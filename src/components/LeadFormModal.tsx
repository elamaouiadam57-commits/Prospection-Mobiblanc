import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Lead } from '../types';

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (leadData: Partial<Lead>) => Promise<void>;
  initialData?: Lead | null;
}

export function LeadFormModal({ isOpen, onClose, onSubmit, initialData }: LeadFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    fonction: '',
    entreprise: '',
    mail: '',
    numero: '',
    status: 'Nouveau',
    notes: '',
  });

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        prenom: initialData.prenom || '',
        nom: initialData.nom || '',
        fonction: initialData.fonction || '',
        entreprise: initialData.entreprise || '',
        mail: initialData.mail || '',
        numero: initialData.numero || '',
        status: initialData.status || 'Nouveau',
        notes: initialData.notes || '',
      });
    } else if (!isOpen) {
      // Reset when closed
      setFormData({
        prenom: '',
        nom: '',
        fonction: '',
        entreprise: '',
        mail: '',
        numero: '',
        status: 'Nouveau',
        notes: '',
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({
        prenom: '',
        nom: '',
        entreprise: '',
        mail: '',
        numero: '',
        status: 'Nouveau',
        notes: '',
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden border border-slate-700"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-slate-50">
                {initialData ? 'Modifier le prospect' : 'Ajouter un prospect'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Prénom</label>
                  <input
                    type="text"
                    required
                    value={formData.prenom}
                    onChange={e => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-slate-50 placeholder-slate-500"
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Nom</label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={e => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-slate-50 placeholder-slate-500"
                    placeholder="Dupont"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Titre / Fonction</label>
                  <input
                    type="text"
                    value={formData.fonction}
                    onChange={e => setFormData({ ...formData, fonction: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-slate-50 placeholder-slate-500"
                    placeholder="CEO"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Entreprise</label>
                  <input
                    type="text"
                    required
                    value={formData.entreprise}
                    onChange={e => setFormData({ ...formData, entreprise: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-slate-50 placeholder-slate-500"
                    placeholder="Acme Corp"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.mail}
                  onChange={e => setFormData({ ...formData, mail: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-slate-50 placeholder-slate-500"
                  placeholder="jean.dupont@acme.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={formData.numero}
                  onChange={e => setFormData({ ...formData, numero: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-slate-50 placeholder-slate-500"
                  placeholder="+33 6 12 34 56 78"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none text-slate-50 placeholder-slate-500"
                  rows={3}
                  placeholder="Informations supplémentaires..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-50 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {initialData ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
