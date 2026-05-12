/// <reference types="vite/client" />
import { Lead, LeadStatus, Consultant, ConsultantInterview, ProspectionMeeting } from '../types';

// Helper to check if Airtable is configured
export const isAirtableConfigured = () => {
  return Boolean(
    import.meta.env.VITE_AIRTABLE_PAT &&
    import.meta.env.VITE_AIRTABLE_BASE_ID &&
    import.meta.env.VITE_AIRTABLE_TABLE_NAME
  );
};

// Helper for PM specific configuration
export const isAirtablePMConfigured = () => {
  return Boolean(
    import.meta.env.VITE_AIRTABLE_PAT &&
    import.meta.env.VITE_AIRTABLE_BASE_ID &&
    (import.meta.env.VITE_AIRTABLE_PM_TABLE_NAME || import.meta.env.VITE_AIRTABLE_TABLE_NAME)
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
    console.log('Airtable not configured. Returning empty list.');
    return [];
  }

  const tableName = import.meta.env.VITE_AIRTABLE_TABLE_NAME?.trim();
  const encodedTable = encodeURIComponent(tableName || '');

  try {
    const response = await fetch(`/api/airtable/${encodedTable}?_t=${Date.now()}`);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`Erreur ${response.status}: ${errData.error?.message || errData.error || response.statusText}`);
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
      isPriority: record.fields["Priorité"] || false,
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

  const tableName = import.meta.env.VITE_AIRTABLE_TABLE_NAME?.trim();
  const encodedTable = encodeURIComponent(tableName || '');

  try {
    const response = await fetch(`/api/airtable/${encodedTable}/${leadId}`, {
      method: 'PATCH',
      headers: {
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
    // ... mock logic ...
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

  const tableName = import.meta.env.VITE_AIRTABLE_TABLE_NAME?.trim();
  const encodedTable = encodeURIComponent(tableName || '');

  try {
    const response = await fetch(`/api/airtable/${encodedTable}`, {
      method: 'POST',
      headers: {
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
              "Priorité": leadData.isPriority || false,
              ...(leadData.dateContact && { "Date de contact": leadData.dateContact }),
            }
          }
        ],
        typecast: true,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errorMessage = errData.error?.message || errData.error || response.statusText;
      
      // If the error is about the missing "Date de contact" column, retry without it
      if (typeof errorMessage === 'string' && (errorMessage.includes('Unknown field name: "Date de contact"') || errorMessage.includes('Date de contact'))) {
        console.warn('Column "Date de contact" is missing in Airtable. Retrying without it...');
        const fallbackBody = {
          records: [{
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
          }],
          typecast: true
        };
        
        const retryResponse = await fetch(`/api/airtable/${encodedTable}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fallbackBody),
        });
        
        if (!retryResponse.ok) {
          const retryErrData = await retryResponse.json().catch(() => ({}));
          throw new Error(`Erreur ${retryResponse.status}: ${retryErrData.error?.message || retryErrData.error || retryResponse.statusText}`);
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

  const tableName = import.meta.env.VITE_AIRTABLE_TABLE_NAME?.trim();
  const encodedTable = encodeURIComponent(tableName || '');

  try {
    const response = await fetch(`/api/airtable/${encodedTable}/${leadId}`, {
      method: 'PATCH',
      headers: {
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
          ...(leadData.isPriority !== undefined && { "Priorité": leadData.isPriority }),
        },
        typecast: true,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errorMessage = errData.error?.message || errData.error || response.statusText;
      
      // If the error is about the missing "Date de contact" column, retry without it
      if (leadData.dateContact !== undefined && typeof errorMessage === 'string' && (errorMessage.includes('Unknown field name: "Date de contact"') || errorMessage.includes('Date de contact'))) {
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
          ...(restLeadData.isPriority !== undefined && { "Priorité": restLeadData.isPriority }),
        };

        const retryResponse = await fetch(`/api/airtable/${encodedTable}/${leadId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fields: fallbackFields, typecast: true }),
        });

        if (!retryResponse.ok) {
          const retryErrData = await retryResponse.json().catch(() => ({}));
          throw new Error(`Airtable API error: ${retryErrData.error?.message || retryErrData.error || retryResponse.statusText}`);
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

  const tableName = import.meta.env.VITE_AIRTABLE_TABLE_NAME?.trim();
  const encodedTable = encodeURIComponent(tableName || '');

  try {
    const response = await fetch(`/api/airtable/${encodedTable}/${leadId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`Airtable API error: ${errData.error?.message || errData.error || response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to delete from Airtable:', error);
    throw error;
  }
};

// --- PROSPECTION MEETINGS METHODS (Airtable) ---

export const fetchPMs = async (): Promise<ProspectionMeeting[]> => {
  if (!isAirtablePMConfigured()) {
    console.log('Airtable PM not configured. Returning empty list.');
    return [];
  }

  const pmTableName = import.meta.env.VITE_AIRTABLE_PM_TABLE_NAME || 'Meetings';
  const encodedTable = encodeURIComponent(pmTableName);

  try {
    const response = await fetch(`/api/airtable/${encodedTable}?_t=${Date.now()}`);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.warn('Meeting table maybe not exist, returning empty');
      return [];
    }

    const data = await response.json();
    return data.records.map((record: any) => ({
      id: record.id,
      leadId: record.fields["Lead ID"] || '',
      leadName: record.fields["Name"] || record.fields["Lead Name"] || '',
      date: record.fields["Date & heure"] || record.fields["Date"] || record.createdTime,
      location: record.fields["Lieu/ type"] || record.fields["Lieu"] || record.fields["Location"] || 'Visio',
      notes: record.fields["Notes / Objectifs"] || record.fields["Notes"] || '',
      status: record.fields["Statut"] || record.fields["Status"] || 'Prévu',
    }));
  } catch (error) {
    console.error('Failed to fetch PMs from Airtable:', error);
    return [];
  }
};

export const createPM = async (data: Partial<ProspectionMeeting>): Promise<ProspectionMeeting> => {
  if (!isAirtablePMConfigured()) {
    const newPM = {
      ...data,
      id: `mock-pm-${Date.now()}`,
    } as ProspectionMeeting;
    return newPM;
  }

  const pmTableName = import.meta.env.VITE_AIRTABLE_PM_TABLE_NAME || 'Meetings';
  const encodedTable = encodeURIComponent(pmTableName);

  try {
    const fields: any = {
      "Name": data.leadName,
      "Date & heure": data.date,
      "Lieu/ type": data.location,
      "Notes / Objectifs": data.notes,
      "Statut": data.status || 'Prévu',
    };

    const response = await fetch(`/api/airtable/${encodedTable}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        records: [{ fields }],
        typecast: true
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errorMessage = errData.error?.message || response.statusText;
      
      // Handle missing "Lead ID" or other non-essential columns silently by retrying
      if (typeof errorMessage === 'string' && errorMessage.includes('Unknown field name')) {
        console.warn('Field missing in Airtable PM table, retrying with minimal fields...');
        // If it failed, let's try the absolute minimum
        const minimalFields = {
          "Name": data.leadName,
          "Date & heure": data.date,
          "Lieu/ type": data.location,
          "Statut": data.status || 'Prévu',
        };
        
        const retryResponse = await fetch(`/api/airtable/${encodedTable}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            records: [{ fields: minimalFields }],
            typecast: true
          })
        });

        if (!retryResponse.ok) {
          const retryErrData = await retryResponse.json().catch(() => ({}));
          throw new Error(`Failed to create PM in Airtable (Retry): ${retryErrData.error?.message || retryResponse.statusText}`);
        }
        
        const retryResult = await retryResponse.json();
        const record = retryResult.records[0];
        return {
          id: record.id,
          leadId: '',
          leadName: record.fields["Name"] || '',
          date: record.fields["Date & heure"] || '',
          location: record.fields["Lieu/ type"] || 'Visio',
          notes: record.fields["Notes / Objectifs"] || '',
          status: record.fields["Statut"] || 'Prévu',
        };
      }
      
      throw new Error(`Failed to create PM in Airtable: ${errorMessage}`);
    }

    const result = await response.json();
    const record = result.records[0];

    return {
      id: record.id,
      leadId: '',
      leadName: record.fields["Name"] || '',
      date: record.fields["Date & heure"] || '',
      location: record.fields["Lieu/ type"] || 'Visio',
      notes: record.fields["Notes / Objectifs"] || '',
      status: record.fields["Statut"] || 'Prévu',
    };
  } catch (error) {
    console.error('Failed to create PM:', error);
    throw error;
  }
};

export const updatePM = async (id: string, data: Partial<ProspectionMeeting>): Promise<ProspectionMeeting> => {
  if (!isAirtablePMConfigured() || id.startsWith('mock')) {
    return { ...data, id } as ProspectionMeeting;
  }

  const pmTableName = import.meta.env.VITE_AIRTABLE_PM_TABLE_NAME || 'Meetings';
  const encodedTable = encodeURIComponent(pmTableName);

  try {
    const fields: any = {
      ...(data.leadName && { "Name": data.leadName }),
      ...(data.date && { "Date & heure": data.date }),
      ...(data.location && { "Lieu/ type": data.location }),
      ...(data.notes !== undefined && { "Notes / Objectifs": data.notes }),
      ...(data.status && { "Statut": data.status }),
    };

    const response = await fetch(`/api/airtable/${encodedTable}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields,
        typecast: true
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errorMessage = errData.error?.message || response.statusText;

      if (typeof errorMessage === 'string' && errorMessage.includes('Unknown field name')) {
        console.warn('Field missing in Airtable PM table (update), retrying without extra fields...');
        const minimalFields: any = {
          ...(data.leadName && { "Name": data.leadName }),
          ...(data.date && { "Date & heure": data.date }),
          ...(data.location && { "Lieu/ type": data.location }),
          ...(data.status && { "Statut": data.status }),
        };

        const retryResponse = await fetch(`/api/airtable/${encodedTable}/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: minimalFields,
            typecast: true
          })
        });

        if (!retryResponse.ok) {
           const retryErrData = await retryResponse.json().catch(() => ({}));
           throw new Error(`Failed to update PM in Airtable (Retry): ${retryErrData.error?.message || retryResponse.statusText}`);
        }
        
        const record = await retryResponse.json();
        return {
          id: record.id,
          leadId: '',
          leadName: record.fields["Name"] || '',
          date: record.fields["Date & heure"] || '',
          location: record.fields["Lieu/ type"] || 'Visio',
          notes: record.fields["Notes / Objectifs"] || '',
          status: record.fields["Statut"] || 'Prévu',
        };
      }
      
      throw new Error(`Failed to update PM in Airtable: ${errorMessage}`);
    }

    const record = await response.json();
    return {
      id: record.id,
      leadId: '',
      leadName: record.fields["Name"] || '',
      date: record.fields["Date & heure"] || '',
      location: record.fields["Lieu/ type"] || 'Visio',
      notes: record.fields["Notes / Objectifs"] || '',
      status: record.fields["Statut"] || 'Prévu',
    };
  } catch (error) {
    console.error('Failed to update PM:', error);
    throw error;
  }
};

export const deletePM = async (id: string): Promise<void> => {
  if (!isAirtablePMConfigured() || id.startsWith('mock')) {
    return;
  }

  const pmTableName = import.meta.env.VITE_AIRTABLE_PM_TABLE_NAME || 'Meetings';
  const encodedTable = encodeURIComponent(pmTableName);

  try {
    const response = await fetch(`/api/airtable/${encodedTable}/${id}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      throw new Error('Failed to delete PM from Airtable');
    }
  } catch (error) {
    console.error('Failed to delete PM:', error);
    throw error;
  }
};
