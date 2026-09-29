import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { api } from '../api/client';
import { withAccess } from '../access';
import { useAuth } from '../auth/AuthContext';
import { Alert } from '../components/Alert';
import { Initials } from '../components/Initials';
import { PageHeader } from '../components/PageHeader';
import { FormInput } from '../components/FormInput';
import { Modal } from '../components/Modal';
import { Select } from '../components/Select';
import { Table, TableBody, TableCell, TableHead, TableRow } from '../components/Table';
import { ROLE_LABELS, type Role, type User } from '../types';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'sales' as Role,
  manager_id: '',
};

export function UsersPage() {
  const { user: current } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    const response = await api.get<{ data: User[] }>('/api/users');
    setUsers(response.data.data);
  }

  useEffect(() => {
    load().catch(() => setError('Could not load users.'));
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(user: User) {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      manager_id: user.manager_id ? String(user.manager_id) : '',
    });
    setOpen(true);
  }

  async function save() {
    const nameOk = /^[\p{L}][\p{L}\p{M} .'-]*$/u.test(form.name.trim());
    const emailOk = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(form.email.trim());
    if (!nameOk) {
      setError('Name can use letters, spaces, apostrophes, hyphens, and periods only.');
      return;
    }
    if (!emailOk) {
      setError('Enter a valid email.');
      return;
    }
    if (form.password && form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      manager_id: form.manager_id ? Number(form.manager_id) : null,
      ...(form.password ? { password: form.password } : {}),
    };

    try {
      if (editing) {
        await api.patch(withAccess(`/api/users/${editing.id}`, editing.access), payload);
      } else {
        await api.post('/api/users', payload);
      }
      setError('');
      setOpen(false);
      await load();
    } catch (caught) {
      if (axios.isAxiosError(caught) && caught.response?.status === 422) {
        const errors = (caught.response.data?.errors ?? {}) as Record<string, string[]>;
        const first = Object.values(errors).flat()[0];
        setError(typeof first === 'string' ? first : 'Check the member details and try again.');
        return;
      }
      setError('Could not save that team member.');
    }
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Team"
        subtitle="Admins, managers, and sales people who can own an inquiry."
        actions={<Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Add member</Button>}
      />
      {error && <Alert>{error}</Alert>}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Manager</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Initials name={user.name} />
                  <Typography sx={{ fontWeight: 700 }}>{user.name}</Typography>
                </Box>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Box component="span" sx={{ px: 1.1, py: 0.35, borderRadius: 999, bgcolor: '#fff1f2', color: '#f1414f', fontSize: 12, fontWeight: 700 }}>
                  {ROLE_LABELS[user.role]}
                </Box>
              </TableCell>
              <TableCell>{user.manager?.name || '—'}</TableCell>
              <TableCell align="right">
                <Button onClick={() => openEdit(user)}>Edit</Button>
                {current?.id !== user.id && (
                  <Button
                    color="error"
                    onClick={async () => {
                      await api.delete(withAccess(`/api/users/${user.id}`, user.access));
                      await load();
                    }}
                  >
                    Delete
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Modal open={open} title={editing ? 'Edit user' : 'Add user'} onClose={() => setOpen(false)}>
        <FormInput label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <FormInput label="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <FormInput
          label={editing ? 'New password' : 'Password'}
          type="password"
          value={form.password}
          helperText={editing ? 'Leave blank to keep the current password.' : 'At least 8 characters.'}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />
        <Select
          label="Role"
          value={form.role}
          options={(Object.keys(ROLE_LABELS) as Role[]).map((role) => ({ value: role, label: ROLE_LABELS[role] }))}
          onChange={(event) => setForm({ ...form, role: event.target.value as Role })}
        />
        <Select
          label="Manager"
          value={form.manager_id}
          allowEmpty
          emptyLabel="No manager"
          options={users.filter((user) => user.id !== editing?.id).map((user) => ({ value: user.id, label: user.name }))}
          onChange={(event) => setForm({ ...form, manager_id: String(event.target.value) })}
        />
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => save().catch(() => setError('Could not save that user. Check the fields and try again.'))}
        >
          Save
        </Button>
      </Modal>
    </Stack>
  );
}
