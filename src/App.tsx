type NavItem = { label: string; href: string };

const nav: NavItem[] = [
  { label: "Docs", href: "#docs" },
  { label: "APIs", href: "#apis" },
  { label: "Sandbox", href: "#sandbox" },
  { label: "Status", href: "#status" },
  { label: "Support", href: "#support" }
];

type ApiCard = {
  name: string;
  description: string;
  highlights: string[];
  href: string;
  badge: string;
};

const apis: ApiCard[] = [
  {
    name: "Policy API",
    description: "Quote, bind, endorsements, and policy lifecycle events.",
    highlights: ["REST + JSON", "OAuth 2.1", "Webhooks-ready"],
    href: "#docs",
    badge: "v1"
  },
  {
    name: "Claims API",
    description: "FNOL, claim status, documents, and payment milestones.",
    highlights: ["Idempotency keys", "PII-safe fields", "Event streaming"],
    href: "#docs",
    badge: "v1"
  },
  {
    name: "Billing API",
    description: "Invoices, payments, refunds, and reconciliation exports.",
    highlights: ["PCI-minimized", "Webhook receipts", "Batch jobs"],
    href: "#docs",
    badge: "v1"
  },
  {
    name: "Identity & Access",
    description: "Organizations, users, roles, and secure token exchange.",
    highlights: ["SSO/SAML optional", "SCIM optional", "Fine-grained scopes"],
    href: "#docs",
    badge: "beta"
  }
];

type LinkCard = { title: string; description: string; href: string };

const docsLinks: LinkCard[] = [
  {
    title: "Quickstart",
    description: "Create an org, issue a token, and make your first API call.",
    href: "#quickstart"
  },
  {
    title: "Authentication",
    description: "OAuth 2.1 client credentials, scopes, and token lifetimes.",
    href: "#auth"
  },
  {
    title: "Webhooks",
    description: "Receive policy/claim events with retries and signatures.",
    href: "#webhooks"
  },
  {
    title: "Errors & idempotency",
    description: "Error codes, correlation IDs, and safe retries.",
    href: "#errors"
  }
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function BrandMark() {
  return (
    <div className="flex items-center gap-2">
      <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400/90 to-brand-700/90 ring-1 ring-white/10">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="size-5 text-slate-950"
          fill="currentColor"
        >
          <path d="M12 2l8 4v6c0 5-3.3 9.4-8 10-4.7-.6-8-5-8-10V6l8-4zm0 4.2L6 8.9v3.2c0 3.5 2.2 6.6 6 7.6 3.8-1 6-4.1 6-7.6V8.9l-6-2.7z" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-wide text-white">
          CIC Insurance
        </div>
        <div className="text-xs text-slate-400">Developer Portal</div>
      </div>
    </div>
  );
}

function Container({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-4">{children}</div>;
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-200">
      {children}
    </span>
  );
}

function Button({
  children,
  href,
  variant = "primary"
}: {
  children: React.ReactNode;
  href: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
        variant === "primary" &&
          "bg-brand-400 text-slate-950 hover:bg-brand-300",
        variant === "secondary" &&
          "border border-white/10 bg-white/5 text-white hover:bg-white/10"
      )}
    >
      {children}
      <span aria-hidden="true">→</span>
    </a>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl">
      <div className="text-xs font-semibold uppercase tracking-widest text-brand-200/90">
        {eyebrow}
      </div>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
    </div>
  );
}

function Card({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]",
        "backdrop-blur",
        className
      )}
    >
      {children}
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs leading-5 text-slate-200">
      <code>{children}</code>
    </pre>
  );
}

