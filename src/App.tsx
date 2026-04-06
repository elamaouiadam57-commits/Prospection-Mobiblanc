import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Dashboard } from './components/Dashboard';
import { LeadsTable } from './components/LeadsTable';
import { KanbanBoard } from './components/KanbanBoard';
import { AirtableBanner } from './components/AirtableBanner';
import { Lead, LeadStatus } from './types';
import { fetchLeads, updateLeadStatus, createLead } from './services/airtable';

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'table' | 'kanban'>('dashboard');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchLeads();
        setLeads(data);
        setError(null);
      } catch (err: any) {
        console.error("Failed to load leads", err);
        setError(err.message || "Une erreur est survenue lors de la connexion à Airtable.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleLeadMove = async (leadId: string, newStatus: LeadStatus) => {
    // Optimistic UI update
    setLeads(prev => prev.map(lead => 
      lead.id === leadId ? { ...lead, status: newStatus } : lead
    ));

    try {
      await updateLeadStatus(leadId, newStatus);
    } catch (error) {
      console.error("Failed to update lead status in Airtable", error);
      // Revert on failure by re-fetching
      const data = await fetchLeads();
      setLeads(data);
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

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans antialiased text-gray-900 selection:bg-blue-100 selection:text-blue-900">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        <AirtableBanner />
        <TopBar 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
        />
        
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="m-8 p-6 bg-red-50 border border-red-200 rounded-2xl text-red-800">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Erreur de connexion Airtable
              </h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
              <div className="mt-4 text-sm text-red-700 bg-red-100/50 p-4 rounded-xl">
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
              {currentView === 'table' && <LeadsTable leads={filteredLeads} onAddLead={handleAddLead} />}
              {currentView === 'kanban' && <KanbanBoard leads={filteredLeads} onLeadMove={handleLeadMove} />}
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
