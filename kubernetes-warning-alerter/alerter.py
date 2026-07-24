#!/usr/bin/env python3

import logging
import os
import signal
import sys
import time
from collections import OrderedDict
from datetime import datetime, timezone
from typing import Any, Optional

from kubernetes import client, config, watch
from kubernetes.client.exceptions import ApiException
from python_http_client.exceptions import HTTPError
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, To
from urllib3.exceptions import ProtocolError


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

# Bug 1 fix: use os.getenv() so missing vars are caught by validate_configuration()
# instead of crashing with an unhandled KeyError before main() runs.
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")
SENDGRID_FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL", "")
SENDGRID_FROM_NAME = os.getenv(
    "SENDGRID_FROM_NAME",
    "Kubernetes Alerts",
)

_raw_to_emails = os.getenv("SENDGRID_TO_EMAILS", "")
SENDGRID_TO_EMAILS = [
    address.strip()
    for address in _raw_to_emails.split(",")
    if address.strip()
]

CLUSTER_NAME = os.getenv(
    "CLUSTER_NAME",
    "kubernetes-cluster",
)

# Ignore an event when its most recent timestamp is older than this.
MAX_EVENT_AGE_SECONDS = int(
    os.getenv("MAX_EVENT_AGE_SECONDS", "180")
)

# Do not resend the same warning during this period.
EVENT_COOLDOWN_SECONDS = int(
    os.getenv("EVENT_COOLDOWN_SECONDS", "1800")
)

# Maximum number of event records retained in memory.
MAX_CACHE_SIZE = int(
    os.getenv("MAX_CACHE_SIZE", "10000")
)

# Optional comma-separated namespace inclusion filter.
INCLUDED_NAMESPACES = {
    namespace.strip()
    for namespace in os.getenv(
        "INCLUDED_NAMESPACES",
        "",
    ).split(",")
    if namespace.strip()
}

# Optional comma-separated namespace exclusion filter.
EXCLUDED_NAMESPACES = {
    namespace.strip()
    for namespace in os.getenv(
        "EXCLUDED_NAMESPACES",
        "",
    ).split(",")
    if namespace.strip()
}

# Ignore warnings for pods that are currently healthy.
CHECK_CURRENT_POD_STATUS = (
    os.getenv("CHECK_CURRENT_POD_STATUS", "true").lower()
    == "true"
)

# Warning reasons that should be validated against current pod state.
POD_HEALTH_CHECK_REASONS = {
    reason.strip()
    for reason in os.getenv(
        "POD_HEALTH_CHECK_REASONS",
        (
            "BackOff,"
            "Unhealthy,"
            "Failed,"
            "FailedMount,"
            "FailedAttachVolume,"
            "FailedScheduling"
        ),
    ).split(",")
    if reason.strip()
}


# ---------------------------------------------------------------------------
# Logging and runtime state
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s %(levelname)s %(message)s",
)

logger = logging.getLogger("k8s-warning-alert")

running = True

# Event UID -> highest count observed
processed_event_counts: OrderedDict[str, int] = OrderedDict()

# Event signature -> timestamp of last successful email
alert_cache: OrderedDict[str, float] = OrderedDict()


# ---------------------------------------------------------------------------
# Signal handling
# ---------------------------------------------------------------------------

def stop_process(signum: int, frame: Any) -> None:
    """Stop the event watcher gracefully."""
    del frame

    global running
    running = False

    logger.info(
        "Received signal %s; shutting down",
        signum,
    )


signal.signal(signal.SIGTERM, stop_process)
signal.signal(signal.SIGINT, stop_process)


# ---------------------------------------------------------------------------
# Kubernetes configuration
# ---------------------------------------------------------------------------

def load_kubernetes_configuration() -> None:
    """
    Use service-account credentials inside Kubernetes.

    Fall back to the local kubeconfig when running on a workstation.
    """
    try:
        config.load_incluster_config()
        logger.info(
            "Using in-cluster Kubernetes credentials"
        )
    except config.ConfigException:
        config.load_kube_config()
        logger.info(
            "Using local Kubernetes kubeconfig"
        )


