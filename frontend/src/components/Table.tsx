import Paper from '@mui/material/Paper';
import MuiTable from '@mui/material/Table';
import TableContainer from '@mui/material/TableContainer';
import type { ReactNode } from 'react';

export { TableBody, TableCell, TableHead, TableRow } from '@mui/material';

export function Table({ children }: { children: ReactNode }) {
  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        border: '1px solid #e8ecf1',
        borderRadius: '20px',
        boxShadow: '0 10px 30px rgba(16, 24, 40, 0.04)',
        overflow: 'auto',
      }}
    >
      <MuiTable>{children}</MuiTable>
    </TableContainer>
  );
}
