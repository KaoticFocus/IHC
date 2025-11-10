import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import { Keyboard as KeyboardIcon } from '@mui/icons-material';

interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: KeyboardShortcut[] = [
  {
    keys: ['Ctrl', 'Shift', 'R'],
    description: 'Start/Stop recording',
    category: 'Recording',
  },
  {
    keys: ['Ctrl', 'S'],
    description: 'Open settings',
    category: 'Navigation',
  },
  {
    keys: ['Ctrl', 'M'],
    description: 'Go to main/dashboard',
    category: 'Navigation',
  },
  {
    keys: ['Ctrl', 'T'],
    description: 'Go to transcripts',
    category: 'Navigation',
  },
  {
    keys: ['Ctrl', 'D'],
    description: 'Go to documents',
    category: 'Navigation',
  },
  {
    keys: ['Esc'],
    description: 'Close modal/dialog',
    category: 'General',
  },
];

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  open,
  onClose,
}) => {
  const categories = Array.from(new Set(shortcuts.map(s => s.category)));

  const formatKeys = (keys: string[]) => {
    return keys.map((key, index) => (
      <React.Fragment key={index}>
        <Chip
          label={key}
          size="small"
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            height: 24,
          }}
        />
        {index < keys.length - 1 && (
          <Typography component="span" sx={{ mx: 0.5, color: 'text.secondary' }}>
            +
          </Typography>
        )}
      </React.Fragment>
    ));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <KeyboardIcon />
          <Typography variant="h6">Keyboard Shortcuts</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {categories.map((category, catIndex) => (
          <Box key={category} sx={{ mb: catIndex < categories.length - 1 ? 3 : 0 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>
              {category}
            </Typography>
            <List>
              {shortcuts
                .filter(s => s.category === category)
                .map((shortcut, index, arr) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 200 }}>
                          {formatKeys(shortcut.keys)}
                        </Box>
                        <ListItemText
                          primary={shortcut.description}
                          primaryTypographyProps={{
                            variant: 'body2',
                          }}
                        />
                      </Box>
                    </ListItem>
                    {index < arr.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
            </List>
            {catIndex < categories.length - 1 && <Divider sx={{ mt: 2 }} />}
          </Box>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

