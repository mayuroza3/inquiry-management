import type { User } from '../types';
import { api } from './client';

export async function login(email: string, password: string): Promise<User> {
  const { data } = await api.post<{ user: User }>('/api/login', { email, password });
  return data.user;
}

export async function logout(): Promise<void> {
  await api.post('/api/logout');
}

export async function currentUser(): Promise<User> {
  const { data } = await api.get<{ user: User }>('/api/me');
  return data.user;
}
