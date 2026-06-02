import { createContext, useContext } from 'react';
import { getSidebarAccent } from './sidebar-accent';

const SidebarThemeContext = createContext(getSidebarAccent('brand'));

export function SidebarThemeProvider({ accent = 'brand', profilePath = '/profile', children }) {
  return (
    <SidebarThemeContext.Provider value={{ accent: getSidebarAccent(accent), profilePath }}>
      {children}
    </SidebarThemeContext.Provider>
  );
}

export function useSidebarTheme() {
  return useContext(SidebarThemeContext);
}
