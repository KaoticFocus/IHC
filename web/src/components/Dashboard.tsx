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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

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
    <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%', maxWidth: '100%' }}>
      <Typography 
        variant={isMobile ? 'h5' : 'h4'} 
        gutterBottom 
        sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: '1.5rem', sm: '2rem' } }}
      >
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
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 2, sm: 3 } }}>
        <Grid item xs={12} sm={6} md={6}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
                <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                  <Typography color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Transcripts
                  </Typography>
                  <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                    {stats.totalTranscripts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    {stats.totalWords.toLocaleString()} words
                  </Typography>
                </Box>
                <DescriptionIcon sx={{ fontSize: { xs: 32, sm: 40 }, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: { xs: 2, sm: 3 } }}>
        <Typography variant={isMobile ? 'subtitle1' : 'h6'} gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '1.25rem' }, mb: { xs: 1, sm: 2 } }}>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2 }, flexWrap: 'wrap', flexDirection: { xs: 'column', sm: 'row' } }}>
          <Button
            variant="contained"
            startIcon={<MicIcon />}
            onClick={onStartRecording}
            disabled={isRecording}
            size={isMobile ? 'medium' : 'large'}
            fullWidth={isMobile}
            sx={{
              minHeight: { xs: 44, sm: 48 },
            }}
          >
            {isRecording ? 'Recording...' : 'Start Recording'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<DescriptionIcon />}
            onClick={() => onNavigate('transcripts')}
            size={isMobile ? 'medium' : 'large'}
            fullWidth={isMobile}
            sx={{
              minHeight: { xs: 44, sm: 48 },
            }}
          >
            View Transcripts
          </Button>
        </Box>
      </Paper>

      {/* Empty State */}
      {stats.totalTranscripts === 0 && (
        <Paper
          sx={{
            p: { xs: 4, sm: 6 },
            textAlign: 'center',
            bgcolor: 'background.default',
          }}
        >
          <MicIcon sx={{ fontSize: { xs: 60, sm: 80 }, color: 'text.secondary', mb: 2 }} />
          <Typography variant={isMobile ? 'h6' : 'h5'} gutterBottom sx={{ fontSize: { xs: '1.125rem', sm: '1.5rem' } }}>
            Get Started
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            Start by recording your first conversation
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={<MicIcon />}
              onClick={onStartRecording}
              size={isMobile ? 'medium' : 'large'}
              sx={{
                minHeight: { xs: 44, sm: 48 },
              }}
            >
              Start Recording
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