export default function App() {
  return (
    <div className="min-h-dvh">
      {/* Decorative background */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0">
        <div className="absolute -top-24 left-1/2 h-72 w-[44rem] -translate-x-1/2 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-fuchsia-600/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur">
        <Container>
          <div className="flex items-center justify-between py-4">
            <a href="#" className="rounded-xl focus-visible:outline-none">
              <BrandMark />
            </a>
            <nav className="hidden items-center gap-6 md:flex">
              {nav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-sm text-slate-300 hover:text-white"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <a
                href="#get-started"
                className="hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 sm:inline-flex"
              >
                Sign in
              </a>
              <a
                href="#get-started"
                className="inline-flex rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-950 hover:bg-slate-100"
              >
                Get API key
              </a>
            </div>
          </div>
        </Container>
      </header>

      <main className="relative">
        <section className="pt-12 sm:pt-16">
          <Container>
            <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-7">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill>Sandbox included</Pill>
                  <Pill>Webhook signatures</Pill>
                  <Pill>99.9% API uptime target</Pill>
                </div>

                <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Build secure insurance integrations in days, not months.
                </h1>
                <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
                  CIC Insurance APIs help you automate quoting, policy servicing,
                  claims, and billing—backed by modern auth, idempotency, and
                  developer-friendly tooling.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Button href="#get-started" variant="primary">
                    Start quickstart
                  </Button>
                  <Button href="#docs" variant="secondary">
                    Explore docs
                  </Button>
                </div>

                <div className="mt-8 flex flex-wrap gap-3 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    OAuth 2.1 (client credentials)
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    Correlation IDs on every request
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    Regional data residency options
                  </span>
                </div>
              </div>

              <div className="lg:col-span-5">
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-white">
                      API Explorer
                    </div>
                    <Pill>read-only example</Pill>
                  </div>
                  <div className="mt-4 space-y-3">
                    <CodeBlock>
                      {`# 1) Get a token (sandbox)
curl -sS https://sandbox.api.cic.insure/oauth/token \\
  -u "$CLIENT_ID:$CLIENT_SECRET" \\
  -d "grant_type=client_credentials&scope=claims.write"

# 2) Create First Notice of Loss (FNOL)
curl -sS https://sandbox.api.cic.insure/v1/claims \\
  -H "Authorization: Bearer $ACCESS_TOKEN" \\
  -H "Idempotency-Key: 9d1c0c1a-..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "policyNumber": "POL-100234",
    "lossDate": "2026-01-14",
    "lossType": "AUTO",
    "contact": { "name": "A. Njoroge", "phone": "+2547..." }
  }'`}
                    </CodeBlock>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-xs font-semibold text-white">
                          Base URLs
                        </div>
                        <div className="mt-2 text-xs text-slate-300">
                          <div>Sandbox: sandbox.api.cic.insure</div>
                          <div>Prod: api.cic.insure</div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-xs font-semibold text-white">
                          Security
                        </div>
                        <div className="mt-2 text-xs text-slate-300">
                          Signed webhooks, scoped tokens, and audit logs.
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </Container>
        </section>

        <section id="apis" className="pt-16 sm:pt-20">
          <Container>
            <SectionTitle
              eyebrow="APIs"
              title="Insurance primitives, packaged as clean endpoints."
              description="Pick the products you need today and expand later. Every API follows consistent patterns for pagination, error handling, and retries."
            />

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {apis.map((api) => (
                <a
                  key={api.name}
                  href={api.href}
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-base font-semibold text-white">
                        {api.name}
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-300">
                        {api.description}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-1 text-xs font-medium",
                        api.badge === "beta"
                          ? "bg-fuchsia-500/15 text-fuchsia-200 ring-1 ring-fuchsia-400/20"
                          : "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/20"
                      )}
                    >
                      {api.badge}
                    </span>
                  </div>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {api.highlights.map((h) => (
                      <Pill key={h}>{h}</Pill>
                    ))}
                  </ul>
                  <div className="mt-4 text-sm text-brand-200 group-hover:text-brand-100">
                    View documentation →
                  </div>
                </a>
              ))}
            </div>
          </Container>
        </section>

        <section id="docs" className="pt-16 sm:pt-20">
          <Container>
            <SectionTitle
              eyebrow="Docs"
              title="Everything you need to integrate confidently."
              description="Copy-pasteable examples, clear versioning, and practical guidance for security, compliance, and retries."
            />
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {docsLinks.map((link) => (
                <a
                  key={link.title}
                  href={link.href}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <div className="text-base font-semibold text-white">
                    {link.title}
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-300">
                    {link.description}
                  </div>
                  <div className="mt-4 text-sm text-brand-200">Open →</div>
                </a>
              ))}
            </div>
          </Container>
        </section>

        <section id="get-started" className="pt-16 sm:pt-20">
          <Container>
            <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-5">
                <SectionTitle
                  eyebrow="Get started"
                  title="A quickstart that mirrors production."
                  description="Use sandbox credentials to build and test. When you’re ready, switch base URLs, rotate secrets, and promote your app."
                />
                <div className="mt-6 space-y-3 text-sm text-slate-300">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="font-semibold text-white">1) Create an app</div>
                    <div className="mt-1">
                      Generate a client ID/secret, choose scopes, and set webhook
                      endpoints.
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="font-semibold text-white">
                      2) Build in sandbox
                    </div>
                    <div className="mt-1">
                      Test idempotent writes, simulated events, and throttling.
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="font-semibold text-white">
                      3) Go live safely
                    </div>
                    <div className="mt-1">
                      Enable audit logs, restrict IPs if needed, and monitor with
                      correlation IDs.
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div id="quickstart" className="space-y-6">
                  <Card>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">
                          Quickstart: token + first call
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          Sample values — replace with your credentials.
                        </div>
                      </div>
                      <Pill>curl</Pill>
                    </div>
                    <div className="mt-4">
                      <CodeBlock>
                        {`export CLIENT_ID="your_client_id"
export CLIENT_SECRET="your_client_secret"

export ACCESS_TOKEN="$(curl -sS https://sandbox.api.cic.insure/oauth/token \\
  -u "$CLIENT_ID:$CLIENT_SECRET" \\
  -d "grant_type=client_credentials&scope=policies.read" | jq -r .access_token)"

curl -sS https://sandbox.api.cic.insure/v1/policies/POL-100234 \\
  -H "Authorization: Bearer $ACCESS_TOKEN" \\
  -H "X-Correlation-Id: $(uuidgen)"`}
                      </CodeBlock>
                      <div className="mt-3 text-xs text-slate-400">
                        Tip: include <span className="text-slate-200">X-Correlation-Id</span>{" "}
                        on every request for easier debugging with support.
                      </div>
                    </div>
                  </Card>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <div id="auth" className="text-sm font-semibold text-white">
                        Authentication
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-300">
                        Use OAuth 2.1 client credentials for server-to-server
                        calls. Scope tokens narrowly and rotate secrets
                        regularly.
                      </div>
                      <ul className="mt-4 space-y-2 text-sm text-slate-300">
                        <li>• Scopes: policies.read, claims.write, billing.read</li>
                        <li>• Token TTL: 15 minutes (configurable)</li>
                        <li>• mTLS: available on request</li>
                      </ul>
                    </Card>

                    <Card>
                      <div id="errors" className="text-sm font-semibold text-white">
                        Errors & retries
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-300">
                        Safe retries via idempotency keys for writes, and
                        exponential backoff for 429/5xx responses.
                      </div>
                      <ul className="mt-4 space-y-2 text-sm text-slate-300">
                        <li>• 429: respect Retry-After</li>
                        <li>• 409: idempotency conflict details</li>
                        <li>• Always log correlation IDs</li>
                      </ul>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section id="sandbox" className="pt-16 sm:pt-20">
          <Container>
            <SectionTitle
              eyebrow="Sandbox"
              title="Simulate real insurance workflows—safely."
              description="Generate policies, trigger claim events, and validate webhooks without touching production data."
            />
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <Card>
                <div className="text-sm font-semibold text-white">
                  Test data factory
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-300">
                  Create sample customers, vehicles, properties, and policies for
                  repeatable runs.
                </div>
              </Card>
              <Card>
                <div className="text-sm font-semibold text-white">Event simulator</div>
                <div className="mt-2 text-sm leading-6 text-slate-300">
                  Fire “policy.renewed” and “claim.updated” events on demand.
                </div>
              </Card>
              <Card>
                <div className="text-sm font-semibold text-white">Rate limiting</div>
                <div className="mt-2 text-sm leading-6 text-slate-300">
                  Verify backoff logic with configurable throttling and error
                  injection.
                </div>
              </Card>
            </div>
          </Container>
        </section>

        <section id="webhooks" className="pt-16 sm:pt-20">
          <Container>
            <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-5">
                <SectionTitle
                  eyebrow="Webhooks"
                  title="Reliable events with signature verification."
                  description="Receive near-real-time policy and claim updates. We retry with backoff, and every payload is signed."
                />
              </div>
              <div className="lg:col-span-7">
                <Card>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white">
                      Example webhook headers
                    </div>
                    <Pill>HMAC-SHA256</Pill>
                  </div>
                  <div className="mt-4">
                    <CodeBlock>
                      {`POST /webhooks/cic HTTP/1.1
Content-Type: application/json
X-CIC-Event: claim.updated
X-CIC-Signature: t=1736850300,v1=8f1b...
X-Correlation-Id: 2e9a2b2c-...`}
                    </CodeBlock>
                    <div className="mt-3 text-xs text-slate-400">
                      Verify the timestamp and signature using your webhook secret.
                      Reject requests older than 5 minutes.
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </Container>
        </section>

        <section id="status" className="pt-16 sm:pt-20">
          <Container>
            <SectionTitle
              eyebrow="Status"
              title="Operational transparency by default."
              description="Monitor incidents and planned maintenance. Subscribe to updates for the products you use."
            />
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <Card>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-white">API</div>
                  <span className="inline-flex items-center gap-2 text-xs text-emerald-200">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    Operational
                  </span>
                </div>
                <div className="mt-2 text-sm text-slate-300">
                  REST endpoints and token service.
                </div>
              </Card>
              <Card>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-white">Webhooks</div>
                  <span className="inline-flex items-center gap-2 text-xs text-emerald-200">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    Operational
                  </span>
                </div>
                <div className="mt-2 text-sm text-slate-300">
                  Delivery, retries, and signatures.
                </div>
              </Card>
              <Card>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-white">Sandbox</div>
                  <span className="inline-flex items-center gap-2 text-xs text-emerald-200">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    Operational
                  </span>
                </div>
                <div className="mt-2 text-sm text-slate-300">
                  Test data and event simulator.
                </div>
              </Card>
            </div>
          </Container>
        </section>

        <section id="support" className="pt-16 pb-16 sm:pt-20 sm:pb-20">
          <Container>
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-8 sm:p-10">
              <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-7">
                  <div className="text-xs font-semibold uppercase tracking-widest text-brand-200/90">
                    Support
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    Get help from people who know the platform.
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    Share the correlation ID and timestamp from your failing
                    request, and we’ll help you trace it end-to-end.
                  </p>
                </div>
                <div className="lg:col-span-5">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <a
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06]"
                      href="mailto:developers@cic.insure"
                    >
                      <div className="text-sm font-semibold text-white">Email</div>
                      <div className="mt-1 text-sm text-slate-300">
                        developers@cic.insure
                      </div>
                    </a>
                    <a
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06]"
                      href="#"
                    >
                      <div className="text-sm font-semibold text-white">
                        Community
                      </div>
                      <div className="mt-1 text-sm text-slate-300">
                        Join the dev forum →
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <footer className="border-t border-white/10 py-10">
        <Container>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <BrandMark />
            <div className="text-xs text-slate-400">
              © {new Date().getFullYear()} CIC Insurance. Developer resources for
              integration partners.
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}

