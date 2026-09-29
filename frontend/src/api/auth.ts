import type { User } from '../types';
import { api } from './client';

export async function login(email: string, password: string): Promise<User> {
  const { data } = await api.post<{ user: User }>('/api/login', { email, password });
  return data.user;
}

export async function register(payload: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role?: string;
}): Promise<{ user: User; message: string }> {
  const { data } = await api.post<{ user: User; message: string }>('/api/register', payload);
  return data;
}

export async function forgotPassword(email: string): Promise<{ message: string; reset_url?: string | null }> {
  const { data } = await api.post<{ message: string; reset_url?: string | null }>('/api/forgot-password', { email });
  return data;
}

export async function resetPassword(payload: {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>('/api/reset-password', payload);
  return data;
}

export async function logout(): Promise<void> {
  await api.post('/api/logout');
}

export async function currentUser(): Promise<User> {
  const { data } = await api.get<{ user: User }>('/api/me');
  return data.user;
}
