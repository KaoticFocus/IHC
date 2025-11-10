import React, { useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import {
  People as PeopleIcon,
  Description as DescriptionIcon,
  Mic as MicIcon,
} from '@mui/icons-material';
import { EnhancedTranscript } from '../services/EnhancedTranscriptionService';

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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Dashboard
      </Typography>

      {/* Recording Status Card */}
      {isRecording && (
        <Paper
          sx={{
            p: 3,
            mb: 3,
            bgcolor: 'error.dark',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            animation: 'pulse 2s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.8 },
            },
          }}
        >
          <MicIcon sx={{ fontSize: 40 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">Recording in Progress</Typography>
            <Typography variant="body2">
              Duration: {formatDuration(Math.floor(recordingDuration / 1000))}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Transcripts
                  </Typography>
                  <Typography variant="h4">{stats.totalTranscripts}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats.totalWords.toLocaleString()} words
                  </Typography>
                </Box>
                <DescriptionIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<MicIcon />}
            onClick={onStartRecording}
            disabled={isRecording}
            size="large"
          >
            {isRecording ? 'Recording...' : 'Start Recording'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<DescriptionIcon />}
            onClick={() => onNavigate('transcripts')}
            size="large"
          >
            View Transcripts
          </Button>
        </Box>
      </Paper>

      {/* Empty State */}
      {stats.totalTranscripts === 0 && (
        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            bgcolor: 'background.default',
          }}
        >
          <MicIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Get Started
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Start by recording your first conversation
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={<MicIcon />}
              onClick={onStartRecording}
              size="large"
            >
              Start Recording
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

