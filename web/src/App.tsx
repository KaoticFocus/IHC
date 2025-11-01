import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, Typography } from '@mui/material';
import { VoiceAssistant } from './components/VoiceAssistant';
import { TranscriptViewer } from './components/TranscriptViewer';
import { SettingsModal } from './components/SettingsModal';
import { LeadManagementScreen } from './components/LeadManagementScreen';
import { DocumentManager } from './components/DocumentManager';
import { AppLayout } from './components/AppLayout';
import { TooltipProvider } from './context/TooltipContext';
import StorageService from './services/StorageService';
import AudioService from './services/AudioService';

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

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState('main');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);

  // Load leads on startup
  useEffect(() => {
    const loadLeads = async () => {
      try {
        const savedLeads = await StorageService.getLeads();
        if (savedLeads) {
          setLeads(savedLeads);
        }
      } catch (error) {
        console.error('Failed to load leads:', error);
      }
    };
    loadLeads();
    
    // Load audio settings
    AudioService.loadSettings();
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
    
    try {
      const updatedLeads = await StorageService.saveLead(newLead);
      setLeads(updatedLeads);
      console.log('Lead created:', newLead);
      
      // Navigate to leads screen to show the new lead
      setCurrentScreen('leads');
    } catch (error) {
      console.error('Failed to save lead:', error);
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

        {currentScreen === 'transcripts' && (
          <TranscriptViewer />
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

