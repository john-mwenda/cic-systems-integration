# Kubernetes Warning Alerter

Watches Kubernetes Warning events cluster-wide and sends email alerts via
SendGrid when new warnings are detected.

## How it works

1. On startup the service loads all existing Warning events to build a
   baseline, so warnings that were already present before the pod started do
   not trigger emails.
2. A continuous watch stream receives new and updated events in real time.
3. Each event is filtered by recency, namespace, pod health, and a per-event
   cooldown before an email is sent.
4. The cooldown window is recorded only after SendGrid confirms delivery, so
   transient send failures do not suppress subsequent retry attempts.

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `SENDGRID_API_KEY` | Yes | — | SendGrid API key |
| `SENDGRID_FROM_EMAIL` | Yes | — | Sender email address |
| `SENDGRID_TO_EMAILS` | Yes | — | Comma-separated recipient addresses |
| `SENDGRID_FROM_NAME` | No | `Kubernetes Alerts` | Sender display name |
| `CLUSTER_NAME` | No | `kubernetes-cluster` | Cluster label used in email subjects |
| `LOG_LEVEL` | No | `INFO` | Python logging level |
| `MAX_EVENT_AGE_SECONDS` | No | `180` | Ignore events older than this |
| `EVENT_COOLDOWN_SECONDS` | No | `1800` | Minimum seconds between repeat alerts for the same event |
| `MAX_CACHE_SIZE` | No | `10000` | Maximum in-memory cache entries |
| `INCLUDED_NAMESPACES` | No | *(all)* | Comma-separated namespace allowlist |
| `EXCLUDED_NAMESPACES` | No | *(none)* | Comma-separated namespace denylist |
| `CHECK_CURRENT_POD_STATUS` | No | `true` | Skip alerts when the referenced pod is currently healthy |
| `POD_HEALTH_CHECK_REASONS` | No | `BackOff,Unhealthy,Failed,FailedMount,FailedAttachVolume,FailedScheduling` | Warning reasons that trigger a live pod health check |

## Running locally

```bash
pip install -r requirements.txt

export SENDGRID_API_KEY=SG.xxx
export SENDGRID_FROM_EMAIL=alerts@example.com
export SENDGRID_TO_EMAILS=ops@example.com

python alerter.py
```

## Deploying to Kubernetes

Create the secret, then apply the manifests:

```bash
kubectl create namespace monitoring

kubectl create secret generic k8s-warning-alerter-secrets \
  --namespace monitoring \
  --from-literal=sendgrid-api-key="$SENDGRID_API_KEY" \
  --from-literal=sendgrid-from-email="alerts@example.com" \
  --from-literal=sendgrid-to-emails="ops@example.com"

kubectl apply -f k8s/deployment.yaml
```

Edit the `image` field in `k8s/deployment.yaml` to point to your registry
before applying.

## RBAC

The deployment manifest creates a `ClusterRole` that grants read access to
`events` (get, list, watch) and read access to `pods` (get) for pod health
checks. No write permissions are required.
