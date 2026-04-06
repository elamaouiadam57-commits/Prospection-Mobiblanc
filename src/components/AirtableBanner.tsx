import { Database, X } from 'lucide-react';
import { useState } from 'react';
import { isAirtableConfigured } from '../services/airtable';
import { motion, AnimatePresence } from 'motion/react';

export function AirtableBanner() {
  const [isVisible, setIsVisible] = useState(!isAirtableConfigured());

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-blue-900/20 border-b border-blue-500/20 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-8 py-3 flex items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="bg-blue-500/20 p-1.5 rounded-lg shrink-0 mt-0.5 sm:mt-0">
              <Database className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-sm text-blue-200">
              <span className="font-semibold">Connect Airtable:</span> Currently using mock data. To connect your Airtable base, add <code className="bg-blue-500/20 px-1.5 py-0.5 rounded text-xs">VITE_AIRTABLE_PAT</code>, <code className="bg-blue-500/20 px-1.5 py-0.5 rounded text-xs">VITE_AIRTABLE_BASE_ID</code>, and <code className="bg-blue-500/20 px-1.5 py-0.5 rounded text-xs">VITE_AIRTABLE_TABLE_NAME</code> to your environment variables.
            </div>
          </div>
          <button 
            onClick={() => setIsVisible(false)}
            className="text-blue-400 hover:text-blue-300 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
