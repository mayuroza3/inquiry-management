import { keyframes } from '@mui/material/styles';

export const riseIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: none; }
`;

export const growX = keyframes`
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
`;

export function surfaceMotion(delay = 0) {
  return {
    animation: `${riseIn} 0.55s ease both`,
    animationDelay: `${delay}ms`,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
      transition: 'none',
    },
    '&:hover': {
      transform: 'translateY(-3px)',
      boxShadow: '0 16px 34px rgba(241, 65, 79, 0.14)',
    },
  };
}
