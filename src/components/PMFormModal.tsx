import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, CheckCircle, XCircle, Search, ChevronDown, User } from 'lucide-react';
import { ProspectionMeeting, Lead } from '../types';
import { cn } from '../lib/utils';

interface PMFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<ProspectionMeeting>) => Promise<void>;
  leads: Lead[];
  initialData?: ProspectionMeeting | null;
}

export function PMFormModal({ isOpen, onClose, onSubmit, leads, initialData }: PMFormModalProps) {
  const [formData, setFormData] = useState({
    leadId: '',
    date: new Date().toISOString().slice(0, 16),
    location: 'Visio',
    notes: '',
    status: 'Prévu' as const,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialData) {
      const lead = leads.find(l => l.id === initialData.leadId);
      setFormData({
        leadId: initialData.leadId,
        date: initialData.date.slice(0, 16),
        location: initialData.location,
        notes: initialData.notes,
        status: initialData.status,
      });
      setSearchQuery(lead ? `${lead.prenom} ${lead.nom}` : '');
    } else {
      setFormData({
        leadId: '',
        date: new Date().toISOString().slice(0, 16),
        location: 'Visio',
        notes: '',
        status: 'Prévu',
      });
      setSearchQuery('');
    }
  }, [initialData, isOpen, leads]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredLeads = leads.filter(lead => {
    const fullName = `${lead.prenom} ${lead.nom}`.toLowerCase();
    const company = (lead.entreprise || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || company.includes(query);
  });

  const selectedLead = leads.find(l => l.id === formData.leadId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.leadId) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        leadName: selectedLead ? `${selectedLead.prenom} ${selectedLead.nom}` : 'Prospect inconnu',
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectLead = (lead: Lead) => {
    setFormData(p => ({ ...p, leadId: lead.id }));
    setSearchQuery(`${lead.prenom} ${lead.nom}`);
    setIsDropdownOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-50">
                {initialData ? 'Modifier le RDV' : 'Nouveau RDV Prospection'}
              </h2>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-50 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2 relative" ref={dropdownRef}>
                <label className="text-sm font-medium text-slate-400">Prospect</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Chercher un prospect..."
                    value={searchQuery}
                    onFocus={() => setIsDropdownOpen(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                      // Reset leadId if they start typing something that doesn't match perfectly
                      const match = leads.find(l => `${l.prenom} ${l.nom}` === e.target.value);
                      if (match) setFormData(p => ({ ...p, leadId: match.id }));
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-11 pr-10 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                    <ChevronDown className={cn("w-4 h-4 transition-transform", isDropdownOpen && "rotate-180")} />
                  </div>
                </div>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 right-0 top-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-10 max-h-60 overflow-y-auto custom-scrollbar overflow-x-hidden"
                    >
                      {filteredLeads.length > 0 ? (
                        filteredLeads.map(lead => (
                          <button
                            key={lead.id}
                            type="button"
                            onClick={() => handleSelectLead(lead)}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-700 transition-colors",
                              formData.leadId === lead.id && "bg-blue-600/10 border-l-4 border-blue-500"
                            )}
                          >
                            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400">
                              <User className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-100 truncate">
                                {lead.prenom} {lead.nom}
                              </p>
                              <p className="text-xs text-slate-500 truncate">{lead.entreprise}</p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-center text-slate-500 text-sm">
                          Aucun prospect trouvé
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Date & Heure</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.date}
                    onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Lieu / Type</label>
                  <select
                    value={formData.location}
                    onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="Visio">Visio</option>
                    <option value="Physique">Physique</option>
                    <option value="Téléphone">Téléphone</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Statut</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Prévu', icon: Clock, color: 'blue' },
                    { id: 'Terminé', icon: CheckCircle, color: 'emerald' },
                    { id: 'Annulé', icon: XCircle, color: 'rose' },
                  ].map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, status: s.id as any }))}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all text-xs font-semibold",
                        formData.status === s.id 
                          ? s.id === 'Prévu' ? "bg-blue-500/10 border-blue-500/50 text-blue-400" :
                            s.id === 'Terminé' ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" :
                            "bg-rose-500/10 border-rose-500/50 text-rose-400"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                      )}
                    >
                      <s.icon className="w-4 h-4" />
                      {s.id}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Notes / Objectifs</label>
                <textarea
                  rows={4}
                  value={formData.notes}
                  onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Points clés à aborder ou résumé du rdv..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none transition-all placeholder:text-slate-600"
                />
              </div>

              <button
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Opération en cours...' : (initialData ? 'Enregistrer les modifications' : 'Programmer le RDV')}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
