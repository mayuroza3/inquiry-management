import { createTheme } from '@mui/material/styles';

const red = '#f1414f';
const redDark = '#c4333f';
const rose = '#fff1f2';
const ink = '#333333';

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: red, dark: redDark, light: '#ff8a92', contrastText: '#ffffff' },
    secondary: { main: red },
    background: { default: '#fff8f8', paper: '#ffffff' },
    text: { primary: ink, secondary: '#767676' },
    divider: '#e6e6e6',
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Ubuntu", "Segoe UI", sans-serif',
    h3: { fontFamily: '"Montserrat", "Segoe UI", sans-serif', fontWeight: 700, letterSpacing: '-0.03em', color: red },
    h4: { fontFamily: '"Montserrat", "Segoe UI", sans-serif', fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.03em', color: red },
    h5: { fontFamily: '"Montserrat", "Segoe UI", sans-serif', fontWeight: 700, letterSpacing: '-0.02em', color: red },
    h6: { fontFamily: '"Montserrat", "Segoe UI", sans-serif', fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em', color: red },
    button: { fontFamily: '"Ubuntu", "Segoe UI", sans-serif', textTransform: 'none', fontWeight: 500, letterSpacing: '0.01em' },
    body1: { letterSpacing: '0.01em' },
    body2: { letterSpacing: '0.01em' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { fontFamily: '"Ubuntu", "Segoe UI", sans-serif', backgroundColor: '#fff8f8', color: ink },
        a: { color: red },
        'a:hover': { color: redDark },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { boxShadow: 'none', borderRadius: 20 },
        contained: {
          backgroundColor: red,
          '&:hover': { backgroundColor: redDark, boxShadow: 'none' },
        },
        outlined: {
          borderColor: red,
          color: red,
          '&:hover': { borderColor: red, backgroundColor: rose },
        },
        text: {
          color: red,
          '&:hover': { backgroundColor: rose },
        },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 8, backgroundColor: '#fff' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 12 },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: { color: red, '&:hover': { color: redDark } },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: '#eef1f4', padding: '14px 16px', fontFamily: '"Ubuntu", "Segoe UI", sans-serif' },
        head: {
          color: '#767676',
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          backgroundColor: '#fff8f8',
        },
      },
    },
  },
});
