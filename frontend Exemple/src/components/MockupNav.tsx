import { useNavigate, useLocation } from "react-router-dom";
import { APP_CONFIG } from "@/config";

const pages = [
  { label: "Accueil", path: "/" },
  { label: "Connexion", path: "/login" },
  { label: "Dashboard", path: "/dashboard" },
  { label: "Événement", path: "/dashboard/evenements/sophie-lucas" },
  { label: "Album invité", path: "/evenement/sophie-lucas" },
  { label: "Photo Wall", path: "/photowall/sophie-lucas" },
  { label: "Config thème", path: "/admin/config" },
  { label: "Tarifs", path: "/pricing" },
];

const MockupNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide on photo wall (full screen)
  if (location.pathname.startsWith("/photowall")) return null;

  return (
    <div className="sticky top-0 z-[100] bg-foreground/95 backdrop-blur-md text-background">
      <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto scrollbar-none">
        <span className="text-xs font-bold shrink-0 mr-2 opacity-60">{APP_CONFIG.name} Mockup →</span>
        {pages.map(p => (
          <button
            key={p.path}
            onClick={() => navigate(p.path)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all shrink-0 ${
              location.pathname === p.path
                ? "gradient-bg text-white font-medium"
                : "text-background/70 hover:text-background hover:bg-background/10"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MockupNav;
