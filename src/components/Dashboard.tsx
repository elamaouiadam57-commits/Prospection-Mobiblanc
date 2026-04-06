import { Lead } from '../types';
import { motion } from 'motion/react';
import { Users, Target, Building2, UserCheck } from 'lucide-react';

interface DashboardProps {
  leads: Lead[];
}

export function Dashboard({ leads }: DashboardProps) {
  const isWon = (s: string) => {
    const lower = s.toLowerCase();
    return lower.includes('gagn') || lower.includes('won') || lower.includes('success');
  };
  
  const isLost = (s: string) => {
    const lower = s.toLowerCase();
    return lower.includes('perdu') || lower.includes('lost') || lower.includes('fail');
  };

  const isNew = (s: string) => {
    const lower = s.toLowerCase();
    return lower.includes('nouveau') || lower.includes('new');
  };

  const totalLeads = leads.length;
  const contactedLeads = leads.filter(l => !isNew(l.status));
  
  // Get unique companies from contacted leads
  const uniqueCompanies = new Set(
    contactedLeads
      .map(l => l.entreprise?.trim())
      .filter(Boolean)
  );

  const wonLeads = leads.filter(l => isWon(l.status)).length;
  const winRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

  const stats = [
    { label: 'Total Prospects', value: totalLeads.toString(), icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Personnes contactées', value: contactedLeads.length.toString(), icon: UserCheck, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Entreprises contactées', value: uniqueCompanies.size.toString(), icon: Building2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Taux de conversion', value: `${winRate}%`, icon: Target, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 max-w-7xl mx-auto"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-50 tracking-tight">Overview</h1>
        <p className="text-slate-400 mt-1 text-sm">Here's what's happening in your pipeline today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg shadow-black/10"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-slate-400 text-sm font-medium">{stat.label}</h3>
              <p className="text-2xl font-semibold text-slate-50 mt-1">{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Placeholder for future charts */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg shadow-black/10 h-80 flex flex-col">
          <h3 className="font-medium text-slate-50 mb-4">Revenue Forecast</h3>
          <div className="flex-1 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center bg-slate-900/50">
            <p className="text-sm text-slate-500">Chart visualization area</p>
          </div>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg shadow-black/10 h-80 flex flex-col">
          <h3 className="font-medium text-slate-50 mb-4">Recent Activity</h3>
          <div className="flex-1 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center bg-slate-900/50">
            <p className="text-sm text-slate-500">Activity feed</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
