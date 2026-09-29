import Box from '@mui/material/Box';
import MuiPagination from '@mui/material/Pagination';

export function Pagination({
  page,
  count,
  onChange,
}: {
  page: number;
  count: number;
  onChange: (page: number) => void;
}) {
  if (count <= 1) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
      <MuiPagination color="primary" page={page} count={count} onChange={(_, value) => onChange(value)} />
    </Box>
  );
}
