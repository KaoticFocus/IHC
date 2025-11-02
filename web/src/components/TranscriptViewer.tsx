import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { EnhancedTranscript } from '../services/EnhancedTranscriptionService';
import { useSearch } from '../hooks/useSearch';
import { useConfirmation } from './ConfirmationDialog';
import { ExportService } from '../services/ExportService';
import { ErrorService } from '../services/ErrorService';

interface TranscriptViewerProps {
  entries?: EnhancedTranscript[];
  onViewTranscript?: () => void;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({ 
  entries: externalEntries = [],
  onViewTranscript 
}) => {
  const [entries, setEntries] = useState<EnhancedTranscript[]>(externalEntries);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const { confirm, ConfirmationDialog } = useConfirmation();

  useEffect(() => {
    if (externalEntries.length > 0) {
      setEntries(externalEntries);
    }
  }, [externalEntries]);

  const filteredEntries = useSearch(entries, searchTerm, ['text', 'speaker'], 300);

  const formattedTranscript = useMemo(() => {
    return filteredEntries.map(entry => {
      const time = formatTime(entry.timestamp);
      const aiIndicator = entry.aiEnhanced ? ' [AI Enhanced]' : '';
      const roleIndicator = entry.speakerRole ? ` (${entry.speakerRole})` : '';
      return `[${time}] ${entry.speaker}${roleIndicator}${aiIndicator}: ${entry.text}`;
    }).join('\n\n');
  }, [filteredEntries]);

  const handleSaveTranscript = useCallback((format: 'txt' | 'json' = 'txt') => {
    if (entries.length === 0) return;

    try {
      if (format === 'json') {
        ExportService.exportToJSON(
          { entries: filteredEntries, exportedAt: new Date().toISOString() },
          `transcript_${Date.now()}.json`
        );
      } else {
        ExportService.exportTranscript(formattedTranscript, `transcript_${Date.now()}.txt`);
      }
      ErrorService.handleSuccess('Transcript exported successfully');
    } catch (error) {
      ErrorService.handleError(error, 'exportTranscript');
    }
    setExportMenuAnchor(null);
  }, [entries, filteredEntries, formattedTranscript]);

  const handleDeleteTranscript = useCallback(() => {
    confirm(
      'Are you sure you want to delete this transcript? This action cannot be undone.',
      () => {
        setEntries([]);
        ErrorService.handleSuccess('Transcript deleted');
      },
      { severity: 'error', confirmText: 'Delete' }
    );
  }, [confirm]);

  const handleViewTranscript = () => {
    if (onViewTranscript) {
      onViewTranscript();
    } else {
      setViewDialogOpen(true);
    }
  };

  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6">Transcript ({entries.length} entries)</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {entries.length > 0 && (
              <TextField
                size="small"
                placeholder="Search transcript..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 200 }}
              />
            )}
            {entries.length > 0 && (
              <IconButton
                onClick={handleViewTranscript}
                size="small"
                aria-label="View full transcript"
              >
                <VisibilityIcon />
              </IconButton>
            )}
            <IconButton
              onClick={(e) => setExportMenuAnchor(e.currentTarget)}
              disabled={entries.length === 0}
              size="small"
              aria-label="Export transcript"
            >
              <DownloadIcon />
            </IconButton>
            <IconButton
              onClick={handleDeleteTranscript}
              disabled={entries.length === 0}
              size="small"
              aria-label="Delete transcript"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>

        <Menu
          anchorEl={exportMenuAnchor}
          open={Boolean(exportMenuAnchor)}
          onClose={() => setExportMenuAnchor(null)}
        >
          <MenuItem onClick={() => handleSaveTranscript('txt')}>
            Export as TXT
          </MenuItem>
          <MenuItem onClick={() => handleSaveTranscript('json')}>
            Export as JSON
          </MenuItem>
        </Menu>

        <List sx={{ maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
          {filteredEntries.slice(0, 5).map((entry) => (
            <ListItem key={entry.id}>
              <ListItemText
                primary={entry.text}
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                    <Chip label={entry.speaker} size="small" variant="outlined" />
                    {entry.speakerRole && (
                      <Chip label={entry.speakerRole} size="small" variant="outlined" />
                    )}
                    <Typography variant="caption">{formatTime(entry.timestamp)}</Typography>
                    {entry.aiEnhanced && (
                      <Chip label="AI Enhanced" size="small" color="primary" />
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))}
          {filteredEntries.length > 5 && (
            <Box sx={{ textAlign: 'center', py: 1 }}>
              <Typography variant="caption" color="text.secondary">
                ... and {filteredEntries.length - 5} more entries
              </Typography>
              <Button
                variant="text"
                size="small"
                onClick={handleViewTranscript}
                sx={{ mt: 1 }}
              >
                View All
              </Button>
            </Box>
          )}
        </List>

        <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Full Transcript ({filteredEntries.length} entries)
            {searchTerm && ` - Filtered: "${searchTerm}"`}
          </DialogTitle>
          <DialogContent>
            <List>
              {filteredEntries.map((entry) => (
                <ListItem key={entry.id}>
                  <ListItemText
                    primary={entry.text}
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                        <Chip label={entry.speaker} size="small" variant="outlined" />
                        {entry.speakerRole && (
                          <Chip label={entry.speakerRole} size="small" variant="outlined" />
                        )}
                        <Typography variant="caption">{formatTime(entry.timestamp)}</Typography>
                        {entry.aiEnhanced && (
                          <Chip label="AI Enhanced" size="small" color="primary" />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => handleSaveTranscript('txt')}>Download as TXT</Button>
            <Button onClick={() => handleSaveTranscript('json')}>Download as JSON</Button>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {entries.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No transcript entries yet.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use the voice assistant to start recording a conversation.
            </Typography>
          </Box>
        )}
      </Paper>

      <ConfirmationDialog />
    </Box>
  );
};
