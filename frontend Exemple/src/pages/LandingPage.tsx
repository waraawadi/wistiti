import { APP_CONFIG } from "@/config";
import { Button } from "@/components/ui/button";
import {
  Camera, QrCode, Image, Download, Shield, Monitor,
  ChevronRight, Check, X, Star
} from "lucide-react";

const features = [
  { icon: Image, title: "Album digital", desc: "Un album en ligne élégant pour rassembler toutes les photos de votre événement." },
  { icon: QrCode, title: "QR Code unique", desc: "Chaque événement dispose d'un QR code personnalisé à partager avec vos invités." },
  { icon: Monitor, title: "Photo Wall live", desc: "Affichez les photos en temps réel sur un écran pendant votre événement." },
  { icon: Camera, title: "Aucune app requise", desc: "Vos invités prennent des photos directement depuis leur navigateur mobile." },
  { icon: Download, title: "Téléchargement ZIP", desc: "Téléchargez toutes les photos en un seul clic dans un fichier ZIP." },
  { icon: Shield, title: "Modération", desc: "Validez ou refusez les photos avant qu'elles n'apparaissent dans l'album." },
];

const steps = [
  { num: 1, title: "Créez votre événement", desc: "En seulement 2 minutes, configurez votre album photo." },
  { num: 2, title: "Les invités scannent le QR code", desc: "Partagez le QR code imprimé ou numérique à vos convives." },
  { num: 3, title: "Toutes les photos dans un album", desc: "Retrouvez chaque moment capturé dans un seul endroit." },
];

const plans = [
  {
    name: "Gratuit", price: "0", features: ["1 événement", "50 photos max", "QR Code", "Album en ligne"],
    missing: ["Photo Wall", "Téléchargement ZIP", "Modération", "Support prioritaire"], accent: false,
  },
  {
    name: "Plus", price: "9 900", features: ["5 événements", "500 photos / événement", "QR Code", "Album en ligne", "Photo Wall", "Téléchargement ZIP"],
    missing: ["Modération avancée", "Support prioritaire"], accent: false,
  },
  {
    name: "Pro", price: "24 900", features: ["Événements illimités", "Photos illimitées", "QR Code", "Album en ligne", "Photo Wall", "Téléchargement ZIP", "Modération avancée", "Support prioritaire"],
    missing: [], accent: true, badge: "Le plus populaire",
  },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <span className="text-xl font-bold gradient-text" style={{ fontFamily: 'Syne' }}>{APP_CONFIG.name}</span>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Tarifs</a>
            <a href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Connexion</a>
            <Button variant="gradient" size="sm">Créer un événement</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight" style={{ fontFamily: 'Syne' }}>
              Collectez <span className="gradient-text">toutes les photos</span> de votre événement
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-lg">
              Créez un album collaboratif en quelques clics. Vos invités scannent un QR code et partagent leurs plus beaux moments instantanément.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button variant="gradient" size="lg">
                Créer un événement <ChevronRight className="ml-1" />
              </Button>
              <Button variant="outline" size="lg">Voir la démo</Button>
            </div>
          </div>
          <div className="relative flex justify-center">
            <div className="w-64 h-[500px] rounded-[2rem] gradient-bg p-1 shadow-glow">
              <div className="w-full h-full bg-background rounded-[1.8rem] p-4 flex flex-col">
                <div className="text-center mt-4">
                  <p className="text-xs text-muted-foreground">Album</p>
                  <p className="font-bold text-sm" style={{ fontFamily: 'Syne' }}>Mariage Sophie & Lucas</p>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4 flex-1">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="rounded-lg bg-muted aspect-square flex items-center justify-center">
                      <Camera className="text-muted-foreground" size={20} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center" style={{ fontFamily: 'Syne' }}>
            Comment ça <span className="gradient-text">marche ?</span>
          </h2>
          <div className="mt-16 grid md:grid-cols-3 gap-8 relative">
            {/* Dashed connecting line */}
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] border-t-2 border-dashed border-primary/30" />
            {steps.map(step => (
              <div key={step.num} className="text-center relative">
                <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center mx-auto text-white text-xl font-bold shadow-glow" style={{ fontFamily: 'Syne' }}>
                  {step.num}
                </div>
                <h3 className="mt-6 text-lg font-bold" style={{ fontFamily: 'Syne' }}>{step.title}</h3>
                <p className="mt-2 text-muted-foreground text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center" style={{ fontFamily: 'Syne' }}>
            Tout ce dont vous avez <span className="gradient-text">besoin</span>
          </h2>
          <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="p-6 rounded-[var(--radius-card)] bg-card border hover:shadow-glow transition-shadow duration-300">
                <div className="w-12 h-12 rounded-[var(--radius-button)] bg-accent flex items-center justify-center">
                  <f.icon className="text-primary" size={24} />
                </div>
                <h3 className="mt-4 font-bold text-lg" style={{ fontFamily: 'Syne' }}>{f.title}</h3>
                <p className="mt-2 text-muted-foreground text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center" style={{ fontFamily: 'Syne' }}>
            Nos <span className="gradient-text">tarifs</span>
          </h2>
          <p className="text-center text-muted-foreground mt-4">Simple et transparent. Sans engagement.</p>
          <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto items-start">
            {plans.map(plan => (
              <div
                key={plan.name}
                className="relative rounded-[var(--radius-card)] bg-card p-6 transition-transform duration-300"
                style={{
                  border: plan.accent ? '2px solid var(--color-primary-hex)' : '1px solid hsl(var(--border))',
                  transform: plan.accent ? 'scale(1.05)' : undefined,
                  boxShadow: plan.accent ? 'var(--shadow-glow)' : undefined,
                }}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-bg text-white text-xs font-semibold px-4 py-1 rounded-full">
                    {plan.badge}
                  </div>
                )}
                <h3 className="text-xl font-bold mt-2" style={{ fontFamily: 'Syne' }}>{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-3xl font-extrabold" style={{ fontFamily: 'Syne' }}>{plan.price}</span>
                  <span className="text-muted-foreground ml-1">F CFA / mois</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check size={16} className="text-primary shrink-0" /> {f}
                    </li>
                  ))}
                  {plan.missing.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <X size={16} className="shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button variant={plan.accent ? "gradient" : "outline"} className="w-full mt-6">
                  {plan.price === "0" ? "Commencer gratuitement" : "Choisir ce plan"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-bold gradient-text" style={{ fontFamily: 'Syne' }}>{APP_CONFIG.name}</span>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Fonctionnalités</a>
            <a href="#" className="hover:text-foreground transition-colors">Tarifs</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            <a href="#" className="hover:text-foreground transition-colors">CGU</a>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 {APP_CONFIG.name}. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
