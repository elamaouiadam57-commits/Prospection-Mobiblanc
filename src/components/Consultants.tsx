import React, { useState } from 'react';
import { Consultant, ConsultantInterview } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDateSafe } from '../lib/utils';
import { 
  UserPlus, 
  Video, 
  Star, 
  Calendar, 
  Mail, 
  Briefcase, 
  ChevronRight,
  Plus,
  Search,
  BookOpen,
  Pencil,
  Trash2
} from 'lucide-react';
import { ConsultantFormModal } from './ConsultantFormModal';
import { InterviewFormModal } from './InterviewFormModal';

interface ConsultantsProps {
  consultants: Consultant[];
  interviews: ConsultantInterview[];
  onAddConsultant: (data: Partial<Consultant>) => Promise<void>;
  onUpdateConsultant: (id: string, data: Partial<Consultant>) => Promise<void>;
  onDeleteConsultant: (id: string) => Promise<void>;
  onAddInterview: (data: Partial<ConsultantInterview>) => Promise<void>;
  onUpdateInterview: (id: string, data: Partial<ConsultantInterview>) => Promise<void>;
  onDeleteInterview: (id: string) => Promise<void>;
}

export function Consultants({ 
  consultants, 
  interviews, 
  onAddConsultant, 
  onUpdateConsultant,
  onDeleteConsultant,
  onAddInterview,
  onUpdateInterview,
  onDeleteInterview
}: ConsultantsProps) {
  const [selectedConsultantId, setSelectedConsultantId] = useState<string | null>(null);
  const [isConsultantModalOpen, setIsConsultantModalOpen] = useState(false);
  const [editingConsultant, setEditingConsultant] = useState<Consultant | null>(null);
  
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<ConsultantInterview | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConsultants = consultants.filter(c => 
    `${c.prenom} ${c.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.specialite.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedConsultant = consultants.find(c => c.id === selectedConsultantId);
  const selectedInterviews = interviews
    .filter(i => i.consultantId === selectedConsultantId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleEditConsultant = (c: Consultant, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConsultant(c);
    setIsConsultantModalOpen(true);
  };

  const handleDeleteConsultantClick = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // In an iframe context, window.confirm can be blocked. 
    // We'll perform the action directly and the user can see it reflected in the list.
    try {
      await onDeleteConsultant(id);
      if (selectedConsultantId === id) setSelectedConsultantId(null);
    } catch (error) {
      console.error('Failed to delete consultant', error);
    }
  };

  const handleEditInterview = (i: ConsultantInterview) => {
    setEditingInterview(i);
    setIsInterviewModalOpen(true);
  };

  const handleDeleteInterviewClick = async (id: string) => {
    try {
      await onDeleteInterview(id);
    } catch (error) {
      console.error('Failed to delete interview', error);
    }
  };

  const handleConsultantSubmit = async (data: Partial<Consultant>) => {
    if (editingConsultant) {
      await onUpdateConsultant(editingConsultant.id, data);
    } else {
      await onAddConsultant(data);
    }
    setEditingConsultant(null);
  };

  const handleInterviewSubmit = async (data: Partial<ConsultantInterview>) => {
    if (editingInterview) {
      await onUpdateInterview(editingInterview.id, data);
    } else {
      await onAddInterview(data);
    }
    setEditingInterview(null);
  };

  const closeConsultantModal = () => {
    setIsConsultantModalOpen(false);
    setEditingConsultant(null);
  };

  const closeInterviewModal = () => {
    setIsInterviewModalOpen(false);
    setEditingInterview(null);
  };

  return (
    <div className="flex h-full bg-slate-900 overflow-hidden">
      {/* Consultants List Sidebar */}
      <div className="w-1/3 border-r border-slate-800 flex flex-col min-w-[320px]">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-50">Consultants</h2>
            <button 
              onClick={() => setIsConsultantModalOpen(true)}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredConsultants.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedConsultantId(c.id)}
              className={cn(
                "w-full text-left p-4 rounded-2xl border transition-all group relative overflow-hidden",
                selectedConsultantId === c.id 
                  ? "bg-blue-600/10 border-blue-500/50" 
                  : "bg-slate-800/30 border-slate-700 hover:border-slate-600"
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-100">{c.prenom} {c.nom}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <Briefcase className="w-3 h-3" />
                    <span>{c.specialite}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => handleEditConsultant(c, e)}
                    className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-400 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={(e) => handleDeleteConsultantClick(c.id, e)}
                    className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight className={cn(
                    "w-4 h-4 transition-transform ml-1",
                    selectedConsultantId === c.id ? "text-blue-400 rotate-90" : "text-slate-500"
                  )} />
                </div>
              </div>
            </button>
          ))}
          {filteredConsultants.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm">
              <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-10" />
              <p>Aucun consultant trouvé.</p>
            </div>
          )}
        </div>
      </div>

      {/* Details Area */}
      <div className="flex-1 bg-slate-900 overflow-y-auto">
        <AnimatePresence mode="wait">
          {selectedConsultant ? (
            <motion.div
              key={selectedConsultant.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-10 max-w-4xl mx-auto space-y-10"
            >
              {/* Profile Card */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <UserPlus className="w-40 h-40" />
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                      {selectedConsultant.prenom[0]}{selectedConsultant.nom[0]}
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-slate-50">{selectedConsultant.prenom} {selectedConsultant.nom}</h1>
                      <div className="flex flex-wrap items-center gap-4 mt-2">
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <Mail className="w-4 h-4 text-blue-400" />
                          <span>{selectedConsultant.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <Briefcase className="w-4 h-4 text-indigo-400" />
                          <span>{selectedConsultant.experience} ans d'XP</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsInterviewModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Ajouter un entretien
                  </button>
                </div>
              </div>

              {/* Interviews Timeline */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-50 flex items-center gap-3">
                    <Video className="w-6 h-6 text-purple-400" />
                    Historique des entretiens
                  </h3>
                  <span className="bg-slate-800 text-slate-400 text-xs px-3 py-1 rounded-full border border-slate-700">
                    {selectedInterviews.length} entretien{selectedInterviews.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-4">
                  {selectedInterviews.map((interview) => (
                    <div 
                      key={interview.id}
                      className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600 transition-colors group"
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-4 flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm font-medium">
                              <div className="flex items-center gap-2 text-slate-400 bg-slate-900/50 px-3 py-1 rounded-lg">
                                <Calendar className="w-4 h-4 text-blue-400" />
                                <span>{formatDateSafe(interview.date, 'dd/MM/yyyy HH:mm')}</span>
                              </div>
                              <span className={cn(
                                "px-3 py-1 rounded-lg text-xs",
                                interview.status === 'Réalisé' ? "bg-emerald-500/10 text-emerald-400" :
                                interview.status === 'Programmé' ? "bg-blue-500/10 text-blue-400" :
                                "bg-rose-500/10 text-rose-400"
                              )}>
                                {interview.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 mr-2 px-2 py-1 rounded-lg hover:bg-slate-700/50 transition-colors">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={cn(
                                      "w-4 h-4",
                                      i < interview.rating ? "text-amber-400 fill-amber-400" : "text-slate-600"
                                    )} 
                                  />
                                ))}
                              </div>
                              <button 
                                onClick={() => handleEditInterview(interview)}
                                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-400 transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteInterviewClick(interview.id)}
                                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <BookOpen className="w-5 h-5 text-slate-500 shrink-0 mt-1" />
                            <p className="text-slate-300 leading-relaxed italic text-sm">"{interview.notes}"</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {selectedInterviews.length === 0 && (
                    <div className="text-center py-20 bg-slate-800/20 border-2 border-dashed border-slate-800 rounded-3xl">
                      <Calendar className="w-16 h-16 mx-auto mb-4 opacity-5" />
                      <p className="text-slate-500">Aucun entretien enregistré pour ce consultant.</p>
                      <button 
                         onClick={() => setIsInterviewModalOpen(true)}
                         className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-medium"
                      >
                        Enregistrer le premier entretien
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-slate-800 flex items-center justify-center">
                <UserCheck className="w-10 h-10 opacity-20" />
              </div>
              <p>Sélectionnez un consultant pour voir ses entretiens.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      <ConsultantFormModal 
        isOpen={isConsultantModalOpen}
        onClose={closeConsultantModal}
        onSubmit={handleConsultantSubmit}
        initialData={editingConsultant}
      />

      {selectedConsultant && (
        <InterviewFormModal 
          isOpen={isInterviewModalOpen}
          onClose={closeInterviewModal}
          onSubmit={handleInterviewSubmit}
          consultantId={selectedConsultant.id}
          consultantName={`${selectedConsultant.prenom} ${selectedConsultant.nom}`}
          initialData={editingInterview}
        />
      )}
    </div>
  );
}

// Minimal missing icon
function UserCheck(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  );
}
