/// <reference types="vite/client" />
import { Lead, LeadStatus, Consultant, ConsultantInterview, ProspectionMeeting } from '../types';
import { MOCK_LEADS, MOCK_CONSULTANTS, MOCK_INTERVIEWS, MOCK_PMS } from '../data/mock';

// Helper to check if Airtable is configured
export const isAirtableConfigured = () => {
  return Boolean(
    import.meta.env.VITE_AIRTABLE_PAT &&
    import.meta.env.VITE_AIRTABLE_BASE_ID &&
    import.meta.env.VITE_AIRTABLE_TABLE_NAME
  );
};

// Helper to safely parse Airtable status (handles single select, multi select, and formatting issues)
const parseStatus = (rawStatus: any): string => {
  let s = '';
  if (Array.isArray(rawStatus)) {
    s = rawStatus[0];
  } else if (typeof rawStatus === 'object' && rawStatus !== null) {
    s = rawStatus.name || rawStatus.value || '';
  } else if (typeof rawStatus === 'string') {
    s = rawStatus;
  }
  
  return s.trim() || 'Nouveau';
};

const parseTags = (rawTags: any): string[] => {
  if (Array.isArray(rawTags)) return rawTags.map(String);
  if (typeof rawTags === 'string') return rawTags.split(',').map(s => s.trim()).filter(Boolean);
  return [];
};

// Fetch leads from Airtable (or return mock data if not configured)
export const fetchLeads = async (): Promise<Lead[]> => {
  if (!isAirtableConfigured()) {
    console.log('Airtable not configured. Using mock data.');
    return [...MOCK_LEADS];
  }

  const pat = import.meta.env.VITE_AIRTABLE_PAT?.trim();
  const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID?.trim().replace(/\/$/, '');
  const tableName = import.meta.env.VITE_AIRTABLE_TABLE_NAME?.trim();

  try {
    const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableName}?_t=${Date.now()}`, {
      headers: {
        Authorization: `Bearer ${pat}`,
      }
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`Erreur ${response.status}: ${errData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    return data.records.map((record: any) => ({
      id: record.id,
      airtableId: record.id,
      dateAjout: record.fields["Date d'ajout"] || record.createdTime || new Date().toISOString(),
      dateContact: record.fields["Date de contact"] || '',
      prenom: record.fields["Prénom"] || '',
      nom: record.fields["Nom"] || 'Inconnu',
      linkedin: record.fields["Linkedin"] || '',
      fonction: record.fields["Fonction"] || '',
      category: record.fields["Category"] || '',
      entreprise: record.fields["Entreprise"] || 'Inconnue',
      numero: record.fields["Numéro"] || '',
      mail: record.fields["Mail"] || '',
      status: parseStatus(record.fields["Status"]),
      mailEnvoye: record.fields["Mail envoyé"] || false,
      notes: record.fields["Notes"] || '',
      scoreLead: record.fields["Score lead"] || 0,
      tags: parseTags(record.fields["Tags"] || record.fields["Mots-clés"] || record.fields["Labels"]),
    }));
  } catch (error) {
    console.error('Failed to fetch from Airtable:', error);
    throw error;
  }
};

