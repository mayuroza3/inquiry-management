import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState, type FormEvent, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ROLE_LABELS } from '../types';
import { Initials } from './Initials';

const navSx = {
  borderRadius: 2.5,
  mb: 0.4,
  color: '#333333',
  py: 1,
  '& .MuiListItemIcon-root': { color: '#767676', minWidth: 36 },
  '&:hover': { bgcolor: '#fff5f6', color: '#f1414f' },
  '&.active': {
    bgcolor: '#fff5f6',
    color: '#f1414f',
    '& .MuiListItemIcon-root': { color: '#f1414f' },
  },
};

export function AdminShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const links = [
    { to: '/admin', label: 'Dashboard', icon: <DashboardOutlinedIcon fontSize="small" />, end: true },
    { to: '/admin/inquiries', label: 'Inquiries', icon: <AssignmentOutlinedIcon fontSize="small" />, end: false },
    { to: '/admin/activity', label: 'Activity', icon: <HistoryOutlinedIcon fontSize="small" />, end: false },
  ];

  if (user?.role === 'admin') {
    links.push({ to: '/admin/users', label: 'Team', icon: <PeopleOutlineIcon fontSize="small" />, end: false });
  }

  function search(event: FormEvent) {
    event.preventDefault();
    const term = query.trim();
    navigate(term ? `/admin/inquiries?search=${encodeURIComponent(term)}` : '/admin/inquiries');
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fff1f2', p: { xs: 0, md: 1.5 } }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: { xs: '100vh', md: 'calc(100vh - 24px)' },
          bgcolor: '#fff8f8',
          borderRadius: { xs: 0, md: '28px' },
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(16, 24, 40, 0.08)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            px: { xs: 2, md: 3 },
            py: 1,
            bgcolor: '#333333',
            color: '#fff',
          }}
        >
          <Typography sx={{ fontSize: 14, fontWeight: 400, color: '#fff' }}>Savit Interactive</Typography>
          <Typography sx={{ fontSize: 14, color: '#fff', display: { xs: 'none', sm: 'block' } }}>Inquiry Management Portal</Typography>
        </Box>
        <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Box
          component="nav"
          sx={{
            width: 236,
            flexShrink: 0,
            bgcolor: '#fff',
            borderRight: '1px solid #eef1f4',
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            py: 2.5,
            px: 1.5,
          }}
        >
          <Box component={NavLink} to="/admin" sx={{ display: 'flex', justifyContent: 'center', px: 1, mb: 3, lineHeight: 0 }}>
            <Box component="img" src="/savit-logo.svg" alt="Savit" sx={{ height: 68, width: 'auto' }} />
          </Box>
          <SectionLabel>Menu</SectionLabel>
          <List sx={{ px: 0.5 }}>
            {links.map((link) => (
              <ListItemButton key={link.to} component={NavLink} to={link.to} end={link.end} sx={navSx}>
                <ListItemIcon>{link.icon}</ListItemIcon>
                <ListItemText primary={link.label} primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} />
              </ListItemButton>
            ))}
          </List>
          <Box sx={{ flexGrow: 1 }} />
          <SectionLabel>Account</SectionLabel>
          <List sx={{ px: 0.5 }}>
            <ListItemButton onClick={() => logout()} sx={navSx}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Log out" primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} />
            </ListItemButton>
          </List>
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: { xs: 2, md: 3 },
              height: 76,
              borderBottom: '1px solid #eef1f4',
            }}
          >
            <Box component="form" onSubmit={search} sx={{ flex: 1, display: 'flex', justifyContent: { xs: 'stretch', md: 'center' } }}>
              <TextField
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, email, or company"
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: '#98a2b3' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  maxWidth: 560,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 8,
                    bgcolor: '#fff',
                    minHeight: 44,
                    pl: 0.75,
                    boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
                  },
                }}
              />
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                bgcolor: '#fff',
                border: '1px solid #e8ecf1',
                borderRadius: 999,
                pl: 0.5,
                pr: 0.75,
                py: 0.4,
                boxShadow: '0 8px 20px rgba(16, 24, 40, 0.04)',
                flexShrink: 0,
              }}
            >
              <Box
                component={NavLink}
                to="/admin/profile"
                sx={{ display: 'flex', alignItems: 'center', gap: 1.1, textDecoration: 'none', color: 'inherit', pl: 0.75, pr: 0.75, py: 0.25, minWidth: 0 }}
              >
                <Initials name={user?.name || 'User'} size={34} solid />
                <Box sx={{ minWidth: 0, display: { xs: 'none', sm: 'block' } }}>
                  <Typography variant="body2" noWrap sx={{ fontWeight: 700, lineHeight: 1.2 }}>{user?.name}</Typography>
                  <Typography variant="caption" noWrap sx={{ display: 'block', color: '#f1414f', fontWeight: 500 }}>
                    {user ? ROLE_LABELS[user.role] : ''}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              gap: 1,
              px: 2,
              pb: 1,
              overflow: 'auto',
            }}
          >
            {links.map((link) => (
              <Box
                key={link.to}
                component={NavLink}
                to={link.to}
                end={link.end}
                sx={{
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 999,
                  textDecoration: 'none',
                  color: '#3f4b59',
                  bgcolor: '#fff',
                  border: '1px solid #e8ecf1',
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  '&.active': { bgcolor: '#fff5f6', color: '#f1414f', borderColor: '#f1414f' },
                }}
              >
                {link.label}
              </Box>
            ))}
            <Box
              component="button"
              onClick={() => logout()}
              sx={{
                px: 1.5,
                py: 0.75,
                borderRadius: 999,
                color: '#3f4b59',
                bgcolor: '#fff',
                border: '1px solid #e8ecf1',
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              Log out
            </Box>
          </Box>
          <Box component="main" sx={{ flexGrow: 1, px: { xs: 2, md: 3 }, pb: 3, minWidth: 0 }}>
            <Outlet />
          </Box>
        </Box>
        </Box>
      </Box>
    </Box>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Typography variant="caption" sx={{ px: 1.5, pb: 0.75, color: '#98a2b3', letterSpacing: '0.08em', fontWeight: 700 }}>
      {String(children).toUpperCase()}
    </Typography>
  );
}
