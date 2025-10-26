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
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ currentScreen }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastResponse, setLastResponse] = useState<AssistantResponse | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);

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

      const audioPath = await AudioService.stopRecording();
      
      if (audioPath) {
        const response = await VoiceAssistantService.processVoiceCommand(audioPath);
        setLastResponse(response);
        
        const history = VoiceAssistantService.getCommandHistory();
        setCommandHistory(history);
        
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

        {lastResponse && (
          <Typography
            variant="body2"
            sx={{ mb: 2, fontStyle: 'italic' }}
          >
            {lastResponse.text}
          </Typography>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <HelpTooltip title={isListening ? "Click to stop recording" : "Click to start voice command"}>
            <IconButton
              color={isListening ? 'secondary' : 'primary'}
              size="large"
              onClick={handleVoiceCommand}
              disabled={isProcessing}
              sx={{
                width: 56,
                height: 56,
                animation: isProcessing ? 'pulse 1.5s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.1)' },
                  '100%': { transform: 'scale(1)' },
                },
              }}
            >
              {isListening ? <MicOffIcon /> : <MicIcon />}
            </IconButton>
          </HelpTooltip>
        </Box>
      </Paper>
    </Box>
  );
};
