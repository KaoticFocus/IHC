import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
  Alert,
  ImageList,
  ImageListItem,
  ImageListItemBar,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Visibility as ViewIcon,
  Note as NoteIcon,
  Mic as MicIcon,
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';
import { Consultation, CreateConsultationInput } from '../types/Consultation';
import ConsultationService from '../services/ConsultationService';
import { useAuth } from '../context/AuthContext';

export const ConsultationScreen: React.FC = () => {
  const auth = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [uploadPhotoDialogOpen, setUploadPhotoDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [consultationForm, setConsultationForm] = useState<CreateConsultationInput>({
    title: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    address: '',
    consultationDate: new Date(),
    notes: '',
  });

  const [notesText, setNotesText] = useState('');

  useEffect(() => {
    if (auth.user) {
      loadConsultations();
    } else {
      setError('Please sign in to manage consultations');
      setLoading(false);
    }
  }, [auth.user]);

  const loadConsultations = async () => {
    try {
      setLoading(true);
      setError(null);
      await ConsultationService.initialize();
      
      if (!ConsultationService.isAvailable()) {
        setError('Consultation management requires Supabase authentication. Please sign in.');
        setLoading(false);
        return;
      }

      const allConsultations = await ConsultationService.getAllConsultations();
      setConsultations(allConsultations);
    } catch (err) {
      console.error('Error loading consultations:', err);
      setError((err as Error).message || 'Failed to load consultations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConsultation = async () => {
    try {
      setError(null);
      const newConsultation = await ConsultationService.createConsultation(consultationForm);
      setConsultations([newConsultation, ...consultations]);
      setCreateDialogOpen(false);
      setConsultationForm({
        title: '',
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        address: '',
        consultationDate: new Date(),
        notes: '',
      });
    } catch (err) {
      setError((err as Error).message || 'Failed to create consultation');
    }
  };

  const handleDeleteConsultation = async (consultationId: string) => {
    if (!window.confirm('Are you sure you want to delete this consultation? All photos and notes will be deleted.')) {
      return;
    }

    try {
      setError(null);
      await ConsultationService.deleteConsultation(consultationId);
      setConsultations(consultations.filter(c => c.id !== consultationId));
    } catch (err) {
      setError((err as Error).message || 'Failed to delete consultation');
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedConsultation) return;

    try {
      setUploading(true);
      setError(null);
      await ConsultationService.uploadPhoto(
        selectedConsultation.id,
        file
      );
      
      // Update consultation with new photo
      const updatedConsultation = await ConsultationService.getConsultation(selectedConsultation.id);
      if (updatedConsultation) {
        setConsultations(consultations.map(c => c.id === updatedConsultation.id ? updatedConsultation : c));
        setSelectedConsultation(updatedConsultation);
      }
      
      setUploadPhotoDialogOpen(false);
    } catch (err) {
      setError((err as Error).message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (consultationId: string, photoId: string) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      setError(null);
      await ConsultationService.deletePhoto(consultationId, photoId);
      
      // Reload consultation
      const updatedConsultation = await ConsultationService.getConsultation(consultationId);
      if (updatedConsultation) {
        setConsultations(consultations.map(c => c.id === updatedConsultation.id ? updatedConsultation : c));
        if (selectedConsultation?.id === consultationId) {
          setSelectedConsultation(updatedConsultation);
        }
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to delete photo');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedConsultation) return;

    try {
      setError(null);
      await ConsultationService.updateConsultation({
        id: selectedConsultation.id,
        notes: notesText,
      });
      
      // Reload consultation
      const updatedConsultation = await ConsultationService.getConsultation(selectedConsultation.id);
      if (updatedConsultation) {
        setConsultations(consultations.map(c => c.id === updatedConsultation.id ? updatedConsultation : c));
        setSelectedConsultation(updatedConsultation);
      }
      
      setNotesDialogOpen(false);
    } catch (err) {
      setError((err as Error).message || 'Failed to save notes');
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!auth.user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Please sign in to manage consultations. Consultation data is stored securely in Supabase.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Consultations</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          New Consultation
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {consultations.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <MicIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No consultations yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create your first consultation to start tracking meetings with homeowners
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Consultation
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {consultations.map((consultation) => (
            <Grid item xs={12} md={6} lg={4} key={consultation.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                    <Typography variant="h6" component="div">
                      {consultation.title}
                    </Typography>
                    {consultation.hasRecording && (
                      <Chip
                        icon={<MicIcon />}
                        label="Recorded"
                        color="success"
                        size="small"
                      />
                    )}
                  </Box>
                  {consultation.clientName && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Client:</strong> {consultation.clientName}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {formatDate(consultation.consultationDate)}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Chip
                      icon={<PhotoCameraIcon />}
                      label={`${consultation.photos.length} photos`}
                      size="small"
                      variant="outlined"
                    />
                    {consultation.notes && (
                      <Chip
                        icon={<NoteIcon />}
                        label="Has notes"
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<PhotoCameraIcon />}
                    onClick={() => {
                      setSelectedConsultation(consultation);
                      setUploadPhotoDialogOpen(true);
                    }}
                  >
                    Add Photo
                  </Button>
                  <Button
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={() => {
                      setSelectedConsultation(consultation);
                      setViewDialogOpen(true);
                    }}
                  >
                    View
                  </Button>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteConsultation(consultation.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Consultation Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Consultation</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Consultation Title"
            value={consultationForm.title}
            onChange={(e) => setConsultationForm({ ...consultationForm, title: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Client Name"
            value={consultationForm.clientName}
            onChange={(e) => setConsultationForm({ ...consultationForm, clientName: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Client Email"
            value={consultationForm.clientEmail}
            onChange={(e) => setConsultationForm({ ...consultationForm, clientEmail: e.target.value })}
            margin="normal"
            type="email"
          />
          <TextField
            fullWidth
            label="Client Phone"
            value={consultationForm.clientPhone}
            onChange={(e) => setConsultationForm({ ...consultationForm, clientPhone: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Address"
            value={consultationForm.address}
            onChange={(e) => setConsultationForm({ ...consultationForm, address: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            label="Consultation Date"
            type="datetime-local"
            value={consultationForm.consultationDate ? new Date(consultationForm.consultationDate).toISOString().slice(0, 16) : ''}
            onChange={(e) => setConsultationForm({ ...consultationForm, consultationDate: e.target.value ? new Date(e.target.value) : new Date() })}
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            fullWidth
            label="Notes (optional)"
            value={consultationForm.notes}
            onChange={(e) => setConsultationForm({ ...consultationForm, notes: e.target.value })}
            margin="normal"
            multiline
            rows={4}
            placeholder="Add notes about the consultation..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateConsultation}
            variant="contained"
            disabled={!consultationForm.title}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Photo Dialog */}
      <Dialog open={uploadPhotoDialogOpen} onClose={() => setUploadPhotoDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Photo</DialogTitle>
        <DialogContent>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            style={{ display: 'none' }}
            id="photo-upload"
            disabled={uploading}
          />
          <label htmlFor="photo-upload">
            <Button
              variant="outlined"
              component="span"
              fullWidth
              startIcon={<UploadIcon />}
              disabled={uploading}
              sx={{ py: 2 }}
            >
              {uploading ? 'Uploading...' : 'Choose Photo'}
            </Button>
          </label>
          {uploading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadPhotoDialogOpen(false)} disabled={uploading}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Consultation Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedConsultation?.title}
          {selectedConsultation?.hasRecording && (
            <Chip
              icon={<MicIcon />}
              label="Recorded"
              color="success"
              size="small"
              sx={{ ml: 2 }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          {selectedConsultation?.clientName && (
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Client:</strong> {selectedConsultation.clientName}
            </Typography>
          )}
          {selectedConsultation?.clientEmail && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>Email:</strong> {selectedConsultation.clientEmail}
            </Typography>
          )}
          {selectedConsultation?.clientPhone && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>Phone:</strong> {selectedConsultation.clientPhone}
            </Typography>
          )}
          {selectedConsultation?.address && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <strong>Address:</strong> {selectedConsultation.address}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Date:</strong> {selectedConsultation ? formatDate(selectedConsultation.consultationDate) : ''}
          </Typography>
          
          {selectedConsultation?.notes && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Notes
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                  {selectedConsultation.notes}
                </Typography>
              </Paper>
            </Box>
          )}
          
          {selectedConsultation?.photos && selectedConsultation.photos.length > 0 ? (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Photos ({selectedConsultation.photos.length})
              </Typography>
              <ImageList cols={3} gap={16}>
                {selectedConsultation.photos.map((photo) => (
                  <ImageListItem key={photo.id}>
                    {photo.url ? (
                      <img
                        src={photo.url}
                        alt={photo.name}
                        loading="lazy"
                        style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: '100%',
                          height: '200px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'grey.200',
                        }}
                      >
                        <PhotoCameraIcon />
                      </Box>
                    )}
                    <ImageListItemBar
                      title={photo.name}
                      subtitle={`${(photo.fileSize / 1024).toFixed(1)} KB`}
                      actionIcon={
                        <IconButton
                          sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                          onClick={() => {
                            if (photo.url) window.open(photo.url, '_blank');
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                      }
                    />
                    <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeletePhoto(selectedConsultation!.id, photo.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </ImageListItem>
                ))}
              </ImageList>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No photos uploaded yet
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          <Button
            variant="outlined"
            startIcon={<NoteIcon />}
            onClick={() => {
              setNotesText(selectedConsultation?.notes || '');
              setNotesDialogOpen(true);
            }}
          >
            {selectedConsultation?.notes ? 'Edit Notes' : 'Add Notes'}
          </Button>
          <Button
            variant="contained"
            startIcon={<PhotoCameraIcon />}
            onClick={() => {
              setViewDialogOpen(false);
              setUploadPhotoDialogOpen(true);
            }}
          >
            Add Photo
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={notesDialogOpen} onClose={() => setNotesDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Consultation Notes</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={10}
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            placeholder="Add notes about the consultation..."
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotesDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveNotes} variant="contained">
            Save Notes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

