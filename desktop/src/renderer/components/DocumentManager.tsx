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

  const handleStartDictation = async () => {
    try {
      setIsDictating(true);
      const result = await ipcRenderer.invoke('start-recording');
      
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to start dictation:', error);
      setIsDictating(false);
    }
  };

  const handleStopDictation = async () => {
    try {
      const result = await ipcRenderer.invoke('stop-recording');
      
      if (result.success && result.audioPath) {
        // Transcribe the audio
        const transcription = await ipcRenderer.invoke('transcribe-audio', result.audioPath);
        
        if (transcription.success) {
          setCurrentNote(currentNote + ' ' + transcription.text);
        }
      }
      
      setIsDictating(false);
    } catch (error) {
      console.error('Failed to stop dictation:', error);
      setIsDictating(false);
    }
  };

  const handleSaveNote = () => {
    const newNote: Note = {
      id: `note_${Date.now()}`,
      title: noteTitle || 'Untitled Note',
      content: currentNote,
      createdAt: Date.now(),
      isDictated: true,
    };
    
    setNotes([...notes, newNote]);
    setCurrentNote('');
    setNoteTitle('');
    setNoteDialogOpen(false);
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
                secondary={`${new Date(note.createdAt).toLocaleString()} • ${note.content.substring(0, 100)}...`}
              />
              <ListItemSecondaryAction>
                <IconButton onClick={() => handleReadDocument({ ...note, content: note.content } as any)}>
                  <ReadIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
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
        <DialogTitle>Create Voice Note</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Note Title"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Note Content"
            value={currentNote}
            onChange={(e) => setCurrentNote(e.target.value)}
            margin="normal"
            multiline
            rows={6}
          />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <IconButton
              color={isDictating ? 'secondary' : 'primary'}
              size="large"
              onClick={isDictating ? handleStopDictation : handleStartDictation}
              sx={{ width: 64, height: 64 }}
            >
              {isDictating ? <StopIcon fontSize="large" /> : <MicIcon fontSize="large" />}
            </IconButton>
          </Box>
          <Typography variant="caption" display="block" align="center" sx={{ mt: 1 }}>
            {isDictating ? 'Recording... Click to stop' : 'Click microphone to start dictation'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveNote} variant="contained" disabled={!currentNote}>
            Save Note
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
