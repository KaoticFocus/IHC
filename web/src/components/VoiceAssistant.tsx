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
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import VoiceAssistantService, { AssistantResponse } from '../services/VoiceAssistantService';
import AudioService from '../services/AudioService';
import ExtensionService from '../services/ExtensionService';
import CommandProcessor from '../services/CommandProcessor';
import WakeWordService from '../services/WakeWordService';
import { HelpTooltip } from './HelpTooltip';

interface VoiceAssistantProps {
  currentScreen: string;
  onNavigate?: (screen: string) => void;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ currentScreen, onNavigate }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastResponse, setLastResponse] = useState<AssistantResponse | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [actionFeedback, setActionFeedback] = useState<string>('');
  const [extensionAvailable, setExtensionAvailable] = useState(false);
  const [isListeningForWakeWord, setIsListeningForWakeWord] = useState(false);
  const [isWaitingForCommand, setIsWaitingForCommand] = useState(false);
  const [isConversationMode, setIsConversationMode] = useState(false);
  const [isMinimized, setIsMinimized] = useState(isMobile);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const handleVoiceCommandRef = useRef<(startConversation?: boolean) => Promise<void>>();

  const startWakeWordListening = async () => {
    try {
      await WakeWordService.startListeningForWakeWord(() => {
        // Wake word detected!
        setIsListeningForWakeWord(false);
        setIsWaitingForCommand(true);
        // Automatically start listening for command
        setTimeout(() => {
          handleVoiceCommandRef.current?.(false);
        }, 500);
      });
      setIsListeningForWakeWord(true);
    } catch (error) {
      console.error('Failed to start wake word listening:', error);
      // Fallback: user can still click mic button
    }
  };

  useEffect(() => {
    VoiceAssistantService.setContext(currentScreen);
    
    // Check for extension availability
    setExtensionAvailable(ExtensionService.isExtensionAvailable());

    // Start listening for wake word on mount
    startWakeWordListening();

    return () => {
      // Cleanup wake word listening on unmount
      WakeWordService.stopListeningForWakeWord();
    };
  }, [currentScreen]);

  useEffect(() => {
    // Listen for extension events
    const handleExtensionStart = () => {
      if (!isListening) {
        handleVoiceCommand();
      }
    };
    
    const handleExtensionStop = () => {
      if (isListening) {
        stopListening();
      }
    };
    
    window.addEventListener('extension-recording-started', handleExtensionStart);
    window.addEventListener('extension-recording-stopped', handleExtensionStop);
    
    return () => {
      window.removeEventListener('extension-recording-started', handleExtensionStart);
      window.removeEventListener('extension-recording-stopped', handleExtensionStop);
    };
  }, [isListening]);

  const handleVoiceCommand = async (startConversation: boolean = false) => {
    if (isListening) {
      await stopListening();
      return;
    }

    try {
      setIsListening(true);
      setIsProcessing(false);
      setIsWaitingForCommand(false);
      
      if (startConversation) {
        VoiceAssistantService.startConversationMode();
        setIsConversationMode(true);
      }

      await AudioService.startRecording();
      
    } catch (error) {
      console.error('Error starting voice command:', error);
      setIsListening(false);
      setIsProcessing(false);
      setIsWaitingForCommand(false);
    }
  };

  // Store ref for wake word callback
  useEffect(() => {
    handleVoiceCommandRef.current = handleVoiceCommand;
  }, [isListening]);

  const stopListening = async () => {
    try {
      setIsListening(false);
      setIsProcessing(true);
      setActionFeedback('');

      const recordingId = await AudioService.stopRecording();
      
      if (recordingId) {
        const isConversation = isConversationMode || VoiceAssistantService.isInConversationMode();
        const response = await VoiceAssistantService.processVoiceCommand(recordingId, isConversation);
        setLastResponse(response);
        
        setIsConversationMode(response.isConversation || false);
        
        const history = VoiceAssistantService.getCommandHistory();
        setCommandHistory(history);
        
        // Execute actions based on response (only in command mode)
        if (!isConversation && response.shouldExecute && response.action) {
          await executeAction(response);
        }
        
        if (response.audioBlob) {
          setIsSpeaking(true);
          const audioUrl = URL.createObjectURL(response.audioBlob);
          audioRef.current = new Audio(audioUrl);
          audioRef.current.onended = async () => {
            URL.revokeObjectURL(audioUrl);
            setIsSpeaking(false);
            
            // If in conversation mode, automatically start listening again
            if (isConversationMode || VoiceAssistantService.isInConversationMode()) {
              setTimeout(() => {
                handleVoiceCommand(true);
              }, 500);
            } else {
              // Resume wake word listening
              await startWakeWordListening();
            }
          };
          await audioRef.current.play();
        } else {
          // Resume wake word listening if not in conversation mode
          if (!isConversationMode && !VoiceAssistantService.isInConversationMode()) {
            await startWakeWordListening();
          }
        }
      }
      
      setIsProcessing(false);
    } catch (error) {
      console.error('Error processing voice command:', error);
      setIsProcessing(false);
      // Resume wake word listening on error
      if (!isConversationMode) {
        await startWakeWordListening();
      }
    }
  };

  const executeAction = async (response: AssistantResponse) => {
    try {
      if (response.action && response.parameters) {
        const result = await CommandProcessor.executeCommand(response.action, response.parameters);
        
        if (result.success) {
          setActionFeedback(result.message);
        } else {
          setActionFeedback(`⚠️ ${result.message}`);
        }
      } else {
        // Fallback for actions without CommandProcessor
        switch (response.action) {
          case 'navigate':
            if (onNavigate && response.parameters?.screen) {
              onNavigate(response.parameters.screen);
              setActionFeedback(`✅ Navigating to ${response.parameters.screen}`);
            }
            break;
            
          default:
            break;
        }
      }
    } catch (error) {
      console.error('Error executing action:', error);
      setActionFeedback('❌ Failed to execute command');
    }
  };

  // On mobile, show minimized floating button when minimized
  if (isMobile && isMinimized && !isListening && !isProcessing) {
    return (
      <Box 
        sx={{ 
          position: 'fixed', 
          bottom: { xs: 16, sm: 20 }, 
          right: { xs: 16, sm: 20 }, 
          zIndex: 1000 
        }}
      >
        <IconButton
          onClick={() => setIsMinimized(false)}
          sx={{
            width: { xs: 56, sm: 64 },
            height: { xs: 56, sm: 64 },
            bgcolor: 'primary.main',
            color: 'white',
            boxShadow: 3,
            '&:hover': {
              bgcolor: 'primary.dark',
            },
          }}
          aria-label="Open voice assistant"
        >
          <MicIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        position: 'fixed', 
        bottom: { xs: 16, sm: 20 }, 
        right: { xs: 16, sm: 20 }, 
        left: { xs: 16, sm: 'auto' },
        zIndex: 1000,
        maxWidth: { xs: 'calc(100% - 32px)', sm: 300 },
      }}
    >
      <Paper
        elevation={isMobile ? 8 : 3}
        role="region"
        aria-label="Voice Assistant"
        sx={{
          p: { xs: 1.5, sm: 2 },
          borderRadius: { xs: 3, sm: 2 },
          backgroundColor: 'background.paper',
          width: '100%',
          maxHeight: { xs: 'calc(100vh - 100px)', sm: 'none' },
          overflowY: 'auto',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: { xs: 1.5, sm: 2 }, alignItems: 'center' }}>
          <Typography variant={isMobile ? 'subtitle2' : 'h6'} sx={{ fontSize: { xs: '0.875rem', sm: '1.25rem' } }}>
            {isMobile ? 'Flow' : 'Voice Assistant'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {extensionAvailable && !isMobile && (
              <Chip 
                label="Extension" 
                size="small" 
                color="success" 
                sx={{ fontSize: '0.7rem', display: { xs: 'none', sm: 'flex' } }}
              />
            )}
            {isMobile && (
              <IconButton
                size="small"
                onClick={() => setIsMinimized(true)}
                sx={{ minWidth: 32, minHeight: 32 }}
                aria-label="Minimize"
              >
                <Typography sx={{ fontSize: '0.75rem' }}>−</Typography>
              </IconButton>
            )}
            <HelpTooltip title="View command history">
              <IconButton
                size="small"
                onClick={() => setShowHistory(!showHistory)}
                aria-label="Toggle command history"
                aria-expanded={showHistory}
                sx={{ minWidth: { xs: 32, sm: 40 }, minHeight: { xs: 32, sm: 40 } }}
              >
                <HistoryIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
              </IconButton>
            </HelpTooltip>
          </Box>
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
          <Box sx={{ mb: { xs: 1.5, sm: 2 }, p: { xs: 1.5, sm: 2 }, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
              You said:
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              {lastResponse.transcription}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
              Assistant:
            </Typography>
            <Typography variant="body2" sx={{ fontStyle: 'italic', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              {lastResponse.text}
            </Typography>
          </Box>
        )}

        {isWaitingForCommand && (
          <Box sx={{ mb: { xs: 1.5, sm: 2 }, textAlign: 'center', p: { xs: 1.5, sm: 2 }, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="body2" color="info.dark" sx={{ fontWeight: 'bold', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              👂 Listening for your command...
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
              Say your command or click mic to start a conversation
            </Typography>
          </Box>
        )}

        {isListeningForWakeWord && !isListening && (
          <Box sx={{ mb: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
              💤 Listening for "Hey Flow"...
            </Typography>
          </Box>
        )}

        {isConversationMode && (
          <Box sx={{ mb: { xs: 1.5, sm: 2 }, textAlign: 'center', p: { xs: 1, sm: 1.5 }, bgcolor: 'success.light', borderRadius: 1 }}>
            <Typography variant="caption" color="success.dark" sx={{ fontWeight: 'bold', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
              💬 Conversation Mode Active
            </Typography>
          </Box>
        )}

        {isListening && (
          <Box sx={{ mb: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
            <Typography variant="body2" color="error" sx={{ mb: 1, fontWeight: 'bold', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              🔴 RECORDING...
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, height: { xs: 24, sm: 30 }, alignItems: 'center' }}>
              {[...Array(5)].map((_, i) => (
                <Box
                  key={i}
                  sx={{
                    width: { xs: 3, sm: 4 },
                    bgcolor: 'error.main',
                    borderRadius: 1,
                    animation: `waveform 1s ease-in-out infinite`,
                    animationDelay: `${i * 0.1}s`,
                    '@keyframes waveform': {
                      '0%, 100%': { height: { xs: '8px', sm: '10px' } },
                      '50%': { height: { xs: '24px', sm: '30px' } },
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {isProcessing && !isListening && (
          <Typography variant="body2" color="primary" sx={{ mb: { xs: 1.5, sm: 2 }, textAlign: 'center', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            Processing your request...
          </Typography>
        )}

        {isSpeaking && (
          <Typography variant="body2" color="success.main" sx={{ mb: { xs: 1.5, sm: 2 }, textAlign: 'center', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            🔊 Speaking...
          </Typography>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.75, sm: 1 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 0.75, sm: 1 } }}>
            <HelpTooltip title={isListening ? "Click to stop recording" : "Click for voice command"}>
              <IconButton
                color={isListening ? 'error' : 'primary'}
                size={isMobile ? 'medium' : 'large'}
                onClick={() => handleVoiceCommand(false)}
                disabled={isProcessing && !isListening}
                aria-label={isListening ? 'Stop recording' : 'Start command'}
                sx={{
                  width: { xs: 56, sm: 64 },
                  height: { xs: 56, sm: 64 },
                  minWidth: { xs: 56, sm: 64 },
                  minHeight: { xs: 56, sm: 64 },
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
                {isListening ? (
                  <MicOffIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />
                ) : (
                  <MicIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />
                )}
              </IconButton>
            </HelpTooltip>
            {!isListening && (
              <HelpTooltip title="Start a conversation">
                <IconButton
                  color="secondary"
                  size={isMobile ? 'medium' : 'large'}
                  onClick={() => handleVoiceCommand(true)}
                  disabled={isProcessing}
                  aria-label="Start conversation"
                  sx={{
                    width: { xs: 56, sm: 64 },
                    height: { xs: 56, sm: 64 },
                    minWidth: { xs: 56, sm: 64 },
                    minHeight: { xs: 56, sm: 64 },
                    bgcolor: 'secondary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'secondary.dark',
                    },
                  }}
                >
                  <MicIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />
                </IconButton>
              </HelpTooltip>
            )}
          </Box>
          
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block', 
              textAlign: 'center', 
              color: 'text.secondary',
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              px: { xs: 1, sm: 0 },
            }}
          >
            {isListening 
              ? 'Click to stop recording' 
              : isConversationMode
              ? 'Conversation mode - speak naturally'
              : 'Say "Hey Flow" or click mic'}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

