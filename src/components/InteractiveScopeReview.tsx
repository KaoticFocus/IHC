import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Sound from 'react-native-sound';
import EnhancedTranscriptionService from '../services/EnhancedTranscriptionService';
import OpenAIService from '../services/OpenAIService';

interface ScopeItem {
  category: string;
  description: string;
  details: string[];
}

interface ScopeOfWork {
  projectTitle: string;
  projectOverview: string;
  scopeItems: ScopeItem[];
  estimatedTimeline: string;
  nextSteps: string[];
}

interface InteractiveScopeReviewProps {
  visible: boolean;
  onClose: () => void;
  scopeOfWork: ScopeOfWork | null;
  sessionId: string;
  onScopeUpdated: (updatedScope: ScopeOfWork) => void;
}

const InteractiveScopeReview: React.FC<InteractiveScopeReviewProps> = ({
  visible,
  onClose,
  scopeOfWork,
  sessionId,
  onScopeUpdated,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [reviewTranscript, setReviewTranscript] = useState('');
  const [changes, setChanges] = useState<any[]>([]);
  const [isProcessingChanges, setIsProcessingChanges] = useState(false);
  const [currentScope, setCurrentScope] = useState<ScopeOfWork | null>(null);
  const [speechSound, setSpeechSound] = useState<Sound | null>(null);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const listeningAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (scopeOfWork) {
      setCurrentScope(scopeOfWork);
    }
  }, [scopeOfWork]);

  useEffect(() => {
    if (isListening) {
      startListening();
    } else {
      stopListening();
    }
  }, [isListening]);

  useEffect(() => {
    if (isSpeaking) {
      startPulseAnimation();
    } else {
      stopPulseAnimation();
    }
  }, [isSpeaking]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.setValue(1);
  };

  const startListeningAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(listeningAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(listeningAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopListeningAnimation = () => {
    listeningAnim.setValue(0);
  };

  const startListening = async () => {
    try {
      startListeningAnimation();
      await EnhancedTranscriptionService.startListening();
    } catch (error) {
      console.error('Error starting listening:', error);
      Alert.alert('Error', 'Failed to start listening for changes');
    }
  };

  const stopListening = async () => {
    try {
      stopListeningAnimation();
      await EnhancedTranscriptionService.stopListening();
    } catch (error) {
      console.error('Error stopping listening:', error);
    }
  };

  const speakText = async (text: string) => {
    try {
      setIsSpeaking(true);
      const audioPath = await OpenAIService.generateSpeech(text);
      
      const sound = new Sound(audioPath, '', (error) => {
        if (error) {
          console.error('Error loading sound:', error);
          setIsSpeaking(false);
          return;
        }
        
        sound.play((success) => {
          setIsSpeaking(false);
          if (!success) {
            console.error('Error playing sound');
          }
        });
      });
      
      setSpeechSound(sound);
    } catch (error) {
      console.error('Error generating speech:', error);
      setIsSpeaking(false);
      Alert.alert('Error', 'Failed to generate speech');
    }
  };

  const stopSpeaking = () => {
    if (speechSound) {
      speechSound.stop();
      speechSound.release();
      setSpeechSound(null);
    }
    setIsSpeaking(false);
  };

  const readScopeSection = async (sectionIndex: number) => {
    if (!currentScope) return;
    
    let textToRead = '';
    
    if (sectionIndex === 0) {
      textToRead = `Project: ${currentScope.projectTitle}. ${currentScope.projectOverview}`;
    } else if (sectionIndex <= currentScope.scopeItems.length) {
      const item = currentScope.scopeItems[sectionIndex - 1];
      textToRead = `${item.category}: ${item.description}. The work includes: ${item.details.join(', ')}`;
    } else if (sectionIndex === currentScope.scopeItems.length + 1) {
      textToRead = `Estimated timeline: ${currentScope.estimatedTimeline}`;
    } else {
      textToRead = `Next steps: ${currentScope.nextSteps.join(', ')}`;
    }
    
    await speakText(textToRead);
  };

  const processChanges = async () => {
    if (!reviewTranscript.trim() || !currentScope) return;
    
    try {
      setIsProcessingChanges(true);
      const result = await OpenAIService.processScopeChanges(currentScope, reviewTranscript);
      
      if (result.changes.length > 0) {
        setCurrentScope(result.updatedScope);
        setChanges(result.changes);
        onScopeUpdated(result.updatedScope);
        
        Alert.alert(
          'Scope Updated',
          `Found ${result.changes.length} changes. The scope has been updated.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('No Changes', 'No changes were detected in the conversation.');
      }
      
      setReviewTranscript('');
    } catch (error) {
      console.error('Error processing changes:', error);
      Alert.alert('Error', 'Failed to process changes');
    } finally {
      setIsProcessingChanges(false);
    }
  };

  const handleClose = () => {
    stopSpeaking();
    stopListening();
    onClose();
  };

  if (!currentScope) return null;

  const sections = [
    'Project Overview',
    ...currentScope.scopeItems.map(item => item.category),
    'Timeline',
    'Next Steps'
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Interactive Scope Review</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.headerButton, isListening && styles.activeButton]}
              onPress={() => setIsListening(!isListening)}
            >
              <Animated.View style={{ transform: [{ scale: listeningAnim }] }}>
                <Icon 
                  name={isListening ? "mic" : "mic-none"} 
                  size={24} 
                  color={isListening ? "#4CAF50" : "#ffffff"} 
                />
              </Animated.View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleClose}
            >
              <Icon name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.instructions}>
            <Text style={styles.instructionsText}>
              {isListening 
                ? "🎤 Listening for changes... Speak naturally about any modifications needed."
                : "👆 Tap 'Listen' to hear for changes, or tap sections to have AI read them aloud."
              }
            </Text>
          </View>

          <View style={styles.sectionNavigation}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {sections.map((section, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.sectionTab,
                    currentSection === index && styles.activeSectionTab
                  ]}
                  onPress={() => {
                    setCurrentSection(index);
                    readScopeSection(index);
                  }}
                >
                  <Text style={[
                    styles.sectionTabText,
                    currentSection === index && styles.activeSectionTabText
                  ]}>
                    {section}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.currentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{sections[currentSection]}</Text>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  style={[styles.speakButton, isSpeaking && styles.speakingButton]}
                  onPress={() => {
                    if (isSpeaking) {
                      stopSpeaking();
                    } else {
                      readScopeSection(currentSection);
                    }
                  }}
                >
                  <Icon 
                    name={isSpeaking ? "stop" : "volume-up"} 
                    size={20} 
                    color={isSpeaking ? "#ff4444" : "#4CAF50"} 
                  />
                </TouchableOpacity>
              </Animated.View>
            </View>

            <View style={styles.sectionContent}>
              {currentSection === 0 && (
                <View>
                  <Text style={styles.projectTitle}>{currentScope.projectTitle}</Text>
                  <Text style={styles.overviewText}>{currentScope.projectOverview}</Text>
                </View>
              )}
              
              {currentSection > 0 && currentSection <= currentScope.scopeItems.length && (
                <View>
                  <Text style={styles.categoryDescription}>
                    {currentScope.scopeItems[currentSection - 1].description}
                  </Text>
                  <View style={styles.detailsList}>
                    {currentScope.scopeItems[currentSection - 1].details.map((detail, index) => (
                      <View key={index} style={styles.detailItem}>
                        <Icon name="check-circle" size={16} color="#4CAF50" />
                        <Text style={styles.detailText}>{detail}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              
              {currentSection === currentScope.scopeItems.length + 1 && (
                <Text style={styles.timelineText}>{currentScope.estimatedTimeline}</Text>
              )}
              
              {currentSection === currentScope.scopeItems.length + 2 && (
                <View style={styles.nextStepsList}>
                  {currentScope.nextSteps.map((step, index) => (
                    <View key={index} style={styles.nextStepItem}>
                      <Text style={styles.stepNumber}>{index + 1}</Text>
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {changes.length > 0 && (
            <View style={styles.changesSection}>
              <Text style={styles.changesTitle}>Recent Changes</Text>
              {changes.map((change, index) => (
                <View key={index} style={styles.changeItem}>
                  <Icon 
                    name={
                      change.type === 'added' ? 'add-circle' :
                      change.type === 'modified' ? 'edit' : 'remove-circle'
                    } 
                    size={16} 
                    color={
                      change.type === 'added' ? '#4CAF50' :
                      change.type === 'modified' ? '#FF9800' : '#ff4444'
                    } 
                  />
                  <Text style={styles.changeText}>
                    {change.type.toUpperCase()}: {change.description}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.processButton, isProcessingChanges && styles.disabledButton]}
              onPress={processChanges}
              disabled={isProcessingChanges || !reviewTranscript.trim()}
            >
              <Text style={styles.processButtonText}>
                {isProcessingChanges ? 'Processing...' : 'Process Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#16213e',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 15,
    padding: 8,
    borderRadius: 8,
  },
  activeButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  instructions: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  instructionsText: {
    fontSize: 14,
    color: '#4CAF50',
    textAlign: 'center',
  },
  sectionNavigation: {
    marginBottom: 20,
  },
  sectionTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeSectionTab: {
    backgroundColor: '#4CAF50',
  },
  sectionTabText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  activeSectionTabText: {
    color: '#ffffff',
  },
  currentSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  speakButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  speakingButton: {
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
  },
  sectionContent: {
    minHeight: 100,
  },
  projectTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  overviewText: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 24,
  },
  categoryDescription: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 15,
    lineHeight: 24,
  },
  detailsList: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailText: {
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  timelineText: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: '600',
  },
  nextStepsList: {
    gap: 12,
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 12,
  },
  stepText: {
    fontSize: 14,
    color: '#ffffff',
    flex: 1,
    lineHeight: 20,
  },
  changesSection: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  changesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 10,
  },
  changeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  changeText: {
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 8,
    flex: 1,
  },
  actionButtons: {
    marginBottom: 20,
  },
  processButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  processButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default InteractiveScopeReview;
