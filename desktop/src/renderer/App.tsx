import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, Typography } from '@mui/material';
import { VoiceAssistant } from './components/VoiceAssistant';
import { TranscriptViewer } from './components/TranscriptViewer';
import { SettingsModal } from './components/SettingsModal';
import { LeadManagementScreen } from './components/LeadManagementScreen';
import { DocumentManager } from './components/DocumentManager';
import { AppLayout } from './components/AppLayout';
import { TooltipProvider } from './context/TooltipContext';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

const { ipcRenderer } = window.require('electron');

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState('main');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);

  // Load leads on startup
  useEffect(() => {
    const loadLeads = async () => {
      const savedLeads = await ipcRenderer.invoke('get-leads');
      if (savedLeads) {
        setLeads(savedLeads);
      }
    };
    loadLeads();
  }, []);

  const handleScreenChange = (screen: string) => {
    setCurrentScreen(screen);
  };

  const handleCreateLead = async (leadData: any) => {
    const newLead = {
      id: Date.now().toString(),
      ...leadData,
      createdAt: new Date().toISOString(),
    };
    
    const result = await ipcRenderer.invoke('save-lead', newLead);
    if (result.success) {
      setLeads(result.leads);
      console.log('Lead created:', newLead);
      
      // Navigate to leads screen to show the new lead
      setCurrentScreen('leads');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <TooltipProvider>
        <AppLayout
          onScreenChange={handleScreenChange}
          onSettingsClick={() => setSettingsOpen(true)}
        >
        {currentScreen === 'main' && (
          <Box>
            <Typography variant="h4" gutterBottom>
              Welcome to IHC Conversation Recorder
            </Typography>
            <VoiceAssistant 
              currentScreen={currentScreen}
              onNavigate={handleScreenChange}
              onCreateLead={handleCreateLead}
            />
            <TranscriptViewer />
          </Box>
        )}
        
        {currentScreen === 'leads' && (
          <>
            <LeadManagementScreen leads={leads} />
            <VoiceAssistant 
              currentScreen={currentScreen}
              onNavigate={handleScreenChange}
              onCreateLead={handleCreateLead}
            />
          </>
        )}

        {currentScreen === 'documents' && (
          <DocumentManager />
        )}

          <SettingsModal
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
          />
        </AppLayout>
      </TooltipProvider>
    </ThemeProvider>
  );
};