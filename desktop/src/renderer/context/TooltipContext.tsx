import React, { createContext, useContext, useState, useEffect } from 'react';

interface TooltipContextType {
  tooltipsEnabled: boolean;
  setTooltipsEnabled: (enabled: boolean) => void;
}

const TooltipContext = createContext<TooltipContextType>({
  tooltipsEnabled: true,
  setTooltipsEnabled: () => {},
});

export const useTooltips = () => useContext(TooltipContext);

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tooltipsEnabled, setTooltipsEnabled] = useState(true);

  // Load tooltip preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tooltipsEnabled');
    if (saved !== null) {
      setTooltipsEnabled(JSON.parse(saved));
    }
  }, []);

  // Save tooltip preference to localStorage
  const handleSetTooltipsEnabled = (enabled: boolean) => {
    setTooltipsEnabled(enabled);
    localStorage.setItem('tooltipsEnabled', JSON.stringify(enabled));
  };

  return (
    <TooltipContext.Provider value={{ tooltipsEnabled, setTooltipsEnabled: handleSetTooltipsEnabled }}>
      {children}
    </TooltipContext.Provider>
  );
};