# ---------------------------------------------------------------------------
# Event helpers
# ---------------------------------------------------------------------------

def get_namespace(
    event_object: client.CoreV1Event,
) -> str:
    """Return the event namespace."""
    return (
        event_object.metadata.namespace
        or event_object.involved_object.namespace
        or "cluster-scoped"
    )


def get_event_count(
    event_object: client.CoreV1Event,
) -> int:
    """Return the Kubernetes event occurrence count."""
    return event_object.count or 1


def get_event_datetime(
    event_object: client.CoreV1Event,
) -> datetime:
    """Return the most useful event timestamp in UTC."""
    timestamp = (
        event_object.event_time
        or event_object.last_timestamp
        or event_object.first_timestamp
        or event_object.metadata.creation_timestamp
    )

    if timestamp is None:
        return datetime.now(timezone.utc)

    if timestamp.tzinfo is None:
        return timestamp.replace(tzinfo=timezone.utc)

    return timestamp.astimezone(timezone.utc)


def get_event_time_string(
    event_object: client.CoreV1Event,
) -> str:
    """Return an ISO-formatted event timestamp."""
    return get_event_datetime(event_object).isoformat()


def get_event_uid(
    event_object: client.CoreV1Event,
) -> str:
    """Return a stable event identifier."""
    return (
        event_object.metadata.uid
        or event_object.metadata.name
        or get_event_key(event_object)
    )


def get_event_key(
    event_object: client.CoreV1Event,
) -> str:
    """
    Build a stable signature for cooldown checks.

    The event count is intentionally excluded so repeated occurrences
    of the same warning share the same cooldown.
    """
    involved_object = event_object.involved_object

    return "|".join(
        [
            get_namespace(event_object),
            involved_object.kind or "Unknown",
            involved_object.name or "Unknown",
            event_object.reason or "Unknown",
            event_object.message or "",
        ]
    )


def is_recent_event(
    event_object: client.CoreV1Event,
) -> bool:
    """Return True when the event is recent enough to alert."""
    event_age = (
        datetime.now(timezone.utc)
        - get_event_datetime(event_object)
    ).total_seconds()

    if event_age < 0:
        # Allow for minor clock differences.
        return True

    return event_age <= MAX_EVENT_AGE_SECONDS


def has_new_occurrence(
    event_object: client.CoreV1Event,
) -> bool:
    """
    Return True only when an event is new or its count increased.

    Existing event counts are preloaded during startup.
    """
    uid = get_event_uid(event_object)
    current_count = get_event_count(event_object)
    previous_count = processed_event_counts.get(uid)

    processed_event_counts[uid] = current_count
    processed_event_counts.move_to_end(uid)

    while len(processed_event_counts) > MAX_CACHE_SIZE:
        processed_event_counts.popitem(last=False)

    if previous_count is None:
        return True

    return current_count > previous_count


def is_in_cooldown(
    event_object: client.CoreV1Event,
) -> bool:
    """
    Return True when the event is still within its email cooldown.

    This is a read-only check; the cache is not updated here.
    The cache is only written after a successful send via
    record_alert_sent(), keeping the cooldown honest about
    what was actually delivered.
    """
    key = get_event_key(event_object)
    last_sent = alert_cache.get(key)

    if (
        EVENT_COOLDOWN_SECONDS > 0
        and last_sent is not None
        and time.time() - last_sent < EVENT_COOLDOWN_SECONDS
    ):
        logger.debug(
            "Suppressing warning during cooldown: %s",
            key,
        )
        return True

    return False


def record_alert_sent(
    event_object: client.CoreV1Event,
) -> None:
    """
    Record the current time as the last successful send for this event.

    Called only after SendGrid confirms delivery so that transient send
    failures do not start a cooldown window and silence future retries.
    """
    key = get_event_key(event_object)

    alert_cache[key] = time.time()
    alert_cache.move_to_end(key)

    while len(alert_cache) > MAX_CACHE_SIZE:
        alert_cache.popitem(last=False)


# ---------------------------------------------------------------------------
# Pod health validation
# ---------------------------------------------------------------------------

