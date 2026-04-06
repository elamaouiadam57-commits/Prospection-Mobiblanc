import { Lead, LeadStatus } from '../types';
import { motion } from 'motion/react';
import { cn, formatDateSafe } from '../lib/utils';
import { useState } from 'react';
import { LeadFormModal } from './LeadFormModal';
import { ConfirmModal } from './ConfirmModal';
import { Edit2, Trash2 } from 'lucide-react';

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
    <div className="text-sm text-gray-500 max-w-xs">
      <div className={cn("transition-all", !isExpanded && isLong && "line-clamp-2")}>
        {note}
      </div>
      {isLong && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800 text-[11px] mt-1 font-medium transition-colors"
        >
          {isExpanded ? 'Voir moins' : 'Voir plus'}
        </button>
      )}
    </div>
  );
}

const getStatusColor = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes('nouveau') || s.includes('new') || s.includes('interested')) return 'bg-blue-100 text-blue-700';
  if (s.includes('contact')) return 'bg-purple-100 text-purple-700';
  if (s.includes('qualif') || s.includes('reply') || s.includes('attente')) return 'bg-amber-100 text-amber-700';
  if (s.includes('prop')) return 'bg-indigo-100 text-indigo-700';
  if (s.includes('gagn') || s.includes('won') || s.includes('success')) return 'bg-emerald-100 text-emerald-700';
  if (s.includes('perdu') || s.includes('lost') || s.includes('fail')) return 'bg-rose-100 text-rose-700';
  return 'bg-gray-100 text-gray-700';
};

export function LeadsTable({ leads, onAddLead, onUpdateLead, onDeleteLead }: LeadsTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      className="p-8 max-w-7xl mx-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Leads</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage and track your active leads.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          Add Lead
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 border-b border-gray-200/60 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4">Nom</th>
                <th className="px-6 py-4">Titre</th>
                <th className="px-6 py-4">Entreprise</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Tags</th>
                <th className="px-6 py-4">Notes</th>
                <th className="px-6 py-4">Date d'ajout</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 align-top">
                    <div className="font-medium text-gray-900">{lead.prenom} {lead.nom}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{lead.mail}</div>
                    {lead.numero && <div className="text-gray-400 text-xs mt-0.5">{lead.numero}</div>}
                  </td>
                  <td className="px-6 py-4 text-gray-600 align-top">{lead.fonction || '-'}</td>
                  <td className="px-6 py-4 text-gray-600 align-top">{lead.entreprise}</td>
                  <td className="px-6 py-4 align-top">
                    <span className={cn("px-2.5 py-1 rounded-md text-xs font-medium", getStatusColor(lead.status))}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex flex-wrap gap-1">
                      {lead.tags?.map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-md font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <ExpandableNote note={lead.notes} />
                  </td>
                  <td className="px-6 py-4 text-gray-500 align-top">
                    {formatDateSafe(lead.dateAjout, 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 align-top text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(lead)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingLead(lead)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No leads found.
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
