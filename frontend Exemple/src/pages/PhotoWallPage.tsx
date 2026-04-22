import { APP_CONFIG } from "@/config";
import { QrCode, Maximize, Camera } from "lucide-react";

const PhotoWallPage = () => {
  return (
    <div className="h-screen w-screen bg-[#0a0a0a] relative overflow-hidden flex items-center justify-center">
      {/* Waiting state */}
      <div className="text-center z-10">
        <div className="relative inline-block">
          <Camera className="text-primary mx-auto animate-pulse" size={64} />
        </div>
        <h2 className="text-white text-2xl font-extrabold mt-6" style={{ fontFamily: 'Syne' }}>{APP_CONFIG.name}</h2>
        <p className="text-gray-500 mt-2">En attente de photos...</p>
        <p className="text-gray-600 text-sm mt-1">Les photos apparaîtront ici en temps réel</p>
      </div>

      {/* Top overlay */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/60 to-transparent z-20">
        <div className="flex items-center gap-2">
          <Camera className="text-primary" size={20} />
          <span className="text-white font-bold" style={{ fontFamily: 'Syne' }}>{APP_CONFIG.name}</span>
        </div>
        <span className="text-white/80 text-sm">Mariage Sophie & Lucas</span>
      </div>

      {/* Bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-6 py-6 z-20">
        <p className="text-white text-lg font-bold" style={{ fontFamily: 'Syne' }}>Un moment magique ✨</p>
        <p className="text-white/60 text-sm mt-1">📸 Photo par Amara</p>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-30">
        <div className="h-full bg-primary animate-[progress_5s_linear_infinite] origin-left" 
          style={{ animation: "progress 5s linear infinite" }} />
      </div>

      {/* Bottom right controls */}
      <div className="absolute bottom-8 right-6 flex items-center gap-3 z-20">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white/50 text-xs">Connecté</span>
        </div>
        <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20">
          <Maximize size={14} />
        </button>
      </div>

      {/* QR in corner */}
      <div className="absolute bottom-20 right-6 z-20 opacity-50 hover:opacity-100 transition-opacity">
        <QrCode className="text-white" size={40} />
      </div>

      <style>{`
        @keyframes progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
};

export default PhotoWallPage;
