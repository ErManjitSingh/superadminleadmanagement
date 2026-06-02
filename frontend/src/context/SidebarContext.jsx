import { createContext, useContext, useEffect, useState } from 'react';

const SidebarContext = createContext(null);

const STORAGE_KEY = 'uno-sidebar-collapsed';

export function SidebarProvider({ children }) {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  const toggleCollapsed = () => setCollapsed((prev) => !prev);
  const effectiveCollapsed = mobileOpen ? false : collapsed;

  return (
    <SidebarContext.Provider
      value={{
        collapsed: effectiveCollapsed,
        rawCollapsed: collapsed,
        setCollapsed,
        toggleCollapsed,
        mobileOpen,
        setMobileOpen,
        expandedWidth: 288,
        collapsedWidth: 80,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}
