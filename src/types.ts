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
}

export interface Consultant {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  specialite: string;
  experience: number;
  dateAjout: string;
}

export interface ConsultantInterview {
  id: string;
  consultantId: string;
  consultantName: string; // Helpful for display without full join
  date: string;
  notes: string;
  rating: number; // 1-5
  status: 'Programmé' | 'Réalisé' | 'Annulé';
}

export interface AirtableConfig {
  pat: string;
  baseId: string;
  tableName: string;
  consultantsTableName?: string;
  interviewsTableName?: string;
}
