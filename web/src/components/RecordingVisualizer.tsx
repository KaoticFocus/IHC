import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  IconButton,
  Paper,
  Typography,
  LinearProgress,
  Button,
  useMediaQuery,
} from '@mui/material';
import { Mic as MicIcon, Stop as StopIcon, PhotoCamera as PhotoCameraIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface RecordingVisualizerProps {
  isRecording: boolean;
  duration: number;
  onStart: () => void;
  onStop: () => void;
  audioLevel?: number; // 0-100
  onPhotoUpload?: (file: File) => void; // Callback for photo upload during recording
}

export const RecordingVisualizer: React.FC<RecordingVisualizerProps> = ({
  isRecording,
  duration,
  onStart,
  onStop,
  audioLevel = 0,
  onPhotoUpload,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [waveform, setWaveform] = useState<number[]>([]);
  const animationRef = useRef<number>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRecording) {
      const generateWaveform = () => {
        setWaveform(Array.from({ length: 50 }, () => Math.random() * 100));
        animationRef.current = requestAnimationFrame(generateWaveform);
      };
      generateWaveform();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setWaveform([]);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onPhotoUpload) {
      onPhotoUpload(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        textAlign: 'center',
        bgcolor: isRecording ? 'error.dark' : 'background.paper',
        color: isRecording ? 'white' : 'text.primary',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        maxWidth: '100%',
      }}
    >
      {/* Waveform Visualization */}
      {isRecording && waveform.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: { xs: 0.25, sm: 0.5 },
            height: { xs: 40, sm: 60 },
            mb: { xs: 1.5, sm: 2 },
          }}
        >
          {waveform.map((height, index) => (
            <Box
              key={index}
              sx={{
                width: { xs: 2, sm: 4 },
                height: `${height}%`,
                bgcolor: 'white',
                borderRadius: 2,
                transition: 'height 0.1s ease',
                minHeight: { xs: 2, sm: 4 },
              }}
            />
          ))}
        </Box>
      )}

      {/* Recording Button */}
      <IconButton
        onClick={isRecording ? onStop : onStart}
        sx={{
          width: { xs: 64, sm: 80 },
          height: { xs: 64, sm: 80 },
          minWidth: { xs: 64, sm: 80 },
          minHeight: { xs: 64, sm: 80 },
          bgcolor: isRecording ? 'error.main' : 'primary.main',
          color: 'white',
          '&:hover': {
            bgcolor: isRecording ? 'error.dark' : 'primary.dark',
          },
          transition: 'all 0.3s ease',
          animation: isRecording ? 'pulse 2s ease-in-out infinite' : 'none',
          '@keyframes pulse': {
            '0%, 100%': {
              transform: 'scale(1)',
              boxShadow: `0 0 0 0 ${theme.palette.error.main}40`,
            },
            '50%': {
              transform: 'scale(1.05)',
              boxShadow: `0 0 0 10px ${theme.palette.error.main}00`,
            },
          },
        }}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {isRecording ? (
          <StopIcon sx={{ fontSize: { xs: 32, sm: 40 } }} />
        ) : (
          <MicIcon sx={{ fontSize: { xs: 32, sm: 40 } }} />
        )}
      </IconButton>

      {/* Duration Display */}
      <Typography
        variant={isMobile ? 'h5' : 'h4'}
        sx={{
          mt: { xs: 1.5, sm: 2 },
          fontFamily: 'monospace',
          fontWeight: 'bold',
          fontSize: { xs: '1.5rem', sm: '2rem' },
        }}
      >
        {formatTime(duration)}
      </Typography>

      {/* Status Text */}
      <Typography 
        variant="body1" 
        sx={{ 
          mt: 1, 
          opacity: 0.9,
          fontSize: { xs: '0.875rem', sm: '1rem' },
        }}
      >
        {isRecording ? 'Recording...' : 'Ready to Record'}
      </Typography>

      {/* Audio Level Indicator */}
      {isRecording && (
        <Box sx={{ mt: { xs: 1.5, sm: 2 } }}>
          <LinearProgress
            variant="determinate"
            value={audioLevel}
            sx={{
              height: { xs: 3, sm: 4 },
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.2)',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'white',
              },
            }}
          />
        </Box>
      )}

      {/* Photo Upload Button (only shown during recording) */}
      {isRecording && onPhotoUpload && (
        <Box sx={{ mt: { xs: 1.5, sm: 2 } }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <Button
            variant="outlined"
            startIcon={<PhotoCameraIcon />}
            onClick={handlePhotoClick}
            size={isMobile ? 'medium' : 'large'}
            fullWidth={isMobile}
            sx={{
              color: 'white',
              borderColor: 'rgba(255,255,255,0.5)',
              minHeight: { xs: 44, sm: 48 },
              '&:hover': {
                borderColor: 'white',
                bgcolor: 'rgba(255,255,255,0.1)',
              },
            }}
          >
            Add Photo
          </Button>
        </Box>
      )}
    </Paper>
  );
};

