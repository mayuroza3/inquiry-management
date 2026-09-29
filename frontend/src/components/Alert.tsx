import MuiAlert from '@mui/material/Alert';

export function Alert({
  severity = 'error',
  children,
}: {
  severity?: 'error' | 'success' | 'info' | 'warning';
  children: string;
}) {
  return (
    <MuiAlert severity={severity} sx={{ mb: 2 }}>
      {children}
    </MuiAlert>
  );
}
