import { LayoutDashboard, Users, Trello, Settings, LogOut, BarChart3, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface SidebarProps {
  currentView: 'dashboard' | 'table' | 'kanban' | 'reports' | 'prospection-meetings';
  setCurrentView: (view: 'dashboard' | 'table' | 'kanban' | 'reports' | 'prospection-meetings') => void;
  onLogout: () => void;
  priorityCount?: number;
}

export function Sidebar({ currentView, setCurrentView, onLogout, priorityCount = 0 }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'table', label: 'Leads Table', icon: Users },
    { id: 'kanban', label: 'Pipeline', icon: Trello },
    { id: 'prospection-meetings', label: 'RDV Prospection', icon: Calendar },
    { id: 'reports', label: 'Rapports', icon: BarChart3 },
  ] as const;

  return (
    <aside className="w-64 h-screen bg-slate-900/50 border-r border-slate-800/50 flex flex-col backdrop-blur-xl">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <span className="text-white font-semibold text-sm">M</span>
          </div>
          <span className="font-semibold text-slate-50 tracking-tight">Mobiblanc CRM</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 relative",
                isActive 
                  ? "text-blue-400 bg-blue-500/10" 
                  : "text-slate-400 hover:text-slate-50 hover:bg-slate-800/80"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute inset-0 bg-blue-500/10 rounded-xl"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className="w-4 h-4 relative z-10" />
              <span className="relative z-10 flex-1">{item.label}</span>
              {item.id === 'table' && priorityCount > 0 && (
                <span className="relative z-10 bg-amber-500 text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded-md min-w-[18px] text-center">
                  {priorityCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800/50">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-50 hover:bg-slate-800/80 transition-colors">
          <Settings className="w-4 h-4" />
          Settings
        </button>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors mt-1"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}
