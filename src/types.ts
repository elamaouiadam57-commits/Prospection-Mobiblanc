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

export interface AirtableConfig {
  pat: string;
  baseId: string;
  tableName: string;
}
