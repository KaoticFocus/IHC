import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  IconButton,
  Paper,
  Typography,
  LinearProgress,
  Button,
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
        p: 4,
        textAlign: 'center',
        bgcolor: isRecording ? 'error.dark' : 'background.paper',
        color: isRecording ? 'white' : 'text.primary',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Waveform Visualization */}
      {isRecording && waveform.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
            height: 60,
            mb: 2,
          }}
        >
          {waveform.map((height, index) => (
            <Box
              key={index}
              sx={{
                width: 4,
                height: `${height}%`,
                bgcolor: 'white',
                borderRadius: 2,
                transition: 'height 0.1s ease',
                minHeight: 4,
              }}
            />
          ))}
        </Box>
      )}

      {/* Recording Button */}
      <IconButton
        onClick={isRecording ? onStop : onStart}
        sx={{
          width: 80,
          height: 80,
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
      >
        {isRecording ? <StopIcon sx={{ fontSize: 40 }} /> : <MicIcon sx={{ fontSize: 40 }} />}
      </IconButton>

      {/* Duration Display */}
      <Typography
        variant="h4"
        sx={{
          mt: 2,
          fontFamily: 'monospace',
          fontWeight: 'bold',
        }}
      >
        {formatTime(duration)}
      </Typography>

      {/* Status Text */}
      <Typography variant="body1" sx={{ mt: 1, opacity: 0.9 }}>
        {isRecording ? 'Recording...' : 'Ready to Record'}
      </Typography>

      {/* Audio Level Indicator */}
      {isRecording && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress
            variant="determinate"
            value={audioLevel}
            sx={{
              height: 4,
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
        <Box sx={{ mt: 2 }}>
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
            sx={{
              color: 'white',
              borderColor: 'rgba(255,255,255,0.5)',
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

