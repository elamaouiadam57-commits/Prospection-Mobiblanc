import { Consultant, ConsultantInterview, ProspectionMeeting } from '../types';

export const fetchConsultants = async (): Promise<Consultant[]> => {
  const response = await fetch('/api/consultants');
  if (!response.ok) throw new Error('Failed to fetch consultants');
  return response.json();
};

export const createConsultant = async (data: Partial<Consultant>): Promise<Consultant> => {
  const response = await fetch('/api/consultants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create consultant');
  return response.json();
};

export const updateConsultant = async (id: string, data: Partial<Consultant>): Promise<Consultant> => {
  const response = await fetch(`/api/consultants/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update consultant');
  return response.json();
};

export const deleteConsultant = async (id: string): Promise<void> => {
  const response = await fetch(`/api/consultants/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete consultant');
};

export const fetchInterviews = async (): Promise<ConsultantInterview[]> => {
  const response = await fetch('/api/interviews');
  if (!response.ok) throw new Error('Failed to fetch interviews');
  return response.json();
};

export const createInterview = async (data: Partial<ConsultantInterview>): Promise<ConsultantInterview> => {
  const response = await fetch('/api/interviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create interview');
  return response.json();
};

export const updateInterview = async (id: string, data: Partial<ConsultantInterview>): Promise<ConsultantInterview> => {
  const response = await fetch(`/api/interviews/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update interview');
  return response.json();
};

export const deleteInterview = async (id: string): Promise<void> => {
  const response = await fetch(`/api/interviews/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete interview');
};
