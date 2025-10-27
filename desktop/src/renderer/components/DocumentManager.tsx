import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  VolumeUp as ReadIcon,
  Mic as MicIcon,
  Stop as StopIcon,
} from '@mui/icons-material';

const { ipcRenderer } = window.require('electron');

interface Document {
  id: string;
  name: string;
  path: string;
  type: string;
  uploadedAt: number;
  content?: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  isDictated: boolean;
}

export const DocumentManager: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [isReading, setIsReading] = useState(false);

  const handleUploadDocument = async () => {
    try {
      const result = await ipcRenderer.invoke('select-file', {
        filters: [
          { name: 'Documents', extensions: ['pdf', 'docx', 'doc', 'txt'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result.success && result.filePath) {
        // Read file content
        const contentResult = await ipcRenderer.invoke('read-file-content', result.filePath);
        
        if (contentResult.success) {
          const newDoc: Document = {
            id: `doc_${Date.now()}`,
            name: result.fileName,
            path: result.filePath,
            type: result.fileType,
            uploadedAt: Date.now(),
            content: contentResult.content,
          };
          
          setDocuments([...documents, newDoc]);
        }
      }
    } catch (error) {
      console.error('Failed to upload document:', error);
    }
  };

  const handleViewDocument = (doc: Document) => {
    setSelectedDoc(doc);
    setViewDialogOpen(true);
  };

  const handleReadDocument = async (doc: Document) => {
    try {
      if (isReading) {
        await ipcRenderer.invoke('stop-reading');
        setIsReading(false);
        return;
      }

      if (doc.content) {
        setIsReading(true);
        await ipcRenderer.invoke('read-text-aloud', doc.content);
        setIsReading(false);
      }
    } catch (error) {
      console.error('Failed to read document:', error);
      setIsReading(false);
    }
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id));
  };

  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  const handleStartDictation = async () => {
    try {
      setIsDictating(true);
      const result = await ipcRenderer.invoke('start-recording');
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create MediaRecorder
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      
      // Clear previous chunks
      setAudioChunks([]);
      
      // Handle data available event
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };
      
      // Start recording
      recorder.start();
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsDictating(false);
    }
  };

  const handleStopDictation = async () => {
    try {
      if (!mediaRecorder) {
        throw new Error('No active recording');
      }

      // Create a Promise that resolves when recording stops
      const recordingStoppedPromise = new Promise<Blob>((resolve) => {
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          resolve(audioBlob);
        };
      });

      // Stop the recording
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setMediaRecorder(null);

      // Wait for the recording data
      const audioBlob = await recordingStoppedPromise;
      
      // Convert Blob to ArrayBuffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Save the recording
      const result = await ipcRenderer.invoke('stop-recording', uint8Array);
      
      if (result.success && result.audioPath) {
        // Save the voice note
        const newNote: Note = {
          id: `note_${Date.now()}`,
          title: `Voice Note ${new Date().toLocaleString()}`,
          content: result.audioPath,
          createdAt: Date.now(),
          isDictated: true,
        };
        
        setNotes(prev => [...prev, newNote]);
        setNoteDialogOpen(false);
        console.log('Voice note saved:', newNote);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    } finally {
      setIsDictating(false);
      setAudioChunks([]);
    }
  };

  const handleAnalyzeDocument = async (doc: Document) => {
    try {
      if (doc.content) {
        const result = await ipcRenderer.invoke('analyze-document', doc.content);
        
        if (result.success) {
          alert(`Document Analysis:\n\nSummary: ${result.summary}\n\nKey Points:\n${result.keyPoints.join('\n')}`);
        }
      }
    } catch (error) {
      console.error('Failed to analyze document:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Documents</Typography>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={handleUploadDocument}
          >
            Upload Document
          </Button>
        </Box>

        <List>
          {documents.map((doc) => (
            <ListItem key={doc.id}>
              <ListItemText
                primary={doc.name}
                secondary={`Uploaded: ${new Date(doc.uploadedAt).toLocaleString()}`}
              />
              <ListItemSecondaryAction>
                <IconButton onClick={() => handleViewDocument(doc)}>
                  <ViewIcon />
                </IconButton>
                <IconButton 
                  onClick={() => handleReadDocument(doc)}
                  color={isReading ? 'secondary' : 'default'}
                >
                  <ReadIcon />
                </IconButton>
                <IconButton onClick={() => handleAnalyzeDocument(doc)}>
                  <Chip label="AI" size="small" />
                </IconButton>
                <IconButton onClick={() => handleDeleteDocument(doc.id)}>
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>

        {documents.length === 0 && (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
            No documents uploaded yet. Click "Upload Document" to add one.
          </Typography>
        )}
      </Paper>

      <Paper elevation={2} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Voice Notes</Typography>
          <Button
            variant="contained"
            startIcon={<MicIcon />}
            onClick={() => setNoteDialogOpen(true)}
          >
            New Voice Note
          </Button>
        </Box>

        <List>
          {notes.map((note) => (
            <ListItem key={note.id}>
              <ListItemText
                primary={note.title}
                secondary={`Created: ${new Date(note.createdAt).toLocaleString()}`}
              />
              <ListItemSecondaryAction>
                <IconButton 
                  onClick={() => ipcRenderer.invoke('play-audio', note.content)}
                  color="primary"
                >
                  <ReadIcon />
                </IconButton>
                <IconButton 
                  onClick={() => setNotes(notes.filter(n => n.id !== note.id))}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
          {notes.length === 0 && (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
              No voice notes yet. Click "New Voice Note" to record one.
            </Typography>
          )}
        </List>
      </Paper>

      {/* View Document Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedDoc?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {selectedDoc?.content}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          <Button onClick={() => selectedDoc && handleReadDocument(selectedDoc)} startIcon={<ReadIcon />}>
            Read Aloud
          </Button>
        </DialogActions>
      </Dialog>

      {/* Voice Note Dialog */}
      <Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Voice Note</DialogTitle>
        <DialogContent>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            py: 4 
          }}>
            {isDictating && (
              <Box sx={{ mb: 3, display: 'flex', gap: 0.5, height: 30, alignItems: 'center' }}>
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
            )}
            <IconButton
              color={isDictating ? 'error' : 'primary'}
              size="large"
              onClick={isDictating ? handleStopDictation : handleStartDictation}
              sx={{
                width: 80,
                height: 80,
                bgcolor: isDictating ? 'error.main' : 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: isDictating ? 'error.dark' : 'primary.dark',
                },
                animation: isDictating ? 'pulse 1.5s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(244, 67, 54, 0.7)' },
                  '50%': { transform: 'scale(1.05)', boxShadow: '0 0 0 10px rgba(244, 67, 54, 0)' },
                  '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(244, 67, 54, 0)' },
                },
              }}
            >
              {isDictating ? <StopIcon sx={{ fontSize: 40 }} /> : <MicIcon sx={{ fontSize: 40 }} />}
            </IconButton>
            <Typography variant="h6" sx={{ mt: 2, color: isDictating ? 'error.main' : 'text.primary' }}>
              {isDictating ? '🔴 Recording...' : 'Click to Start Recording'}
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};
