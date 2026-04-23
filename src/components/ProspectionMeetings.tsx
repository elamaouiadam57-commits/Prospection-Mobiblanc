import React, { useState } from 'react';
import { ProspectionMeeting, Lead } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDateSafe } from '../lib/utils';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Users,
  Star
} from 'lucide-react';
import { PMFormModal } from './PMFormModal';

interface ProspectionMeetingsProps {
  pms: ProspectionMeeting[];
  leads: Lead[];
  onAddPM: (data: Partial<ProspectionMeeting>) => Promise<void>;
  onUpdatePM: (id: string, data: Partial<ProspectionMeeting>) => Promise<void>;
  onDeletePM: (id: string) => Promise<void>;
  onUpdateLead: (id: string, data: Partial<Lead>) => Promise<void>;
}

export function ProspectionMeetings({ pms, leads, onAddPM, onUpdatePM, onDeletePM, onUpdateLead }: ProspectionMeetingsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPM, setEditingPM] = useState<ProspectionMeeting | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPMs = pms.filter(pm => 
    pm.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pm.notes.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleEdit = (pm: ProspectionMeeting) => {
    setEditingPM(pm);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await onDeletePM(id);
  };

  const handleSubmit = async (data: Partial<ProspectionMeeting>) => {
    if (editingPM) {
      await onUpdatePM(editingPM.id, data);
    } else {
      await onAddPM(data);
    }
    setEditingPM(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPM(null);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'Terminé': return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle };
      case 'Annulé': return { color: 'text-rose-400', bg: 'bg-rose-500/10', icon: XCircle };
      default: return { color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Clock };
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-50 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-500" />
            RDV Prospection
          </h1>
          <p className="text-slate-400 mt-1">Gérez vos rendez-vous clients et opportunités.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher un rdv..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-64"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nouveau RDV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredPMs.map((pm) => {
            const status = getStatusInfo(pm.status);
            const lead = leads.find(l => l.id === pm.leadId);
            const isPriority = lead?.isPriority;

            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={pm.id}
                onDoubleClick={() => lead && onUpdateLead(lead.id, { isPriority: !lead.isPriority })}
                className={cn(
                  "bg-slate-800/40 border rounded-3xl p-6 hover:border-slate-600 transition-all group h-full flex flex-col cursor-default",
                  isPriority ? "border-amber-500/40 bg-amber-500/[0.12] shadow-lg shadow-amber-500/5" : "border-slate-700/50"
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={cn("px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5", status.bg, status.color)}>
                    <status.icon className="w-3.5 h-3.5" />
                    {pm.status}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(pm)}
                      className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-400 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(pm.id)}
                      className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4 flex-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-100 line-clamp-1">{pm.leadName}</h3>
                      {isPriority && (
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <span>{pm.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-slate-300 bg-slate-900/50 px-3 py-2 rounded-xl text-sm border border-slate-800">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span>{formatDateSafe(pm.date, 'dd MMMM yyyy à HH:mm')}</span>
                  </div>

                  {pm.notes && (
                    <p className="text-slate-400 text-sm line-clamp-3 italic bg-slate-900/20 p-2 rounded-lg">
                      "{pm.notes}"
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredPMs.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-800/20 border-2 border-dashed border-slate-800 rounded-3xl">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-5" />
            <p className="text-slate-500">Aucun rendez-vous trouvé.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="mt-4 text-blue-400 hover:text-blue-300 font-medium"
            >
              Programmer le premier rendez-vous
            </button>
          </div>
        )}
      </div>

      <PMFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        leads={leads}
        initialData={editingPM}
      />
    </div>
  );
}
