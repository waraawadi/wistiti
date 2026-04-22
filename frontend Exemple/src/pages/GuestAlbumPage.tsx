import { APP_CONFIG } from "@/config";
import { Button } from "@/components/ui/button";
import { Upload, Download, Camera, Image, MessageSquarePlus } from "lucide-react";

const mockPhotos = Array.from({ length: 15 }, (_, i) => i + 1);

const GuestAlbumPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header banner */}
      <div className="gradient-bg py-12 px-4 text-center text-white">
        <p className="text-sm uppercase tracking-wider text-white/70">{APP_CONFIG.name}</p>
        <h1 className="text-3xl md:text-4xl font-extrabold mt-2" style={{ fontFamily: 'Syne' }}>
          Mariage de Sophie & Lucas
        </h1>
        <p className="text-white/80 mt-2">15 Juin 2026 — Dakar, Sénégal</p>
        <p className="text-white/60 text-sm mt-1">342 moments partagés par 89 invités</p>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Upload zone */}
        <div className="border-2 border-dashed rounded-[var(--radius-card)] p-10 text-center hover:border-primary transition-colors cursor-pointer group bg-card">
          <div className="w-16 h-16 mx-auto rounded-full bg-accent flex items-center justify-center group-hover:scale-110 transition-transform">
            <Upload className="text-primary" size={28} />
          </div>
          <p className="mt-4 font-medium" style={{ fontFamily: 'Syne' }}>Glissez vos photos ici</p>
          <p className="text-sm text-muted-foreground mt-1">ou cliquez pour sélectionner — photos & vidéos acceptées</p>
          <Button variant="gradient" size="sm" className="mt-4">
            <Camera size={16} className="mr-1" /> Sélectionner des fichiers
          </Button>
        </div>

        {/* Floating caption button */}
        <div className="flex justify-center mt-4">
          <Button variant="secondary" size="sm">
            <MessageSquarePlus size={16} className="mr-1" /> Ajouter une légende
          </Button>
        </div>

        {/* Photo grid */}
        <div className="mt-8 columns-2 md:columns-3 gap-3 space-y-3">
          {mockPhotos.map(i => {
            const heights = [200, 260, 180, 300, 220, 240];
            const h = heights[i % heights.length];
            return (
              <div
                key={i}
                className="relative rounded-[var(--radius-button)] overflow-hidden bg-muted group cursor-pointer break-inside-avoid"
                style={{ height: `${h}px` }}
              >
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-accent">
                  <Image className="text-muted-foreground/30" size={32} />
                </div>
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <div className="flex-1">
                    <p className="text-white text-xs">📸 Photo par Amara</p>
                  </div>
                  <button className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30">
                    <Download size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GuestAlbumPage;
