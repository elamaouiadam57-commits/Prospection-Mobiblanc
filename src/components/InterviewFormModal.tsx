import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star } from 'lucide-react';
import { ConsultantInterview } from '../types';
import { cn } from '../lib/utils';

interface InterviewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<ConsultantInterview>) => Promise<void>;
  consultantId: string;
  consultantName: string;
  initialData?: ConsultantInterview | null;
}

export function InterviewFormModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  consultantId,
  consultantName,
  initialData
}: InterviewFormModalProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 16),
    notes: '',
    rating: 0,
    status: 'Réalisé' as const,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date.slice(0, 16),
        notes: initialData.notes,
        rating: initialData.rating,
        status: initialData.status as any,
      });
    } else {
      setFormData({ date: new Date().toISOString().slice(0, 16), notes: '', rating: 0, status: 'Réalisé' });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        consultantId,
        consultantName
      });
      onClose();
      if (!initialData) {
        setFormData({ date: new Date().toISOString().slice(0, 16), notes: '', rating: 0, status: 'Réalisé' });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
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
              <div>
                <h2 className="text-2xl font-bold text-slate-50">
                  {initialData ? "Modifier l'entretien" : "Nouvel Entretien"}
                </h2>
                <p className="text-sm text-slate-400 mt-1">Avec {consultantName}</p>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-50 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                  <label className="text-sm font-medium text-slate-400">Statut</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData(p => ({ ...p, status: e.target.value as any }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="Programmé">Programmé</option>
                    <option value="Réalisé">Réalisé</option>
                    <option value="Annulé">Annulé</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Note technique / relationnelle</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, rating: star }))}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star 
                        className={cn(
                          "w-8 h-8",
                          star <= formData.rating ? "text-amber-400 fill-amber-400 font-bold" : "text-slate-700"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Notes d'entretien</label>
                <textarea
                  required
                  rows={4}
                  value={formData.notes}
                  onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Rédigez un court résumé de l'entretien..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none transition-all placeholder:text-slate-600"
                />
              </div>

              <button
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Enregistrement...' : (initialData ? 'Enregistrer les modifications' : "Enregistrer l'entretien")}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
