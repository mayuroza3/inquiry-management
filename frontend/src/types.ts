import type { AccessGrant } from './access';

export type Role = 'admin' | 'sales_manager' | 'sales';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  manager_id: number | null;
  manager?: { id: number; name: string } | null;
  created_at?: string;
  access?: AccessGrant | null;
}

export interface Note {
  id: number;
  body: string;
  created_at: string;
  user?: { id: number; name: string } | null;
}

export interface Activity {
  id: number;
  action: string;
  summary: string;
  created_at: string;
  user?: { id: number; name: string } | null;
  inquiry?: { id: number; contact_name: string; access?: AccessGrant | null } | null;
}

export interface Reminder {
  id: number;
  message: string;
  remind_at: string;
  is_completed: boolean;
  user?: { id: number; name: string } | null;
  inquiry?: { id: number; contact_name: string; access?: AccessGrant | null } | null;
  access?: AccessGrant | null;
}

export interface Attachment {
  id: number;
  original_name: string;
  mime_type: string | null;
  size: number | null;
  access?: AccessGrant | null;
}

export interface Inquiry {
  id: number;
  contact_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string;
  status: string;
  assigned_to: number | null;
  assignee?: { id: number; name: string; email: string; role: Role } | null;
  lead_source_id: number | null;
  lead_source?: { id: number; name: string } | null;
  notes?: Note[];
  comments?: Note[];
  activities?: Activity[];
  reminders?: Reminder[];
  attachments?: Attachment[];
  created_at: string;
  access?: AccessGrant | null;
}

export interface LeadSource {
  id: number;
  name: string;
}

export interface PageMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export const STATUSES = ['new', 'contacted', 'pending', 'qualified', 'won', 'lost'] as const;

export const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  pending: 'Pending',
  qualified: 'Qualified',
  won: 'Won',
  lost: 'Lost',
};

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  sales_manager: 'Sales manager',
  sales: 'Sales',
};

export function formatWhen(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
