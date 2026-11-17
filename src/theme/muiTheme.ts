import { createTheme, type Theme } from '@mui/material/styles';

const SURFACE = {
  light: { page: '#fafaf9', paper: '#ffffff', border: 'rgba(9, 9, 11, 0.08)' },
  dark: { page: '#101012', paper: '#17171a', border: 'rgba(255, 255, 255, 0.08)' },
};

export function buildMuiTheme(mode: 'light' | 'dark'): Theme {
  const surface = SURFACE[mode];
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: { main: '#2563eb', dark: '#1d4ed8', light: '#3b82f6' },
      error: { main: '#dc2626', dark: '#b91c1c' },
      success: { main: isDark ? '#34d399' : '#047857' },
      warning: { main: isDark ? '#fbbf24' : '#b45309' },
      background: { default: surface.page, paper: surface.paper },
      text: {
        primary: isDark ? '#f4f4f5' : '#18181b',
        secondary: isDark ? '#a1a1aa' : '#71717a',
      },
      divider: surface.border,
    },

    shape: { borderRadius: 8 },

    typography: {
      fontFamily: 'inherit',
      button: { textTransform: 'none', fontWeight: 500 },
    },

    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 8, paddingInline: 16 },
        },
      },

      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none', borderColor: surface.border },
        },
      },

      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            border: `1px solid ${surface.border}`,
            backgroundColor: surface.paper,
          },
        },
      },

      MuiTooltip: {
        defaultProps: { arrow: true },
      },

      MuiChip: {
        styleOverrides: { root: { fontWeight: 500 } },
      },

      MuiTextField: {
        defaultProps: { variant: 'standard' },
      },

      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: 14,
            '&.Mui-focused': { color: isDark ? '#f4f4f5' : '#18181b' },
          },
        },
      },

      MuiInput: {
        styleOverrides: {
          root: { fontSize: 14 },
          underline: {
            '&:before': { borderBottomColor: surface.border },
            '&:hover:not(.Mui-disabled, .Mui-error):before': {
              borderBottomColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(9,9,11,0.3)',
            },
            '&:after': { borderBottomColor: isDark ? '#f4f4f5' : '#18181b' },
          },
        },
      },

      MuiFormHelperText: {
        styleOverrides: {
          root: { marginLeft: 0, fontSize: 12 },
        },
      },

      MuiSkeleton: {
        defaultProps: { animation: 'wave' },
        styleOverrides: {
          root: { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(9,9,11,0.06)' },
        },
      },
    },
  });
}