def pod_is_currently_unhealthy(
    core_api: client.CoreV1Api,
    event_object: client.CoreV1Event,
) -> bool:
    """
    Check whether the pod referenced by an event is currently unhealthy.

    A deleted or replaced pod is treated as resolved.
    """
    involved_object = event_object.involved_object

    if involved_object.kind != "Pod":
        return True

    pod_name = involved_object.name
    namespace = get_namespace(event_object)

    if not pod_name or namespace == "cluster-scoped":
        return True

    try:
        pod = core_api.read_namespaced_pod(
            name=pod_name,
            namespace=namespace,
        )

    except ApiException as exc:
        if exc.status == 404:
            logger.info(
                "Ignoring event because pod no longer exists: %s/%s",
                namespace,
                pod_name,
            )
            return False

        logger.warning(
            "Could not verify current pod status for %s/%s: %s",
            namespace,
            pod_name,
            exc,
        )
        return True

    if pod.metadata.deletion_timestamp is not None:
        return False

    # Bug 3 fix: guard against a None status body that Kubernetes can return
    # for very recently scheduled pods before the kubelet has reported back.
    if pod.status is None:
        return True

    if pod.status.phase in {"Failed", "Unknown"}:
        return True

    if pod.status.phase == "Pending":
        return True

    container_statuses = (
        (pod.status.init_container_statuses or [])
        + (pod.status.container_statuses or [])
    )

    if not container_statuses:
        return pod.status.phase not in {
            "Running",
            "Succeeded",
        }

    for container_status in container_statuses:
        state = container_status.state
        last_state = container_status.last_state

        if state and state.waiting:
            waiting_reason = state.waiting.reason or ""

            if waiting_reason not in {
                "ContainerCreating",
                "PodInitializing",
            }:
                return True

        if state and state.terminated:
            if state.terminated.exit_code != 0:
                return True

        if (
            last_state
            and last_state.terminated
            and last_state.terminated.reason
            in {"OOMKilled", "Error"}
            and container_status.restart_count > 0
            and not container_status.ready
        ):
            return True

        if (
            pod.status.phase == "Running"
            and not container_status.ready
        ):
            return True

    return False


def should_validate_pod_health(
    event_object: client.CoreV1Event,
) -> bool:
    """Return True when current pod state should be checked."""
    return (
        CHECK_CURRENT_POD_STATUS
        and event_object.involved_object.kind == "Pod"
        and (
            event_object.reason or ""
        ) in POD_HEALTH_CHECK_REASONS
    )


# ---------------------------------------------------------------------------
# Alert filtering
# ---------------------------------------------------------------------------

def should_send_alert(
    core_api: client.CoreV1Api,
    event_object: client.CoreV1Event,
    watch_action: str,
) -> bool:
    """Determine whether a Warning event should generate an email."""
    if watch_action == "DELETED":
        return False

    if event_object.type != "Warning":
        return False

    namespace = get_namespace(event_object)

    if (
        INCLUDED_NAMESPACES
        and namespace not in INCLUDED_NAMESPACES
    ):
        return False

    if namespace in EXCLUDED_NAMESPACES:
        return False

    # Update the event count cache even when the event is too old.
    # This prevents it from appearing new on the next watch update.
    if not has_new_occurrence(event_object):
        return False

    if not is_recent_event(event_object):
        logger.debug(
            "Ignoring old warning: namespace=%s object=%s "
            "reason=%s time=%s",
            namespace,
            event_object.involved_object.name,
            event_object.reason,
            get_event_time_string(event_object),
        )
        return False

    if should_validate_pod_health(event_object):
        if not pod_is_currently_unhealthy(
            core_api,
            event_object,
        ):
            logger.info(
                "Ignoring stale warning because pod is healthy: "
                "%s/%s reason=%s",
                namespace,
                event_object.involved_object.name,
                event_object.reason,
            )
            return False

    # Bug 2 fix: only check the cooldown here; do not write to the cache.
    # The cache is updated by record_alert_sent() only after a confirmed
    # delivery, so a failed send does not silence the next retry attempt.
    if is_in_cooldown(event_object):
        return False

    return True


