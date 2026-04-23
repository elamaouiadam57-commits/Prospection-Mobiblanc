import { Lead, LeadStatus } from '../types';
import { motion } from 'motion/react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState, useMemo } from 'react';
import type { Key } from 'react';
import { cn, formatDateSafe, getStatusOptions } from '../lib/utils';
import { Edit2, Trash2, Star } from 'lucide-react';

const DEFAULT_COLUMNS: string[] = ['Nouveau', 'Contacté', 'Qualifié', 'Proposition', 'Gagné', 'Perdu'];

interface KanbanBoardProps {
  leads: Lead[];
  onLeadMove: (leadId: string, newStatus: string) => void;
  onUpdateLead: (leadId: string, leadData: Partial<Lead>) => Promise<void>;
  onDeleteLead: (leadId: string) => Promise<void>;
}

// Sortable Item Component
function SortableLeadCard({ lead, onEdit, onDelete, onTogglePriority }: { lead: Lead, onEdit: (lead: Lead) => void, onDelete: (lead: Lead) => void, onTogglePriority: (lead: Lead) => void, key?: Key }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lead.id,
    data: {
      type: 'Lead',
      lead,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-slate-800/50 border-2 border-dashed border-blue-500/50 rounded-xl p-4 h-[120px] opacity-50"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onTogglePriority(lead);
      }}
      className={cn(
        "bg-slate-800 p-4 rounded-xl border shadow-sm hover:shadow-lg hover:shadow-black/20 transition-all cursor-grab active:cursor-grabbing group",
        lead.isPriority ? "border-amber-500/40 bg-amber-500/[0.08]" : "border-slate-700"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <h4 className="font-medium text-slate-50 text-sm truncate">{lead.prenom} {lead.nom}</h4>
          {lead.isPriority && (
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(lead); }}
            className="p-1 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
            title="Modifier"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(lead); }}
            className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-300 font-medium mb-0.5">{lead.fonction || 'Sans titre'}</p>
      <p className="text-xs text-slate-400 mb-3">{lead.entreprise}</p>
      
      {lead.tags && lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {lead.tags.map(tag => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded-md font-medium border border-blue-500/20">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center text-[10px] text-slate-500">
        <span>{formatDateSafe(lead.dateContact || lead.dateAjout, 'MMM d')}</span>
      </div>
    </div>
  );
}

import { LeadFormModal } from './LeadFormModal';
import { ConfirmModal } from './ConfirmModal';

export function KanbanBoard({ leads, onLeadMove, onUpdateLead, onDeleteLead }: KanbanBoardProps) {
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    setTimeout(() => setEditingLead(null), 200);
  };

  const handleModalSubmit = async (leadData: Partial<Lead>) => {
    if (editingLead) {
      await onUpdateLead(editingLead.id, leadData);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { activeColumns, cols } = useMemo(() => {
    const activeCols = getStatusOptions(leads);

    const columnsMap: Record<string, Lead[]> = {};
    activeCols.forEach(c => columnsMap[c] = []);
    
    leads.forEach(lead => {
      const status = lead.status || 'Nouveau';
      if (columnsMap[status]) {
        columnsMap[status].push(lead);
      } else {
        columnsMap[status] = [lead];
        if (!activeCols.includes(status)) activeCols.push(status);
      }
    });

    // Sort each column by priority
    Object.keys(columnsMap).forEach(key => {
      columnsMap[key].sort((a, b) => {
        if (a.isPriority && !b.isPriority) return -1;
        if (!a.isPriority && b.isPriority) return 1;
        return 0;
      });
    });
    
    return { activeColumns: activeCols, cols: columnsMap };
  }, [leads]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const lead = leads.find(l => l.id === active.id);
    if (lead) setActiveLead(lead);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveALead = active.data.current?.type === 'Lead';
    const isOverALead = over.data.current?.type === 'Lead';
    const isOverAColumn = over.data.current?.type === 'Column';

    if (!isActiveALead) return;

    // We don't actually update state on drag over, we wait for drag end to update Airtable/State
    // For a fully optimistic UI, we'd update local state here. 
    // For simplicity and stability with external sync, we'll handle it on DragEnd.
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveLead(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeLead = leads.find(l => l.id === activeId);
    if (!activeLead) return;

    const isOverAColumn = over.data.current?.type === 'Column';
    const isOverALead = over.data.current?.type === 'Lead';

    let newStatus = activeLead.status;

    if (isOverAColumn) {
      newStatus = over.id as string;
    } else if (isOverALead) {
      const overLead = leads.find(l => l.id === overId);
      if (overLead) {
        newStatus = overLead.status;
      }
    }

    if (newStatus !== activeLead.status) {
      onLeadMove(activeId as string, newStatus);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 h-full flex flex-col"
    >
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl font-semibold text-slate-50 tracking-tight">Pipeline</h1>
        <p className="text-slate-400 mt-1 text-sm">Drag and drop leads to update their status.</p>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 h-full items-start">
            {activeColumns.map((colStatus) => (
              <Column 
                key={colStatus} 
                status={colStatus} 
                leads={cols[colStatus] || []}
                onEdit={handleEdit}
                onDelete={setDeletingLead}
                onTogglePriority={(lead) => onUpdateLead(lead.id, { isPriority: !lead.isPriority })}
              />
            ))}
          </div>

          <DragOverlay>
            {activeLead ? (
              <div className="bg-slate-800 p-4 rounded-xl border border-blue-500/50 shadow-2xl shadow-black/50 opacity-90 rotate-2 scale-105">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-slate-50 text-sm">{activeLead.prenom} {activeLead.nom}</h4>
                </div>
                <p className="text-xs text-slate-300 font-medium mb-0.5">{activeLead.fonction || 'Sans titre'}</p>
                <p className="text-xs text-slate-400 mb-3">{activeLead.entreprise}</p>
                {activeLead.tags && activeLead.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {activeLead.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded-md font-medium border border-blue-500/20">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
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

// Column Component
import { useDroppable } from '@dnd-kit/core';

function Column({ status, leads, onEdit, onDelete, onTogglePriority }: { status: string, leads: Lead[], onEdit: (lead: Lead) => void, onDelete: (lead: Lead) => void, onTogglePriority: (lead: Lead) => void, key?: Key }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: {
      type: 'Column',
      status,
    },
  });

  return (
    <div className="flex flex-col w-72 shrink-0 h-full max-h-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-slate-50 text-sm">{status}</h3>
          <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full font-medium">
            {leads.length}
          </span>
        </div>
      </div>

      <div 
        ref={setNodeRef}
        className={cn(
          "flex-1 bg-slate-900/50 rounded-2xl p-3 overflow-y-auto border border-transparent transition-colors",
          isOver && "bg-blue-500/5 border-blue-500/30"
        )}
      >
        <SortableContext items={leads.map(l => l.id)}>
          <div className="flex flex-col gap-3 min-h-[100px]">
            {leads.map((lead) => (
              <SortableLeadCard key={lead.id} lead={lead} onEdit={onEdit} onDelete={onDelete} onTogglePriority={onTogglePriority} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
