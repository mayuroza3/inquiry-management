import Avatar from '@mui/material/Avatar';

export function Initials({ name, size = 36, solid = false }: { name: string; size?: number; solid?: boolean }) {
  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        bgcolor: solid ? '#f1414f' : '#fff1f2',
        color: solid ? '#fff' : '#f1414f',
        fontWeight: 700,
        fontSize: Math.max(12, size * 0.38),
      }}
    >
      {name.trim().slice(0, 1).toUpperCase() || '?'}
    </Avatar>
  );
}
