import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { api } from '../api/client';
import { inquiryHref } from '../access';
import { Alert } from '../components/Alert';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { formatWhen, type Activity, type PageMeta } from '../types';

export function ActivityPage() {
  const [rows, setRows] = useState<Activity[]>([]);
  const [meta, setMeta] = useState<PageMeta>({ current_page: 1, last_page: 1, per_page: 20, total: 0 });
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<{ data: Activity[]; meta: PageMeta }>('/api/activities', { params: { page } })
      .then((response) => {
        setRows(response.data.data);
        setMeta(response.data.meta);
        setError('');
      })
      .catch(() => setError('Activity could not be loaded.'));
  }, [page]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <PageHeader
        title="Activity"
        subtitle="Status changes, notes, comments, reminders, assignments, and account updates."
      />
      {error && <Alert severity="error">{error}</Alert>}
      <Card>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {rows.map((item, index) => (
            <Box key={item.id} sx={{ display: 'grid', gridTemplateColumns: '16px 1fr', gap: 1.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#f1414f', mt: 0.6 }} />
                {index < rows.length - 1 && <Box sx={{ width: 2, flexGrow: 1, bgcolor: '#f7c1c6', my: 0.5 }} />}
              </Box>
              <Box sx={{ pb: 2 }}>
                <Typography sx={{ fontWeight: 650 }}>{item.summary}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.user?.name || 'System'} · {formatWhen(item.created_at)}
                  {item.inquiry && (
                    <>
                      {' · '}
                      <RouterLink to={inquiryHref(item.inquiry)}>{item.inquiry.contact_name}</RouterLink>
                    </>
                  )}
                </Typography>
              </Box>
            </Box>
          ))}
          {rows.length === 0 && !error && <Typography color="text.secondary">Nothing has been recorded yet.</Typography>}
        </Box>
        <Pagination page={meta.current_page} count={meta.last_page} onChange={setPage} />
      </Card>
    </Box>
  );
}
