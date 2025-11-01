import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

interface TranscriptEntry {
  id: string;
  text: string;
  timestamp: number;
  speaker: string;
}

export const TranscriptViewer: React.FC = () => {
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);

  const handleSaveTranscript = () => {
    if (entries.length === 0) return;

    const transcript = entries.map(entry => 
      `[${new Date(entry.timestamp).toLocaleTimeString()}] ${entry.speaker}: ${entry.text}`
    ).join('\n\n');

    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteTranscript = () => {
    setEntries([]);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Transcript</Typography>
          <Box>
            <IconButton
              onClick={handleSaveTranscript}
              disabled={entries.length === 0}
            >
              <DownloadIcon />
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

        {entries.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No transcript entries yet. Use the voice assistant to start recording.
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

