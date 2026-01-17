import axios from 'axios';
import type { Run, Event, UserStats } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getRuns = async (userTokenHash: string = '', limit: number = 50): Promise<Run[]> => {
  const params = new URLSearchParams();
  if (userTokenHash) params.append('user_token_hash', userTokenHash);
  if (limit) params.append('limit', limit.toString());
  
  const response = await api.get<Run[]>(`/runs?${params.toString()}`);
  return response.data;
};

export const getRunTimeline = async (runId: string): Promise<Event[]> => {
  const response = await api.get<Event[]>(`/runs/${runId}`);
  return response.data;
};

export const getUserStats = async (userTokenHash: string): Promise<UserStats> => {
  const response = await api.get<UserStats>(`/stats/user/${userTokenHash}`);
  return response.data;
};

export default api;
