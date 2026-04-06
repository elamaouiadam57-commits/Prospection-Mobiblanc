/// <reference types="vite/client" />
import { Lead, LeadStatus } from '../types';
import { MOCK_LEADS } from '../data/mock';

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
    const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableName}`, {
      headers: {
        Authorization: `Bearer ${pat}`,
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`Erreur ${response.status}: ${errData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    return data.records.map((record: any) => ({
      id: record.id,
      airtableId: record.id,
      dateAjout: record.fields["Date d'ajout"] || new Date().toISOString(),
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
      throw new Error(`Airtable API error: ${response.statusText}`);
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
            }
          }
        ],
        typecast: true,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`Erreur ${response.status}: ${errData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const record = data.records[0];
    
    return {
      id: record.id,
      airtableId: record.id,
      dateAjout: record.fields["Date d'ajout"] || new Date().toISOString(),
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
        },
        typecast: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.statusText}`);
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
      throw new Error(`Airtable API error: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to delete from Airtable:', error);
    throw error;
  }
};
