import { useMemo } from 'react';
import { Lead, ProspectionMeeting } from '../types';
import { motion } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  CheckCircle2, 
  Calendar, 
  TrendingUp,
  Clock,
  Building2,
  Star
} from 'lucide-react';

interface ReportsProps {
  leads: Lead[];
  pms?: ProspectionMeeting[];
}

export function Reports({ leads, pms = [] }: ReportsProps) {
  // Helpers for status checks
  const isWon = (s: string) => {
    const lower = s.toLowerCase();
    return lower.includes('gagn') || lower.includes('won') || lower.includes('success');
  };

  const isContacted = (s: string) => {
    const lower = s.toLowerCase();
    return !lower.includes('nouveau') && !lower.includes('new');
  };

  // Helper to parse date safely in local timezone
  const parseDateLocal = (dateStr: string) => {
    if (!dateStr) return new Date(0);
    try {
      if (dateStr.includes('T')) {
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? new Date(0) : d;
      }
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts.map(Number);
        const parsed = new Date(y, m - 1, d);
        return isNaN(parsed.getTime()) ? new Date(0) : parsed;
      }
      return new Date(dateStr);
    } catch (e) {
      return new Date(0);
    }
  };

  // Get start of current week (Monday)
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const now = new Date();
  const startOfWeek = getStartOfWeek(now);

  // Calculate stats for THIS WEEK
  const thisWeekStats = useMemo(() => {
    const added = leads.filter(l => parseDateLocal(l.dateAjout) >= startOfWeek);
    const contacted = leads.filter(l => {
      const d = l.dateContact ? parseDateLocal(l.dateContact) : parseDateLocal(l.dateAjout);
      return d >= startOfWeek && isContacted(l.status);
    });
    const won = leads.filter(l => {
      const d = l.dateContact ? parseDateLocal(l.dateContact) : parseDateLocal(l.dateAjout);
      return d >= startOfWeek && isWon(l.status);
    });
    const pmsThisWeek = pms.filter(p => parseDateLocal(p.date) >= startOfWeek);
    const prioritized = leads.filter(l => l.isPriority).length;

    return {
      added: added.length,
      contacted: contacted.length,
      won: won.length,
      pms: pmsThisWeek.length,
      total: leads.length,
      prioritized
    };
  }, [leads, pms, startOfWeek]);

  // Group activity by day for this week (Added OR Contacted)
  const dailyActivity = useMemo(() => {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const counts = new Array(7).fill(0);
    
    leads.forEach(l => {
      // Prioritize contact date as requested
      const d = l.dateContact ? parseDateLocal(l.dateContact) : parseDateLocal(l.dateAjout);
      if (d >= startOfWeek) {
        // Get day index (0 = Monday, 6 = Sunday)
        let dayIdx = d.getDay() - 1;
        if (dayIdx === -1) dayIdx = 6; // Sunday
        if (dayIdx >= 0 && dayIdx < 7) {
          counts[dayIdx]++;
        }
      }
    });

    const max = Math.max(...counts, 1);
    return days.map((name, i) => ({
      name,
      count: counts[i],
      percent: (counts[i] / max) * 100
    }));
  }, [leads, startOfWeek]);

  // Recent activity list (this week only)
  const weeklyLeads = useMemo(() => {
    return leads
      .filter(l => {
        const dAjout = parseDateLocal(l.dateAjout);
        const dContact = l.dateContact ? parseDateLocal(l.dateContact) : new Date(0);
        return dAjout >= startOfWeek || dContact >= startOfWeek;
      })
      .sort((a, b) => {
        const dateA = Math.max(parseDateLocal(a.dateAjout).getTime(), a.dateContact ? parseDateLocal(a.dateContact).getTime() : 0);
        const dateB = Math.max(parseDateLocal(b.dateAjout).getTime(), b.dateContact ? parseDateLocal(b.dateContact).getTime() : 0);
        return dateB - dateA;
      });
  }, [leads, startOfWeek]);

  return (
    <div className="h-full overflow-y-auto w-full bg-slate-900">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 max-w-7xl mx-auto space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-50 tracking-tight">Activité de la Semaine</h1>
            <p className="text-slate-400 mt-1">Résumé de vos performances depuis lundi.</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 px-4 py-2 rounded-xl flex items-center gap-3 text-sm text-slate-300">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>Semaine du {startOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</span>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl relative overflow-hidden group hover:border-amber-500/30 transition-colors"
          >
            <div className="absolute -right-2 -top-2 w-16 h-16 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors" />
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <Star className="w-3.5 h-3.5" />
              </div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Prioritaires</p>
            </div>
            <div className="flex items-baseline gap-1.5">
              <h2 className="text-2xl font-bold text-slate-50">{thisWeekStats.prioritized}</h2>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-1.5 text-[9px] text-amber-400 uppercase font-bold tracking-tight">
              <TrendingUp className="w-2.5 h-2.5" />
              <span>Dossiers critiques</span>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-colors"
          >
            <div className="absolute -right-2 -top-2 w-16 h-16 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-colors" />
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                <UserPlus className="w-3.5 h-3.5" />
              </div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Nouveaux</p>
            </div>
            <div className="flex items-baseline gap-1.5">
              <h2 className="text-2xl font-bold text-slate-50">{thisWeekStats.added}</h2>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-1.5 text-[9px] text-blue-400 uppercase font-bold tracking-tight">
              <TrendingUp className="w-2.5 h-2.5" />
              <span>Acquisition active</span>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl relative overflow-hidden group hover:border-amber-500/30 transition-colors"
          >
            <div className="absolute -right-2 -top-2 w-16 h-16 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors" />
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Contactés</p>
            </div>
            <div className="flex items-baseline gap-1.5">
              <h2 className="text-2xl font-bold text-slate-50">{thisWeekStats.contacted}</h2>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-1.5 text-[9px] text-amber-400 uppercase font-bold tracking-tight">
              <TrendingUp className="w-2.5 h-2.5" />
              <span>Actions engagées</span>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl relative overflow-hidden group hover:border-emerald-500/30 transition-colors"
          >
            <div className="absolute -right-2 -top-2 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors" />
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Gagnés</p>
            </div>
            <div className="flex items-baseline gap-1.5">
              <h2 className="text-2xl font-bold text-slate-50">{thisWeekStats.won}</h2>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-1.5 text-[9px] text-emerald-400 uppercase font-bold tracking-tight">
              <TrendingUp className="w-2.5 h-2.5" />
              <span>Objectifs atteints</span>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl relative overflow-hidden group hover:border-pink-500/30 transition-colors"
          >
            <div className="absolute -right-2 -top-2 w-16 h-16 bg-pink-500/5 rounded-full blur-xl group-hover:bg-pink-500/10 transition-colors" />
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">RDV</p>
            </div>
            <div className="flex items-baseline gap-1.5">
              <h2 className="text-2xl font-bold text-slate-50">{thisWeekStats.pms}</h2>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-1.5 text-[9px] text-pink-400 uppercase font-bold tracking-tight">
              <TrendingUp className="w-2.5 h-2.5" />
              <span>Volume hebdo</span>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Daily Chart */}
          <div className="lg:col-span-1 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-50 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Nouveaux leads par jour
            </h3>
            <div className="flex items-end justify-between h-48 gap-2">
              {dailyActivity.map((day) => (
                <div key={day.name} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full relative flex flex-col justify-end h-full">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${day.percent}%` }}
                      className="w-full bg-blue-500/20 border-t-2 border-blue-500 rounded-t-md group-hover:bg-blue-500/30 transition-colors relative"
                    >
                      {day.count > 0 && (
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-blue-400">
                          {day.count}
                        </span>
                      )}
                    </motion.div>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{day.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="lg:col-span-2 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-col">
            <h3 className="text-lg font-semibold text-slate-50 mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              Journal de la semaine
            </h3>
            <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
              {weeklyLeads.map((lead) => {
                const isNewThisWeek = parseDateLocal(lead.dateAjout) >= startOfWeek;
                const isContactedThisWeek = lead.dateContact && parseDateLocal(lead.dateContact) >= startOfWeek;
                
                return (
                  <div key={lead.id} className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-700/50 hover:border-slate-600 transition-colors">
                    <div className={`mt-1 p-2 rounded-lg ${isWon(lead.status) ? 'bg-emerald-500/10 text-emerald-400' : isContactedThisWeek ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      {isWon(lead.status) ? <CheckCircle2 className="w-4 h-4" /> : isContactedThisWeek ? <Users className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-slate-200 truncate">
                          {lead.prenom} {lead.nom}
                        </p>
                        <span className="text-[10px] text-slate-500 whitespace-nowrap">
                          {isContactedThisWeek ? 'Contacté' : 'Ajouté'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Building2 className="w-3 h-3 text-slate-500" />
                        <span className="text-xs text-slate-400 truncate">{lead.entreprise}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                          isWon(lead.status) ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          isContacted(lead.status) ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {lead.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {weeklyLeads.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <Calendar className="w-12 h-12 mb-4 opacity-20" />
                  <p>Aucune activité enregistrée cette semaine.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
