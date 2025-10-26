import React, { useState } from 'react';
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

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState('main');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleScreenChange = (screen: string) => {
    setCurrentScreen(screen);
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
            <VoiceAssistant currentScreen={currentScreen} />
            <TranscriptViewer />
          </Box>
        )}
        
        {currentScreen === 'leads' && (
          <LeadManagementScreen />
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