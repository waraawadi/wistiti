import { APP_CONFIG } from "@/config";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, CalendarPlus, CreditCard, Settings, LogOut,
  Bell, Camera, Users, HardDrive, Plus, QrCode, Eye, MoreHorizontal, Image
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", active: true },
  { icon: Image, label: "Mes événements" },
  { icon: CalendarPlus, label: "Créer un événement" },
  { icon: CreditCard, label: "Tarifs & Plan" },
  { icon: Settings, label: "Paramètres" },
];

const stats = [
  { label: "Événements actifs", value: "3", icon: CalendarPlus },
  { label: "Total photos", value: "1 247", icon: Camera },
  { label: "Invités estimés", value: "342", icon: Users },
  { label: "Stockage utilisé", value: "2.4 Go", icon: HardDrive },
];

const events = [
  { name: "Mariage Sophie & Lucas", date: "15 Juin 2026", photos: 487, status: "Actif" },
  { name: "Anniversaire Mamadou", date: "22 Mars 2026", photos: 312, status: "Actif" },
  { name: "Séminaire Entreprise BDS", date: "8 Janvier 2026", photos: 448, status: "Expiré" },
];

const DashboardPage = () => {
  const [activeNav, setActiveNav] = useState(0);

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))]">
        <div className="p-6">
          <span className="text-xl font-bold text-white" style={{ fontFamily: 'Syne' }}>{APP_CONFIG.name}</span>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item, i) => (
            <button
              key={item.label}
              onClick={() => setActiveNav(i)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-button)] text-sm transition-all ${
                activeNav === i
                  ? "bg-primary text-white font-medium"
                  : "text-white/70 hover:bg-white/10"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center text-white text-sm font-bold">M</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Marie Konaté</p>
              <p className="text-xs text-white/50">Plan Plus</p>
            </div>
            <button className="text-white/50 hover:text-white"><LogOut size={16} /></button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen overflow-auto">
        <header className="bg-card border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold" style={{ fontFamily: 'Syne' }}>Bonjour, Marie 👋</h1>
            <p className="text-sm text-muted-foreground">Lundi 30 Mars 2026</p>
          </div>
          <button className="relative p-2 rounded-[var(--radius-button)] hover:bg-muted transition-colors">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
          </button>
        </header>

        <main className="flex-1 p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(s => (
              <div key={s.label} className="bg-card rounded-[var(--radius-card)] p-5 border relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 gradient-bg" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-extrabold mt-1" style={{ fontFamily: 'Syne' }}>{s.value}</p>
                  </div>
                  <div className="w-10 h-10 rounded-[var(--radius-button)] bg-accent flex items-center justify-center">
                    <s.icon className="text-primary" size={20} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Plan actif */}
          <div className="bg-card rounded-[var(--radius-card)] border p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-secondary text-white text-xs font-semibold">Plan Plus</span>
                <span className="text-sm text-muted-foreground">Expire le 15 Août 2026</span>
              </div>
              <Button variant="outline" size="sm">Mettre à niveau</Button>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Photos utilisées</span>
                <span className="font-medium">342 / 500</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full gradient-bg rounded-full transition-all" style={{ width: "68.4%" }} />
              </div>
            </div>
          </div>

          {/* Events */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ fontFamily: 'Syne' }}>Événements récents</h2>
              <Button variant="gradient" size="sm"><Plus size={16} className="mr-1" /> Créer un événement</Button>
            </div>
            <div className="bg-card rounded-[var(--radius-card)] border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Événement</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Date</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Photos</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Statut</th>
                      <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map(ev => (
                      <tr key={ev.name} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium">{ev.name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{ev.date}</td>
                        <td className="px-4 py-3 text-sm">{ev.photos}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            ev.status === "Actif" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                          }`}>
                            {ev.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8"><Eye size={14} /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><QrCode size={14} /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal size={14} /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
