import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'flex-end' }, gap: 2, flexWrap: 'wrap' }}>
      <Box>
        <Typography variant="h4">{title}</Typography>
        {subtitle && (
          <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 560 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions}
    </Box>
  );
}
