import NorthEastIcon from '@mui/icons-material/NorthEast';
import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/client';
import { inquiryHref } from '../access';
import { Alert } from '../components/Alert';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { Initials } from '../components/Initials';
import { PageHeader } from '../components/PageHeader';
import { growX, surfaceMotion } from '../theme/motion';
import { STATUS_LABELS, formatWhen, type Activity, type Inquiry, type PageMeta, type Reminder } from '../types';

interface Comparison {
  current: number;
  previous: number;
  growth: number | null;
}

interface Stats {
  days: number;
  total: number;
  open: number;
  pending: number;
  closed: number;
  by_status: Record<string, number>;
  received: Comparison;
  closures: Comparison;
  pending_marked: Comparison;
  series: { label: string; current: number; previous: number }[];
}

const PERIODS = [7, 30, 90] as const;
const STATUS_ORDER = ['new', 'contacted', 'pending', 'qualified', 'won', 'lost'];

export function DashboardPage() {
  const [days, setDays] = useState<(typeof PERIODS)[number]>(30);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Inquiry[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [weekReminders, setWeekReminders] = useState<Reminder[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<Stats>('/api/inquiries/stats', { params: { days } })
      .then((response) => {
        setStats(response.data);
        setError('');
      })
      .catch(() => setError('Could not load dashboard metrics.'));
  }, [days]);

  useEffect(() => {
    Promise.all([
      api.get<{ data: Inquiry[]; meta: PageMeta }>('/api/inquiries', { params: { per_page: 5 } }),
      api.get<{ data: Activity[] }>('/api/activities', { params: { per_page: 5 } }),
      api.get<{ data: Reminder[] }>('/api/reminders'),
    ])
      .then(([inquiries, activities, reminders]) => {
        setRecent(inquiries.data.data);
        setActivity(activities.data.data);
        setWeekReminders(reminders.data.data);
      })
      .catch(() => undefined);
  }, []);

  const pipelineMax = Math.max(1, ...Object.values(stats?.by_status ?? {}));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <PageHeader
        title="Dashboard"
        subtitle="Plan the pipeline, see what moved, and pick up the next inquiry."
        actions={
          <ToggleButtonGroup
            exclusive
            size="small"
            value={days}
            onChange={(_, value) => { if (value) setDays(value); }}
            sx={{ bgcolor: '#fff', borderRadius: 999, '& .MuiToggleButton-root': { border: 0, borderRadius: 999, px: 1.5, textTransform: 'none' } }}
          >
            {PERIODS.map((period) => (
              <ToggleButton key={period} value={period}>{period}d</ToggleButton>
            ))}
          </ToggleButtonGroup>
        }
      />
      {error && <Alert>{error}</Alert>}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', xl: '1.15fr 1fr 1fr 1fr' } }}>
        <MetricCard featured label="Received" value={stats?.received.current} comparison={stats?.received} hint={`Previous ${days} days`} delay={0} />
        <MetricCard label="Open now" value={stats?.open} hint="New, contacted, and qualified" delay={70} />
        <MetricCard label="Pending" value={stats?.pending} comparison={stats?.pending_marked} hint="Marked pending this period" delay={140} />
        <MetricCard label="Closed" value={stats?.closed} comparison={stats?.closures} hint="Won or lost this period" delay={210} />
      </Box>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1.6fr 1fr' } }}>
        <Card title="Inquiries received" action={<Typography variant="caption" color="text.secondary">This period vs previous</Typography>}>
          <Box sx={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.series ?? []}>
                <CartesianGrid stroke="#eef1f4" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#98a2b3' }} interval="preserveStartEnd" axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} width={28} tick={{ fontSize: 12, fill: '#98a2b3' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="previous" name="Previous" stroke="#e7b4b8" fill="#fff8f8" strokeWidth={2} animationDuration={900} animationEasing="ease-out" />
                <Area type="monotone" dataKey="current" name="This period" stroke="#f1414f" fill="#fff1f2" strokeWidth={2.5} animationDuration={1100} animationEasing="ease-out" />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Card>
        <Card title="Pipeline">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
            {STATUS_ORDER.map((status, index) => {
              const count = stats?.by_status?.[status] ?? 0;
              return (
                <Box key={status}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{STATUS_LABELS[status]}</Typography>
                    <Typography variant="body2" color="text.secondary">{count}</Typography>
                  </Box>
                  <Box sx={{ height: 8, borderRadius: 999, bgcolor: '#f2f4f7', overflow: 'hidden' }}>
                    <Box
                      sx={{
                        width: `${(count / pipelineMax) * 100}%`,
                        height: '100%',
                        borderRadius: 999,
                        bgcolor: '#f1414f',
                        opacity: status === 'lost' ? 0.45 : 1,
                        transformOrigin: 'left center',
                        animation: `${growX} 0.7s ease both`,
                        animationDelay: `${index * 70}ms`,
                        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                      }}
                    />
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Card>
      </Box>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', xl: '0.95fr 1.25fr 1fr' } }}>
        <WeekCard reminders={weekReminders} />
        <Card title="Latest inquiries" action={<RouterLink to="/admin/inquiries">View all</RouterLink>}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
            {recent.map((inquiry) => (
              <Box key={inquiry.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Initials name={inquiry.contact_name} size={40} />
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography component={RouterLink} to={inquiryHref(inquiry)} sx={{ fontWeight: 650, color: 'inherit', textDecoration: 'none', display: 'block' }} noWrap>
                    {inquiry.contact_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {inquiry.company || inquiry.email}
                  </Typography>
                </Box>
                <Badge status={inquiry.status} />
              </Box>
            ))}
            {recent.length === 0 && <Typography color="text.secondary">No inquiries yet.</Typography>}
          </Box>
        </Card>
        <Card title="Recent activity" action={<RouterLink to="/admin/activity">Open log</RouterLink>}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
            {activity.map((item) => (
              <Box key={item.id}>
                <Typography variant="body2" sx={{ fontWeight: 650 }}>{item.summary}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.user?.name || 'System'} · {formatWhen(item.created_at)}
                  {item.inquiry ? ` · ${item.inquiry.contact_name}` : ''}
                </Typography>
              </Box>
            ))}
            {activity.length === 0 && <Typography color="text.secondary">Nothing has been recorded yet.</Typography>}
          </Box>
        </Card>
      </Box>
    </Box>
  );
}

function MetricCard({
  label,
  value,
  comparison,
  hint,
  featured = false,
  delay = 0,
}: {
  label: string;
  value?: number;
  comparison?: Comparison;
  hint: string;
  featured?: boolean;
  delay?: number;
}) {
  return (
    <Box
      sx={{
        borderRadius: '20px',
        p: 2.5,
        minHeight: 148,
        color: featured ? '#fff' : 'text.primary',
        background: featured ? '#f1414f' : '#fff',
        border: featured ? 0 : '1px solid #e8ecf1',
        boxShadow: '0 10px 30px rgba(16, 24, 40, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        ...surfaceMotion(delay),
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ color: featured ? 'rgba(255,255,255,0.82)' : 'text.secondary', fontWeight: 600 }}>
          {label}
        </Typography>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            bgcolor: featured ? 'rgba(255,255,255,0.16)' : '#fff1f2',
            color: featured ? '#fff' : '#f1414f',
          }}
        >
          <NorthEastIcon sx={{ fontSize: 16 }} />
        </Box>
      </Box>
      <Typography sx={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.15, mt: 1.5 }}>
        {value ?? '—'}
      </Typography>
      <Box sx={{ mt: 'auto', pt: 1.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        {comparison && <Growth value={comparison.growth} featured={featured} />}
        <Typography variant="caption" sx={{ color: featured ? 'rgba(255,255,255,0.78)' : 'text.secondary' }}>{hint}</Typography>
      </Box>
    </Box>
  );
}

function Growth({ value, featured }: { value: number | null; featured?: boolean }) {
  const label = value === null ? 'New' : `${value > 0 ? '+' : ''}${value}%`;
  const negative = value !== null && value < 0;

  return (
    <Box
      component="span"
      sx={{
        px: 1,
        py: 0.25,
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        bgcolor: featured ? 'rgba(255,255,255,0.18)' : '#fff1f2',
        color: featured ? '#fff' : negative ? '#c4333f' : '#f1414f',
      }}
    >
      {label}
    </Box>
  );
}

function WeekCard({ reminders }: { reminders: Reminder[] }) {
  return (
    <Box
      sx={{
        borderRadius: '20px',
        border: '1px solid #f7c1c6',
        bgcolor: '#fff',
        boxShadow: '0 10px 30px rgba(241, 65, 79, 0.08)',
        overflow: 'hidden',
        height: '100%',
        ...surfaceMotion(40),
      }}
    >
      <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#fff1f2' }}>
        <Typography sx={{ fontWeight: 700, color: '#f1414f' }}>This week</Typography>
        <Typography variant="caption" sx={{ color: '#9a3b42' }}>Open reminders due before Sunday.</Typography>
      </Box>
      <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {reminders.map((item) => {
          const due = new Date(item.remind_at).getTime() <= Date.now();
          return (
            <Box key={item.id} sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: due ? '#c4333f' : '#f1414f', mt: 0.7, flexShrink: 0 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.message}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {due ? 'Due' : 'Scheduled'} · {formatWhen(item.remind_at)}
                  {item.inquiry && (
                    <>
                      {' · '}
                      <RouterLink to={inquiryHref(item.inquiry, '#reminders')}>{item.inquiry.contact_name}</RouterLink>
                    </>
                  )}
                </Typography>
              </Box>
            </Box>
          );
        })}
        {reminders.length === 0 && <Typography color="text.secondary">Nothing is due this week.</Typography>}
      </Box>
    </Box>
  );
}
