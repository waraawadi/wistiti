import { APP_CONFIG } from "@/config";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Save, Upload } from "lucide-react";

const ThemeConfigPage = () => {
  const [primary, setPrimary] = useState<string>(APP_CONFIG.colors.primary);
  const [secondary, setSecondary] = useState<string>(APP_CONFIG.colors.secondary);
  const [appName, setAppName] = useState<string>(APP_CONFIG.name);

  const gradient = `linear-gradient(135deg, ${primary}, ${secondary})`;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b px-6 py-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: 'Syne' }}>Configuration du thème</h1>
          <p className="text-sm text-muted-foreground">Personnalisez l'apparence de votre application</p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Settings */}
          <div className="space-y-6">
            {/* Identity */}
            <div className="bg-card rounded-[var(--radius-card)] border p-6 space-y-5">
              <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne' }}>Identité de l'application</h2>
              <div>
                <label className="text-sm font-medium">Nom de l'application</label>
                <input
                  className="w-full h-12 px-4 mt-1 rounded-[var(--radius-input)] border bg-background text-lg font-bold"
                  value={appName}
                  onChange={e => setAppName(e.target.value)}
                  style={{ fontFamily: 'Syne' }}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Logo</label>
                <div className="mt-1 border-2 border-dashed rounded-[var(--radius-button)] p-6 text-center cursor-pointer hover:border-primary transition-colors">
                  <Upload className="mx-auto text-muted-foreground" size={24} />
                  <p className="text-xs text-muted-foreground mt-1">Glissez ou cliquez</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Favicon</label>
                <div className="mt-1 border-2 border-dashed rounded-[var(--radius-button)] p-4 text-center cursor-pointer hover:border-primary transition-colors inline-flex items-center gap-3">
                  <Upload className="text-muted-foreground" size={18} />
                  <p className="text-xs text-muted-foreground">32x32 PNG</p>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="bg-card rounded-[var(--radius-card)] border p-6 space-y-5">
              <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne' }}>Couleurs</h2>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium">Couleur principale</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="color" value={primary} onChange={e => setPrimary(e.target.value)} className="w-10 h-10 rounded-[var(--radius-input)] border cursor-pointer" />
                    <input className="h-10 px-3 rounded-[var(--radius-input)] border bg-background text-sm w-28 font-mono" value={primary} onChange={e => setPrimary(e.target.value)} />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium">Couleur secondaire</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="color" value={secondary} onChange={e => setSecondary(e.target.value)} className="w-10 h-10 rounded-[var(--radius-input)] border cursor-pointer" />
                    <input className="h-10 px-3 rounded-[var(--radius-input)] border bg-background text-sm w-28 font-mono" value={secondary} onChange={e => setSecondary(e.target.value)} />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Aperçu du dégradé</label>
                <div className="mt-1 h-12 rounded-[var(--radius-button)]" style={{ background: gradient }} />
              </div>
            </div>

            <Button variant="gradient" size="lg" className="w-full">
              <Save size={16} className="mr-1" /> Enregistrer les modifications
            </Button>
          </div>

          {/* Right: Live preview */}
          <div className="lg:sticky lg:top-24 self-start">
            <div className="bg-card rounded-[var(--radius-card)] border p-6">
              <h2 className="font-bold text-lg mb-4" style={{ fontFamily: 'Syne' }}>Prévisualisation en direct</h2>

              {/* Mini navbar */}
              <div className="bg-muted rounded-[var(--radius-button)] p-3 flex items-center justify-between">
                <span className="text-sm font-bold" style={{ fontFamily: 'Syne', background: gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {appName}
                </span>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>Lien 1</span>
                  <span>Lien 2</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-4">
                <button className="px-4 py-2 rounded-[var(--radius-button)] text-white text-sm font-medium" style={{ background: primary }}>
                  Bouton primaire
                </button>
                <button className="px-4 py-2 rounded-[var(--radius-button)] text-white text-sm font-medium" style={{ background: secondary }}>
                  Bouton secondaire
                </button>
              </div>

              {/* Card with gradient header */}
              <div className="mt-4 rounded-[var(--radius-button)] border overflow-hidden">
                <div className="h-3" style={{ background: gradient }} />
                <div className="p-4">
                  <h4 className="font-bold text-sm" style={{ fontFamily: 'Syne' }}>Exemple de carte</h4>
                  <p className="text-xs text-muted-foreground mt-1">Contenu de la carte avec le thème actuel.</p>
                </div>
              </div>

              {/* Badge & progress */}
              <div className="flex items-center gap-3 mt-4">
                <span className="text-xs px-3 py-1 rounded-full text-white font-medium" style={{ background: primary }}>Badge</span>
                <span className="text-xs px-3 py-1 rounded-full text-white font-medium" style={{ background: secondary }}>Tag</span>
              </div>
              <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full w-3/4" style={{ background: gradient }} />
              </div>

              <p className="text-xs text-muted-foreground mt-4 text-center">
                Ces modifications s'appliquent immédiatement sans rechargement
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeConfigPage;
