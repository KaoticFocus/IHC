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
} from '@mui/material';
import OpenAIService from '../services/OpenAIService';
import AudioService, { AudioDevice } from '../services/AudioService';
import { useTooltips } from '../context/TooltipContext';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const { tooltipsEnabled, setTooltipsEnabled } = useTooltips();
  const [apiKey, setApiKey] = useState('');
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [selectedInput, setSelectedInput] = useState('');
  const [selectedOutput, setSelectedOutput] = useState('');
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

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
          />

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

