import { createFileRoute, Navigate } from "@tanstack/react-router";
import { LoginView } from "@/components/auth/login-view";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();
  if (!isPending && user) return <Navigate to="/" />;
  return <LoginView />;
}
