import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Warning as WarningIcon,
  HealthAndSafety as HealthIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Description as DescriptionIcon2,
  SelectAll as SelectAllIcon,
  Task as TaskIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import type { EnhancedTranscript } from '../services/EnhancedTranscriptionService';

interface DashboardProps {
  transcripts: EnhancedTranscript[];
  isRecording: boolean;
  recordingDuration?: number;
  onNavigate: (screen: string) => void;
  onStartRecording: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  transcripts: _transcripts,
  isRecording: _isRecording,
  recordingDuration: _recordingDuration,
  onNavigate,
  onStartRecording: _onStartRecording,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const auth = useAuth();
  
  // Get user's first name for personalized greeting
  const firstName = auth.profile?.first_name || 'there';

  // Button grid items matching the image
  const buttonItems = [
    [
      { label: "Urgent Tasks", icon: <WarningIcon />, onClick: () => onNavigate('tasks') },
      { label: "Co. Health", icon: <HealthIcon />, onClick: () => {} },
      { label: "GPM by Job", icon: <TrendingUpIcon />, onClick: () => {} },
    ],
    [
      { label: "Action Items", icon: <AssignmentIcon />, onClick: () => onNavigate('tasks') },
      { label: "Est's To Do", icon: <CheckCircleIcon />, onClick: () => {} },
      { label: "SOW To Check", icon: <DescriptionIcon2 />, onClick: () => {} },
    ],
    [
      { label: "Selections Needed", icon: <SelectAllIcon />, onClick: () => {} },
      { label: "Scopes To Confirm", icon: <TaskIcon />, onClick: () => {} },
    ],
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%', maxWidth: '100%' }}>
      {/* Personalized Greeting Box */}
      <Paper
        sx={{
          p: { xs: 2, sm: 3 },
          mb: { xs: 3, sm: 4 },
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Typography
          variant={isMobile ? 'h6' : 'h5'}
          sx={{
            fontSize: { xs: '1.125rem', sm: '1.5rem' },
            fontWeight: 400,
            textAlign: 'center',
          }}
        >
          What can I do for you, {firstName}?
        </Typography>
      </Paper>

      {/* Button Pills */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1.5,
          justifyContent: 'center',
        }}
      >
        {buttonItems.flat().map((button, index) => (
          <Button
            key={index}
            variant="outlined"
            onClick={button.onClick}
            sx={{
              px: 2,
              py: 1,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              textTransform: 'none',
              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
              fontSize: '1rem',
              fontWeight: 400,
              whiteSpace: 'nowrap',
              minWidth: 'auto',
              width: 'auto',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
              },
            }}
          >
            {button.label}
          </Button>
        ))}
      </Box>

    </Box>
  );
};

