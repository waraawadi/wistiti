"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

import { AuthSplitLayout, authInputClass } from "@/components/auth/auth-split-layout";
import { AppName } from "@/components/app-name";
import { Button } from "@/components/ui/button";
import { getNextQueryFromWindow } from "@/lib/auth-redirect";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";

const inputCls = authInputClass();

export default function LoginPage() {
  const setAuth = useAppStore((s) => s.setAuth);
  const [registerHref, setRegisterHref] = useState("/register");
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRegisterHref(`/register${window.location.search}`);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post<{
        access: string;
        refresh: string;
        user?: { id: number; email: string; nom: string; is_superuser?: boolean };
      }>("/api/auth/login/", { email, password });
      setAuth({ token: data.access, refreshToken: data.refresh, user: data.user ?? null });
      const next = getNextQueryFromWindow();
      if (next) {
        window.location.href = next;
        return;
      }
      window.location.href = data.user?.is_superuser ? "/superadmin" : "/dashboard";
    } catch {
      setError("Identifiants invalides.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitLayout
      title="Bon retour parmi nous"
      subtitle="Connectez-vous pour gérer vos événements et vos albums."
      quote={
        <>
          « Grâce à <AppName className="font-bold text-white" /> nous avons récupéré plus de 500 photos de notre
          mariage. Magique ! »
        </>
      }
      quoteAuthor="Aminata D., Dakar"
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Email</label>
          <div className="relative mt-2">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={17} />
            <input
              type="email"
              className={inputCls}
              placeholder="sophie@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Mot de passe</label>
          <div className="relative mt-2">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={17} />
            <input
              type={showPw ? "text" : "password"}
              className={`${inputCls} pr-11`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
              aria-label={showPw ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive font-medium rounded-xl bg-destructive/10 px-3 py-2 border border-destructive/20">
            {error}
          </p>
        )}

        <Button type="submit" variant="gradient" className="w-full h-11 rounded-xl font-semibold shadow-glow" disabled={loading}>
          {loading ? "Connexion…" : "Se connecter"}
        </Button>

        <p className="text-sm text-muted-foreground text-center pt-1">
          Pas encore de compte ?{" "}
          <Link href={registerHref} className="font-semibold text-primary hover:underline underline-offset-4">
            Créer un compte
          </Link>
        </p>
      </form>
    </AuthSplitLayout>
  );
}
