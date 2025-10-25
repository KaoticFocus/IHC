import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Sound from 'react-native-sound';
import VoiceAssistantService, { AssistantResponse } from '../services/VoiceAssistantService';
import EnhancedTranscriptionService from '../services/EnhancedTranscriptionService';

interface VoiceAssistantProps {
  onCommandExecuted: (action: string, parameters: any) => void;
  currentScreen: string;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  onCommandExecuted,
  currentScreen,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastResponse, setLastResponse] = useState<AssistantResponse | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const currentSound = useRef<Sound | null>(null);

  useEffect(() => {
    VoiceAssistantService.setContext(currentScreen);
  }, [currentScreen]);

  useEffect(() => {
    if (isListening) {
      startListeningAnimation();
    } else {
      stopListeningAnimation();
    }
  }, [isListening]);

  useEffect(() => {
    if (isSpeaking) {
      startPulseAnimation();
    } else {
      stopPulseAnimation();
    }
  }, [isSpeaking]);

  const startListeningAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopListeningAnimation = () => {
    waveAnim.setValue(0);
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.setValue(1);
  };

  const handleVoiceCommand = async () => {
    if (isListening) {
      // Stop listening
      await stopListening();
      return;
    }

    try {
      setIsListening(true);
      setIsProcessing(true);

      // Start recording for voice command
      await EnhancedTranscriptionService.startListening();
      
      // Wait for user to speak (in a real implementation, you'd have a timeout)
      // For now, we'll simulate this with a button press to stop
      
    } catch (error) {
      console.error('Error starting voice command:', error);
      Alert.alert('Error', 'Failed to start voice recognition');
      setIsListening(false);
      setIsProcessing(false);
    }
  };

  const stopListening = async () => {
    try {
      setIsListening(false);
      setIsProcessing(true);

      // Stop recording and get the audio file
      const audioPath = await EnhancedTranscriptionService.stopListening();
      
      if (audioPath) {
        // Process the voice command
        const response = await VoiceAssistantService.processVoiceCommand(audioPath);
        setLastResponse(response);
        
        // Add to command history
        const history = VoiceAssistantService.getCommandHistory();
        setCommandHistory(history);
        
        // Play the response
        if (response.audioPath) {
          await playResponse(response.audioPath);
        }
        
        // Execute the command if needed
        if (response.shouldExecute && response.action) {
          onCommandExecuted(response.action, response.parameters || {});
        }
      }
      
      setIsProcessing(false);
    } catch (error) {
      console.error('Error processing voice command:', error);
      Alert.alert('Error', 'Failed to process voice command');
      setIsProcessing(false);
    }
  };

  const playResponse = async (audioPath: string) => {
    try {
      setIsSpeaking(true);
      
      const sound = new Sound(audioPath, '', (error) => {
        if (error) {
          console.error('Error loading response audio:', error);
          setIsSpeaking(false);
          return;
        }
        
        sound.play((success) => {
          setIsSpeaking(false);
          if (!success) {
            console.error('Error playing response audio');
          }
        });
      });
      
      currentSound.current = sound;
    } catch (error) {
      console.error('Error playing response:', error);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (currentSound.current) {
      currentSound.current.stop();
      currentSound.current.release();
      currentSound.current = null;
    }
    setIsSpeaking(false);
  };

  const getAssistantStatus = () => {
    if (isSpeaking) return 'Speaking...';
    if (isProcessing) return 'Processing...';
    if (isListening) return 'Listening...';
    return 'Ready';
  };

  const getAssistantIcon = () => {
    if (isSpeaking) return 'volume-up';
    if (isProcessing) return 'hourglass-empty';
    if (isListening) return 'mic';
    return 'mic-none';
  };

  const getAssistantColor = () => {
    if (isSpeaking) return '#4CAF50';
    if (isProcessing) return '#FF9800';
    if (isListening) return '#f44336';
    return '#2196F3';
  };

  return (
    <>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.assistantButton,
            {
              transform: [
                { scale: isListening ? waveAnim : pulseAnim },
              ],
              backgroundColor: getAssistantColor(),
            },
          ]}
        >
          <TouchableOpacity
            style={styles.button}
            onPress={handleVoiceCommand}
            disabled={isProcessing}
          >
            <Icon
              name={getAssistantIcon()}
              size={32}
              color="#ffffff"
            />
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{getAssistantStatus()}</Text>
          {lastResponse && (
            <TouchableOpacity
              style={styles.historyButton}
              onPress={() => setShowHistory(true)}
            >
              <Icon name="history" size={16} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {lastResponse && (
          <View style={styles.lastResponseContainer}>
            <Text style={styles.lastResponseText} numberOfLines={2}>
              {lastResponse.text}
            </Text>
            {isSpeaking && (
              <TouchableOpacity
                style={styles.stopButton}
                onPress={stopSpeaking}
              >
                <Icon name="stop" size={16} color="#ff4444" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <Modal
        visible={showHistory}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={styles.historyModal}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Voice Command History</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowHistory(false)}
            >
              <Icon name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.historyContent}>
            {commandHistory.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Icon name="history" size={48} color="#666" />
                <Text style={styles.emptyHistoryText}>No commands yet</Text>
                <Text style={styles.emptyHistorySubtext}>
                  Start using voice commands to see them here
                </Text>
              </View>
            ) : (
              commandHistory.map((command, index) => (
                <View key={index} style={styles.historyItem}>
                  <Icon name="mic" size={16} color="#4CAF50" />
                  <Text style={styles.historyCommand}>{command}</Text>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.historyFooter}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                VoiceAssistantService.clearHistory();
                setCommandHistory([]);
              }}
            >
              <Text style={styles.clearButtonText}>Clear History</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 1000,
  },
  assistantButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  button: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  historyButton: {
    marginLeft: 8,
    padding: 4,
  },
  lastResponseContainer: {
    position: 'absolute',
    bottom: 90,
    right: 0,
    left: -200,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 12,
    maxWidth: 250,
  },
  lastResponseText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
  },
  stopButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  historyModal: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#16213e',
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    padding: 8,
  },
  historyContent: {
    flex: 1,
    padding: 20,
  },
  emptyHistory: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyHistoryText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: '#cccccc',
    textAlign: 'center',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  historyCommand: {
    color: '#ffffff',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  historyFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  clearButton: {
    backgroundColor: '#f44336',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VoiceAssistant;
