import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  IconButton,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Collapse,
  Fade,
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  History as HistoryIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import VoiceAssistantService, { AssistantResponse } from '../services/VoiceAssistantService';
import AudioService from '../services/AudioService';
import { HelpTooltip } from './HelpTooltip';

interface VoiceAssistantProps {
  currentScreen: string;
  onNavigate?: (screen: string) => void;
  onCreateLead?: (leadData: any) => void;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ currentScreen, onNavigate, onCreateLead }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastResponse, setLastResponse] = useState<AssistantResponse | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [actionFeedback, setActionFeedback] = useState<string>('');

  useEffect(() => {
    VoiceAssistantService.setContext(currentScreen);
  }, [currentScreen]);

  const handleVoiceCommand = async () => {
    if (isListening) {
      await stopListening();
      return;
    }

    try {
      setIsListening(true);
      setIsProcessing(true);

      const audioPath = await AudioService.startRecording();
      
    } catch (error) {
      console.error('Error starting voice command:', error);
      setIsListening(false);
      setIsProcessing(false);
    }
  };

  const stopListening = async () => {
    try {
      setIsListening(false);
      setIsProcessing(true);
      setActionFeedback('');

      const audioPath = await AudioService.stopRecording();
      
      if (audioPath) {
        const response = await VoiceAssistantService.processVoiceCommand(audioPath);
        setLastResponse(response);
        
        const history = VoiceAssistantService.getCommandHistory();
        setCommandHistory(history);
        
        // Execute actions based on response
        if (response.shouldExecute && response.action) {
          await executeAction(response);
        }
        
        if (response.audioPath) {
          setIsSpeaking(true);
          await AudioService.playAudio(response.audioPath);
          setIsSpeaking(false);
        }
      }
      
      setIsProcessing(false);
    } catch (error) {
      console.error('Error processing voice command:', error);
      setIsProcessing(false);
    }
  };

  const executeAction = async (response: AssistantResponse) => {
    try {
      switch (response.action) {
        case 'create_lead':
          if (onCreateLead && response.parameters) {
            onCreateLead(response.parameters);
            setActionFeedback('✅ Lead created successfully!');
          } else {
            setActionFeedback('⚠️ Lead creation not available on this screen');
          }
          break;
          
        case 'navigate':
          if (onNavigate && response.parameters?.screen) {
            onNavigate(response.parameters.screen);
            setActionFeedback(`✅ Navigating to ${response.parameters.screen}`);
          }
          break;
          
        default:
          // No action needed
          break;
      }
    } catch (error) {
      console.error('Error executing action:', error);
      setActionFeedback('❌ Failed to execute command');
    }
  };

  return (
    <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
      <Paper
        elevation={3}
        sx={{
          p: 2,
          borderRadius: 2,
          backgroundColor: 'background.paper',
          width: 300,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Voice Assistant</Typography>
          <HelpTooltip title="View command history">
            <IconButton
              size="small"
              onClick={() => setShowHistory(!showHistory)}
            >
              <HistoryIcon />
            </IconButton>
          </HelpTooltip>
        </Box>

        <Collapse in={showHistory}>
          <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
            {commandHistory.map((command, index) => (
              <ListItem key={index}>
                <ListItemText primary={command} />
              </ListItem>
            ))}
          </List>
        </Collapse>

        {actionFeedback && (
          <Box sx={{ mb: 2, p: 1.5, bgcolor: 'success.dark', borderRadius: 1, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'white' }}>
              {actionFeedback}
            </Typography>
          </Box>
        )}

        {lastResponse && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              You said:
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {lastResponse.transcription}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Assistant:
            </Typography>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              {lastResponse.text}
            </Typography>
          </Box>
        )}

        {/* Recording Status Indicator */}
        {isListening && (
          <Box sx={{ mb: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="error" sx={{ mb: 1, fontWeight: 'bold' }}>
              🔴 RECORDING...
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, height: 30, alignItems: 'center' }}>
              {[...Array(5)].map((_, i) => (
                <Box
                  key={i}
                  sx={{
                    width: 4,
                    bgcolor: 'error.main',
                    borderRadius: 1,
                    animation: `waveform 1s ease-in-out infinite`,
                    animationDelay: `${i * 0.1}s`,
                    '@keyframes waveform': {
                      '0%, 100%': { height: '10px' },
                      '50%': { height: '30px' },
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {isProcessing && !isListening && (
          <Typography variant="body2" color="primary" sx={{ mb: 2, textAlign: 'center' }}>
            Processing your request...
          </Typography>
        )}

        {isSpeaking && (
          <Typography variant="body2" color="success.main" sx={{ mb: 2, textAlign: 'center' }}>
            🔊 Speaking...
          </Typography>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <HelpTooltip title={isListening ? "Click to stop recording" : "Click to start voice command"}>
            <IconButton
              color={isListening ? 'error' : 'primary'}
              size="large"
              onClick={handleVoiceCommand}
              disabled={isProcessing && !isListening}
              sx={{
                width: 64,
                height: 64,
                bgcolor: isListening ? 'error.main' : 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: isListening ? 'error.dark' : 'primary.dark',
                },
                animation: isListening ? 'pulse 1.5s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(244, 67, 54, 0.7)' },
                  '50%': { transform: 'scale(1.05)', boxShadow: '0 0 0 10px rgba(244, 67, 54, 0)' },
                  '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(244, 67, 54, 0)' },
                },
              }}
            >
              {isListening ? <MicOffIcon fontSize="large" /> : <MicIcon fontSize="large" />}
            </IconButton>
          </HelpTooltip>
        </Box>
        
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1, color: 'text.secondary' }}>
          {isListening ? 'Click to stop recording' : 'Click to ask a question'}
        </Typography>
      </Paper>
    </Box>
  );
};
