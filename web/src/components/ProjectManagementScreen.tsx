import React, { useState, useEffect } from 'react';
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
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  ImageList,
  ImageListItem,
  ImageListItemBar,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Upload as UploadIcon,
  Visibility as ViewIcon,
  Folder as FolderIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
} from '@mui/icons-material';
import { Project, ProjectDocument, CreateProjectInput } from '../types/Project';
import ProjectManagementService from '../services/ProjectManagementService';
import { useAuth } from '../context/AuthContext';

export const ProjectManagementScreen: React.FC = () => {
  const auth = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<ProjectDocument | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [projectForm, setProjectForm] = useState<CreateProjectInput>({
    name: '',
    description: '',
    status: 'planning',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    address: '',
  });

  useEffect(() => {
    if (auth.user) {
      loadProjects();
    } else {
      setError('Please sign in to manage projects');
      setLoading(false);
    }
  }, [auth.user]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      await ProjectManagementService.initialize();
      
      if (!ProjectManagementService.isAvailable()) {
        setError('Project management requires Supabase authentication. Please sign in.');
        setLoading(false);
        return;
      }

      const allProjects = await ProjectManagementService.getAllProjects();
      setProjects(allProjects);
    } catch (err) {
      console.error('Error loading projects:', err);
      setError((err as Error).message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      setError(null);
      const newProject = await ProjectManagementService.createProject(projectForm);
      setProjects([newProject, ...projects]);
      setCreateDialogOpen(false);
      setProjectForm({
        name: '',
        description: '',
        status: 'planning',
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        address: '',
      });
    } catch (err) {
      setError((err as Error).message || 'Failed to create project');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('Are you sure you want to delete this project? All documents will be deleted.')) {
      return;
    }

    try {
      setError(null);
      await ProjectManagementService.deleteProject(projectId);
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (err) {
      setError((err as Error).message || 'Failed to delete project');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedProject) return;

    try {
      setUploading(true);
      setError(null);
      const document = await ProjectManagementService.uploadDocument(
        selectedProject.id,
        file
      );
      
      // Update project with new document
      const updatedProject = await ProjectManagementService.getProject(selectedProject.id);
      if (updatedProject) {
        setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
        setSelectedProject(updatedProject);
      }
      
      setUploadDialogOpen(false);
    } catch (err) {
      setError((err as Error).message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (projectId: string, documentId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      setError(null);
      await ProjectManagementService.deleteDocument(projectId, documentId);
      
      // Reload project
      const updatedProject = await ProjectManagementService.getProject(projectId);
      if (updatedProject) {
        setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
        if (selectedProject?.id === projectId) {
          setSelectedProject(updatedProject);
        }
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to delete document');
    }
  };

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'planning': return 'default';
      case 'in_progress': return 'primary';
      case 'completed': return 'success';
      case 'on_hold': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getDocumentIcon = (type: ProjectDocument['type']) => {
    switch (type) {
      case 'image': return <ImageIcon />;
      case 'pdf': return <PdfIcon />;
      default: return <DocIcon />;
    }
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
          Please sign in to manage projects. Project data is stored securely in Supabase.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Projects</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          New Project
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {projects.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <FolderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No projects yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create your first project to start organizing documents and images
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Project
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} md={6} lg={4} key={project.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                    <Typography variant="h6" component="div">
                      {project.name}
                    </Typography>
                    <Chip
                      label={project.status}
                      color={getStatusColor(project.status)}
                      size="small"
                    />
                  </Box>
                  {project.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {project.description}
                    </Typography>
                  )}
                  {project.clientName && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Client:</strong> {project.clientName}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    {project.documents.length} document{project.documents.length !== 1 ? 's' : ''}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<UploadIcon />}
                    onClick={() => {
                      setSelectedProject(project);
                      setUploadDialogOpen(true);
                    }}
                  >
                    Upload
                  </Button>
                  <Button
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={() => {
                      setSelectedProject(project);
                      setViewDialogOpen(true);
                    }}
                  >
                    View
                  </Button>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteProject(project.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Project Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Project Name"
            value={projectForm.name}
            onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={projectForm.description}
            onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={projectForm.status}
              onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value as Project['status'] })}
              label="Status"
            >
              <MenuItem value="planning">Planning</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="on_hold">On Hold</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Client Name"
            value={projectForm.clientName}
            onChange={(e) => setProjectForm({ ...projectForm, clientName: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Client Email"
            value={projectForm.clientEmail}
            onChange={(e) => setProjectForm({ ...projectForm, clientEmail: e.target.value })}
            margin="normal"
            type="email"
          />
          <TextField
            fullWidth
            label="Client Phone"
            value={projectForm.clientPhone}
            onChange={(e) => setProjectForm({ ...projectForm, clientPhone: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Address"
            value={projectForm.address}
            onChange={(e) => setProjectForm({ ...projectForm, address: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateProject}
            variant="contained"
            disabled={!projectForm.name}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Document or Image</DialogTitle>
        <DialogContent>
          <input
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="file-upload"
            disabled={uploading}
          />
          <label htmlFor="file-upload">
            <Button
              variant="outlined"
              component="span"
              fullWidth
              startIcon={<UploadIcon />}
              disabled={uploading}
              sx={{ py: 2 }}
            >
              {uploading ? 'Uploading...' : 'Choose File'}
            </Button>
          </label>
          {uploading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Project Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedProject?.name}
          <Chip
            label={selectedProject?.status}
            color={getStatusColor(selectedProject?.status || 'planning')}
            size="small"
            sx={{ ml: 2 }}
          />
        </DialogTitle>
        <DialogContent>
          {selectedProject?.description && (
            <Typography variant="body1" sx={{ mb: 2 }}>
              {selectedProject.description}
            </Typography>
          )}
          
          {selectedProject?.documents && selectedProject.documents.length > 0 ? (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Documents ({selectedProject.documents.length})
              </Typography>
              <ImageList cols={3} gap={16}>
                {selectedProject.documents.map((doc) => (
                  <ImageListItem key={doc.id}>
                    {doc.type === 'image' && doc.url ? (
                      <img
                        src={doc.url}
                        alt={doc.name}
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
                        {getDocumentIcon(doc.type)}
                      </Box>
                    )}
                    <ImageListItemBar
                      title={doc.name}
                      subtitle={`${(doc.fileSize / 1024).toFixed(1)} KB`}
                      actionIcon={
                        <IconButton
                          sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                          onClick={() => {
                            if (doc.url) window.open(doc.url, '_blank');
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
                        onClick={() => handleDeleteDocument(selectedProject!.id, doc.id)}
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
              No documents uploaded yet
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => {
              setViewDialogOpen(false);
              setUploadDialogOpen(true);
            }}
          >
            Upload Document
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

