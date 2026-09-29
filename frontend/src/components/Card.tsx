import Box from '@mui/material/Box';
import MuiCard from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { surfaceMotion } from '../theme/motion';

export function Card({
  title,
  icon,
  children,
  action,
}: {
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <MuiCard
      elevation={0}
      sx={{
        border: '1px solid #e8ecf1',
        borderRadius: '20px',
        boxShadow: '0 10px 30px rgba(16, 24, 40, 0.04)',
        height: '100%',
        ...surfaceMotion(),
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        {(title || action) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            {(title || icon) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#f1414f' }}>
                {icon}
                {title && <Typography variant="h6">{title}</Typography>}
              </Box>
            )}
            {action}
          </div>
        )}
        {children}
      </CardContent>
    </MuiCard>
  );
}
