import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { TranscriptViewer } from './components/TranscriptViewer';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './components/Dashboard';
import { RecordingVisualizer } from './components/RecordingVisualizer';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { TooltipProvider } from './context/TooltipContext';
import { useAuth } from './context/AuthContext';
import HybridStorageService from './services/HybridStorageService';
import { getSupabaseClient } from './services/SupabaseService';

// Lazy load heavy components for code splitting
const DocumentManager = lazy(() => import('./components/DocumentManager').then(m => ({ default: m.DocumentManager })));
const ProjectManagementScreen = lazy(() => import('./components/ProjectManagementScreen').then(m => ({ default: m.ProjectManagementScreen })));
const ConsultationScreen = lazy(() => import('./components/ConsultationScreen').then(m => ({ default: m.ConsultationScreen })));
const AppLayout = lazy(() => import('./components/AppLayout').then(m => ({ default: m.AppLayout })));
const AIAnalysisViewer = lazy(() => import('./components/AIAnalysisViewer').then(m => ({ default: m.AIAnalysisViewer })));
const ScopeOfWorkViewer = lazy(() => import('./components/ScopeOfWorkViewer').then(m => ({ default: m.ScopeOfWorkViewer })));
import StorageService from './services/StorageService';
import AudioService from './services/AudioService';
import EnhancedTranscriptionService, { EnhancedTranscript } from './services/EnhancedTranscriptionService';
import OpenAIService from './services/OpenAIService';
import CommandProcessor from './services/CommandProcessor';
import { ErrorService } from './services/ErrorService';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { ScopeOfWork } from './types/ScopeOfWork';
import { AIAnalysis } from './types/AIAnalysis';
import ConsultationService from './services/ConsultationService';
import ProjectManagementService from './services/ProjectManagementService';
import './utils/supabaseDiagnostics'; // Load diagnostics utility
import { SplashScreen } from './components/SplashScreen';

