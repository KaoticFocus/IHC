import React, { useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  People as PeopleIcon,
  Description as DescriptionIcon,
  Mic as MicIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { Lead } from '../types/Lead';
import { EnhancedTranscript } from '../services/EnhancedTranscriptionService';

interface DashboardProps {
  leads: Lead[];
  transcripts: EnhancedTranscript[];
  isRecording: boolean;
  recordingDuration?: number;
  onNavigate: (screen: string) => void;
  onStartRecording: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  leads,
  transcripts,
  isRecording,
  recordingDuration = 0,
  onNavigate,
  onStartRecording,
}) => {
  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const activeLeads = leads.filter(l => {
      const status = l.status;
      return status === 'lead' || status === 'qualified' || status === 'estimate';
    }).length;
    const closedLeads = leads.filter(l => l.status === 'closed').length;
    const totalTranscripts = transcripts.length;
    const totalWords = transcripts.reduce((sum, t) => sum + t.text.split(' ').length, 0);
    const recentLeads = leads
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      totalLeads,
      activeLeads,
      closedLeads,
      totalTranscripts,
      totalWords,
      recentLeads,
      conversionRate: totalLeads > 0 ? (closedLeads / totalLeads) * 100 : 0,
    };
  }, [leads, transcripts]);

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
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Leads
                  </Typography>
                  <Typography variant="h4">{stats.totalLeads}</Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Active Leads
                  </Typography>
                  <Typography variant="h4">{stats.activeLeads}</Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Conversion Rate
                  </Typography>
                  <Typography variant="h4">{stats.conversionRate.toFixed(1)}%</Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
              <LinearProgress
                variant="determinate"
                value={stats.conversionRate}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
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
            startIcon={<PeopleIcon />}
            onClick={() => onNavigate('leads')}
            size="large"
          >
            View Leads
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

      {/* Recent Leads */}
      {stats.recentLeads.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Recent Leads</Typography>
            <Button size="small" onClick={() => onNavigate('leads')}>
              View All
            </Button>
          </Box>
          <List>
            {stats.recentLeads.map((lead, index) => (
              <React.Fragment key={lead.id}>
                <ListItem>
                  <ListItemIcon>
                    <PeopleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={lead.name}
                    secondary={
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        {lead.type && <Chip label={lead.type} size="small" />}
                        <Chip label={lead.status} size="small" color="default" />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < stats.recentLeads.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Empty State */}
      {stats.totalLeads === 0 && stats.totalTranscripts === 0 && (
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
            Start by recording your first conversation or creating a lead
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
            <Button
              variant="outlined"
              startIcon={<PeopleIcon />}
              onClick={() => onNavigate('leads')}
              size="large"
            >
              Create Lead
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