// Update a lead's status in Airtable
export const updateLeadStatus = async (leadId: string, newStatus: LeadStatus): Promise<void> => {
  if (!isAirtableConfigured()) {
    console.log(`Mock update: Lead ${leadId} status changed to ${newStatus}`);
    return;
  }

  const pat = import.meta.env.VITE_AIRTABLE_PAT?.trim();
  const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID?.trim().replace(/\/$/, '');
  const tableName = import.meta.env.VITE_AIRTABLE_TABLE_NAME?.trim();

  try {
    const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableName}/${leadId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${pat}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          Status: newStatus,
        },
        typecast: true,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`Airtable API error: ${errData.error?.message || errData.error?.type || response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to update Airtable:', error);
    throw error;
  }
};

// Create a new lead in Airtable
export const createLead = async (leadData: Partial<Lead>): Promise<Lead> => {
  if (!isAirtableConfigured()) {
    const newLead: Lead = {
      ...leadData,
      id: `mock-${Date.now()}`,
      airtableId: `mock-${Date.now()}`,
      dateAjout: new Date().toISOString(),
      dateContact: leadData.dateContact || '',
      status: leadData.status || 'Nouveau',
      prenom: leadData.prenom || '',
      nom: leadData.nom || 'Inconnu',
      entreprise: leadData.entreprise || 'Inconnue',
      mail: leadData.mail || '',
      scoreLead: 0,
    } as Lead;
    console.log('Mock create:', newLead);
    return newLead;
  }

  const pat = import.meta.env.VITE_AIRTABLE_PAT?.trim();
  const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID?.trim().replace(/\/$/, '');
  const tableName = import.meta.env.VITE_AIRTABLE_TABLE_NAME?.trim();

  try {
    const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableName}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pat}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              "Prénom": leadData.prenom,
              "Nom": leadData.nom,
              "Fonction": leadData.fonction,
              "Entreprise": leadData.entreprise,
              "Mail": leadData.mail,
              "Numéro": leadData.numero,
              "Status": leadData.status || 'Nouveau',
              "Notes": leadData.notes,
              "Date d'ajout": new Date().toISOString().split('T')[0],
              ...(leadData.dateContact && { "Date de contact": leadData.dateContact }),
            }
          }
        ],
        typecast: true,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errorMessage = errData.error?.message || errData.error?.type || response.statusText;
      
      // If the error is about the missing "Date de contact" column, retry without it
      if (errorMessage.includes('Unknown field name: "Date de contact"') || errorMessage.includes('Date de contact')) {
        console.warn('Column "Date de contact" is missing in Airtable. Retrying without it...');
        const fallbackBody = {
          fields: {
            "Prénom": leadData.prenom,
            "Nom": leadData.nom,
            "Fonction": leadData.fonction,
            "Entreprise": leadData.entreprise,
            "Mail": leadData.mail,
            "Numéro": leadData.numero,
            "Status": leadData.status || 'Nouveau',
            "Notes": leadData.notes,
            "Date d'ajout": new Date().toISOString().split('T')[0],
          }
        };
        
        const retryResponse = await fetch(`https://api.airtable.com/v0/${baseId}/${tableName}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${pat}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ records: [fallbackBody], typecast: true }),
        });
        
        if (!retryResponse.ok) {
          const retryErrData = await retryResponse.json().catch(() => ({}));
          throw new Error(`Erreur ${retryResponse.status}: ${retryErrData.error?.message || retryErrData.error?.type || retryResponse.statusText}`);
        }
        
        const data = await retryResponse.json();
        const record = data.records[0];
        
        return {
          id: record.id,
          airtableId: record.id,
          dateAjout: record.fields["Date d'ajout"] || new Date().toISOString(),
          dateContact: '',
          prenom: record.fields["Prénom"] || '',
          nom: record.fields["Nom"] || 'Inconnu',
          linkedin: record.fields["Linkedin"] || '',
          fonction: record.fields["Fonction"] || '',
          category: record.fields["Category"] || '',
          entreprise: record.fields["Entreprise"] || 'Inconnue',
          numero: record.fields["Numéro"] || '',
          mail: record.fields["Mail"] || '',
          status: parseStatus(record.fields["Status"]),
          mailEnvoye: record.fields["Mail envoyé"] || false,
          notes: record.fields["Notes"] || '',
          scoreLead: record.fields["Score lead"] || 0,
          tags: parseTags(record.fields["Tags"] || record.fields["Mots-clés"] || record.fields["Labels"]),
        };
      }
      
      throw new Error(`Erreur ${response.status}: ${errorMessage}`);
    }

    const data = await response.json();
    const record = data.records[0];
    
    return {
      id: record.id,
      airtableId: record.id,
      dateAjout: record.fields["Date d'ajout"] || new Date().toISOString(),
      dateContact: record.fields["Date de contact"] || '',
      prenom: record.fields["Prénom"] || '',
      nom: record.fields["Nom"] || 'Inconnu',
      linkedin: record.fields["Linkedin"] || '',
      fonction: record.fields["Fonction"] || '',
      category: record.fields["Category"] || '',
      entreprise: record.fields["Entreprise"] || 'Inconnue',
      numero: record.fields["Numéro"] || '',
      mail: record.fields["Mail"] || '',
      status: parseStatus(record.fields["Status"]),
      mailEnvoye: record.fields["Mail envoyé"] || false,
      notes: record.fields["Notes"] || '',
      scoreLead: record.fields["Score lead"] || 0,
      tags: parseTags(record.fields["Tags"] || record.fields["Mots-clés"] || record.fields["Labels"]),
    };
  } catch (error) {
    console.error('Failed to create lead in Airtable:', error);
    throw error;
  }
};

