import { Lead, LeadStatus } from '../types';
import { motion } from 'motion/react';
import { cn, formatDateSafe, getStatusOptions } from '../lib/utils';
import { useState, useMemo } from 'react';
import { LeadFormModal } from './LeadFormModal';
import { ConfirmModal } from './ConfirmModal';
import { Edit2, Trash2, ChevronDown, Download, Star, Filter, Calendar as CalendarIcon } from 'lucide-react';
import * as XLSX from 'xlsx';
import { subDays, isAfter, startOfDay, isSameDay } from 'date-fns';

interface LeadsTableProps {
  leads: Lead[];
  onAddLead: (leadData: Partial<Lead>) => Promise<void>;
  onUpdateLead: (leadId: string, leadData: Partial<Lead>) => Promise<void>;
  onDeleteLead: (leadId: string) => Promise<void>;
}

function ExpandableNote({ note }: { note: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!note) return <span>-</span>;

  const isLong = note.length > 60;

  return (
    <div className="text-sm text-slate-400 max-w-xs">
      <div className={cn("transition-all", !isExpanded && isLong && "line-clamp-2")}>
        {note}
      </div>
      {isLong && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-400 hover:text-blue-300 text-[11px] mt-1 font-medium transition-colors"
        >
          {isExpanded ? 'Voir moins' : 'Voir plus'}
        </button>
      )}
    </div>
  );
}

