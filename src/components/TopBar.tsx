import { Search, Bell, ArrowDownUp, RefreshCw } from 'lucide-react';

interface TopBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortOrder: 'desc' | 'asc';
  setSortOrder: (order: 'desc' | 'asc') => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function TopBar({ searchQuery, setSearchQuery, sortOrder, setSortOrder, onRefresh, isRefreshing }: TopBarProps) {
  return (
    <header className="h-16 border-b border-slate-800/50 bg-slate-900/70 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-8">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <span className="font-medium text-slate-50">Business Development</span>
        <span>/</span>
        <span>Pipeline</span>
      </div>

      <div className="flex items-center gap-4">
        {onRefresh && (
          <button 
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`p-2 text-slate-400 hover:text-slate-200 transition-colors rounded-full hover:bg-slate-800 ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Synchroniser avec Airtable"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
        <button 
          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors"
          title="Trier par date"
        >
          <ArrowDownUp className="w-4 h-4" />
          <span>{sortOrder === 'desc' ? 'Plus récents' : 'Plus anciens'}</span>
        </button>
        
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher par nom ou entreprise..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-1.5 bg-slate-800/50 border-transparent focus:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-full text-sm w-64 transition-all outline-none text-slate-50 placeholder-slate-500"
          />
        </div>
        <button className="p-2 text-slate-400 hover:text-slate-200 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900"></span>
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 border border-slate-700 overflow-hidden">
          <img src="https://picsum.photos/seed/avatar/100/100" alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
      </div>
    </header>
  );
}
