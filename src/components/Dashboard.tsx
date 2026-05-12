import { useState } from 'react';
import { Lead, ProspectionMeeting } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Target, Building2, ChevronDown, Clock, Video, Calendar, Star } from 'lucide-react';

interface DashboardProps {
  leads: Lead[];
  pms?: ProspectionMeeting[];
}

export function Dashboard({ leads, pms = [] }: DashboardProps) {
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);

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

  // Group contacted leads by company
  const companiesMap = new Map<string, Lead[]>();
  contactedLeads.forEach(lead => {
    const companyName = lead.entreprise?.trim() || 'Non renseigné';
    if (!companiesMap.has(companyName)) {
      companiesMap.set(companyName, []);
    }
    companiesMap.get(companyName)!.push(lead);
  });

  // Sort companies by number of leads (descending)
  const sortedCompanies = Array.from(companiesMap.entries()).sort((a, b) => b[1].length - a[1].length);

  // Helper to parse date safely in local timezone
  const parseDateLocal = (dateStr: string) => {
    if (!dateStr) return new Date(0);
    try {
      if (dateStr.includes('T')) {
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? new Date(0) : d;
      }
      const parts = dateStr.split('-');
      if (parts.length !== 3) return new Date(0);
      const [y, m, d] = parts.map(Number);
      const parsed = new Date(y, m - 1, d);
      return isNaN(parsed.getTime()) ? new Date(0) : parsed;
    } catch (e) {
      return new Date(0);
    }
  };

  // Recent activity (last 10 added leads)
  const recentActivity = [...leads]
    .sort((a, b) => parseDateLocal(b.dateAjout).getTime() - parseDateLocal(a.dateAjout).getTime())
    .slice(0, 15);

  const toggleCompany = (companyName: string) => {
    setExpandedCompany(prev => prev === companyName ? null : companyName);
  };

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

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const startOfWeek = getStartOfWeek(new Date());
  const pmsThisWeek = pms.filter(p => parseDateLocal(p.date) >= startOfWeek).length;
  const prioritizedLeads = leads.filter(l => l.isPriority).length;

  const stats = [
    { label: 'Total Prospects', value: totalLeads.toString(), icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Prioritaires', value: prioritizedLeads.toString(), icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Entreprises', value: uniqueCompanies.size.toString(), icon: Building2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'RDV de la semaine', value: pmsThisWeek.toString(), icon: Calendar, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="h-full overflow-y-auto w-full">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 max-w-7xl mx-auto"
      >
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-50 tracking-tight">Overview</h1>
          <p className="text-slate-400 mt-1 text-sm">Here's what's happening in your pipeline today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
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

        {/* Company Details & Recent Activity */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg shadow-black/10 h-[500px] flex flex-col">
            <h3 className="font-medium text-slate-50 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              Détail par entreprise contactée
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {sortedCompanies.map(([companyName, companyLeads]) => (
                <div key={companyName} className="border border-slate-700 rounded-xl overflow-hidden bg-slate-900/50">
                  <button
                    onClick={() => toggleCompany(companyName)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-800 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-semibold text-sm">
                        {companyName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-200">{companyName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-slate-700 text-slate-300 text-xs py-1 px-2.5 rounded-full font-medium">
                        {companyLeads.length} prospect{companyLeads.length > 1 ? 's' : ''}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${expandedCompany === companyName ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  <AnimatePresence>
                    {expandedCompany === companyName && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-700/50 bg-slate-900/80"
                      >
                        <div className="p-4 space-y-3">
                          {companyLeads.map(lead => (
                            <div key={lead.id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                              <div>
                                <p className="text-sm font-medium text-slate-200">{lead.prenom} {lead.nom}</p>
                                <p className="text-xs text-slate-400">{lead.fonction || 'Fonction non renseignée'}</p>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-md font-medium border ${getStatusColor(lead.status)}`}>
                                {lead.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
              {sortedCompanies.length === 0 && (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                  Aucune entreprise contactée pour le moment.
                </div>
              )}
            </div>
          </div>
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg shadow-black/10 h-[500px] flex flex-col">
            <h3 className="font-medium text-slate-50 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Activité récente
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {recentActivity.map(lead => (
                <div key={lead.id} className="relative pl-4 border-l-2 border-slate-700 pb-4 last:pb-0 last:border-transparent">
                  <div className="absolute w-2.5 h-2.5 bg-blue-500 rounded-full -left-[6px] top-1.5 ring-4 ring-slate-800" />
                  <p className="text-sm text-slate-300">
                    <span className="font-medium text-slate-100">{lead.prenom} {lead.nom}</span> a été ajouté(e).
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {parseDateLocal(lead.dateAjout).toLocaleDateString('fr-FR', { 
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: lead.dateAjout.includes('T') ? '2-digit' : undefined, 
                      minute: lead.dateAjout.includes('T') ? '2-digit' : undefined
                    })}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                    {lead.entreprise && (
                      <span className="text-xs text-slate-400">chez {lead.entreprise}</span>
                    )}
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                  Aucune activité récente.
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