const getStatusColor = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes('nouveau') || s.includes('new') || s.includes('interested')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  if (s.includes('contact')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  if (s.includes('qualif') || s.includes('reply') || s.includes('attente')) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  if (s.includes('not qualified')) return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
  if (s.includes('not available')) return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  if (s.includes('prop')) return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
  if (s.includes('gagn') || s.includes('won') || s.includes('success')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (s.includes('perdu') || s.includes('lost') || s.includes('fail')) return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  return 'bg-slate-800 text-slate-400 border-slate-700';
};

export function LeadsTable({ leads, onAddLead, onUpdateLead, onDeleteLead }: LeadsTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days' | '90days' | 'custom'>('all');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const filteredLeads = useMemo(() => {
    if (dateFilter === 'all') return leads;
    
    const now = new Date();
    const today = startOfDay(now);
    let threshold: Date | null = null;

    if (dateFilter === 'custom') {
      const selected = startOfDay(new Date(customDate));
      return leads.filter(lead => {
        const activityDateStr = lead.dateContact || lead.dateAjout;
        if (!activityDateStr) return false;
        const activityDate = startOfDay(new Date(activityDateStr));
        return isSameDay(activityDate, selected);
      });
    }

    switch (dateFilter) {
      case 'today':
        threshold = today;
        break;
      case '7days':
        threshold = subDays(today, 7);
        break;
      case '30days':
        threshold = subDays(today, 30);
        break;
      case '90days':
        threshold = subDays(today, 90);
        break;
      default:
        return leads;
    }

    if (!threshold) return leads;

    return leads.filter(lead => {
      const activityDateStr = lead.dateContact || lead.dateAjout;
      if (!activityDateStr) return false;
      const activityDate = new Date(activityDateStr);
      return isAfter(activityDate, threshold) || activityDate.getTime() === threshold.getTime();
    });
  }, [leads, dateFilter, customDate]);

  const STATUS_OPTIONS = useMemo(() => getStatusOptions(leads), [leads]);

  const handleExportExcel = () => {
    const dataToExport = leads.map(lead => ({
      'Prénom': lead.prenom,
      'Nom': lead.nom,
      'Email': lead.mail,
      'Téléphone': lead.numero || '',
      'Fonction': lead.fonction || '',
      'Entreprise': lead.entreprise || '',
      'Statut': lead.status,
      'Tags': (lead.tags || []).join(', '),
      'Notes': lead.notes || '',
      'Date Ajout': lead.dateAjout,
      'Date Contact': lead.dateContact || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
    
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `CRM_Leads_Export_${date}.xlsx`);
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setUpdatingId(leadId);
    try {
      await onUpdateLead(leadId, { status: newStatus as LeadStatus });
    } catch (error) {
      console.error('Failed to update status', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingLead) return;
    setIsDeleting(true);
    try {
      await onDeleteLead(deletingLead.id);
      setDeletingLead(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    // Add a small delay so the modal animation finishes before clearing data
    setTimeout(() => setEditingLead(null), 200);
  };

  const handleModalSubmit = async (leadData: Partial<Lead>) => {
    if (editingLead) {
      await onUpdateLead(editingLead.id, leadData);
    } else {
      await onAddLead(leadData);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 h-full flex flex-col max-w-7xl mx-auto w-full"
    >
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-50 tracking-tight">Leads</h1>
            {leads.filter(l => l.isPriority).length > 0 && (
              <span className="bg-amber-500/10 text-amber-400 text-xs px-2.5 py-1 rounded-full font-medium border border-amber-500/20 flex items-center gap-1.5">
                <Star className="w-3 h-3 fill-amber-400" />
                {leads.filter(l => l.isPriority).length} prioritaire{leads.filter(l => l.isPriority).length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-slate-400 mt-1 text-sm">Manage and track your active leads.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="appearance-none bg-slate-800 border border-slate-700 text-slate-200 text-sm pl-9 pr-8 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer transition-all hover:border-slate-600"
              >
                <option value="all">Toute l'activité</option>
                <option value="today">Aujourd'hui</option>
                <option value="7days">7 derniers jours</option>
                <option value="30days">30 derniers jours</option>
                <option value="90days">90 derniers jours</option>
                <option value="custom">Date exacte...</option>
              </select>
              <CalendarIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>

            {dateFilter === 'custom' && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-sm px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all hover:border-slate-600"
              />
            )}
          </div>

          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-slate-600"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            Add Lead
          </button>
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-lg shadow-black/10 flex flex-col min-h-0 flex-1 overflow-hidden">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left text-sm relative">
            <thead className="bg-slate-900/95 backdrop-blur-md border-b border-slate-700 text-slate-400 font-medium sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4">Nom</th>
                <th className="px-6 py-4">Titre</th>
                <th className="px-6 py-4">Entreprise</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Tags</th>
                <th className="px-6 py-4">Notes</th>
                <th className="px-6 py-4">Dernière activité</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredLeads
                .slice()
                .sort((a, b) => {
                  // Priority sorting first
                  if (a.isPriority && !b.isPriority) return -1;
                  if (!a.isPriority && b.isPriority) return 1;

                  const dateA = a.dateContact || a.dateAjout;
                  const dateB = b.dateContact || b.dateAjout;
                  return new Date(dateB).getTime() - new Date(dateA).getTime();
                })
                .map((lead) => (
                <tr 
                  key={lead.id} 
                  onDoubleClick={() => onUpdateLead(lead.id, { isPriority: !lead.isPriority })}
                  className={cn(
                    "hover:bg-slate-700/50 transition-colors group cursor-default",
                    lead.isPriority && "bg-amber-500/[0.12] hover:bg-amber-500/[0.15]"
                  )}
                >
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-slate-50">{lead.prenom} {lead.nom}</div>
                      {lead.isPriority && (
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      )}
                    </div>
                    <div className="text-slate-400 text-xs mt-0.5">{lead.mail}</div>
                    {lead.numero && <div className="text-slate-500 text-xs mt-0.5">{lead.numero}</div>}
                  </td>
                  <td className="px-6 py-4 text-slate-300 align-top">{lead.fonction || '-'}</td>
                  <td className="px-6 py-4 text-slate-300 align-top">{lead.entreprise}</td>
                  <td className="px-6 py-4 align-top">
                    <div className="relative inline-block">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        disabled={updatingId === lead.id}
                        className={cn(
                          "appearance-none px-2.5 py-1 pr-7 rounded-md text-xs font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors",
                          getStatusColor(lead.status),
                          updatingId === lead.id ? 'opacity-50 cursor-not-allowed' : ''
                        )}
                      >
                        {STATUS_OPTIONS.map(status => (
                          <option key={status} value={status} className="bg-slate-800 text-slate-200">
                            {status}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-70" />
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex flex-wrap gap-1">
                      {lead.tags?.map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded-md font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <ExpandableNote note={lead.notes} />
                  </td>
                  <td className="px-6 py-4 text-slate-400 align-top">
                    {formatDateSafe(lead.dateContact || lead.dateAjout, 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 align-top text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(lead)}
                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingLead(lead)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    {dateFilter === 'all' ? 'No leads found.' : 'Aucune activité trouvée pour cette période.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <LeadFormModal 
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        initialData={editingLead}
        statusOptions={STATUS_OPTIONS}
      />

      <ConfirmModal
        isOpen={!!deletingLead}
        onClose={() => setDeletingLead(null)}
        onConfirm={handleDelete}
        title="Supprimer le prospect"
        message={`Êtes-vous sûr de vouloir supprimer ${deletingLead?.prenom} ${deletingLead?.nom} ? Cette action est irréversible.`}
        isSubmitting={isDeleting}
      />
    </motion.div>
  );
}
