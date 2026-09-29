import Box from '@mui/material/Box';
import { STATUS_LABELS } from '../types';

const TONES: Record<string, { bg: string; color: string }> = {
  new: { bg: '#fff1f2', color: '#f1414f' },
  contacted: { bg: '#fff1f2', color: '#f1414f' },
  pending: { bg: '#fff4e5', color: '#9a6700' },
  qualified: { bg: '#fff1f2', color: '#f1414f' },
  won: { bg: '#f1414f', color: '#fff' },
  lost: { bg: '#fff1f2', color: '#f1414f' },
};

export function Badge({ status }: { status: string }) {
  const tone = TONES[status] ?? { bg: '#f2f4f7', color: '#475467' };

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        px: 1.1,
        py: 0.35,
        borderRadius: 999,
        bgcolor: tone.bg,
        color: tone.color,
        fontSize: 12,
        fontWeight: 650,
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}
    >
      {STATUS_LABELS[status] ?? status}
    </Box>
  );
}
