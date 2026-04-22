import { useState } from "react";
import { APP_CONFIG } from "@/config";
import { Button } from "@/components/ui/button";
import { Mail, Lock, User, Eye, EyeOff, Camera } from "lucide-react";

const AuthPage = () => {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [showPw, setShowPw] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Left gradient panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-bg relative flex-col justify-between p-12 overflow-hidden">
        {/* Floating photo cards */}
        <div className="absolute inset-0 overflow-hidden">
          {[
            { top: "10%", left: "10%", rotate: "-6deg", delay: "0s" },
            { top: "30%", left: "60%", rotate: "4deg", delay: "1s" },
            { top: "60%", left: "20%", rotate: "-3deg", delay: "2s" },
            { top: "50%", left: "70%", rotate: "8deg", delay: "0.5s" },
          ].map((pos, i) => (
            <div
              key={i}
              className="absolute w-32 h-40 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 flex items-center justify-center animate-pulse"
              style={{ top: pos.top, left: pos.left, transform: `rotate(${pos.rotate})`, animationDelay: pos.delay, animationDuration: "3s" }}
            >
              <Camera className="text-white/40" size={28} />
            </div>
          ))}
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold text-white" style={{ fontFamily: 'Syne' }}>{APP_CONFIG.name}</h2>
          <p className="text-white/80 mt-2">Collectez chaque moment, ensemble.</p>
        </div>
        <div className="relative z-10">
          <blockquote className="text-white/90 italic text-lg leading-relaxed">
            « Grâce à {APP_CONFIG.name}, nous avons récupéré plus de 500 photos de notre mariage. Magique ! »
          </blockquote>
          <p className="text-white/60 mt-3 text-sm">— Aminata D., Dakar</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: 'Syne' }}>
            {tab === "login" ? "Connexion" : "Créer un compte"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {tab === "login" ? "Bienvenue ! Connectez-vous à votre espace." : "Rejoignez la communauté d'organisateurs."}
          </p>

          {/* Tabs */}
          <div className="flex mt-6 bg-muted rounded-[var(--radius-button)] p-1">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-[var(--radius-input)] transition-all ${tab === "login" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
            >
              Connexion
            </button>
            <button
              onClick={() => setTab("register")}
              className={`flex-1 py-2 text-sm font-medium rounded-[var(--radius-input)] transition-all ${tab === "register" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
            >
              Inscription
            </button>
          </div>

          <form className="mt-8 space-y-4" onSubmit={e => e.preventDefault()}>
            {tab === "register" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Prénom</label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input className="w-full h-10 pl-10 pr-3 rounded-[var(--radius-input)] border bg-card text-sm" placeholder="Sophie" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Nom</label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input className="w-full h-10 pl-10 pr-3 rounded-[var(--radius-input)] border bg-card text-sm" placeholder="Diallo" />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input type="email" className="w-full h-10 pl-10 pr-3 rounded-[var(--radius-input)] border bg-card text-sm" placeholder="sophie@email.com" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Mot de passe</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input type={showPw ? "text" : "password"} className="w-full h-10 pl-10 pr-10 rounded-[var(--radius-input)] border bg-card text-sm" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {tab === "register" && (
              <div>
                <label className="text-sm font-medium">Confirmer le mot de passe</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input type="password" className="w-full h-10 pl-10 pr-3 rounded-[var(--radius-input)] border bg-card text-sm" placeholder="••••••••" />
                </div>
              </div>
            )}

            {tab === "login" && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" /> Se souvenir de moi
                </label>
                <a href="#" className="text-sm text-primary hover:underline">Mot de passe oublié ?</a>
              </div>
            )}

            {tab === "register" && (
              <label className="flex items-start gap-2 text-sm text-muted-foreground">
                <input type="checkbox" className="rounded mt-0.5" />
                <span>J'accepte les <a href="#" className="text-primary underline">conditions générales d'utilisation</a></span>
              </label>
            )}

            <Button variant="gradient" size="lg" className="w-full">
              {tab === "login" ? "Se connecter" : "Créer mon compte"}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
              <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">ou continuer avec</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="w-full">Google</Button>
              <Button variant="outline" className="w-full">Apple</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
