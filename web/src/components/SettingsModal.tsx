import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
  FormControlLabel,
  Switch,
  Divider,
  Chip,
} from '@mui/material';
import { CloudSync as CloudSyncIcon, CloudOff as CloudOffIcon } from '@mui/icons-material';
import OpenAIService from '../services/OpenAIService';
import AudioService, { AudioDevice } from '../services/AudioService';
import { useTooltips } from '../context/TooltipContext';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured, initSupabase } from '../services/SupabaseService';
import HybridStorageService from '../services/HybridStorageService';
import { ErrorService } from '../services/ErrorService';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const { tooltipsEnabled, setTooltipsEnabled } = useTooltips();
  const auth = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [selectedInput, setSelectedInput] = useState('');
  const [selectedOutput, setSelectedOutput] = useState('');
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [cloudEnabled, setCloudEnabled] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    try {
      // Request microphone permission first to get device labels
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
      } catch (permError) {
        console.warn('Microphone permission denied, device labels may be limited:', permError);
      }

      // Load audio devices
      const devices = await AudioService.getAudioDevices();
      setAudioDevices(devices);

      // Set current devices or defaults
      const currentInput = AudioService.getCurrentInputDevice();
      const currentOutput = AudioService.getCurrentOutputDevice();
      
      if (currentInput) {
        setSelectedInput(currentInput);
      } else if (devices.length > 0) {
        const defaultInput = devices.find(d => d.type === 'input');
        if (defaultInput) setSelectedInput(defaultInput.id);
      }
      
      if (currentOutput) {
        setSelectedOutput(currentOutput);
      } else if (devices.length > 0) {
        const defaultOutput = devices.find(d => d.type === 'output');
        if (defaultOutput) setSelectedOutput(defaultOutput.id);
      }

      // Check if OpenAI key exists
      const hasKey = await OpenAIService.hasApiKey();
      if (hasKey) {
        setApiKey('********'); // Mask the actual key
      }

      // Check Supabase configuration
      const isConfigured = isSupabaseConfigured();
      setCloudEnabled(isConfigured && HybridStorageService.isCloudEnabled());
      
      // Load Supabase credentials if not configured via env
      if (!isConfigured) {
        const storedUrl = localStorage.getItem('supabase_url') || '';
        const storedKey = localStorage.getItem('supabase_key') || '';
        setSupabaseUrl(storedUrl);
        setSupabaseKey(storedKey ? '********' : '');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      setErrorMessage('Failed to load settings: ' + (error as Error).message);
    }
  };

  const handleSave = async () => {
    try {
      setSaveStatus(null);
      setErrorMessage('');

      // Save OpenAI key if changed
      if (apiKey && apiKey !== '********') {
        await OpenAIService.setApiKey(apiKey);
      }

      // Configure Supabase if provided
      if (supabaseUrl && supabaseKey && supabaseKey !== '********') {
        initSupabase(supabaseUrl, supabaseKey);
        localStorage.setItem('supabase_url', supabaseUrl);
        localStorage.setItem('supabase_key', supabaseKey);
        await HybridStorageService.enableCloudSync();
        setCloudEnabled(true);
        ErrorService.handleSuccess('Supabase configured successfully');
      }

      // Save audio device selections
      if (selectedInput) {
        await AudioService.setInputDevice(selectedInput);
      }
      if (selectedOutput) {
        await AudioService.setOutputDevice(selectedOutput);
      }

      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus(null);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to save settings:', error);
      const errorMsg = (error as Error).message || 'Unknown error';
      setErrorMessage(errorMsg);
      setSaveStatus('error');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await HybridStorageService.syncToCloud();
      ErrorService.handleSuccess('Data synced to cloud successfully');
    } catch (error) {
      ErrorService.handleError(error, 'syncToCloud');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            API Configuration
          </Typography>
          <TextField
            fullWidth
            label="OpenAI API Key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            margin="normal"
            placeholder="sk-..."
            helperText="Required for AI transcription and analysis"
          />

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Cloud Sync (Supabase)
            </Typography>
            <Chip
              icon={cloudEnabled ? <CloudSyncIcon /> : <CloudOffIcon />}
              label={cloudEnabled ? 'Enabled' : 'Disabled'}
              color={cloudEnabled ? 'success' : 'default'}
            />
          </Box>

          {!isSupabaseConfigured() && (
            <>
              <TextField
                fullWidth
                label="Supabase URL"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                margin="normal"
                placeholder="https://your-project.supabase.co"
                helperText="Get this from your Supabase dashboard"
              />
              <TextField
                fullWidth
                label="Supabase Anon Key"
                type="password"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                margin="normal"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                helperText="Find this in Settings > API"
              />
            </>
          )}

          {cloudEnabled && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<CloudSyncIcon />}
                onClick={handleSync}
                disabled={syncing}
                fullWidth
              >
                {syncing ? 'Syncing...' : 'Sync to Cloud'}
              </Button>
              {auth.user && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                  Signed in as: {auth.user.email}
                </Typography>
              )}
            </Box>
          )}

          <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>
            User Interface
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={tooltipsEnabled}
                onChange={(e) => setTooltipsEnabled(e.target.checked)}
              />
            }
            label="Show helpful tooltips on hover"
          />

          <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>
            Audio Devices
          </Typography>
          <FormControl fullWidth margin="normal">
            <InputLabel>Input Device</InputLabel>
            <Select
              value={selectedInput}
              onChange={(e) => setSelectedInput(e.target.value)}
              label="Input Device"
            >
              {audioDevices
                .filter(device => device.type === 'input')
                .map(device => (
                  <MenuItem key={device.id} value={device.id}>
                    {device.name}
                  </MenuItem>
                ))
              }
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Output Device</InputLabel>
            <Select
              value={selectedOutput}
              onChange={(e) => setSelectedOutput(e.target.value)}
              label="Output Device"
            >
              {audioDevices
                .filter(device => device.type === 'output')
                .map(device => (
                  <MenuItem key={device.id} value={device.id}>
                    {device.name}
                  </MenuItem>
                ))
              }
            </Select>
          </FormControl>
        </Box>

        {saveStatus && (
          <Alert
            severity={saveStatus}
            sx={{ mt: 2 }}
          >
            {saveStatus === 'success' 
              ? 'Settings saved successfully!' 
              : `Failed to save settings: ${errorMessage}`}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

