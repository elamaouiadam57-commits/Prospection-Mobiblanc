import { Search, Bell, ArrowDownUp } from 'lucide-react';

interface TopBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortOrder: 'desc' | 'asc';
  setSortOrder: (order: 'desc' | 'asc') => void;
}

export function TopBar({ searchQuery, setSearchQuery, sortOrder, setSortOrder }: TopBarProps) {
  return (
    <header className="h-16 border-b border-gray-200/50 bg-white/70 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-8">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="font-medium text-gray-900">Business Development</span>
        <span>/</span>
        <span>Pipeline</span>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          title="Trier par date"
        >
          <ArrowDownUp className="w-4 h-4" />
          <span>{sortOrder === 'desc' ? 'Plus récents' : 'Plus anciens'}</span>
        </button>
        
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Rechercher par nom ou entreprise..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-1.5 bg-gray-100/50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-full text-sm w-64 transition-all outline-none"
          />
        </div>
        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 border border-gray-200 overflow-hidden">
          <img src="https://picsum.photos/seed/avatar/100/100" alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
      </div>
    </header>
  );
}
