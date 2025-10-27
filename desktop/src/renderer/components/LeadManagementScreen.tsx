import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

interface Lead {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  notes?: string;
  type?: string;
  createdAt: number | string;
}

interface LeadManagementScreenProps {
  leads?: Lead[];
}

export const LeadManagementScreen: React.FC<LeadManagementScreenProps> = ({ leads: externalLeads = [] }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  
  // Merge external leads (from voice commands) with internal leads
  useEffect(() => {
    if (externalLeads.length > 0) {
      setLeads(prev => {
        const existingIds = new Set(prev.map(l => l.id));
        const newLeads = externalLeads.filter(l => !existingIds.has(l.id));
        return [...prev, ...newLeads];
      });
    }
  }, [externalLeads]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    notes: '',
  });

  const handleAddLead = () => {
    setCurrentLead(null);
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      notes: '',
    });
    setDialogOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setCurrentLead(lead);
    setFormData({
      name: lead.name,
      address: lead.address,
      phone: lead.phone,
      email: lead.email,
      notes: lead.notes,
    });
    setDialogOpen(true);
  };

  const handleDeleteLead = (id: string) => {
    setLeads(leads.filter(lead => lead.id !== id));
  };

  const handleSaveLead = () => {
    if (currentLead) {
      // Update existing lead
      setLeads(leads.map(lead =>
        lead.id === currentLead.id
          ? { ...lead, ...formData }
          : lead
      ));
    } else {
      // Add new lead
      const newLead: Lead = {
        id: `lead_${Date.now()}`,
        ...formData,
        createdAt: Date.now(),
      };
      setLeads([...leads, newLead]);
    }
    setDialogOpen(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Lead Management</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddLead}
          >
            Add Lead
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>{lead.name}</TableCell>
                  <TableCell>{lead.address}</TableCell>
                  <TableCell>{lead.phone}</TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleEditLead(lead)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteLead(lead.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {leads.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No leads yet. Click "Add Lead" to create your first lead.
            </Typography>
          </Box>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentLead ? 'Edit Lead' : 'Add New Lead'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
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
