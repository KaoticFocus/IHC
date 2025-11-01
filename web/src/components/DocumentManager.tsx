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
} from '@mui/material';
import {
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';

interface Document {
  id: string;
  name: string;
  content: string;
  type: string;
  uploadedAt: number;
}

export const DocumentManager: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUploadDocument = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const newDoc: Document = {
        id: `doc_${Date.now()}`,
        name: file.name,
        content: text,
        type: file.type,
        uploadedAt: Date.now(),
      };
      
      setDocuments([...documents, newDoc]);
    } catch (error) {
      console.error('Failed to read file:', error);
    }
  };

  const handleViewDocument = (doc: Document) => {
    setSelectedDoc(doc);
    setViewDialogOpen(true);
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Documents</Typography>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={handleUploadDocument}
          >
            Upload Document
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,.doc,.docx"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
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

      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedDoc?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {selectedDoc?.content}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