// Update a lead's full data in Airtable
export const updateLead = async (leadId: string, leadData: Partial<Lead>): Promise<void> => {
  if (!isAirtableConfigured()) {
    console.log(`Mock update full: Lead ${leadId}`, leadData);
    return;
  }

  const pat = import.meta.env.VITE_AIRTABLE_PAT?.trim();
  const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID?.trim().replace(/\/$/, '');
  const tableName = import.meta.env.VITE_AIRTABLE_TABLE_NAME?.trim();

  try {
    const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableName}/${leadId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${pat}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          ...(leadData.prenom !== undefined && { "Prénom": leadData.prenom }),
          ...(leadData.nom !== undefined && { "Nom": leadData.nom }),
          ...(leadData.fonction !== undefined && { "Fonction": leadData.fonction }),
          ...(leadData.entreprise !== undefined && { "Entreprise": leadData.entreprise }),
          ...(leadData.mail !== undefined && { "Mail": leadData.mail }),
          ...(leadData.numero !== undefined && { "Numéro": leadData.numero }),
          ...(leadData.status !== undefined && { "Status": leadData.status }),
          ...(leadData.notes !== undefined && { "Notes": leadData.notes }),
          ...(leadData.dateContact !== undefined && { "Date de contact": leadData.dateContact }),
        },
        typecast: true,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errorMessage = errData.error?.message || errData.error?.type || response.statusText;
      
      // If the error is about the missing "Date de contact" column, retry without it
      if (leadData.dateContact !== undefined && (errorMessage.includes('Unknown field name: "Date de contact"') || errorMessage.includes('Date de contact'))) {
        console.warn('Column "Date de contact" is missing in Airtable. Retrying without it...');
        const { dateContact, ...restLeadData } = leadData;
        
        const fallbackFields = {
          ...(restLeadData.prenom !== undefined && { "Prénom": restLeadData.prenom }),
          ...(restLeadData.nom !== undefined && { "Nom": restLeadData.nom }),
          ...(restLeadData.fonction !== undefined && { "Fonction": restLeadData.fonction }),
          ...(restLeadData.entreprise !== undefined && { "Entreprise": restLeadData.entreprise }),
          ...(restLeadData.mail !== undefined && { "Mail": restLeadData.mail }),
          ...(restLeadData.numero !== undefined && { "Numéro": restLeadData.numero }),
          ...(restLeadData.status !== undefined && { "Status": restLeadData.status }),
          ...(restLeadData.notes !== undefined && { "Notes": restLeadData.notes }),
        };

        const retryResponse = await fetch(`https://api.airtable.com/v0/${baseId}/${tableName}/${leadId}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${pat}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fields: fallbackFields, typecast: true }),
        });

        if (!retryResponse.ok) {
          const retryErrData = await retryResponse.json().catch(() => ({}));
          throw new Error(`Airtable API error: ${retryErrData.error?.message || retryErrData.error?.type || retryResponse.statusText}`);
        }
        return;
      }

      throw new Error(`Airtable API error: ${errorMessage}`);
    }
  } catch (error) {
    console.error('Failed to update Airtable:', error);
    throw error;
  }
};

// Delete a lead in Airtable
export const deleteLead = async (leadId: string): Promise<void> => {
  if (!isAirtableConfigured()) {
    console.log(`Mock delete: Lead ${leadId}`);
    return;
  }

  const pat = import.meta.env.VITE_AIRTABLE_PAT?.trim();
  const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID?.trim().replace(/\/$/, '');
  const tableName = import.meta.env.VITE_AIRTABLE_TABLE_NAME?.trim();

  try {
    const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableName}/${leadId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${pat}`,
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`Airtable API error: ${errData.error?.message || errData.error?.type || response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to delete from Airtable:', error);
    throw error;
  }
};

// --- CONSULTANTS METHODS (LocalStorage) ---

const CONSULTANTS_STORAGE_KEY = 'crm_consultants_data';
const INTERVIEWS_STORAGE_KEY = 'crm_interviews_data';

export const fetchConsultants = async (): Promise<Consultant[]> => {
  const stored = localStorage.getItem(CONSULTANTS_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored consultants', e);
    }
  }
  // Initial seeding with mock data if empty
  localStorage.setItem(CONSULTANTS_STORAGE_KEY, JSON.stringify(MOCK_CONSULTANTS));
  return [...MOCK_CONSULTANTS];
};

export const createConsultant = async (data: Partial<Consultant>): Promise<Consultant> => {
  const consultants = await fetchConsultants();
  const newConsultant = {
    ...data,
    id: `c-${Date.now()}`,
    dateAjout: new Date().toISOString(),
  } as Consultant;
  
  const updated = [newConsultant, ...consultants];
  localStorage.setItem(CONSULTANTS_STORAGE_KEY, JSON.stringify(updated));
  return newConsultant;
};

// --- INTERVIEWS METHODS (LocalStorage) ---

export const fetchInterviews = async (): Promise<ConsultantInterview[]> => {
  const stored = localStorage.getItem(INTERVIEWS_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored interviews', e);
    }
  }
  // Initial seeding with mock data if empty
  localStorage.setItem(INTERVIEWS_STORAGE_KEY, JSON.stringify(MOCK_INTERVIEWS));
  return [...MOCK_INTERVIEWS];
};

export const createInterview = async (data: Partial<ConsultantInterview>): Promise<ConsultantInterview> => {
  const interviews = await fetchInterviews();
  const newInterview = {
    ...data,
    id: `i-${Date.now()}`,
  } as ConsultantInterview;
  
  const updated = [newInterview, ...interviews];
  localStorage.setItem(INTERVIEWS_STORAGE_KEY, JSON.stringify(updated));
  return newInterview;
};

export const updateConsultant = async (id: string, data: Partial<Consultant>): Promise<Consultant> => {
  const consultants = await fetchConsultants();
  const updated = consultants.map(c => c.id === id ? { ...c, ...data } : c);
  localStorage.setItem(CONSULTANTS_STORAGE_KEY, JSON.stringify(updated));
  const result = updated.find(c => c.id === id);
  if (!result) throw new Error('Consultant not found');
  return result;
};

export const deleteConsultant = async (id: string): Promise<void> => {
  const consultants = await fetchConsultants();
  const updated = consultants.filter(c => c.id !== id);
  localStorage.setItem(CONSULTANTS_STORAGE_KEY, JSON.stringify(updated));
  
  // Also delete associated interviews
  const interviews = await fetchInterviews();
  const updatedInterviews = interviews.filter(i => i.consultantId !== id);
  localStorage.setItem(INTERVIEWS_STORAGE_KEY, JSON.stringify(updatedInterviews));
};

export const updateInterview = async (id: string, data: Partial<ConsultantInterview>): Promise<ConsultantInterview> => {
  const interviews = await fetchInterviews();
  const updated = interviews.map(i => i.id === id ? { ...i, ...data } : i);
  localStorage.setItem(INTERVIEWS_STORAGE_KEY, JSON.stringify(updated));
  const result = updated.find(i => i.id === id);
  if (!result) throw new Error('Interview not found');
  return result;
};

export const deleteInterview = async (id: string): Promise<void> => {
  const interviews = await fetchInterviews();
  const updated = interviews.filter(i => i.id !== id);
  localStorage.setItem(INTERVIEWS_STORAGE_KEY, JSON.stringify(updated));
};

// --- PROSPECTION MEETINGS METHODS (LocalStorage) ---

const PM_STORAGE_KEY = 'crm_pm_data';

export const fetchPMs = async (): Promise<ProspectionMeeting[]> => {
  const stored = localStorage.getItem(PM_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored PMs', e);
    }
  }
  // Initialize with mocks if empty
  localStorage.setItem(PM_STORAGE_KEY, JSON.stringify(MOCK_PMS));
  return [...MOCK_PMS];
};

export const createPM = async (data: Partial<ProspectionMeeting>): Promise<ProspectionMeeting> => {
  const pms = await fetchPMs();
  const newPM: ProspectionMeeting = {
    id: Math.random().toString(36).substr(2, 9),
    leadId: data.leadId || '',
    leadName: data.leadName || '',
    date: data.date || new Date().toISOString(),
    location: data.location || 'Visio',
    notes: data.notes || '',
    status: data.status || 'Prévu',
  };
  const updated = [newPM, ...pms];
  localStorage.setItem(PM_STORAGE_KEY, JSON.stringify(updated));
  return newPM;
};

export const updatePM = async (id: string, data: Partial<ProspectionMeeting>): Promise<ProspectionMeeting> => {
  const pms = await fetchPMs();
  const updated = pms.map(pm => pm.id === id ? { ...pm, ...data } : pm);
  localStorage.setItem(PM_STORAGE_KEY, JSON.stringify(updated));
  const result = updated.find(pm => pm.id === id);
  if (!result) throw new Error('PM not found');
  return result;
};

export const deletePM = async (id: string): Promise<void> => {
  const pms = await fetchPMs();
  const updated = pms.filter(pm => pm.id !== id);
  localStorage.setItem(PM_STORAGE_KEY, JSON.stringify(updated));
};
