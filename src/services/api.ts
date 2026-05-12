import { ProspectionMeeting } from '../types';

export const fetchPMs = async (): Promise<ProspectionMeeting[]> => {
  const response = await fetch('/api/pms');
  if (!response.ok) throw new Error('Failed to fetch PMs');
  return response.json();
};

export const createPM = async (data: Partial<ProspectionMeeting>): Promise<ProspectionMeeting> => {
  const response = await fetch('/api/pms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create PM');
  return response.json();
};

export const updatePM = async (id: string, data: Partial<ProspectionMeeting>): Promise<ProspectionMeeting> => {
  const response = await fetch(`/api/pms/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update PM');
  return response.json();
};

export const deletePM = async (id: string): Promise<void> => {
  const response = await fetch(`/api/pms/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete PM');
};
