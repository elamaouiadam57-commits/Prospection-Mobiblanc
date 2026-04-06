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
import { cn, formatDateSafe } from '../lib/utils';

const DEFAULT_COLUMNS: string[] = ['Nouveau', 'Contacté', 'Qualifié', 'Proposition', 'Gagné', 'Perdu'];

interface KanbanBoardProps {
  leads: Lead[];
  onLeadMove: (leadId: string, newStatus: string) => void;
}

// Sortable Item Component
function SortableLeadCard({ lead }: { lead: Lead, key?: Key }) {
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
        className="bg-white/50 border-2 border-dashed border-blue-400 rounded-xl p-4 h-[120px] opacity-50"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-4 rounded-xl border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-900 text-sm">{lead.prenom} {lead.nom}</h4>
      </div>
      <p className="text-xs text-gray-500 mb-3">{lead.entreprise}</p>
      
      {lead.tags && lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {lead.tags.map(tag => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md font-medium border border-blue-100/50">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center text-[10px] text-gray-400">
        <span>{formatDateSafe(lead.dateAjout, 'MMM d')}</span>
      </div>
    </div>
  );
}

export function KanbanBoard({ leads, onLeadMove }: KanbanBoardProps) {
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

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
    const uniqueStatuses = Array.from(new Set(leads.map(l => l.status).filter(Boolean)));
    
    let activeCols: string[] = [];
    const usesDefault = uniqueStatuses.some(s => DEFAULT_COLUMNS.includes(s));
    
    if (usesDefault || uniqueStatuses.length === 0) {
      activeCols = [...DEFAULT_COLUMNS];
      uniqueStatuses.forEach(s => {
        if (!activeCols.includes(s)) activeCols.push(s);
      });
    } else {
      activeCols = uniqueStatuses;
    }

    const columnsMap: Record<string, Lead[]> = {};
    activeCols.forEach(c => columnsMap[c] = []);
    
    leads.forEach(lead => {
      const status = lead.status || 'Nouveau';
      if (!columnsMap[status]) {
        columnsMap[status] = [];
        if (!activeCols.includes(status)) activeCols.push(status);
      }
      columnsMap[status].push(lead);
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
      className="p-8 h-[calc(100vh-4rem)] flex flex-col"
    >
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Pipeline</h1>
        <p className="text-gray-500 mt-1 text-sm">Drag and drop leads to update their status.</p>
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
              />
            ))}
          </div>

          <DragOverlay>
            {activeLead ? (
              <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xl opacity-90 rotate-2 scale-105">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900 text-sm">{activeLead.prenom} {activeLead.nom}</h4>
                </div>
                <p className="text-xs text-gray-500 mb-3">{activeLead.entreprise}</p>
                {activeLead.tags && activeLead.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {activeLead.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md font-medium border border-blue-100/50">
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
    </motion.div>
  );
}

// Column Component
import { useDroppable } from '@dnd-kit/core';

function Column({ status, leads }: { status: string, leads: Lead[], key?: Key }) {
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
          <h3 className="font-medium text-gray-900 text-sm">{status}</h3>
          <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full font-medium">
            {leads.length}
          </span>
        </div>
      </div>

      <div 
        ref={setNodeRef}
        className={cn(
          "flex-1 bg-gray-50/80 rounded-2xl p-3 overflow-y-auto border border-transparent transition-colors",
          isOver && "bg-blue-50/50 border-blue-200"
        )}
      >
        <SortableContext items={leads.map(l => l.id)}>
          <div className="flex flex-col gap-3 min-h-[100px]">
            {leads.map((lead) => (
              <SortableLeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