# ---------------------------------------------------------------------------
# Email generation and SendGrid delivery
# ---------------------------------------------------------------------------

def get_event_node(
    event_object: client.CoreV1Event,
) -> str:
    """Return the node or source host reported by the event."""
    if event_object.source and event_object.source.host:
        return event_object.source.host

    reporting_instance = getattr(
        event_object,
        "reporting_instance",
        None,
    )

    return reporting_instance or "Not reported"


def build_email_content(
    event_object: client.CoreV1Event,
) -> tuple[str, str]:
    """Build the email subject and body."""
    namespace = get_namespace(event_object)
    involved_object = event_object.involved_object

    object_kind = involved_object.kind or "Unknown"
    object_name = involved_object.name or "Unknown"
    reason = event_object.reason or "Unknown"
    event_message = (
        event_object.message
        or "No event message was provided."
    )

    subject = (
        f"[{CLUSTER_NAME}] Kubernetes Warning: "
        f"{reason} - {namespace}/{object_name}"
    )

    body = f"""A Kubernetes Warning event was detected.

Cluster: {CLUSTER_NAME}
Namespace: {namespace}
Event type: {event_object.type or "Warning"}
Reason: {reason}

Object kind: {object_kind}
Object name: {object_name}
Node or source: {get_event_node(event_object)}

Occurrence count: {get_event_count(event_object)}
First seen: {event_object.first_timestamp or "Not reported"}
Latest occurrence: {get_event_time_string(event_object)}

Message:
{event_message}

Event UID:
{get_event_uid(event_object)}
"""

    return subject, body


def send_sendgrid_email(
    subject: str,
    body: str,
) -> None:
    """Send an email through the SendGrid API."""
    recipients = [
        To(email_address)
        for email_address in SENDGRID_TO_EMAILS
    ]

    message = Mail(
        from_email=(
            SENDGRID_FROM_EMAIL,
            SENDGRID_FROM_NAME,
        ),
        to_emails=recipients,
        subject=subject,
        plain_text_content=body,
    )

    sendgrid_client = SendGridAPIClient(
        SENDGRID_API_KEY
    )

    response = sendgrid_client.send(message)

    if response.status_code not in {200, 201, 202}:
        raise RuntimeError(
            "SendGrid returned status "
            f"{response.status_code}: {response.body}"
        )

    message_id = response.headers.get(
        "X-Message-Id",
        "Not returned",
    )

    logger.info(
        "SendGrid accepted email: status=%s message_id=%s",
        response.status_code,
        message_id,
    )


# ---------------------------------------------------------------------------
# Event processing
# ---------------------------------------------------------------------------

def process_event(
    core_api: client.CoreV1Api,
    event_object: client.CoreV1Event,
    watch_action: str,
) -> None:
    """Filter and process one Kubernetes event."""
    if not should_send_alert(
        core_api,
        event_object,
        watch_action,
    ):
        return

    namespace = get_namespace(event_object)
    involved_object = event_object.involved_object

    logger.warning(
        "Sending warning alert: namespace=%s "
        "object=%s/%s reason=%s count=%s",
        namespace,
        involved_object.kind,
        involved_object.name,
        event_object.reason,
        get_event_count(event_object),
    )

    subject, body = build_email_content(
        event_object
    )

    try:
        send_sendgrid_email(subject, body)

        # Bug 2 fix: record the cooldown only after confirmed delivery.
        record_alert_sent(event_object)

        logger.info(
            "Alert email sent for %s/%s",
            namespace,
            involved_object.name,
        )

    except HTTPError as exc:
        response_body = getattr(
            exc,
            "body",
            str(exc),
        )

        logger.exception(
            "SendGrid rejected alert for %s/%s: %s",
            namespace,
            involved_object.name,
            response_body,
        )

    except (OSError, RuntimeError):
        logger.exception(
            "Unable to send alert for %s/%s",
            namespace,
            involved_object.name,
        )


# ---------------------------------------------------------------------------
# Startup baseline
# ---------------------------------------------------------------------------

