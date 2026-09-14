import React, { createContext, useState, useMemo, useEffect, useContext } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { getTheme } from '../theme/theme';

const ThemeContext = createContext({
  mode: 'light',
  toggleTheme: () => {},
});

export const useThemeContext = () => useContext(ThemeContext);

export const ThemeContextProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode ? savedMode : 'light';
  });

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
