import { useMemo } from 'react';
import { Lead } from '../types';
import { motion } from 'motion/react';
import { BarChart3, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ReportsProps {
  leads: Lead[];
}

export function Reports({ leads }: ReportsProps) {
  const isWon = (s: string) => {
    const lower = s.toLowerCase();
    return lower.includes('gagn') || lower.includes('won') || lower.includes('success');
  };

  const isContacted = (s: string) => {
    const lower = s.toLowerCase();
    return !lower.includes('nouveau') && !lower.includes('new');
  };

  // Helper to get start of week (Monday)
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const now = new Date();
  const startOfThisWeek = getStartOfWeek(now);
  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
  const endOfLastWeek = new Date(startOfThisWeek);
  endOfLastWeek.setMilliseconds(-1);

  const stats = useMemo(() => {
    const thisWeekLeads = leads.filter(l => new Date(l.dateAjout) >= startOfThisWeek);
    const lastWeekLeads = leads.filter(l => {
      const d = new Date(l.dateAjout);
      return d >= startOfLastWeek && d <= endOfLastWeek;
    });

    const thisWeekContacted = leads.filter(l => {
      const d = l.dateContact ? new Date(l.dateContact) : new Date(l.dateAjout);
      return d >= startOfThisWeek && isContacted(l.status);
    });
    const lastWeekContacted = leads.filter(l => {
      const d = l.dateContact ? new Date(l.dateContact) : new Date(l.dateAjout);
      return d >= startOfLastWeek && d <= endOfLastWeek && isContacted(l.status);
    });

    const thisWeekWon = leads.filter(l => {
      // Assuming if they are won, and their dateContact/dateAjout is this week
      const d = l.dateContact ? new Date(l.dateContact) : new Date(l.dateAjout);
      return d >= startOfThisWeek && isWon(l.status);
    });
    const lastWeekWon = leads.filter(l => {
      const d = l.dateContact ? new Date(l.dateContact) : new Date(l.dateAjout);
      return d >= startOfLastWeek && d <= endOfLastWeek && isWon(l.status);
    });

    const calcTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      added: {
        current: thisWeekLeads.length,
        previous: lastWeekLeads.length,
        trend: calcTrend(thisWeekLeads.length, lastWeekLeads.length)
      },
      contacted: {
        current: thisWeekContacted.length,
        previous: lastWeekContacted.length,
        trend: calcTrend(thisWeekContacted.length, lastWeekContacted.length)
      },
      won: {
        current: thisWeekWon.length,
        previous: lastWeekWon.length,
        trend: calcTrend(thisWeekWon.length, lastWeekWon.length)
      }
    };
  }, [leads, startOfThisWeek, startOfLastWeek, endOfLastWeek]);

  const contactedLeads = useMemo(() => {
    return leads
      .filter(l => isContacted(l.status))
      .sort((a, b) => {
        const dateA = a.dateContact ? new Date(a.dateContact).getTime() : new Date(a.dateAjout).getTime();
        const dateB = b.dateContact ? new Date(b.dateContact).getTime() : new Date(b.dateAjout).getTime();
        return dateB - dateA;
      });
  }, [leads]);

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('nouveau') || s.includes('new')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (s.includes('contact')) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    if (s.includes('qualifi')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    if (s.includes('prop')) return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    if (s.includes('gagn') || s.includes('won')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (s.includes('perdu') || s.includes('lost')) return 'bg-red-500/10 text-red-400 border-red-500/20';
    return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  };

  const StatCard = ({ title, current, previous, trend, icon: Icon }: any) => (
    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg shadow-black/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
        <div className="w-10 h-10 rounded-xl bg-slate-900/50 flex items-center justify-center text-slate-300">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-end gap-3">
        <p className="text-3xl font-semibold text-slate-50">{current}</p>
        <div className={`flex items-center text-sm font-medium mb-1 ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend >= 0 ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
          {Math.abs(trend)}%
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-2">vs semaine dernière ({previous})</p>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto w-full">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 max-w-7xl mx-auto"
      >
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-50 tracking-tight">Rapports & Statistiques</h1>
          <p className="text-slate-400 mt-1 text-sm">Analysez vos performances hebdomadaires et l'historique des contacts.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            title="Nouveaux prospects" 
            current={stats.added.current} 
            previous={stats.added.previous} 
            trend={stats.added.trend} 
            icon={BarChart3} 
          />
          <StatCard 
            title="Prospects contactés" 
            current={stats.contacted.current} 
            previous={stats.contacted.previous} 
            trend={stats.contacted.trend} 
            icon={Calendar} 
          />
          <StatCard 
            title="Prospects gagnés" 
            current={stats.won.current} 
            previous={stats.won.previous} 
            trend={stats.won.trend} 
            icon={TrendingUp} 
          />
        </div>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-lg shadow-black/10 flex flex-col min-h-0 overflow-hidden">
          <div className="p-6 border-b border-slate-700 bg-slate-900/50">
            <h3 className="font-medium text-slate-50">Historique des contacts</h3>
            <p className="text-sm text-slate-400 mt-1">Liste chronologique des prospects que vous avez contactés.</p>
          </div>
          <div className="overflow-auto max-h-[600px] custom-scrollbar">
            <table className="w-full text-left text-sm relative">
              <thead className="bg-slate-900/95 backdrop-blur-md border-b border-slate-700 text-slate-400 font-medium sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4">Date de contact</th>
                  <th className="px-6 py-4">Prospect</th>
                  <th className="px-6 py-4">Entreprise</th>
                  <th className="px-6 py-4">Statut actuel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {contactedLeads.map((lead) => {
                  const dateStr = lead.dateContact || lead.dateAjout;
                  const dateObj = new Date(dateStr);
                  return (
                    <tr key={lead.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                        {dateObj.toLocaleDateString('fr-FR', { 
                          weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-200">{lead.prenom} {lead.nom}</div>
                        <div className="text-slate-500 text-xs">{lead.fonction || 'Fonction non renseignée'}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {lead.entreprise || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {contactedLeads.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      Aucun prospect contacté pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