def preload_existing_event_counts(
    core_api: client.CoreV1Api,
) -> Optional[str]:
    """
    Load current Warning events without emailing them.

    Returns the resource version used to start the live watch,
    or None when the API call fails.
    """
    logger.info(
        "Loading existing Warning events as startup baseline"
    )

    try:
        existing_events = (
            core_api.list_event_for_all_namespaces(
                field_selector="type=Warning"
            )
        )

    except ApiException:
        logger.exception(
            "Unable to load existing Warning events"
        )
        return None

    for event_object in existing_events.items:
        processed_event_counts[
            get_event_uid(event_object)
        ] = get_event_count(event_object)

    while len(processed_event_counts) > MAX_CACHE_SIZE:
        processed_event_counts.popitem(last=False)

    logger.info(
        "Loaded %s existing Warning events",
        len(existing_events.items),
    )

    return existing_events.metadata.resource_version


# ---------------------------------------------------------------------------
# Kubernetes watch loop
# ---------------------------------------------------------------------------

def watch_warning_events() -> None:
    """Continuously watch Warning events across all namespaces."""
    core_api = client.CoreV1Api()

    resource_version = preload_existing_event_counts(
        core_api
    )

    # Bug 4 fix: log clearly when preloading failed so operators know
    # that events occurring between startup and the first watch connection
    # may be missed, rather than failing silently.
    if resource_version is None:
        logger.warning(
            "Startup baseline could not be loaded; the watch will "
            "start from the current moment and events that occurred "
            "during the gap may not trigger alerts"
        )

    while running:
        event_watcher = watch.Watch()

        try:
            logger.info(
                "Starting Kubernetes Warning event watch"
            )

            event_stream = event_watcher.stream(
                core_api.list_event_for_all_namespaces,
                field_selector="type=Warning",
                resource_version=resource_version,
                timeout_seconds=300,
                allow_watch_bookmarks=True,
            )

            for watched_event in event_stream:
                if not running:
                    event_watcher.stop()
                    break

                watch_action = watched_event.get(
                    "type",
                    "UNKNOWN",
                )

                event_object = watched_event.get("object")

                if event_object is None:
                    continue

                if watch_action == "BOOKMARK":
                    resource_version = (
                        event_object.metadata.resource_version
                    )
                    continue

                resource_version = (
                    event_object.metadata.resource_version
                    or resource_version
                )

                process_event(
                    core_api,
                    event_object,
                    watch_action,
                )

        except ApiException as exc:
            if exc.status == 410:
                logger.warning(
                    "Kubernetes resource version expired; "
                    "reloading event baseline"
                )

                resource_version = (
                    preload_existing_event_counts(
                        core_api
                    )
                )

                if resource_version is None:
                    logger.warning(
                        "Baseline reload failed; resuming watch "
                        "without a resource version"
                    )
            else:
                logger.exception(
                    "Kubernetes API error: status=%s reason=%s",
                    exc.status,
                    exc.reason,
                )
                time.sleep(10)

        except (
            ProtocolError,
            TimeoutError,
            OSError,
        ):
            logger.warning(
                "Kubernetes event stream disconnected; "
                "reconnecting"
            )
            time.sleep(5)

        except Exception:
            logger.exception(
                "Unexpected event watcher failure"
            )
            time.sleep(10)

        finally:
            event_watcher.stop()


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def validate_configuration() -> bool:
    """Validate required environment configuration."""
    valid = True

    if not SENDGRID_API_KEY:
        logger.error(
            "SENDGRID_API_KEY is not set or is empty"
        )
        valid = False

    if not SENDGRID_FROM_EMAIL:
        logger.error(
            "SENDGRID_FROM_EMAIL is not set or is empty"
        )
        valid = False

    if not SENDGRID_TO_EMAILS:
        logger.error(
            "SENDGRID_TO_EMAILS is not set or contains no recipients"
        )
        valid = False

    return valid


def main() -> int:
    """Start the Kubernetes Warning event watcher."""
    if not validate_configuration():
        return 1

    load_kubernetes_configuration()
    watch_warning_events()

    logger.info(
        "Kubernetes Warning event watcher stopped"
    )

    return 0


if __name__ == "__main__":
    sys.exit(main())
