import React, { useEffect, useState } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { useMediaQuery } from '@mui/material';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Only show splash on mobile devices
    if (!isMobile) {
      onComplete();
      return;
    }

    // Animation duration: 4.5 seconds (slightly less than 5s for smooth transition)
    const duration = 4500;
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (elapsed >= duration) {
        setIsVisible(false);
        clearInterval(interval);
        // Wait for fade out animation before calling onComplete
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [onComplete, isMobile]);

  // Don't render on desktop
  if (!isMobile) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        zIndex: 9999,
        backgroundColor: '#0a1929',
        background: 'linear-gradient(135deg, #0a1929 0%, #1a237e 50%, #0a1929 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.5s ease-out',
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      {/* Animated Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Construction Elements - Animated */}
        <Box
          sx={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            fontSize: '4rem',
            opacity: 0.3,
            animation: 'float 3s ease-in-out infinite',
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
              '50%': { transform: 'translateY(-20px) rotate(5deg)' },
            },
          }}
        >
          🏗️
        </Box>
        <Box
          sx={{
            position: 'absolute',
            top: '60%',
            right: '15%',
            fontSize: '3rem',
            opacity: 0.25,
            animation: 'float 4s ease-in-out infinite',
            animationDelay: '1s',
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
              '50%': { transform: 'translateY(-15px) rotate(-5deg)' },
            },
          }}
        >
          🔨
        </Box>
        <Box
          sx={{
            position: 'absolute',
            bottom: '25%',
            left: '20%',
            fontSize: '2.5rem',
            opacity: 0.2,
            animation: 'float 3.5s ease-in-out infinite',
            animationDelay: '0.5s',
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
              '50%': { transform: 'translateY(-10px) rotate(3deg)' },
            },
          }}
        >
          📐
        </Box>

        {/* AI/Technology Elements - Animated */}
        <Box
          sx={{
            position: 'absolute',
            top: '30%',
            right: '20%',
            fontSize: '3.5rem',
            opacity: 0.3,
            animation: 'pulse 2s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': { transform: 'scale(1)', opacity: 0.3 },
              '50%': { transform: 'scale(1.1)', opacity: 0.5 },
            },
          }}
        >
          🤖
        </Box>
        <Box
          sx={{
            position: 'absolute',
            bottom: '40%',
            right: '10%',
            fontSize: '2rem',
            opacity: 0.25,
            animation: 'pulse 2.5s ease-in-out infinite',
            animationDelay: '0.3s',
            '@keyframes pulse': {
              '0%, 100%': { transform: 'scale(1)', opacity: 0.25 },
              '50%': { transform: 'scale(1.15)', opacity: 0.4 },
            },
          }}
        >
          ⚡
        </Box>

        {/* Neural Network / Data Flow Visualization */}
        {[...Array(8)].map((_, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              width: '2px',
              height: '100px',
              background: `linear-gradient(to bottom, transparent, rgba(33, 150, 243, 0.6), transparent)`,
              left: `${15 + i * 12}%`,
              top: `${20 + (i % 3) * 30}%`,
              opacity: 0.4,
              animation: `flow${i} ${2 + i * 0.2}s ease-in-out infinite`,
              animationDelay: `${i * 0.1}s`,
              '@keyframes flow0, flow1, flow2, flow3, flow4, flow5, flow6, flow7': {
                '0%': { transform: 'translateY(-50px) scaleY(0)', opacity: 0 },
                '50%': { transform: 'translateY(0px) scaleY(1)', opacity: 0.6 },
                '100%': { transform: 'translateY(50px) scaleY(0)', opacity: 0 },
              },
            }}
          />
        ))}

        {/* Construction Blueprint Grid */}
        <Box
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundImage: `
              linear-gradient(rgba(33, 150, 243, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(33, 150, 243, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            opacity: 0.3,
            animation: 'gridMove 10s linear infinite',
            '@keyframes gridMove': {
              '0%': { transform: 'translate(0, 0)' },
              '100%': { transform: 'translate(50px, 50px)' },
            },
          }}
        />
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
        }}
      >
        {/* FLOW Logo/Text */}
        <Box
          sx={{
            position: 'relative',
            animation: 'fadeInScale 1s ease-out',
            '@keyframes fadeInScale': {
              '0%': { opacity: 0, transform: 'scale(0.8)' },
              '100%': { opacity: 1, transform: 'scale(1)' },
            },
          }}
        >
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '3.5rem', sm: '5rem', md: '6rem' },
              fontWeight: 900,
              background: 'linear-gradient(135deg, #2196F3 0%, #00BCD4 50%, #4CAF50 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '0.1em',
              textShadow: '0 0 30px rgba(33, 150, 243, 0.5)',
              mb: 1,
            }}
          >
            FLOW
          </Typography>
        </Box>

        {/* Tagline */}
        <Box
          sx={{
            animation: 'fadeInUp 1.5s ease-out',
            animationDelay: '0.3s',
            animationFillMode: 'both',
            '@keyframes fadeInUp': {
              '0%': { opacity: 0, transform: 'translateY(20px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 300,
              letterSpacing: '0.05em',
            }}
          >
            AI-Powered Construction Intelligence
          </Typography>
        </Box>

        {/* Visual Elements Combining AI & Construction */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 2, sm: 3 },
            mt: 2,
            animation: 'fadeInUp 2s ease-out',
            animationDelay: '0.6s',
            animationFillMode: 'both',
          }}
        >
          {/* Construction Icon */}
          <Box
            sx={{
              fontSize: { xs: '2.5rem', sm: '3rem' },
              animation: 'rotateIn 1s ease-out',
              animationDelay: '1s',
              animationFillMode: 'both',
              '@keyframes rotateIn': {
                '0%': { opacity: 0, transform: 'rotate(-180deg) scale(0)' },
                '100%': { opacity: 1, transform: 'rotate(0deg) scale(1)' },
              },
            }}
          >
            🏗️
          </Box>

          {/* Connecting Flow Animation */}
          <Box
            sx={{
              width: { xs: '60px', sm: '100px' },
              height: '3px',
              background: 'linear-gradient(90deg, transparent, #2196F3, #00BCD4, #2196F3, transparent)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
                animation: 'flowAcross 2s ease-in-out infinite',
                '@keyframes flowAcross': {
                  '0%': { transform: 'translateX(-100%)' },
                  '100%': { transform: 'translateX(100%)' },
                },
              },
            }}
          />

          {/* AI Icon */}
          <Box
            sx={{
              fontSize: { xs: '2.5rem', sm: '3rem' },
              animation: 'pulseIn 1s ease-out',
              animationDelay: '1.2s',
              animationFillMode: 'both',
              '@keyframes pulseIn': {
                '0%': { opacity: 0, transform: 'scale(0)' },
                '50%': { transform: 'scale(1.2)' },
                '100%': { opacity: 1, transform: 'scale(1)' },
              },
            }}
          >
            🤖
          </Box>
        </Box>

        {/* Future Arrow/Forward Motion */}
        <Box
          sx={{
            mt: 3,
            animation: 'fadeInUp 2.5s ease-out',
            animationDelay: '1.5s',
            animationFillMode: 'both',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              fontWeight: 300,
            }}
          >
            Building the Future
          </Typography>
          <Box
            sx={{
              fontSize: { xs: '1.5rem', sm: '2rem' },
              animation: 'arrowMove 1.5s ease-in-out infinite',
              '@keyframes arrowMove': {
                '0%, 100%': { transform: 'translateX(0)' },
                '50%': { transform: 'translateX(10px)' },
              },
            }}
          >
            →
          </Box>
        </Box>

        {/* Progress Bar */}
        <Box
          sx={{
            position: 'absolute',
            bottom: { xs: '10%', sm: '15%' },
            width: { xs: '80%', sm: '60%' },
            maxWidth: '400px',
            height: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #2196F3, #00BCD4, #4CAF50)',
              borderRadius: '2px',
              transition: 'width 0.1s linear',
              boxShadow: '0 0 10px rgba(33, 150, 243, 0.5)',
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

