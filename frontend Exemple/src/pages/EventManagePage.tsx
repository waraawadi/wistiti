import { APP_CONFIG } from "@/config";
import { Button } from "@/components/ui/button";
import {
  Save, Upload, QrCode, Copy, Printer, ExternalLink, Camera,
  Check, X, Trash2, AlertTriangle, Users, HardDrive, Image
} from "lucide-react";
import { useState } from "react";

const mockPhotos = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  approved: i < 8,
  pending: i >= 8,
}));

const EventManagePage = () => {
  const [moderation, setModeration] = useState(true);
  const [photoWall, setPhotoWall] = useState(true);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Gérer l'événement</p>
            <h1 className="text-2xl font-extrabold" style={{ fontFamily: 'Syne' }}>Mariage Sophie & Lucas</h1>
          </div>
          <Button variant="gradient"><Save size={16} className="mr-1" /> Enregistrer</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div className="space-y-6">
            <div className="bg-card rounded-[var(--radius-card)] border p-6 space-y-5">
              <div>
                <label className="text-sm font-medium">Titre de l'événement</label>
                <input className="w-full h-12 px-4 mt-1 rounded-[var(--radius-input)] border bg-background text-lg font-bold" defaultValue="Mariage Sophie & Lucas" style={{ fontFamily: 'Syne' }} />
              </div>
              <div>
                <label className="text-sm font-medium">Date et heure</label>
                <input type="datetime-local" className="w-full h-10 px-4 mt-1 rounded-[var(--radius-input)] border bg-background text-sm" defaultValue="2026-06-15T14:00" />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea className="w-full px-4 py-3 mt-1 rounded-[var(--radius-input)] border bg-background text-sm min-h-[100px] resize-none" defaultValue="Rejoignez-nous pour célébrer l'union de Sophie et Lucas. Partagez vos plus beaux moments !" />
              </div>
              <div>
                <label className="text-sm font-medium">Couleur du thème</label>
                <div className="flex items-center gap-3 mt-1">
                  <input type="color" defaultValue={APP_CONFIG.colors.primary} className="w-10 h-10 rounded-[var(--radius-input)] border cursor-pointer" />
                  <input className="h-10 px-3 rounded-[var(--radius-input)] border bg-background text-sm w-32" defaultValue={APP_CONFIG.colors.primary} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Image de fond</label>
                <div className="mt-1 border-2 border-dashed rounded-[var(--radius-card)] p-8 text-center hover:border-primary transition-colors cursor-pointer">
                  <Upload className="mx-auto text-muted-foreground" size={32} />
                  <p className="text-sm text-muted-foreground mt-2">Glissez une image ou cliquez pour sélectionner</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Activer la modération manuelle</p>
                  <p className="text-xs text-muted-foreground">Validez les photos avant publication</p>
                </div>
                <button onClick={() => setModeration(!moderation)} className={`w-11 h-6 rounded-full transition-colors relative ${moderation ? "bg-primary" : "bg-muted"}`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${moderation ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Photo Wall activé</p>
                  <p className="text-xs text-muted-foreground">Diffusez les photos en direct</p>
                </div>
                <button onClick={() => setPhotoWall(!photoWall)} className={`w-11 h-6 rounded-full transition-colors relative ${photoWall ? "bg-primary" : "bg-muted"}`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${photoWall ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>

            {/* Danger zone */}
            <div className="bg-card rounded-[var(--radius-card)] border border-destructive/30 p-6">
              <div className="flex items-center gap-2 text-destructive mb-2">
                <AlertTriangle size={18} /> <span className="font-medium text-sm">Zone de danger</span>
              </div>
              <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                Désactiver l'événement
              </Button>
            </div>
          </div>

          {/* Right: Preview + Tools */}
          <div className="space-y-6">
            {/* QR Code */}
            <div className="bg-card rounded-[var(--radius-card)] border p-6 text-center">
              <h3 className="font-bold" style={{ fontFamily: 'Syne' }}>QR Code de l'événement</h3>
              <div className="w-48 h-48 mx-auto mt-4 rounded-[var(--radius-card)] border-2 border-primary/20 flex items-center justify-center bg-white">
                <QrCode size={120} className="text-primary" />
              </div>
              <p className="text-xs text-muted-foreground mt-3 font-mono">photoevent.app/e/sophie-lucas-2026</p>
              <div className="flex gap-2 mt-4 justify-center flex-wrap">
                <Button variant="outline" size="sm"><Copy size={14} className="mr-1" /> Copier le lien</Button>
                <Button variant="outline" size="sm"><Printer size={14} className="mr-1" /> Imprimer</Button>
                <Button variant="gradient" size="sm">Télécharger PNG</Button>
              </div>
            </div>

            {/* Photo Wall link */}
            <div className="bg-card rounded-[var(--radius-card)] border p-6">
              <h3 className="font-bold" style={{ fontFamily: 'Syne' }}>Photo Wall</h3>
              <p className="text-xs text-muted-foreground mt-1 font-mono">photoevent.app/wall/sophie-lucas-2026</p>
              <Button variant="secondary" size="sm" className="mt-3"><ExternalLink size={14} className="mr-1" /> Ouvrir le Photo Wall</Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Camera, label: "Photos", value: "487" },
                { icon: Users, label: "Invités", value: "89" },
                { icon: HardDrive, label: "Espace", value: "1.2 Go" },
              ].map(s => (
                <div key={s.label} className="bg-card rounded-[var(--radius-card)] border p-4 text-center">
                  <s.icon className="mx-auto text-primary" size={20} />
                  <p className="text-lg font-bold mt-1" style={{ fontFamily: 'Syne' }}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Media grid */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Syne' }}>Médias ({mockPhotos.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {mockPhotos.map(photo => (
              <div key={photo.id} className="relative group aspect-square rounded-[var(--radius-button)] bg-muted overflow-hidden cursor-pointer">
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
                  <Image className="text-muted-foreground/40" size={28} />
                </div>
                {photo.pending && (
                  <span className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">En attente</span>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600"><Check size={14} /></button>
                  <button className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"><X size={14} /></button>
                  <button className="w-8 h-8 rounded-full bg-gray-500 text-white flex items-center justify-center hover:bg-gray-600"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">Faites défiler pour charger plus de photos...</p>
        </div>
      </main>
    </div>
  );
};

export default EventManagePage;
