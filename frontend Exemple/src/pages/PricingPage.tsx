import { APP_CONFIG } from "@/config";
import { Button } from "@/components/ui/button";
import { Check, X, ChevronDown } from "lucide-react";
import { useState } from "react";

const plans = [
  {
    name: "Gratuit", price: "0", accent: "muted",
    features: [
      { label: "1 événement", included: true },
      { label: "50 photos max", included: true },
      { label: "QR Code unique", included: true },
      { label: "Album en ligne", included: true },
      { label: "Photo Wall live", included: false },
      { label: "Téléchargement ZIP", included: false },
      { label: "Modération avancée", included: false },
      { label: "Support prioritaire", included: false },
    ],
  },
  {
    name: "Plus", price: "9 900", accent: "secondary",
    features: [
      { label: "5 événements", included: true },
      { label: "500 photos / événement", included: true },
      { label: "QR Code unique", included: true },
      { label: "Album en ligne", included: true },
      { label: "Photo Wall live", included: true },
      { label: "Téléchargement ZIP", included: true },
      { label: "Modération avancée", included: false },
      { label: "Support prioritaire", included: false },
    ],
  },
  {
    name: "Pro", price: "24 900", accent: "primary", popular: true,
    features: [
      { label: "Événements illimités", included: true },
      { label: "Photos illimitées", included: true },
      { label: "QR Code unique", included: true },
      { label: "Album en ligne", included: true },
      { label: "Photo Wall live", included: true },
      { label: "Téléchargement ZIP", included: true },
      { label: "Modération avancée", included: true },
      { label: "Support prioritaire", included: true },
    ],
  },
];

const faqs = [
  { q: "Puis-je changer de plan à tout moment ?", a: "Oui, vous pouvez mettre à niveau ou rétrograder votre plan à tout moment. Le changement prend effet immédiatement." },
  { q: "Les photos sont-elles stockées de manière sécurisée ?", a: "Absolument. Toutes les photos sont chiffrées et stockées sur des serveurs sécurisés avec sauvegarde automatique." },
  { q: "Comment fonctionne le QR code ?", a: "Chaque événement génère un QR code unique. Les invités le scannent avec leur téléphone et accèdent directement à l'album pour partager leurs photos." },
  { q: "Y a-t-il un engagement minimum ?", a: "Non, aucun engagement. Vous pouvez annuler à tout moment sans frais supplémentaires." },
  { q: "Le Photo Wall fonctionne-t-il sans connexion internet ?", a: "Le Photo Wall nécessite une connexion internet pour recevoir les photos en temps réel. Nous recommandons une connexion Wi-Fi stable." },
];

const PricingPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-bg py-16 px-4 text-center text-white">
        <p className="text-sm uppercase tracking-wider text-white/70">{APP_CONFIG.name}</p>
        <h1 className="text-3xl md:text-4xl font-extrabold mt-2" style={{ fontFamily: 'Syne' }}>
          Choisissez votre formule
        </h1>
        <p className="text-white/80 mt-2 max-w-md mx-auto">Simple et transparent. Commencez gratuitement et évoluez selon vos besoins.</p>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-6 -mt-20 relative z-10">
          {plans.map(plan => (
            <div
              key={plan.name}
              className="relative bg-card rounded-[var(--radius-card)] p-6 shadow-lg transition-transform duration-300"
              style={{
                border: plan.popular ? '2px solid var(--color-primary-hex)' : '1px solid hsl(var(--border))',
                transform: plan.popular ? 'scale(1.05)' : undefined,
                boxShadow: plan.popular ? 'var(--shadow-glow)' : undefined,
              }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-bg text-white text-xs font-semibold px-4 py-1 rounded-full">
                  Le plus populaire
                </div>
              )}
              <h3 className="text-xl font-bold mt-2" style={{ fontFamily: 'Syne' }}>{plan.name}</h3>
              <div className="mt-3">
                <span className="text-4xl font-extrabold" style={{ fontFamily: 'Syne' }}>{plan.price}</span>
                <span className="text-muted-foreground ml-1 text-sm">F CFA / mois</span>
              </div>
              <ul className="mt-6 space-y-3">
                {plan.features.map(f => (
                  <li key={f.label} className={`flex items-center gap-2 text-sm ${!f.included ? "text-muted-foreground" : ""}`}>
                    {f.included ? <Check size={16} className="text-primary shrink-0" /> : <X size={16} className="shrink-0" />}
                    {f.label}
                  </li>
                ))}
              </ul>
              <Button variant={plan.popular ? "gradient" : "outline"} className="w-full mt-6">
                {plan.price === "0" ? "Commencer gratuitement" : "Choisir ce plan"}
              </Button>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8" style={{ fontFamily: 'Syne' }}>Comparaison détaillée</h2>
          <div className="bg-card rounded-[var(--radius-card)] border overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Fonctionnalité</th>
                  <th className="text-center px-4 py-3 font-medium">Gratuit</th>
                  <th className="text-center px-4 py-3 font-medium">Plus</th>
                  <th className="text-center px-4 py-3 font-medium text-primary">Pro</th>
                </tr>
              </thead>
              <tbody>
                {plans[0].features.map((f, i) => (
                  <tr key={f.label} className="border-b last:border-0">
                    <td className="px-4 py-3">{f.label}</td>
                    {plans.map(p => (
                      <td key={p.name} className="px-4 py-3 text-center">
                        {p.features[i].included ? <Check size={16} className="mx-auto text-primary" /> : <X size={16} className="mx-auto text-muted-foreground" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8" style={{ fontFamily: 'Syne' }}>Questions fréquentes</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-card rounded-[var(--radius-card)] border overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.q}
                  <ChevronDown size={16} className={`shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-muted-foreground">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