export const App: React.FC = () => {
  const auth = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('main');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcriptEntries, setTranscriptEntries] = useState<EnhancedTranscript[]>([]);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [showScopeOfWork, setShowScopeOfWork] = useState(false);
  const [scopeOfWork, setScopeOfWork] = useState<ScopeOfWork | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [hasOpenAIKey, setHasOpenAIKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingScope, setIsGeneratingScope] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const recordingStartTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [currentConsultationId, setCurrentConsultationId] = useState<string | null>(null);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  // Track if initialization has completed to prevent re-initialization
  const initializedRef = useRef(false);
  
  // Handle app visibility changes (when switching back to app)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // App is visible again - refresh auth session if needed (non-blocking)
        const supabase = getSupabaseClient();
        if (auth.user && supabase) {
          // Silently refresh session in background with timeout
          const refreshTimeout = setTimeout(() => {
            console.warn('[App] Session refresh timed out');
          }, 2000);
          
          supabase.auth.getSession()
            .then(() => {
              clearTimeout(refreshTimeout);
            })
            .catch(err => {
              clearTimeout(refreshTimeout);
              console.warn('[App] Failed to refresh session on visibility change:', err);
            });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [auth.user]);
  
  // Load leads on startup - only run once
  useEffect(() => {
    // Skip if already initialized or auth is still loading
    if (initializedRef.current || auth.loading) {
      return;
    }

    const initializeApp = async () => {
      try {
        setIsLoading(true);
        
        // Handle OAuth callback
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');
        
        if (error) {
          ErrorService.handleError(new Error(errorDescription || error), 'oauthCallback');
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } else if (accessToken) {
          // OAuth callback - session will be handled by AuthContext
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
          ErrorService.handleSuccess('Successfully signed in!');
        }
        
        // Setup command processor first (non-blocking)
        setupCommandProcessor();
        
        // Load audio settings (non-blocking, cached)
        AudioService.loadSettings().catch(err => {
          console.warn('[App] Failed to load audio settings:', err);
        });
        
        // Check OpenAI status (non-blocking)
        checkOpenAIStatus().catch(err => {
          console.warn('[App] Failed to check OpenAI status:', err);
        });
        
        // Enable cloud sync if authenticated (with timeout)
        if (auth.user) {
          const syncTimeout = setTimeout(() => {
            console.warn('[App] Cloud sync timed out, continuing without sync');
          }, 3000);
          
          try {
            await HybridStorageService.enableCloudSync();
            // Sync from cloud on startup (non-critical, can fail silently)
            HybridStorageService.syncFromCloud().catch(err => {
              console.warn('[App] Cloud sync failed:', err);
            });
          } catch (err) {
            console.warn('[App] Failed to enable cloud sync:', err);
          } finally {
            clearTimeout(syncTimeout);
          }
        }
        
        initializedRef.current = true;
        setIsLoading(false);
      } catch (error) {
        console.error('[App] Initialization error:', error);
        ErrorService.handleError(error, 'initializeApp');
        setIsLoading(false);
      }
    };
    
    initializeApp();
  }, [auth.user, auth.loading]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'r',
      ctrl: true,
      shift: true,
      action: () => {
        if (!isRecording) {
          startRecording();
        } else {
          stopRecording();
        }
      },
      description: 'Start/Stop recording',
    },
    {
      key: 's',
      ctrl: true,
      action: () => setSettingsOpen(true),
      description: 'Open settings',
    },
    {
      key: 'm',
      ctrl: true,
      action: () => setCurrentScreen('main'),
      description: 'Go to main',
    },
    {
      key: 't',
      ctrl: true,
      action: () => setCurrentScreen('transcripts'),
      description: 'Go to transcripts',
    },
    {
      key: 'd',
      ctrl: true,
      action: () => setCurrentScreen('documents'),
      description: 'Go to documents',
    },
  ]);

  const checkOpenAIStatus = async () => {
    const [hasKey, error] = await ErrorService.handleAsyncError(
      OpenAIService.hasApiKey(),
      'checkOpenAIStatus'
    );
    if (error) {
      setHasOpenAIKey(false);
    } else {
      setHasOpenAIKey(hasKey ?? false);
    }
  };

  const setupCommandProcessor = () => {
    CommandProcessor.setNavigationCallback((screen: string) => {
      handleScreenChange(screen);
    });

    CommandProcessor.setRecordingCallback((action: 'start' | 'stop') => {
      if (action === 'start') {
        // Check if project is selected before starting
        if (!currentProjectId) {
          // This will be handled by the command processor's response
          return;
        }
        startRecording(true); // Skip project check since it's already verified
      } else {
        stopRecording();
      }
    });

    CommandProcessor.setProjectCreationCallback(async (projectData: any) => {
      try {
        await ProjectManagementService.initialize();
        if (!ProjectManagementService.isAvailable()) {
          throw new Error('Project management requires authentication. Please sign in.');
        }

        const project = await ProjectManagementService.createProject({
          name: projectData.name || projectData.title || 'New Project',
          description: projectData.description,
          clientName: projectData.clientName,
          clientEmail: projectData.clientEmail,
          clientPhone: projectData.clientPhone,
          address: projectData.address,
          status: projectData.status || 'planning',
        });

        setCurrentProjectId(project.id);
        ErrorService.handleSuccess(`Project "${project.name}" created successfully`);
        
        // Navigate to projects screen
        handleScreenChange('projects');
      } catch (error) {
        ErrorService.handleError(error, 'createProject');
        throw error;
      }
    });

    CommandProcessor.setProjectSelectionCallback(async (projectId: string, projectName: string) => {
      try {
        await ProjectManagementService.initialize();
        if (!ProjectManagementService.isAvailable()) {
          throw new Error('Project management requires authentication. Please sign in.');
        }

        let selectedProjectId = projectId;
        
        // If no projectId provided, search for project by name
        if (!selectedProjectId && projectName) {
          const projects = await ProjectManagementService.getAllProjects();
          const matchingProject = projects.find(
            p => p.name.toLowerCase().includes(projectName.toLowerCase()) ||
                 projectName.toLowerCase().includes(p.name.toLowerCase())
          );
          
          if (!matchingProject) {
            throw new Error(`Project "${projectName}" not found`);
          }
          
          selectedProjectId = matchingProject.id;
        }

        if (!selectedProjectId) {
          throw new Error('Project not found');
        }

        setCurrentProjectId(selectedProjectId);
        
        // Get user's name from profile
        const userName = auth.profile?.first_name || auth.profile?.full_name?.split(' ')[0] || 'there';
        
        return { userName };
      } catch (error) {
        ErrorService.handleError(error, 'selectProject');
        throw error;
      }
    });

    CommandProcessor.setNoteDictationCallback(async (note: string, targetId?: string, targetType?: 'project' | 'consultation') => {
      try {
        const id = targetId || currentProjectId || currentConsultationId;
        const type = targetType || (currentProjectId ? 'project' : currentConsultationId ? 'consultation' : undefined);

        if (!id || !type) {
          // If no specific target, add to current consultation if recording, or show error
          if (currentConsultationId) {
            await ConsultationService.updateConsultation({
              id: currentConsultationId,
              notes: note,
            });
            ErrorService.handleSuccess('Note saved to consultation');
          } else {
            throw new Error('No project or consultation selected. Please select one first or start a recording.');
          }
          return;
        }

        if (type === 'project') {
          // For projects, we'd need to add a notes field or use description
          // For now, update the project description
          const project = await ProjectManagementService.getProject(id);
          if (project) {
            const updatedDescription = project.description 
              ? `${project.description}\n\nNote: ${note}`
              : `Note: ${note}`;
            await ProjectManagementService.updateProject({
              id,
              description: updatedDescription,
            });
            ErrorService.handleSuccess('Note added to project');
          }
        } else if (type === 'consultation') {
          await ConsultationService.updateConsultation({
            id,
            notes: note,
          });
          ErrorService.handleSuccess('Note saved to consultation');
        }
      } catch (error) {
        ErrorService.handleError(error, 'dictateNote');
        throw error;
      }
    });

    CommandProcessor.setPhotoDescriptionCallback(async (description: string, photoIds: string[]) => {
      try {
        const ids = photoIds.length > 0 ? photoIds : selectedPhotoIds;
        
        if (ids.length === 0) {
          throw new Error('No photos selected. Please select photos first.');
        }

        // Determine if photos are from consultation or project
        if (currentConsultationId) {
          for (const photoId of ids) {
            await ConsultationService.updatePhotoDescription(currentConsultationId, photoId, description);
          }
          ErrorService.handleSuccess(`Description saved for ${ids.length} photo${ids.length > 1 ? 's' : ''}`);
        } else if (currentProjectId) {
          for (const photoId of ids) {
            await ProjectManagementService.updateDocumentDescription(currentProjectId, photoId, description);
          }
          ErrorService.handleSuccess(`Description saved for ${ids.length} photo${ids.length > 1 ? 's' : ''}`);
        } else {
          throw new Error('No project or consultation context. Please open a project or consultation first.');
        }
      } catch (error) {
        ErrorService.handleError(error, 'describePhoto');
        throw error;
      }
    });

    CommandProcessor.setWorkDescriptionCallback(async (description: string, photoIds: string[]) => {
      try {
        const ids = photoIds.length > 0 ? photoIds : selectedPhotoIds;
        
        if (ids.length === 0) {
          throw new Error('No photos selected. Please select photos first.');
        }

        // Determine if photos are from consultation or project
        if (currentConsultationId) {
          await ConsultationService.updatePhotoWorkDescription(currentConsultationId, ids, description);
          ErrorService.handleSuccess(`Work description saved for ${ids.length} photo${ids.length > 1 ? 's' : ''}`);
        } else if (currentProjectId) {
          await ProjectManagementService.updateDocumentWorkDescription(currentProjectId, ids, description);
          ErrorService.handleSuccess(`Work description saved for ${ids.length} photo${ids.length > 1 ? 's' : ''}`);
        } else {
          throw new Error('No project or consultation context. Please open a project or consultation first.');
        }
      } catch (error) {
        ErrorService.handleError(error, 'describeWork');
        throw error;
      }
    });
  };

  const startRecording = async (skipProjectCheck: boolean = false) => {
    // Check if project is selected (required before recording)
    if (!skipProjectCheck && !currentProjectId) {
      ErrorService.handleError(
        new Error('Please select a project first. Say "Hey Flow, the following information will go under the [project name] job" before starting a recording.'),
        'startRecording'
      );
      return;
    }

    try {
      setIsRecording(true);
      recordingStartTimeRef.current = Date.now();
      setRecordingDuration(0);
      
      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(Date.now() - recordingStartTimeRef.current);
      }, 100);
      
      ErrorService.handleInfo('Starting recording...');
      
      const hasKey = await OpenAIService.hasApiKey();
      
      const [sessionId, error] = await ErrorService.handleAsyncError(
        EnhancedTranscriptionService.startTranscription(
          hasKey,
          (entries) => setTranscriptEntries(entries),
          (err) => ErrorService.handleError(err, 'transcription'),
          (analysis) => setAiAnalysis(analysis)
        ),
        'startTranscription'
      );
      
      if (error || !sessionId) {
        setIsRecording(false);
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
        }
        return;
      }
      
      setCurrentSessionId(sessionId);
      
      // Create or link consultation for this recording
      // Must be associated with a project (which has client info)
      if (auth.user && currentProjectId) {
        try {
          await ConsultationService.initialize();
          if (ConsultationService.isAvailable()) {
            // Get project info to populate client details
            const project = await ProjectManagementService.getProject(currentProjectId);
            const consultation = await ConsultationService.createConsultation({
              title: `Consultation - ${new Date().toLocaleDateString()}`,
              projectId: currentProjectId,
              consultationDate: new Date(),
              sessionId: sessionId,
              clientName: project?.clientName,
              clientEmail: project?.clientEmail,
              clientPhone: project?.clientPhone,
              address: project?.address,
            });
            setCurrentConsultationId(consultation.id);
          }
        } catch (err) {
          console.warn('Failed to create consultation:', err);
          // Continue with recording even if consultation creation fails
        }
      } else if (auth.user && !currentProjectId) {
        ErrorService.handleWarning('Please select a project before starting a recording. Images must be associated with a project and client.');
      }
      
      const [, audioError] = await ErrorService.handleAsyncError(
        AudioService.startRecording(),
        'startAudioRecording'
      );
      
      if (audioError) {
        setIsRecording(false);
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
        }
        return;
      }
      
      ErrorService.handleSuccess('Recording started');
    } catch (error) {
      ErrorService.handleError(error, 'startRecording');
      setIsRecording(false);
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      
      // Stop duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      
      ErrorService.handleInfo('Stopping recording...');
      
      const [recordingId, recordingError] = await ErrorService.handleAsyncError(
        AudioService.stopRecording(),
        'stopAudioRecording'
      );
      
      if (recordingError) {
        return;
      }
      
      if (recordingId && hasOpenAIKey) {
        const audioBlob = AudioService.getCurrentAudioBlob();
        if (audioBlob) {
          const [enhanced, enhanceError] = await ErrorService.handleAsyncError(
            EnhancedTranscriptionService.enhanceWithOpenAI(audioBlob),
            'enhanceWithOpenAI'
          );
          
          if (!enhanceError && enhanced) {
            setTranscriptEntries(enhanced.enhancedTranscript);
            setAiAnalysis(enhanced.aiAnalysis);
          }
        }
      }
      
      const [finalEntries, stopError] = await ErrorService.handleAsyncError(
        EnhancedTranscriptionService.stopTranscription(),
        'stopTranscription'
      );
      
      if (!stopError && finalEntries) {
        setTranscriptEntries(finalEntries);
        
        if (currentSessionId && finalEntries.length > 0) {
          await ErrorService.handleAsyncError(
            EnhancedTranscriptionService.saveEnhancedTranscript(
              currentSessionId,
              finalEntries,
              aiAnalysis
            ),
            'saveTranscript'
          );
        }
      }
      
      // Update consultation with recording ID if available
      if (currentConsultationId && recordingId && auth.user) {
        try {
          await ConsultationService.initialize();
          if (ConsultationService.isAvailable()) {
            await ConsultationService.updateConsultation({
              id: currentConsultationId,
              recordingId: recordingId,
            });
          }
        } catch (err) {
          console.warn('Failed to update consultation with recording:', err);
        }
      }
      
      ErrorService.handleSuccess('Recording stopped and saved');
    } catch (error) {
      ErrorService.handleError(error, 'stopRecording');
    }
  };

  const handlePhotoUpload = async (file: File) => {
    // Ensure we have a project selected (required for client association)
    if (!currentProjectId) {
      ErrorService.handleError(
        new Error('Please select a project first. Images must be associated with a project and client.'),
        'uploadPhoto'
      );
      return;
    }

    if (!auth.user) {
      ErrorService.handleWarning('Please sign in to upload photos');
      return;
    }

    try {
      // If we have a consultation, upload to it (it's already linked to project)
      if (currentConsultationId) {
        await ConsultationService.initialize();
        if (!ConsultationService.isAvailable()) {
          ErrorService.handleWarning('Consultation service not available. Please sign in.');
          return;
        }

        ErrorService.handleInfo('Uploading photo...');
        await ConsultationService.uploadPhoto(currentConsultationId, file);
        ErrorService.handleSuccess('Photo uploaded successfully');
      } else {
        // No consultation, upload directly to project
        await ProjectManagementService.initialize();
        if (!ProjectManagementService.isAvailable()) {
          ErrorService.handleWarning('Project management not available. Please sign in.');
          return;
        }

        ErrorService.handleInfo('Uploading photo to project...');
        await ProjectManagementService.uploadDocument(currentProjectId, file);
        ErrorService.handleSuccess('Photo uploaded successfully to project');
      }
    } catch (error) {
      ErrorService.handleError(error, 'uploadPhoto');
    }
  };

  const generateScopeOfWork = async () => {
    try {
      if (transcriptEntries.length === 0) {
        ErrorService.handleWarning('No transcript available. Please record a conversation first.');
        return;
      }

      setIsGeneratingScope(true);
      ErrorService.handleInfo('Generating scope of work...');

      const fullTranscript = transcriptEntries.map(e => e.text).join(' ');
      const [scope, error] = await ErrorService.handleAsyncError(
        OpenAIService.generateScopeOfWork(fullTranscript),
        'generateScopeOfWork'
      );
      
      if (error || !scope) {
        return;
      }
      
      setScopeOfWork({ ...scope, currentView: 'homeowner' });
      setShowScopeOfWork(true);
      ErrorService.handleSuccess('Scope of work generated successfully');
    } catch (error) {
      ErrorService.handleError(error, 'generateScopeOfWork');
    } finally {
      setIsGeneratingScope(false);
    }
  };

  const handleScreenChange = (screen: string) => {
    setCurrentScreen(screen);
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  // Load saved transcripts for dashboard
  const [savedTranscripts, setSavedTranscripts] = useState<EnhancedTranscript[]>([]);
  useEffect(() => {
    const loadTranscripts = async () => {
      try {
        const transcripts = await StorageService.getAllTranscripts();
        if (transcripts && transcripts.length > 0) {
          const allEntries: EnhancedTranscript[] = [];
          transcripts.forEach((t: any) => {
            if (t.entries && Array.isArray(t.entries)) {
              allEntries.push(...t.entries);
            }
          });
          setSavedTranscripts(allEntries);
        }
      } catch (error) {
        console.error('Error loading transcripts:', error);
      }
    };
    loadTranscripts();
  }, []);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      )}
      <TooltipProvider>
        <Suspense fallback={
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <CircularProgress />
          </Box>
        }>
          <AppLayout
            onScreenChange={handleScreenChange}
            onSettingsClick={() => setSettingsOpen(true)}
            currentScreen={currentScreen}
          >
        {currentScreen === 'main' && (
          <Box>
            <Box sx={{ mb: 3 }}>
              <RecordingVisualizer
                isRecording={isRecording}
                duration={recordingDuration}
                onStart={startRecording}
                onStop={stopRecording}
                onPhotoUpload={handlePhotoUpload}
              />
            </Box>
            
            <Dashboard
              transcripts={[...transcriptEntries, ...savedTranscripts]}
              isRecording={isRecording}
              recordingDuration={recordingDuration}
              onNavigate={handleScreenChange}
              onStartRecording={startRecording}
            />

            {transcriptEntries.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Box
                    component="button"
                    onClick={async () => {
                      setIsAnalyzing(true);
                      const fullTranscript = transcriptEntries.map(e => e.text).join(' ');
                      const [analysis, error] = await ErrorService.handleAsyncError(
                        OpenAIService.analyzeConversation(fullTranscript),
                        'analyzeConversation'
                      );
                      if (!error && analysis) {
                        setAiAnalysis(analysis);
                        setShowAIAnalysis(true);
                      }
                      setIsAnalyzing(false);
                    }}
                    disabled={isAnalyzing}
                    sx={{
                      p: 1.5,
                      bgcolor: 'primary.main',
                      color: 'white',
                      border: 'none',
                      borderRadius: 2,
                      cursor: isAnalyzing ? 'wait' : 'pointer',
                      opacity: isAnalyzing ? 0.7 : 1,
                      '&:hover': { bgcolor: 'primary.dark' },
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      fontWeight: 'medium',
                    }}
                  >
                    {isAnalyzing && <CircularProgress size={16} />}
                    View AI Analysis
                  </Box>
                  <Box
                    component="button"
                    onClick={generateScopeOfWork}
                    disabled={isGeneratingScope}
                    sx={{
                      p: 1.5,
                      bgcolor: 'warning.main',
                      color: 'white',
                      border: 'none',
                      borderRadius: 2,
                      cursor: isGeneratingScope ? 'wait' : 'pointer',
                      opacity: isGeneratingScope ? 0.7 : 1,
                      '&:hover': { bgcolor: 'warning.dark' },
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      fontWeight: 'medium',
                    }}
                  >
                    {isGeneratingScope && <CircularProgress size={16} />}
                    Generate Scope
                  </Box>
                </Box>
                <TranscriptViewer entries={transcriptEntries} />
              </Box>
            )}
          </Box>
        )}

        {currentScreen === 'projects' && (
          <Suspense fallback={<CircularProgress />}>
            <ProjectManagementScreen />
          </Suspense>
        )}

        {currentScreen === 'documents' && (
          <Suspense fallback={<CircularProgress />}>
            <DocumentManager />
          </Suspense>
        )}

        {currentScreen === 'transcripts' && (
          <TranscriptViewer />
        )}

        {currentScreen === 'consultations' && (
          <Suspense fallback={<CircularProgress />}>
            <ConsultationScreen 
              currentProjectId={currentProjectId}
              onPhotoSelectionChange={(photoIds) => setSelectedPhotoIds(photoIds)}
              onConsultationSelect={(consultationId) => {
                setCurrentConsultationId(consultationId);
              }}
            />
          </Suspense>
        )}

        {currentScreen === 'clients' && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Clients</Typography>
            <Typography variant="body1" color="text.secondary">
              Client management coming soon...
            </Typography>
          </Box>
        )}

        {currentScreen === 'tasks' && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Tasks</Typography>
            <Typography variant="body1" color="text.secondary">
              Task management coming soon...
            </Typography>
          </Box>
        )}

          <SettingsModal
            open={settingsOpen}
            onClose={() => {
              setSettingsOpen(false);
              checkOpenAIStatus();
            }}
          />

          <AuthModal
            open={authOpen}
            onClose={() => setAuthOpen(false)}
          />

          <KeyboardShortcutsModal
            open={shortcutsOpen}
            onClose={() => setShortcutsOpen(false)}
          />

          <Suspense fallback={null}>
            <AIAnalysisViewer
              open={showAIAnalysis}
              onClose={() => setShowAIAnalysis(false)}
              analysis={aiAnalysis}
            />
          </Suspense>

          <Suspense fallback={null}>
            <ScopeOfWorkViewer
              open={showScopeOfWork}
              onClose={() => setShowScopeOfWork(false)}
              scopeOfWork={scopeOfWork}
              sessionId={currentSessionId}
            />
          </Suspense>
        </AppLayout>
      </Suspense>
    </TooltipProvider>
    </>
  );
};

