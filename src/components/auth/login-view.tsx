import { Scale } from "lucide-react";
import { useState } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginView() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "up") {
        const { error: err } = await authClient.signUp.email({
          email,
          password,
          name: name.trim() || email.split("@")[0],
        });
        if (err) throw new Error(err.message ?? "Could not create the account");
      } else {
        const { error: err } = await authClient.signIn.email({ email, password });
        if (err) throw new Error(err.message ?? "Could not sign in");
      }
      window.location.assign("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-paper lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between bg-sidebar px-12 py-12 text-sidebar-fg lg:flex">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-md bg-raised text-ink">
            <Scale className="size-5" strokeWidth={1.75} />
          </span>
          <span className="font-display text-xl tracking-tight">LegalFlow AI</span>
        </div>
        <div className="max-w-md">
          <p className="font-display text-4xl leading-tight tracking-tight">
            A single confidential workspace for counsel.
          </p>
          <p className="mt-5 text-sm leading-relaxed text-sidebar-muted">
            Matters, contracts, clause libraries and AI-assisted first drafts — always subject to
            lawyer review. Built for firms that treat privilege as architecture, not a setting.
          </p>
        </div>
        <p className="text-xs tracking-[0.16em] text-sidebar-muted uppercase">
          Attorney-client privileged workspace
        </p>
      </section>

      <section className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="grid size-9 place-items-center rounded-md bg-sidebar text-sidebar-fg">
              <Scale className="size-4" />
            </span>
            <span className="font-display text-lg">LegalFlow AI</span>
          </div>
          <h1 className="font-display text-2xl tracking-tight">
            {mode === "in" ? "Sign in to the firm" : "Create your workspace"}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {mode === "in"
              ? "Use your firm email, or continue with Google or X."
              : "A sample matter book is prepared on first sign-in."}
          </p>

          {authEnabled ? (
            <>
              <form className="mt-6 space-y-3" onSubmit={onSubmit}>
                {mode === "up" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "up" ? "new-password" : "current-password"}
                  />
                </div>
                {error && <p className="text-sm text-danger">{error}</p>}
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
                </Button>
              </form>

              <p className="mt-4 text-center text-sm text-ink-soft">
                {mode === "in" ? "New to the firm?" : "Already have access?"}{" "}
                <button
                  type="button"
                  data-testid="auth-mode-toggle"
                  className="font-medium text-accent hover:underline"
                  onClick={() => {
                    setMode(mode === "in" ? "up" : "in");
                    setError(null);
                  }}
                >
                  {mode === "in" ? "Create an account" : "Sign in"}
                </button>
              </p>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-line" />
                <span className="text-[11px] tracking-wide text-ink-faint uppercase">or</span>
                <div className="h-px flex-1 bg-line" />
              </div>

              <div className="space-y-2">
                {GROK_PROVIDERS.map((p) => (
                  <Button
                    key={p.providerId}
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={() => signIn(p.providerId, { callbackURL: "/" })}
                  >
                    Continue with {p.label}
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-6 text-sm text-ink-soft">Sign-in is disabled.</p>
          )}
        </div>
      </section>
    </main>
  );
}

export function BrandedSplash() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      <p className="font-display text-2xl tracking-tight text-ink">LegalFlow AI</p>
      <p className="mt-2 text-sm text-ink-soft">Opening the confidential workspace…</p>
    </main>
  );
}
