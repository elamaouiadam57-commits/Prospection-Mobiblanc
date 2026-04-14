import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Dashboard } from './components/Dashboard';
import { LeadsTable } from './components/LeadsTable';
import { KanbanBoard } from './components/KanbanBoard';
import { Reports } from './components/Reports';
import { AirtableBanner } from './components/AirtableBanner';
import { Login } from './components/Login';
import { Lead, LeadStatus } from './types';
import { fetchLeads, updateLeadStatus, createLead, updateLead, deleteLead } from './services/airtable';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'table' | 'kanban' | 'reports'>('dashboard');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);
    
    try {
      const data = await fetchLeads();
      setLeads(data);
      setError(null);
    } catch (err: any) {
      console.error("Failed to load leads", err);
      setError(err.message || "Une erreur est survenue lors de la connexion à Airtable.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Poll for changes every 30 seconds
    const interval = setInterval(() => {
      loadData(false);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleLeadMove = async (leadId: string, newStatus: LeadStatus) => {
    const lead = leads.find(l => l.id === leadId);
    const isContactedStatus = !newStatus.toLowerCase().includes('nouveau') && !newStatus.toLowerCase().includes('new');
    
    // Update dateContact: set to current time if active status, clear if Nouveau
    const newDateContact = isContactedStatus ? new Date().toISOString() : '';

    // Optimistic UI update
    setLeads(prev => prev.map(lead => 
      lead.id === leadId ? { 
        ...lead, 
        status: newStatus,
        dateContact: newDateContact
      } : lead
    ));

    try {
      await updateLead(leadId, { status: newStatus, dateContact: newDateContact });
    } catch (error) {
      console.error("Failed to update lead status in Airtable", error);
      // Revert on failure by re-fetching
      loadData(false);
    }
  };

  const handleAddLead = async (leadData: Partial<Lead>) => {
    try {
      const newLead = await createLead(leadData);
      setLeads(prev => [newLead, ...prev]);
    } catch (error) {
      console.error("Failed to add lead", error);
      throw error;
    }
  };

  const handleUpdateLead = async (leadId: string, leadData: Partial<Lead>) => {
    const lead = leads.find(l => l.id === leadId);
    let updatedData = { ...leadData };
    
    if (leadData.status) {
      const isContactedStatus = !leadData.status.toLowerCase().includes('nouveau') && !leadData.status.toLowerCase().includes('new');
      updatedData.dateContact = isContactedStatus ? new Date().toISOString() : '';
    }

    // Optimistic update
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updatedData } : l));

    try {
      await updateLead(leadId, updatedData);
    } catch (error) {
      console.error("Failed to update lead", error);
      // Revert on failure
      loadData(false);
      throw error;
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      await deleteLead(leadId);
      setLeads(prev => prev.filter(lead => lead.id !== leadId));
    } catch (error) {
      console.error("Failed to delete lead", error);
      throw error;
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${lead.prenom} ${lead.nom}`.toLowerCase();
    const company = (lead.entreprise || '').toLowerCase();
    return fullName.includes(query) || company.includes(query);
  }).sort((a, b) => {
    const dateA = new Date(a.dateAjout).getTime();
    const dateB = new Date(b.dateAjout).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden font-sans antialiased text-slate-50 selection:bg-blue-500/30 selection:text-blue-200">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        onLogout={() => setIsAuthenticated(false)}
      />
      
      <main className="flex-1 flex flex-col min-w-0 bg-slate-900">
        <AirtableBanner />
        <TopBar 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          onRefresh={() => loadData(false)}
          isRefreshing={isRefreshing}
        />
        
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {isRefreshing && (
            <div className="absolute top-4 right-4 z-50 bg-slate-800 text-blue-400 text-xs px-3 py-1.5 rounded-full shadow-lg border border-slate-700 flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              Synchronisation...
            </div>
          )}
          {error && (
            <div className="m-8 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Erreur de connexion Airtable
              </h3>
              <p className="mt-2 text-sm text-red-300">{error}</p>
              <div className="mt-4 text-sm text-red-300 bg-red-500/10 p-4 rounded-xl">
                <p className="font-medium mb-1">Vérifications à effectuer :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Votre Personal Access Token (PAT) est-il correct et a-t-il les scopes <code>data.records:read</code> et <code>data.records:write</code> ?</li>
                  <li>L'ID de la base (commence par <code>app...</code>) est-il correct ?</li>
                  <li>Le nom de la table (ex: <code>Leads</code>) correspond-il exactement à celui dans Airtable (attention aux majuscules/espaces) ?</li>
                </ul>
              </div>
            </div>
          )}
          
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : !error ? (
            <>
              {currentView === 'dashboard' && <Dashboard leads={filteredLeads} />}
              {currentView === 'table' && (
                <LeadsTable 
                  leads={filteredLeads} 
                  onAddLead={handleAddLead} 
                  onUpdateLead={handleUpdateLead}
                  onDeleteLead={handleDeleteLead}
                />
              )}
              {currentView === 'kanban' && (
                <KanbanBoard 
                  leads={filteredLeads} 
                  onLeadMove={handleLeadMove} 
                  onUpdateLead={handleUpdateLead}
                  onDeleteLead={handleDeleteLead}
                />
              )}
              {currentView === 'reports' && <Reports leads={filteredLeads} />}
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
