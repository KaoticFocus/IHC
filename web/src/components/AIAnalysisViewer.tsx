import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Summarize as SummarizeIcon,
  TaskAlt as TaskAltIcon,
  Topic as TopicIcon,
  People as PeopleIcon,
  Share as ShareIcon,
  SentimentSatisfied as SentimentSatisfiedIcon,
  SentimentNeutral as SentimentNeutralIcon,
  SentimentDissatisfied as SentimentDissatisfiedIcon,
} from '@mui/icons-material';
import { AIAnalysis } from '../types/AIAnalysis';

interface AIAnalysisViewerProps {
  open: boolean;
  onClose: () => void;
  analysis: AIAnalysis | null;
}

export const AIAnalysisViewer: React.FC<AIAnalysisViewerProps> = ({
  open,
  onClose,
  analysis,
}) => {
  if (!analysis) return null;

  const getSentimentColor = (sentiment: string): string => {
    switch (sentiment) {
      case 'positive':
        return '#4CAF50';
      case 'negative':
        return '#f44336';
      default:
        return '#FF9800';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <SentimentSatisfiedIcon />;
      case 'negative':
        return <SentimentDissatisfiedIcon />;
      default:
        return <SentimentNeutralIcon />;
    }
  };

  const handleShare = async () => {
    const analysisText = `
AI Conversation Analysis

SUMMARY:
${analysis.summary}

KEY POINTS:
${analysis.keyPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')}

ACTION ITEMS:
${analysis.actionItems.map((item, index) => `${index + 1}. ${item}`).join('\n')}

SENTIMENT: ${analysis.sentiment.toUpperCase()}

TOPICS DISCUSSED:
${analysis.topics.map((topic, index) => `${index + 1}. ${topic}`).join('\n')}

SPEAKER INSIGHTS:
${analysis.speakerInsights ? Object.entries(analysis.speakerInsights).map(([speaker, insights]) => 
  `${speaker}: ${insights.role || 'Unknown'} - ${insights.sentiment || 'neutral'} sentiment`
).join('\n') : 'No speaker insights available'}
    `;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Conversation Analysis',
          text: analysisText,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(analysisText);
      alert('Analysis copied to clipboard!');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">AI Analysis</Typography>
          <IconButton onClick={handleShare} size="small">
            <ShareIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* Summary Section */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <SummarizeIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Summary</Typography>
            </Box>
            <Typography variant="body1" sx={{ mt: 1 }}>
              {analysis.summary}
            </Typography>
          </Paper>

          {/* Sentiment Section */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {getSentimentIcon(analysis.sentiment)}
              <Typography variant="h6" sx={{ ml: 1 }}>Sentiment Analysis</Typography>
            </Box>
            <Chip
              label={analysis.sentiment.toUpperCase()}
              sx={{
                bgcolor: getSentimentColor(analysis.sentiment),
                color: 'white',
                fontWeight: 'bold',
                mt: 1,
              }}
            />
          </Paper>

          {/* Key Points Section */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Key Points
            </Typography>
            <List dense>
              {analysis.keyPoints.map((point, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <TaskAltIcon color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={point} />
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* Action Items Section */}
          {analysis.actionItems.length > 0 && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Action Items
              </Typography>
              <List dense>
                {analysis.actionItems.map((item, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <TaskAltIcon color="warning" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {/* Topics Section */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TopicIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Topics Discussed</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {analysis.topics.map((topic, index) => (
                <Chip
                  key={index}
                  label={topic}
                  size="small"
                  sx={{ bgcolor: 'primary.dark', color: 'white' }}
                />
              ))}
            </Box>
          </Paper>

          {/* Speaker Insights Section */}
          {analysis.speakerInsights && Object.keys(analysis.speakerInsights).length > 0 && (
            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PeopleIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Speaker Insights</Typography>
              </Box>
              {Object.entries(analysis.speakerInsights).map(([speaker, insights]) => (
                <Box key={speaker} sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {speaker}
                    </Typography>
                    {insights.role && (
                      <Chip
                        label={insights.role}
                        size="small"
                        sx={{ bgcolor: 'success.main', color: 'white' }}
                      />
                    )}
                  </Box>
                  {insights.sentiment && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Sentiment:</strong> {insights.sentiment}
                    </Typography>
                  )}
                  {insights.mainTopics && insights.mainTopics.length > 0 && (
                    <Typography variant="body2">
                      <strong>Main Topics:</strong> {insights.mainTopics.join(', ')}
                    </Typography>
                  )}
                </Box>
              ))}
            </Paper>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

