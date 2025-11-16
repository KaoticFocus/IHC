import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  FlatList,
  Dimensions,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AudioRecorderPlayer, {
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  OutputFormatAndroidType,
} from 'react-native-audio-recorder-player';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import EnhancedTranscriptionService, { EnhancedTranscript } from './src/services/EnhancedTranscriptionService';
import TranscriptViewer from './src/components/TranscriptViewer';
import SettingsModal from './src/components/SettingsModal';
import AIAnalysisViewer from './src/components/AIAnalysisViewer';
import OnboardingModal from './src/components/OnboardingModal';
import ScopeOfWorkViewer from './src/components/ScopeOfWorkViewer';
import ContractorScopeViewer from './src/components/ContractorScopeViewer';
import InteractiveScopeReview from './src/components/InteractiveScopeReview';
import VoiceAssistant from './src/components/VoiceAssistant';
import OpenAIService, { AIAnalysis } from './src/services/OpenAIService';
import CommandProcessor from './src/services/CommandProcessor';
import ConsultationScreen from './src/components/ConsultationScreen';
import ConsultationService from './src/services/ConsultationService';
import DocumentPicker from 'react-native-document-picker';

const { width, height } = Dimensions.get('window');

interface Recording {
  id: string;
  name: string;
  path: string;
  duration: number;
  date: Date;
  size: number;
  transcriptPath?: string;
  hasTranscript: boolean;
  hasAIAnalysis: boolean;
  aiEnhanced: boolean;
  hasScopeOfWork: boolean;
}

