import React, { useState } from 'react';
import { IconButton, Badge, Tooltip } from '@mui/material';
import { Mic as MicIcon } from '@mui/icons-material';
import { Box } from '@mui/material';

interface FloatingMicButtonProps {
  onClick: () => void;
  isListening?: boolean;
  isWaitingForCommand?: boolean;
}

export const FloatingMicButton: React.FC<FloatingMicButtonProps> = ({
  onClick,
  isListening = false,
  isWaitingForCommand = false,
}) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 1000,
      }}
    >
      <Tooltip title={isWaitingForCommand ? "Listening for command..." : isListening ? "Stop recording" : "Say 'Hey Flow' or click to start"}>
        <IconButton
          onClick={onClick}
          sx={{
            width: 56,
            height: 56,
            bgcolor: isListening 
              ? 'error.main' 
              : isWaitingForCommand 
              ? 'info.main' 
              : 'primary.main',
            color: 'white',
            boxShadow: 3,
            '&:hover': {
              bgcolor: isListening ? 'error.dark' : isWaitingForCommand ? 'info.dark' : 'primary.dark',
              transform: 'scale(1.1)',
            },
            animation: isListening ? 'pulse 1.5s infinite' : 'none',
            '@keyframes pulse': {
              '0%': { 
                transform: 'scale(1)', 
                boxShadow: '0 0 0 0 rgba(244, 67, 54, 0.7)' 
              },
              '50%': { 
                transform: 'scale(1.05)', 
                boxShadow: '0 0 0 10px rgba(244, 67, 54, 0)' 
              },
              '100%': { 
                transform: 'scale(1)', 
                boxShadow: '0 0 0 0 rgba(244, 67, 54, 0)' 
              },
            },
          }}
          aria-label="Voice assistant"
        >
          <MicIcon sx={{ fontSize: 28 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

