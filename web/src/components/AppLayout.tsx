import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  styled,
  Chip,
  Avatar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Settings as SettingsIcon,
  Home as HomeIcon,
  Description as DescriptionIcon,
  AccountCircle as AccountCircleIcon,
  CloudSync as CloudSyncIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Keyboard as KeyboardIcon,
  Folder as FolderIcon,
  Mic as MicIcon,
} from '@mui/icons-material';
import { HelpTooltip } from './HelpTooltip';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';
import { AuthModal } from './AuthModal';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { ProfileEditModal } from './ProfileEditModal';
import { VoiceAssistant } from './VoiceAssistant';

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' && prop !== 'isMobile' })<{
  open?: boolean;
  isMobile?: boolean;
}>(({ theme, open, isMobile }) => ({
  flexGrow: 1,
  padding: isMobile ? theme.spacing(2) : theme.spacing(3),
  marginLeft: isMobile ? 0 : `-${drawerWidth}px`,
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(!isMobile && open && {
    marginLeft: 0,
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

interface AppLayoutProps {
  children: React.ReactNode;
  onScreenChange: (screen: string) => void;
  onSettingsClick: () => void;
  currentScreen?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  onScreenChange,
  onSettingsClick,
  currentScreen = 'main',
}) => {
  const auth = useAuth();
  const { toggleTheme, theme } = useThemeMode();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const isTablet = useMediaQuery(muiTheme.breakpoints.between('md', 'lg'));
  const [drawerOpen, setDrawerOpen] = React.useState(!isMobile);
  const [authOpen, setAuthOpen] = React.useState(false);
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);

  // Update drawer state when screen size changes
  React.useEffect(() => {
    setDrawerOpen(!isMobile);
  }, [isMobile]);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleDrawerClose = () => {
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, screen: 'main' },
    { text: 'Consultations', icon: <MicIcon />, screen: 'consultations' },
    { text: 'Projects', icon: <FolderIcon />, screen: 'projects' },
    { text: 'Documents', icon: <DescriptionIcon />, screen: 'documents' },
    { text: 'Transcripts', icon: <DescriptionIcon />, screen: 'transcripts' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <HelpTooltip title="Toggle navigation menu">
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerToggle}
              edge="start"
              sx={{ 
                minWidth: { xs: 44, sm: 48 },
                minHeight: { xs: 44, sm: 48 },
              }}
            >
              <MenuIcon />
            </IconButton>
          </HelpTooltip>
          <Typography 
            variant={isMobile ? 'subtitle1' : 'h6'} 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' },
            }}
          >
            {isMobile ? 'IHC Recorder' : 'IHC Conversation Recorder'}
          </Typography>
          {!isMobile && (
            <>
              {auth.user ? (
                <Chip
                  icon={<CloudSyncIcon />}
                  label={
                    auth.profile?.first_name || auth.profile?.last_name
                      ? `${auth.profile.first_name || ''} ${auth.profile.last_name || ''}`.trim()
                      : auth.profile?.full_name || auth.user.email?.split('@')[0] || 'User'
                  }
                  size="small"
                  color="success"
                  sx={{ mr: 1, color: 'white', display: { xs: 'none', md: 'flex' } }}
                  title={`Signed in as ${auth.user.email}`}
                />
              ) : (
                <Chip
                  label="Not signed in"
                  size="small"
                  color="default"
                  sx={{ mr: 1, color: 'white', bgcolor: 'rgba(255, 255, 255, 0.2)', display: { xs: 'none', md: 'flex' } }}
                />
              )}
              <HelpTooltip title="Keyboard shortcuts">
                <IconButton 
                  color="inherit" 
                  onClick={() => setShortcutsOpen(true)}
                  sx={{ 
                    minWidth: { xs: 44, sm: 48 },
                    minHeight: { xs: 44, sm: 48 },
                    display: { xs: 'none', sm: 'flex' },
                  }}
                >
                  <KeyboardIcon />
                </IconButton>
              </HelpTooltip>
            </>
          )}
          <HelpTooltip title={`Switch to ${theme.palette.mode === 'dark' ? 'light' : 'dark'} mode`}>
            <IconButton 
              color="inherit" 
              onClick={toggleTheme}
              sx={{ 
                minWidth: { xs: 44, sm: 48 },
                minHeight: { xs: 44, sm: 48 },
              }}
            >
              {theme.palette.mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </HelpTooltip>
          <HelpTooltip title={auth.user ? 'Account & Sign Out' : 'Sign in'}>
            <IconButton 
              color="inherit" 
              onClick={() => setAuthOpen(true)}
              sx={{ 
                minWidth: { xs: 44, sm: 48 },
                minHeight: { xs: 44, sm: 48 },
              }}
            >
              {auth.user && auth.profile?.avatar_url ? (
                auth.profile.avatar_url.startsWith('emoji:') ? (
                  <Avatar 
                    sx={{ 
                      width: { xs: 28, sm: 32 }, 
                      height: { xs: 28, sm: 32 }, 
                      bgcolor: 'primary.main', 
                      fontSize: { xs: '1rem', sm: '1.2rem' } 
                    }}
                  >
                    {auth.profile.avatar_url.replace('emoji:', '')}
                  </Avatar>
                ) : (
                  <Avatar 
                    src={auth.profile.avatar_url} 
                    sx={{ width: { xs: 28, sm: 32 }, height: { xs: 28, sm: 32 } }}
                  >
                    <AccountCircleIcon />
                  </Avatar>
                )
              ) : (
                <AccountCircleIcon />
              )}
            </IconButton>
          </HelpTooltip>
          <HelpTooltip title="Open settings">
            <IconButton 
              color="inherit" 
              onClick={onSettingsClick}
              sx={{ 
                minWidth: { xs: 44, sm: 48 },
                minHeight: { xs: 44, sm: 48 },
              }}
            >
              <SettingsIcon />
            </IconButton>
          </HelpTooltip>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            ...(isMobile && {
              width: { xs: '85%', sm: drawerWidth },
              maxWidth: drawerWidth,
            }),
          },
        }}
      >
        <Toolbar />
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => {
                onScreenChange(item.screen);
                if (isMobile) {
                  handleDrawerClose();
                }
              }}
              sx={{
                minHeight: { xs: 56, sm: 48 },
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: { xs: 48, sm: 40 } }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: { xs: '1rem', sm: '0.875rem' },
                }}
              />
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Main open={drawerOpen} isMobile={isMobile}>
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }} />
        <Box sx={{ 
          width: '100%',
          maxWidth: '100%',
          overflowX: 'hidden',
        }}>
          {children}
        </Box>
      </Main>
      <AuthModal 
        open={authOpen} 
        onClose={() => setAuthOpen(false)}
        onEditProfile={() => {
          setAuthOpen(false);
          setProfileOpen(true);
        }}
      />
      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <ProfileEditModal open={profileOpen} onClose={() => setProfileOpen(false)} />
      <VoiceAssistant currentScreen={currentScreen} onNavigate={onScreenChange} />
    </Box>
  );
};

