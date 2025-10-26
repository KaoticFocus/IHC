import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { TranscriptEntry } from '../services/TranscriptionService';
import TranscriptionService from '../services/TranscriptionService';
import AudioService from '../services/AudioService';

const { ipcRenderer } = window.require('electron');

export const TranscriptViewer: React.FC = () => {
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  useEffect(() => {
    const session = TranscriptionService.getCurrentSession();
    if (session) {
      setEntries(session.entries);
      setCurrentSessionId(session.id);
    }
  }, []);

  const handleStartRecording = async () => {
    try {
      const sessionId = await TranscriptionService.startTranscription(
        (updatedEntries) => setEntries(updatedEntries),
        (error) => console.error('Transcription error:', error)
      );
      setCurrentSessionId(sessionId);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handleStopRecording = async () => {
    try {
      const updatedEntries = await TranscriptionService.stopTranscription();
      setEntries(updatedEntries);
      setIsRecording(false);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const handleSaveTranscript = async () => {
    try {
      const savePath = await ipcRenderer.invoke('select-directory');
      if (savePath) {
        // Format transcript
        const transcript = entries.map(entry => 
          `[${new Date(entry.timestamp).toLocaleTimeString()}] ${entry.speaker}: ${entry.text}`
        ).join('\n\n');

        // Save file
        await ipcRenderer.invoke('save-file', {
          path: `${savePath}/transcript_${Date.now()}.txt`,
          content: transcript
        });

        setShowSaveDialog(false);
      }
    } catch (error) {
      console.error('Failed to save transcript:', error);
    }
  };

  const handleDeleteTranscript = () => {
    setEntries([]);
    setCurrentSessionId(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Transcript</Typography>
          <Box>
            <IconButton
              color={isRecording ? 'secondary' : 'primary'}
              onClick={isRecording ? handleStopRecording : handleStartRecording}
            >
              {isRecording ? <StopIcon /> : <PlayIcon />}
            </IconButton>
            <IconButton
              onClick={() => setShowSaveDialog(true)}
              disabled={entries.length === 0}
            >
              <SaveIcon />
            </IconButton>
            <IconButton
              onClick={handleDeleteTranscript}
              disabled={entries.length === 0}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>

        <List sx={{ maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
          {entries.map((entry) => (
            <ListItem key={entry.id}>
              <ListItemText
                primary={entry.text}
                secondary={`${entry.speaker} - ${new Date(entry.timestamp).toLocaleTimeString()}`}
              />
            </ListItem>
          ))}
        </List>

        <Dialog open={showSaveDialog} onClose={() => setShowSaveDialog(false)}>
          <DialogTitle>Save Transcript</DialogTitle>
          <DialogContent>
            <Typography>
              Choose a location to save the transcript file.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowSaveDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveTranscript} variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};