import React, { useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Mic as MicIcon,
  Warning as WarningIcon,
  HealthAndSafety as HealthIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Description as DescriptionIcon2,
  SelectAll as SelectAllIcon,
  Task as TaskIcon,
} from '@mui/icons-material';
import { EnhancedTranscript } from '../services/EnhancedTranscriptionService';
import { useAuth } from '../context/AuthContext';

interface DashboardProps {
  transcripts: EnhancedTranscript[];
  isRecording: boolean;
  recordingDuration?: number;
  onNavigate: (screen: string) => void;
  onStartRecording: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  transcripts,
  isRecording,
  recordingDuration = 0,
  onNavigate,
  onStartRecording,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const auth = useAuth();
  
  // Get user's first name for personalized greeting
  const userName = auth.profile?.first_name || auth.profile?.full_name?.split(' ')[0] || auth.user?.email?.split('@')[0] || 'there';

  const stats = useMemo(() => {
    const totalTranscripts = transcripts.length;
    const totalWords = transcripts.reduce((sum, t) => sum + t.text.split(' ').length, 0);

    return {
      totalTranscripts,
      totalWords,
    };
  }, [transcripts]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
          What can I do for you, {userName}?
        </Typography>
      </Paper>

      {/* Button Grid */}
      <Grid container spacing={2}>
        {buttonItems.map((row, rowIndex) => (
          <Grid container item xs={12} spacing={2} key={rowIndex}>
            {row.map((button, buttonIndex) => (
              <Grid item xs={12} sm={4} key={buttonIndex}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={button.onClick}
                  sx={{
                    p: { xs: 2, sm: 2.5 },
                    minHeight: { xs: 56, sm: 64 },
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    textTransform: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <Box sx={{ fontSize: { xs: 24, sm: 28 }, color: 'primary.main' }}>
                    {button.icon}
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      fontWeight: 500,
                      color: 'text.primary',
                    }}
                  >
                    {button.label}
                  </Typography>
                </Button>
              </Grid>
            ))}
          </Grid>
        ))}
      </Grid>

    </Box>
  );
};

