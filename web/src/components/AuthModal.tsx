import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Tabs,
  Tab,
  Link,
  Alert,
  Divider,
} from '@mui/material';
import { Google, Apple } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { ErrorService } from '../services/ErrorService';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ open, onClose }) => {
  const [tab, setTab] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signIn, signUp, resetPassword, signInWithOAuth } = useAuth();

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      onClose();
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      ErrorService.handleError(err, 'signIn');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !fullName) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signUp(email, password, fullName);
      setTab(0); // Switch to sign in tab
      setEmail('');
      setPassword('');
      setFullName('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
      ErrorService.handleError(err, 'signUp');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await resetPassword(email);
      ErrorService.handleSuccess('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
      ErrorService.handleError(err, 'resetPassword');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    setLoading(true);
    setError(null);

    try {
      await signInWithOAuth(provider);
      // OAuth will redirect, so we don't need to close the modal here
    } catch (err: any) {
      setError(err.message || `Failed to sign in with ${provider}`);
      ErrorService.handleError(err, `oauthSignIn-${provider}`);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)}>
          <Tab label="Sign In" />
          <Tab label="Sign Up" />
          <Tab label="Reset Password" />
        </Tabs>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {tab === 0 && (
          <Box sx={{ pt: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Google />}
                onClick={() => handleOAuthSignIn('google')}
                disabled={loading}
                sx={{
                  textTransform: 'none',
                  py: 1.5,
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                Continue with Google
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Apple />}
                onClick={() => handleOAuthSignIn('apple')}
                disabled={loading}
                sx={{
                  textTransform: 'none',
                  py: 1.5,
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                Continue with Apple
              </Button>
            </Box>
            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
            />
            <Box sx={{ mt: 1, textAlign: 'right' }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => setTab(2)}
                sx={{ cursor: 'pointer' }}
              >
                Forgot password?
              </Link>
            </Box>
          </Box>
        )}

        {tab === 1 && (
          <Box sx={{ pt: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Google />}
                onClick={() => handleOAuthSignIn('google')}
                disabled={loading}
                sx={{
                  textTransform: 'none',
                  py: 1.5,
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                Sign up with Google
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Apple />}
                onClick={() => handleOAuthSignIn('apple')}
                disabled={loading}
                sx={{
                  textTransform: 'none',
                  py: 1.5,
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                Sign up with Apple
              </Button>
            </Box>
            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>
            <TextField
              fullWidth
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              helperText="Must be at least 6 characters"
            />
            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              required
            />
          </Box>
        )}

        {tab === 2 && (
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter your email address and we'll send you a link to reset your password.
            </Typography>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {tab === 0 && (
          <Button onClick={handleSignIn} variant="contained" disabled={loading}>
            Sign In
          </Button>
        )}
        {tab === 1 && (
          <Button onClick={handleSignUp} variant="contained" disabled={loading}>
            Sign Up
          </Button>
        )}
        {tab === 2 && (
          <Button onClick={handleResetPassword} variant="contained" disabled={loading}>
            Send Reset Email
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

