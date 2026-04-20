import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Consultant } from '../types';

interface ConsultantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Consultant>) => Promise<void>;
  initialData?: Consultant | null;
}

export function ConsultantFormModal({ isOpen, onClose, onSubmit, initialData }: ConsultantFormModalProps) {
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    specialite: '',
    experience: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        prenom: initialData.prenom,
        nom: initialData.nom,
        email: initialData.email,
        specialite: initialData.specialite,
        experience: initialData.experience,
      });
    } else {
      setFormData({ prenom: '', nom: '', email: '', specialite: '', experience: 0 });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
      if (!initialData) {
        setFormData({ prenom: '', nom: '', email: '', specialite: '', experience: 0 });
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
              <h2 className="text-2xl font-bold text-slate-50">
                {initialData ? 'Modifier le Consultant' : 'Nouveau Consultant'}
              </h2>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-50 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Prénom</label>
                  <input
                    required
                    value={formData.prenom}
                    onChange={e => setFormData(p => ({ ...p, prenom: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Nom</label>
                  <input
                    required
                    value={formData.nom}
                    onChange={e => setFormData(p => ({ ...p, nom: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Spécialité</label>
                  <input
                    required
                    value={formData.specialite}
                    onChange={e => setFormData(p => ({ ...p, specialite: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Expérience (ans)</label>
                  <input
                    type="number"
                    required
                    value={formData.experience}
                    onChange={e => setFormData(p => ({ ...p, experience: parseInt(e.target.value) }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <button
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Opération en cours...' : (initialData ? 'Enregistrer les modifications' : 'Ajouter le Consultant')}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