const App: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [currentRecordingTime, setCurrentRecordingTime] = useState(0);
  const [audioRecorderPlayer] = useState(new AudioRecorderPlayer());
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptEntries, setTranscriptEntries] = useState<EnhancedTranscript[]>([]);
  const [showTranscript, setShowTranscript] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [hasOpenAIKey, setHasOpenAIKey] = useState(false);
  const [useOpenAI, setUseOpenAI] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [showScopeOfWork, setShowScopeOfWork] = useState(false);
  const [showContractorScope, setShowContractorScope] = useState(false);
  const [scopeOfWork, setScopeOfWork] = useState<any>(null);
  const [isGeneratingScope, setIsGeneratingScope] = useState(false);
  const [showInteractiveReview, setShowInteractiveReview] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('main');
  const [showConsultations, setShowConsultations] = useState(false);
  const [currentConsultationId, setCurrentConsultationId] = useState<string | null>(null);

  useEffect(() => {
    checkPermissions();
    loadRecordings();
    checkOpenAIStatus();
    checkOnboardingStatus();
    setupCommandProcessor();
  }, []);

  const setupCommandProcessor = () => {
    CommandProcessor.setNavigationCallback((screen: string) => {
      handleNavigation(screen);
    });

    CommandProcessor.setRecordingCallback((action: 'start' | 'stop') => {
      if (action === 'start') {
        startRecording();
      } else {
        stopRecording();
      }
    });
  };

  const checkOnboardingStatus = async () => {
    try {
      // Check if user has completed onboarding
      const completed = await AsyncStorage.getItem('onboarding_completed');
      if (!completed) {
        setShowOnboarding(true);
      } else {
        setHasCompletedOnboarding(true);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setShowOnboarding(true);
    }
  };

  const checkOpenAIStatus = async () => {
    try {
      const hasKey = await OpenAIService.hasApiKey();
      setHasOpenAIKey(true); // AI is always enabled for MVP
      setUseOpenAI(true); // AI is always enabled for MVP
    } catch (error) {
      console.error('Error checking OpenAI status:', error);
    }
  };

  const handleOnboardingComplete = async (hasApiKey: boolean) => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
      setHasCompletedOnboarding(true);
      setShowOnboarding(false);
      setHasOpenAIKey(true); // AI is always enabled for MVP
      setUseOpenAI(true); // AI is always enabled for MVP
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const checkPermissions = async () => {
    try {
      const result = await check(PERMISSIONS.ANDROID.RECORD_AUDIO);
      if (result !== RESULTS.GRANTED) {
        const requestResult = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
        if (requestResult !== RESULTS.GRANTED) {
          Alert.alert('Permission Required', 'Microphone permission is required to record audio.');
        }
      }
    } catch (error) {
      console.error('Permission check error:', error);
    }
  };

  const loadRecordings = async () => {
    try {
      const recordingsPath = `${RNFS.DocumentDirectoryPath}/recordings`;
      const exists = await RNFS.exists(recordingsPath);
      
      if (!exists) {
        await RNFS.mkdir(recordingsPath);
        return;
      }

      const files = await RNFS.readDir(recordingsPath);
      const recordingFiles = files
        .filter(file => file.name.endsWith('.m4a'))
        .map(file => {
          const baseName = file.name.replace('.m4a', '');
          const transcriptPath = `${RNFS.DocumentDirectoryPath}/transcripts/${baseName}.json`;
          
          return {
            id: file.name,
            name: baseName,
            path: file.path,
            duration: 0, // Will be calculated when needed
            date: file.mtime,
            size: file.size,
            transcriptPath: transcriptPath,
            hasTranscript: false, // Will be checked separately
            hasAIAnalysis: false, // Will be checked separately
            aiEnhanced: false, // Will be checked separately
            hasScopeOfWork: false, // Will be checked separately
          };
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      // Check which recordings have transcripts and AI analysis
      const recordingsWithTranscripts = await Promise.all(
        recordingFiles.map(async (recording) => {
          try {
            const transcriptExists = await RNFS.exists(recording.transcriptPath!);
            let hasAIAnalysis = false;
            let aiEnhanced = false;
            
            if (transcriptExists) {
              try {
                const transcriptData = await RNFS.readFile(recording.transcriptPath!, 'utf8');
                const parsed = JSON.parse(transcriptData);
                hasAIAnalysis = !!parsed.aiAnalysis;
                aiEnhanced = !!parsed.aiEnhanced;
              } catch (error) {
                console.error('Error reading transcript data:', error);
              }
            }
            
            return { 
              ...recording, 
              hasTranscript: transcriptExists,
              hasAIAnalysis: hasAIAnalysis,
              aiEnhanced: aiEnhanced,
            };
          } catch (error) {
            return { 
              ...recording, 
              hasTranscript: false,
              hasAIAnalysis: false,
              aiEnhanced: false,
            };
          }
        })
      );

      setRecordings(recordingsWithTranscripts);
    } catch (error) {
      console.error('Error loading recordings:', error);
    }
  };

  const startRecording = async () => {
    try {
      const recordingsPath = `${RNFS.DocumentDirectoryPath}/recordings`;
      const exists = await RNFS.exists(recordingsPath);
      
      if (!exists) {
        await RNFS.mkdir(recordingsPath);
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `conversation_${timestamp}.m4a`;
      const path = `${recordingsPath}/${fileName}`;

      const audioSet = {
        AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
        AudioSourceAndroid: AudioSourceAndroidType.MIC,
        AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
        AVNumberOfChannelsKeyIOS: 2,
        AVFormatIDKeyIOS: AVEncodingOption.aac,
        OutputFormatAndroid: OutputFormatAndroidType.AAC_ADTS,
      };

      const uri = await audioRecorderPlayer.startRecorder(path, audioSet);
      setIsRecording(true);
      setCurrentRecordingTime(0);
      setTranscriptEntries([]);

      // Start transcription
      try {
      const sessionId = await EnhancedTranscriptionService.startTranscription(
        useOpenAI && hasOpenAIKey,
        (entries) => {
          setTranscriptEntries(entries);
        },
        (error) => {
          console.error('Transcription error:', error);
          Alert.alert('Transcription Error', error);
        },
        (analysis) => {
          setAiAnalysis(analysis);
        }
      );
      setCurrentSessionId(sessionId);
      setIsTranscribing(true);

      // Create consultation for this recording
      try {
        await ConsultationService.initialize();
        if (ConsultationService.isAvailable()) {
          const consultation = await ConsultationService.createConsultation({
            title: `Consultation - ${new Date().toLocaleDateString()}`,
            consultationDate: new Date(),
            sessionId: sessionId,
          });
          setCurrentConsultationId(consultation.id);
        }
      } catch (err) {
        console.warn('Failed to create consultation:', err);
        // Continue with recording even if consultation creation fails
      }
      } catch (transcriptionError) {
        console.error('Failed to start transcription:', transcriptionError);
        // Continue with recording even if transcription fails
      }

      // Start timer
      const timer = setInterval(() => {
        setCurrentRecordingTime(prev => prev + 1);
      }, 1000);

      // Store timer reference for cleanup
      (audioRecorderPlayer as any).timer = timer;

    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please check permissions.');
    }
  };

  const stopRecording = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      setIsRecording(false);
      
      // Stop transcription
      if (isTranscribing) {
        try {
          const finalEntries = await EnhancedTranscriptionService.stopTranscription();
          setTranscriptEntries(finalEntries);
          
          // Enhance with OpenAI if enabled
          let aiAnalysisResult = null;
          if (useOpenAI && hasOpenAIKey && finalEntries.length > 0) {
            try {
              const enhancedResult = await EnhancedTranscriptionService.enhanceWithOpenAI(result);
              setTranscriptEntries(enhancedResult.enhancedTranscript);
              aiAnalysisResult = enhancedResult.aiAnalysis;
              setAiAnalysis(enhancedResult.aiAnalysis);
            } catch (aiError) {
              console.error('Error enhancing with OpenAI:', aiError);
              // Continue with basic transcription
            }
          }
          
          // Save transcript
          if (finalEntries.length > 0 && currentSessionId) {
            await EnhancedTranscriptionService.saveEnhancedTranscript(
              currentSessionId, 
              finalEntries, 
              aiAnalysisResult
            );
          }

          // Update consultation with recording ID if available
          if (currentConsultationId && result) {
            try {
              await ConsultationService.initialize();
              if (ConsultationService.isAvailable()) {
                // Extract recording ID from path if needed
                const recordingId = result.split('/').pop()?.replace('.m4a', '') || result;
                await ConsultationService.updateConsultation({
                  id: currentConsultationId,
                  recordingId: recordingId,
                });
              }
            } catch (err) {
              console.warn('Failed to update consultation with recording:', err);
            }
          }
        } catch (transcriptionError) {
          console.error('Error stopping transcription:', transcriptionError);
        }
        setIsTranscribing(false);
      }
      
      // Clear timer
      if ((audioRecorderPlayer as any).timer) {
        clearInterval((audioRecorderPlayer as any).timer);
      }

      // Reload recordings list
      await loadRecordings();
      
      const transcriptInfo = transcriptEntries.length > 0 
        ? `\nTranscript: ${transcriptEntries.length} entries, ${transcriptEntries.reduce((count, entry) => count + entry.text.split(' ').length, 0)} words`
        : '';
      
      Alert.alert(
        'Recording Saved', 
        `Recording saved successfully!\nDuration: ${formatTime(currentRecordingTime)}${transcriptInfo}`
      );
      setCurrentRecordingTime(0);
      setTranscriptEntries([]);
      setCurrentSessionId('');
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Recording Error', 'Failed to stop recording.');
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const deleteRecording = async (recording: Recording) => {
    Alert.alert(
      'Delete Recording',
      `Are you sure you want to delete "${recording.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await RNFS.unlink(recording.path);
              await loadRecordings();
            } catch (error) {
              console.error('Error deleting recording:', error);
              Alert.alert('Error', 'Failed to delete recording.');
            }
          },
        },
      ]
    );
  };

  const viewTranscript = async (recording: Recording) => {
    try {
      if (recording.hasTranscript && recording.transcriptPath) {
        const transcript = await EnhancedTranscriptionService.loadEnhancedTranscript(recording.id.replace('.m4a', ''));
        setTranscriptEntries(transcript.entries);
        setCurrentSessionId(transcript.sessionId);
        setShowTranscript(true);
      } else {
        Alert.alert('No Transcript', 'This recording does not have a transcript available.');
      }
    } catch (error) {
      console.error('Error loading transcript:', error);
      Alert.alert('Error', 'Failed to load transcript.');
    }
  };

  const viewAIAnalysis = async (recording: Recording) => {
    try {
      if (recording.hasAIAnalysis && recording.transcriptPath) {
        const transcript = await EnhancedTranscriptionService.loadEnhancedTranscript(recording.id.replace('.m4a', ''));
        if (transcript.aiAnalysis) {
          setAiAnalysis(transcript.aiAnalysis);
          setShowAIAnalysis(true);
        } else {
          Alert.alert('No AI Analysis', 'This recording does not have AI analysis available.');
        }
      } else {
        Alert.alert('No AI Analysis', 'This recording does not have AI analysis available.');
      }
    } catch (error) {
      console.error('Error loading AI analysis:', error);
      Alert.alert('Error', 'Failed to load AI analysis.');
    }
  };

  const generateScopeOfWork = async (recording: Recording) => {
    try {
      setIsGeneratingScope(true);
      
      if (recording.transcriptPath) {
        const transcript = await EnhancedTranscriptionService.loadEnhancedTranscript(recording.id.replace('.m4a', ''));
        if (transcript && transcript.fullTranscript) {
          const scope = await OpenAIService.generateScopeOfWork(transcript.fullTranscript);
          setScopeOfWork(scope);
          
          // Show options for which scope to review and how
          Alert.alert(
            'Scope of Work Generated',
            'Two scopes have been created. Which would you like to review?',
            [
              {
                text: 'Homeowner Scope - Interactive',
                onPress: () => {
                  setScopeOfWork({...scope, currentView: 'homeowner'});
                  setShowInteractiveReview(true);
                },
              },
              {
                text: 'Homeowner Scope - View Only',
                onPress: () => {
                  setScopeOfWork({...scope, currentView: 'homeowner'});
                  setShowScopeOfWork(true);
                },
              },
              {
                text: 'Contractor Scope - View Only',
                onPress: () => {
                  setScopeOfWork({...scope, currentView: 'contractor'});
                  setShowContractorScope(true);
                },
              },
              {
                text: 'Cancel',
                style: 'cancel',
              },
            ]
          );
          
          // Save scope of work to the recording
          const updatedRecording = { ...recording, hasScopeOfWork: true };
          const updatedRecordings = recordings.map(r => 
            r.id === recording.id ? updatedRecording : r
          );
          setRecordings(updatedRecordings);
          
          // Save to storage
          await AsyncStorage.setItem('recordings', JSON.stringify(updatedRecordings));
        } else {
          Alert.alert('No Transcript', 'Transcript not available for this recording.');
        }
      } else {
        Alert.alert('No Transcript', 'Transcript not available for this recording.');
      }
    } catch (error) {
      console.error('Error generating scope of work:', error);
      Alert.alert('Error', 'Failed to generate scope of work. Please try again.');
    } finally {
      setIsGeneratingScope(false);
    }
  };

  const handleScopeUpdated = (updatedScope: any) => {
    setScopeOfWork(updatedScope);
  };

  const handleNavigation = (screen: string) => {
    switch (screen) {
      case 'main':
        setShowSettings(false);
        setCurrentScreen('main');
        break;
      case 'settings':
        setShowSettings(true);
        setCurrentScreen('settings');
        break;
      case 'back':
        setShowSettings(false);
        setCurrentScreen('main');
        break;
      default:
        console.log(`Navigation to ${screen} not implemented`);
    }
  };

  const handleVoiceCommand = async (action: string, parameters: any) => {
    try {
      const result = await CommandProcessor.executeCommand(action, parameters);
      
      if (!result.success) {
        Alert.alert('Command Error', result.message);
      }
      
      // Handle successful commands
      if (result.success && result.data) {
        // Additional handling based on the command result
        console.log('Command executed successfully:', result);
      }
    } catch (error) {
      console.error('Error handling voice command:', error);
      Alert.alert('Error', 'Failed to execute voice command');
    }
  };

  const handlePhotoUpload = async () => {
    if (!currentConsultationId) {
      Alert.alert('Error', 'No active consultation. Please start a recording first.');
      return;
    }

    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.images],
        allowMultiSelection: false,
      });

      if (result && result.length > 0) {
        const file = result[0];
        const fileName = file.name || `photo_${Date.now()}.jpg`;
        const mimeType = file.type || 'image/jpeg';

        await ConsultationService.initialize();
        if (!ConsultationService.isAvailable()) {
          Alert.alert('Error', 'Consultation service not available. Please configure Supabase in settings.');
          return;
        }

        await ConsultationService.uploadPhoto(
          currentConsultationId,
          file.uri,
          fileName,
          mimeType
        );

        Alert.alert('Success', 'Photo uploaded successfully');
      }
    } catch (err: any) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled
        return;
      }
      Alert.alert('Error', (err as Error).message || 'Failed to upload photo');
    }
  };

  const renderRecordingItem = ({ item }: { item: Recording }) => (
    <View style={styles.recordingItem}>
      <View style={styles.recordingInfo}>
        <View style={styles.recordingHeader}>
          <Text style={styles.recordingName}>{item.name}</Text>
          <View style={styles.badgesContainer}>
            {item.hasTranscript && (
              <View style={styles.transcriptBadge}>
                <Icon name="text-fields" size={16} color="#4CAF50" />
                <Text style={styles.transcriptBadgeText}>Transcript</Text>
              </View>
            )}
            {item.hasAIAnalysis && (
              <View style={styles.aiBadge}>
                <Icon name="psychology" size={16} color="#2196F3" />
                <Text style={styles.aiBadgeText}>AI Analysis</Text>
              </View>
            )}
            {item.aiEnhanced && (
              <View style={styles.enhancedBadge}>
                <Icon name="auto-awesome" size={16} color="#FF9800" />
                <Text style={styles.enhancedBadgeText}>Enhanced</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.recordingDetails}>
          {item.date.toLocaleDateString()} • {formatFileSize(item.size)}
        </Text>
      </View>
      <View style={styles.recordingActions}>
        {item.hasAIAnalysis && (
          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => viewAIAnalysis(item)}
          >
            <Icon name="psychology" size={24} color="#2196F3" />
          </TouchableOpacity>
        )}
        {item.hasTranscript && (
          <TouchableOpacity
            style={styles.scopeButton}
            onPress={() => generateScopeOfWork(item)}
            disabled={isGeneratingScope}
          >
            <Icon 
              name={isGeneratingScope ? "hourglass-empty" : "description"} 
              size={24} 
              color={isGeneratingScope ? "#cccccc" : "#FF9800"} 
            />
          </TouchableOpacity>
        )}
        {item.hasTranscript && (
          <TouchableOpacity
            style={styles.transcriptButton}
            onPress={() => viewTranscript(item)}
          >
            <Icon name="visibility" size={24} color="#4CAF50" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteRecording(item)}
        >
          <Icon name="delete" size={24} color="#ff4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.title}>Contractor Voice Notes</Text>
              <Text style={styles.subtitle}>Record client meetings & site consultations</Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowConsultations(true)}
              >
                <Icon name="event-note" size={24} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowSettings(true)}
              >
                <Icon name="settings" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.aiStatus}>
            <Icon name="psychology" size={16} color="#4CAF50" />
            <Text style={styles.aiStatusText}>AI Powered</Text>
          </View>
        </View>

        <View style={styles.recordingSection}>
          <View style={styles.recordingControls}>
            <TouchableOpacity
              style={[styles.recordButton, isRecording && styles.recordingButton]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Icon
                name={isRecording ? 'stop' : 'mic'}
                size={40}
                color={isRecording ? '#ff4444' : '#ffffff'}
              />
            </TouchableOpacity>
            
            <View style={styles.recordingInfo}>
              <Text style={styles.recordingStatus}>
                {isRecording ? 'Recording client meeting...' : 'Tap to start recording'}
              </Text>
              {isRecording && (
                <Text style={styles.recordingTime}>
                  {formatTime(currentRecordingTime)}
                </Text>
              )}
              {isTranscribing && (
                <View style={styles.transcriptionStatus}>
                  <Icon name="text-fields" size={16} color="#4CAF50" />
                  <Text style={styles.transcriptionText}>
                    Transcribing... ({transcriptEntries.length} entries)
                  </Text>
                </View>
              )}
            </View>
            {isRecording && currentConsultationId && (
              <TouchableOpacity
                style={styles.photoButton}
                onPress={handlePhotoUpload}
              >
                <Icon name="photo-camera" size={20} color="#fff" />
                <Text style={styles.photoButtonText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.recordingStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{recordings.length}</Text>
              <Text style={styles.statLabel}>Recordings</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {recordings.filter(rec => rec.hasTranscript).length}
              </Text>
              <Text style={styles.statLabel}>With Transcripts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {recordings.filter(rec => rec.hasAIAnalysis).length}
              </Text>
              <Text style={styles.statLabel}>AI Analyzed</Text>
            </View>
          </View>
        </View>

        <View style={styles.recordingsSection}>
          <Text style={styles.sectionTitle}>Client Meetings & Consultations</Text>
          <FlatList
            data={recordings}
            renderItem={renderRecordingItem}
            keyExtractor={(item) => item.id}
            style={styles.recordingsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Icon name="mic-off" size={64} color="#666" />
                <Text style={styles.emptyText}>No client meetings recorded yet</Text>
                <Text style={styles.emptySubtext}>Start recording your first client consultation</Text>
              </View>
            }
          />
        </View>
      </LinearGradient>

      <TranscriptViewer
        visible={showTranscript}
        onClose={() => setShowTranscript(false)}
        transcriptEntries={transcriptEntries}
        sessionId={currentSessionId}
      />

      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onApiKeySet={setHasOpenAIKey}
      />

      <AIAnalysisViewer
        visible={showAIAnalysis}
        onClose={() => setShowAIAnalysis(false)}
        analysis={aiAnalysis}
      />

      <OnboardingModal
        visible={showOnboarding}
        onComplete={handleOnboardingComplete}
      />

      <ScopeOfWorkViewer
        visible={showScopeOfWork}
        onClose={() => setShowScopeOfWork(false)}
        scopeOfWork={scopeOfWork}
        sessionId={currentSessionId}
      />

      <ContractorScopeViewer
        visible={showContractorScope}
        onClose={() => setShowContractorScope(false)}
        scopeOfWork={scopeOfWork}
        sessionId={currentSessionId}
      />

      <InteractiveScopeReview
        visible={showInteractiveReview}
        onClose={() => setShowInteractiveReview(false)}
        scopeOfWork={scopeOfWork}
        sessionId={currentSessionId}
        onScopeUpdated={handleScopeUpdated}
      />

      <VoiceAssistant
        onCommandExecuted={handleVoiceCommand}
        currentScreen={currentScreen}
      />

      <ConsultationScreen
        visible={showConsultations}
        onClose={() => setShowConsultations(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  gradient: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 15,
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
  },
  settingsButton: {
    padding: 8,
  },
  aiStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
    alignSelf: 'center',
  },
  aiStatusText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 6,
    fontWeight: '600',
  },
  recordingSection: {
    padding: 20,
    alignItems: 'center',
  },
  recordingControls: {
    alignItems: 'center',
    marginBottom: 30,
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  recordingButton: {
    backgroundColor: '#ff4444',
  },
  recordingInfo: {
    alignItems: 'center',
  },
  recordingStatus: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 8,
  },
  recordingTime: {
    fontSize: 24,
    color: '#4CAF50',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  photoButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  recordingStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#cccccc',
  },
  recordingsSection: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  recordingsList: {
    flex: 1,
  },
  recordingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  recordingInfo: {
    flex: 1,
  },
  recordingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  recordingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  transcriptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  transcriptBadgeText: {
    fontSize: 9,
    color: '#4CAF50',
    marginLeft: 2,
    fontWeight: '600',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  aiBadgeText: {
    fontSize: 9,
    color: '#2196F3',
    marginLeft: 2,
    fontWeight: '600',
  },
  enhancedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  enhancedBadgeText: {
    fontSize: 9,
    color: '#FF9800',
    marginLeft: 2,
    fontWeight: '600',
  },
  recordingDetails: {
    fontSize: 14,
    color: '#cccccc',
  },
  recordingActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiButton: {
    padding: 8,
    marginRight: 8,
  },
  scopeButton: {
    padding: 8,
    marginRight: 8,
  },
  transcriptButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  transcriptionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'center',
  },
  transcriptionText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 6,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});

export default App;
