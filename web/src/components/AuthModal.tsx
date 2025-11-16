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
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { 
  Google,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { ErrorService } from '../services/ErrorService';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onEditProfile?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ open, onClose, onEditProfile }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tab, setTab] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user, profile, signIn, signUp, resetPassword, signInWithOAuth, signOut } = useAuth();
  
  // Check if Supabase is configured
  const isSupabaseConfigured = !!(
    import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

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

  const handleOAuthSignIn = async (provider: 'google') => {
    setLoading(true);
    setError(null);

    try {
      await signInWithOAuth(provider);
      // OAuth will redirect, so we don't need to close the modal here
      // Note: loading state will remain true until redirect happens
    } catch (err: any) {
      const errorMessage = err.message || `Failed to sign in with ${provider}.`;
      
      // Show a more helpful error message
      if (errorMessage.includes('not enabled') || errorMessage.includes('Unsupported provider')) {
        setError(
          `${provider.charAt(0).toUpperCase() + provider.slice(1)} OAuth is not enabled in Supabase. ` +
          `Go to: https://supabase.com/dashboard/project/xppnphkaeczptxuhmpuv/auth/providers ` +
          `and toggle ${provider.charAt(0).toUpperCase() + provider.slice(1)} ON, then add your Client ID and Secret.`
        );
      } else {
        setError(errorMessage);
      }
      
      ErrorService.handleError(err, `oauthSignIn-${provider}`);
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    setError(null);

    try {
      await signOut();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to sign out');
      ErrorService.handleError(err, 'signOut');
    } finally {
      setLoading(false);
    }
  };

  // If user is logged in, show account info instead of sign in/sign up
  if (user) {
    const displayName = profile?.first_name || profile?.last_name
      ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
      : profile?.full_name || user.email?.split('@')[0] || 'User';
    
    const loginEmail = user.email || 'Not available';
    const workEmail = profile?.work_email || 'Not set';
    const phone = profile?.phone || 'Not set';

    return (
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            m: { xs: 0, sm: 2 },
            maxHeight: { xs: '100%', sm: '90vh' },
          }
        }}
      >
        <DialogTitle sx={{ pb: { xs: 1, sm: 2 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Account
            </Typography>
            <Typography 
              variant="body2" 
              color="success.main" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
              }}
            >
              <Box
                sx={{
                  width: { xs: 6, sm: 8 },
                  height: { xs: 6, sm: 8 },
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                  display: 'inline-block',
                }}
              />
              Signed In
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: { xs: 2, sm: 3 } }}>
            <Avatar
              src={profile?.avatar_url?.startsWith('emoji:') ? undefined : profile?.avatar_url}
              sx={{
                width: { xs: 64, sm: 80 },
                height: { xs: 64, sm: 80 },
                bgcolor: 'primary.main',
                fontSize: { xs: '1.5rem', sm: '2rem' },
                mb: { xs: 1.5, sm: 2 },
              }}
            >
              {profile?.avatar_url?.startsWith('emoji:') ? (
                <Typography sx={{ fontSize: { xs: '2rem', sm: '3rem' } }}>
                  {profile.avatar_url.replace('emoji:', '')}
                </Typography>
              ) : !profile?.avatar_url ? (
                <AccountCircleIcon sx={{ fontSize: { xs: 64, sm: 80 } }} />
              ) : null}
            </Avatar>
            <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              {displayName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              {loginEmail}
            </Typography>
            {user.app_metadata?.provider === 'google' && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                Signed in with Google
              </Typography>
            )}
          </Box>

          <List sx={{ width: '100%' }}>
            <ListItem sx={{ px: { xs: 0, sm: 2 }, py: { xs: 1, sm: 1.5 } }}>
              <ListItemIcon sx={{ minWidth: { xs: 40, sm: 56 } }}>
                <EmailIcon color="action" sx={{ fontSize: { xs: 20, sm: 24 } }} />
              </ListItemIcon>
              <ListItemText
                primary="Login Email"
                secondary={loginEmail}
                primaryTypographyProps={{
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                }}
                secondaryTypographyProps={{
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              />
            </ListItem>
            {profile?.work_email && (
              <ListItem sx={{ px: { xs: 0, sm: 2 }, py: { xs: 1, sm: 1.5 } }}>
                <ListItemIcon sx={{ minWidth: { xs: 40, sm: 56 } }}>
                  <WorkIcon color="action" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </ListItemIcon>
                <ListItemText
                  primary="Work Email"
                  secondary={workEmail}
                  primaryTypographyProps={{
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  }}
                  secondaryTypographyProps={{
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                />
              </ListItem>
            )}
            {profile?.phone && (
              <ListItem sx={{ px: { xs: 0, sm: 2 }, py: { xs: 1, sm: 1.5 } }}>
                <ListItemIcon sx={{ minWidth: { xs: 40, sm: 56 } }}>
                  <PhoneIcon color="action" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </ListItemIcon>
                <ListItemText
                  primary="Phone"
                  secondary={phone}
                  primaryTypographyProps={{
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  }}
                  secondaryTypographyProps={{
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                />
              </ListItem>
            )}
          </List>

          {onEditProfile && (
            <Box sx={{ mt: { xs: 1.5, sm: 2 } }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  onClose();
                  onEditProfile();
                }}
                size={isMobile ? 'medium' : 'large'}
                sx={{
                  minHeight: { xs: 44, sm: 48 },
                }}
              >
                Edit Profile
              </Button>
            </Box>
          )}
          <Alert severity="info" sx={{ mt: { xs: 1.5, sm: 2 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            Your profile information is stored in Supabase and synced across devices.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, flexDirection: { xs: 'column-reverse', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
          <Button 
            onClick={onClose}
            fullWidth={isMobile}
            size={isMobile ? 'medium' : 'large'}
            sx={{
              minHeight: { xs: 44, sm: 48 },
            }}
          >
            Close
          </Button>
          <Button
            onClick={handleSignOut}
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            disabled={loading}
            fullWidth={isMobile}
            size={isMobile ? 'medium' : 'large'}
            sx={{
              minHeight: { xs: 44, sm: 48 },
            }}
          >
            {loading ? 'Signing out...' : 'Sign Out'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  // User is not logged in - show sign in/sign up forms
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          m: { xs: 0, sm: 2 },
          maxHeight: { xs: '100%', sm: '90vh' },
        }
      }}
    >
      <DialogTitle sx={{ pb: { xs: 1, sm: 2 } }}>
        <Tabs 
          value={tab} 
          onChange={(_, newValue) => setTab(newValue)}
          variant={isMobile ? 'fullWidth' : 'standard'}
          sx={{
            '& .MuiTab-root': {
              minHeight: { xs: 48, sm: 48 },
              fontSize: { xs: '0.875rem', sm: '1rem' },
            },
          }}
        >
          <Tab label="Sign In" />
          <Tab label="Sign Up" />
          <Tab label="Reset Password" />
        </Tabs>
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {tab === 0 && (
          <Box sx={{ pt: 2 }}>
            {!isSupabaseConfigured && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Supabase is not configured. OAuth sign-in requires Supabase credentials. Please configure Supabase in Settings or environment variables.
              </Alert>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Google />}
                onClick={() => handleOAuthSignIn('google')}
                disabled={loading || !isSupabaseConfigured}
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
            {!isSupabaseConfigured && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Supabase is not configured. OAuth sign-up requires Supabase credentials. Please configure Supabase in Settings or environment variables.
              </Alert>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Google />}
                onClick={() => handleOAuthSignIn('google')}
                disabled={loading || !isSupabaseConfigured}
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
      <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, flexDirection: { xs: 'column-reverse', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
        <Button 
          onClick={onClose}
          fullWidth={isMobile}
          size={isMobile ? 'medium' : 'large'}
          sx={{
            minHeight: { xs: 44, sm: 48 },
          }}
        >
          Cancel
        </Button>
        {tab === 0 && (
          <Button 
            onClick={handleSignIn} 
            variant="contained" 
            disabled={loading}
            fullWidth={isMobile}
            size={isMobile ? 'medium' : 'large'}
            sx={{
              minHeight: { xs: 44, sm: 48 },
            }}
          >
            Sign In
          </Button>
        )}
        {tab === 1 && (
          <Button 
            onClick={handleSignUp} 
            variant="contained" 
            disabled={loading}
            fullWidth={isMobile}
            size={isMobile ? 'medium' : 'large'}
            sx={{
              minHeight: { xs: 44, sm: 48 },
            }}
          >
            Sign Up
          </Button>
        )}
        {tab === 2 && (
          <Button 
            onClick={handleResetPassword} 
            variant="contained" 
            disabled={loading}
            fullWidth={isMobile}
            size={isMobile ? 'medium' : 'large'}
            sx={{
              minHeight: { xs: 44, sm: 48 },
            }}
          >
            Send Reset Email
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

