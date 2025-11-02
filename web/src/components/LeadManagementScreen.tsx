import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Chip,
  Skeleton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import StorageService from '../services/StorageService';
import { ErrorService } from '../services/ErrorService';
import { useSearch } from '../hooks/useSearch';
import { useConfirmation } from './ConfirmationDialog';
import { ExportService } from '../services/ExportService';
import { Lead } from '../types/Lead';

interface LeadManagementScreenProps {
  leads?: Lead[];
}

const leadTypes: Lead['type'][] = ['bathroom', 'kitchen', 'basement', 'addition', 'deck', 'roofing', 'other'];

export const LeadManagementScreen: React.FC<LeadManagementScreenProps> = ({ leads: externalLeads = [] }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    notes: '',
  });
  const { confirm, ConfirmationDialog } = useConfirmation();

  // Search functionality
  const filteredLeads = useSearch(leads, searchTerm, ['name', 'address', 'phone', 'email'], 300);
  
  // Filter by type
  const displayLeads = useMemo(() => {
    if (filterType === 'all') return filteredLeads;
    return filteredLeads.filter(lead => lead.type === filterType);
  }, [filteredLeads, filterType]);

  useEffect(() => {
    const loadLeads = async () => {
      try {
        setLoading(true);
        const [savedLeads, error] = await ErrorService.handleAsyncError(
          StorageService.getLeads(),
          'loadLeads'
        );
        if (!error && savedLeads) {
          setLeads(savedLeads);
        }
      } finally {
        setLoading(false);
      }
    };
    loadLeads();
  }, []);

  useEffect(() => {
    if (externalLeads.length > 0) {
      setLeads(prev => {
        const existingIds = new Set(prev.map(l => l.id));
        const newLeads = externalLeads.filter(l => !existingIds.has(l.id));
        return [...prev, ...newLeads];
      });
    }
  }, [externalLeads]);

  const handleAddLead = () => {
    setCurrentLead(null);
    setFormData({ name: '', address: '', phone: '', email: '', notes: '' });
    setDialogOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setCurrentLead(lead);
    setFormData({
      name: lead.name,
      address: lead.address || '',
      phone: lead.phone || '',
      email: lead.email || '',
      notes: lead.notes || '',
    });
    setDialogOpen(true);
  };

  const handleDeleteLead = useCallback(async (id: string) => {
    confirm(
      'Are you sure you want to delete this lead? This action cannot be undone.',
      async () => {
        const [, error] = await ErrorService.handleAsyncError(
          StorageService.deleteLead(id),
          'deleteLead'
        );
        if (!error) {
          const updatedLeads = await StorageService.getLeads();
          setLeads(updatedLeads || []);
          ErrorService.handleSuccess('Lead deleted successfully');
        }
      },
      { severity: 'error', confirmText: 'Delete' }
    );
  }, [confirm]);
  
  const handleExportLeads = useCallback(() => {
    try {
      ExportService.exportLeads(displayLeads);
      ErrorService.handleSuccess('Leads exported successfully');
    } catch (error) {
      ErrorService.handleError(error, 'exportLeads');
    }
  }, [displayLeads]);

  const handleSaveLead = async () => {
    if (!formData.name.trim()) {
      ErrorService.handleWarning('Please enter a name for the lead');
      return;
    }

    const [,] = await ErrorService.handleAsyncError(
      (async () => {
        const leadToSave: Lead = currentLead
          ? { ...currentLead, ...formData }
          : {
              id: `lead_${Date.now()}`,
              ...formData,
              createdAt: new Date().toISOString(),
            };
        
        const updatedLeads = await StorageService.saveLead(leadToSave);
        setLeads(updatedLeads);
        setDialogOpen(false);
        ErrorService.handleSuccess(currentLead ? 'Lead updated successfully' : 'Lead created successfully');
      })(),
      'saveLead'
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6">Lead Management</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search leads..."
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
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={(e) => setFilterAnchor(e.currentTarget)}
            >
              Filter {filterType !== 'all' && `(${filterType})`}
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportLeads}
              disabled={displayLeads.length === 0}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddLead}
            >
              Add Lead
            </Button>
          </Box>
        </Box>

        <Menu
          anchorEl={filterAnchor}
          open={Boolean(filterAnchor)}
          onClose={() => setFilterAnchor(null)}
        >
          <MenuItem onClick={() => { setFilterType('all'); setFilterAnchor(null); }}>
            All Types
          </MenuItem>
          {leadTypes.map(type => (
            <MenuItem key={type} onClick={() => { setFilterType(type || 'all'); setFilterAnchor(null); }}>
              {(type || 'all').charAt(0).toUpperCase() + (type || 'all').slice(1)}
            </MenuItem>
          ))}
        </Menu>

        {loading ? (
          <Box>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={53} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Address</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayLeads.map((lead) => (
                    <TableRow key={lead.id} hover>
                      <TableCell>{lead.name}</TableCell>
                      <TableCell>
                        {lead.type && (
                          <Chip label={lead.type} size="small" />
                        )}
                      </TableCell>
                      <TableCell>{lead.address || '-'}</TableCell>
                      <TableCell>{lead.phone || '-'}</TableCell>
                      <TableCell>{lead.email || '-'}</TableCell>
                      <TableCell>
                        {lead.status && (
                          <Chip 
                            label={lead.status} 
                            size="small" 
                            color={lead.status === 'closed' ? 'success' : 'default'}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleEditLead(lead)}
                          aria-label="Edit lead"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteLead(lead.id)}
                          aria-label="Delete lead"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {displayLeads.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                {searchTerm || filterType !== 'all' ? (
                  <>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      No leads found matching your search.
                    </Typography>
                    <Button
                      variant="text"
                      onClick={() => {
                        setSearchTerm('');
                        setFilterType('all');
                      }}
                    >
                      Clear filters
                    </Button>
                  </>
                ) : (
                  <>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      No leads yet.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddLead}
                      sx={{ mt: 2 }}
                    >
                      Create your first lead
                    </Button>
                  </>
                )}
              </Box>
            )}
          </>
        )}
      </Paper>

      <ConfirmationDialog />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentLead ? 'Edit Lead' : 'Add New Lead'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            margin="normal"
            multiline
            rows={4}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveLead} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
