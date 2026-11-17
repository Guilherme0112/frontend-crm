import { useMemo, type ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { useTheme } from './ThemeContext';
import { buildMuiTheme } from './muiTheme';

export function MuiThemeBridge({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const theme = useMemo(() => buildMuiTheme(resolvedTheme), [resolvedTheme]);

  return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>;
}
