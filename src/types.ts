export type LeadStatus = string;

export interface Lead {
  id: string;
  airtableId?: string;
  dateAjout: string;
  dateContact?: string;
  prenom: string;
  nom: string;
  linkedin: string;
  fonction: string;
  category: string;
  entreprise: string;
  numero: string;
  mail: string;
  status: LeadStatus;
  mailEnvoye: boolean | string;
  notes: string;
  scoreLead: number;
  tags?: string[];
  isPriority?: boolean;
}

export interface ProspectionMeeting {
  id: string;
  leadId: string;
  leadName: string;
  date: string;
  location: string;
  notes: string;
  status: 'Prévu' | 'Terminé' | 'Annulé';
}

export interface AirtableConfig {
  pat: string;
  baseId: string;
  tableName: string;
}
