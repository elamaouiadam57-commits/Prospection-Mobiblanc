import { Lead, Consultant, ConsultantInterview, ProspectionMeeting } from '../types';

export const MOCK_LEADS: Lead[] = [
  {
    id: '1',
    dateAjout: '2026-04-05T10:30:00Z',
    dateContact: '',
    prenom: 'Sarah',
    nom: 'Jenkins',
    linkedin: 'linkedin.com/in/sjenkins',
    fonction: 'Directrice Marketing',
    category: 'A',
    entreprise: 'TechFlow Solutions',
    numero: '+33 6 12 34 56 78',
    mail: 'sarah.j@techflow.io',
    status: 'Nouveau',
    mailEnvoye: false,
    notes: 'Intéressée par notre nouvelle offre.',
    scoreLead: 85,
  },
  {
    id: '2',
    dateAjout: '2026-04-04T14:15:00Z',
    dateContact: '2026-04-06T10:00:00Z',
    prenom: 'Marcus',
    nom: 'Chen',
    linkedin: 'linkedin.com/in/mchen',
    fonction: 'CEO',
    category: 'B',
    entreprise: 'Global Retail Group',
    numero: '+33 6 98 76 54 32',
    mail: 'm.chen@globalretail.com',
    status: 'Contacté',
    mailEnvoye: true,
    notes: 'A relancer la semaine prochaine.',
    scoreLead: 60,
  },
  {
    id: '3',
    dateAjout: '2026-04-02T09:00:00Z',
    dateContact: '2026-04-03T11:30:00Z',
    prenom: 'Elena',
    nom: 'Rodriguez',
    linkedin: 'linkedin.com/in/erodriguez',
    fonction: 'CTO',
    category: 'A',
    entreprise: 'FinServe Partners',
    numero: '+33 6 11 22 33 44',
    mail: 'elena.r@finserve.net',
    status: 'Qualifié',
    mailEnvoye: true,
    notes: 'Budget validé pour Q3.',
    scoreLead: 95,
  }
];

export const MOCK_CONSULTANTS: Consultant[] = [
  {
    id: 'c1',
    prenom: 'Jean',
    nom: 'Dupont',
    email: 'j.dupont@consult.com',
    specialite: 'Cloud Architecture',
    experience: 12,
    dateAjout: '2026-04-01T10:00:00Z'
  },
  {
    id: 'c2',
    prenom: 'Alice',
    nom: 'Vasseur',
    email: 'a.vasseur@consult.com',
    specialite: 'Data Science',
    experience: 8,
    dateAjout: '2026-04-05T09:00:00Z'
  }
];

export const MOCK_INTERVIEWS: ConsultantInterview[] = [
  {
    id: 'i1',
    consultantId: 'c1',
    consultantName: 'Jean Dupont',
    date: '2026-04-10T14:00:00Z',
    notes: 'Très bon profil technique, maîtrise AWS et GCP.',
    rating: 5,
    status: 'Réalisé'
  },
  {
    id: 'i2',
    consultantId: 'c2',
    consultantName: 'Alice Vasseur',
    date: '2026-04-12T11:00:00Z',
    notes: 'Niveau d\'expertise correct, mais manque d\'expérience sur Spark.',
    rating: 3,
    status: 'Réalisé'
  },
  {
    id: 'i3',
    consultantId: 'c1',
    consultantName: 'Jean Dupont',
    date: '2026-04-22T10:00:00Z',
    notes: 'Entretien final avec le client.',
    rating: 0,
    status: 'Programmé'
  }
];

export const MOCK_PMS: ProspectionMeeting[] = [
  {
    id: 'pm1',
    leadId: '1',
    leadName: 'Sarah Jenkins',
    date: '2026-04-25T14:30:00Z',
    location: 'Visio',
    notes: 'Présentation de la roadmap produit.',
    status: 'Prévu'
  },
  {
    id: 'pm2',
    leadId: '3',
    leadName: 'Elena Rodriguez',
    date: '2026-04-20T10:00:00Z',
    location: 'Physique',
    notes: 'Discussion sur le budget Q3.',
    status: 'Terminé'
  }
];
