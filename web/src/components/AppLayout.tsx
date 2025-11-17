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
  BottomNavigation,
  BottomNavigationAction,
  Paper,
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
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Dashboard as DashboardIcon,
  RecordVoiceOver as ConsultIcon,
  Hearing as ListenIcon,
  KeyboardVoice as DictateIcon,
  Architecture as TasksIcon,
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
  onMicClick?: () => void; // Callback for mic button in bottom nav
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  onScreenChange,
  onSettingsClick,
  currentScreen = 'main',
  onMicClick,
}) => {
  const auth = useAuth();
  const { toggleTheme, theme } = useThemeMode();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
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

  // Bottom navigation items for mobile - matching the image
  const bottomNavItems = [
    { label: 'Home', icon: <DashboardIcon />, screen: 'main' },
    { label: 'Clients', icon: <PeopleIcon />, screen: 'clients' },
    { label: 'Consult', icon: <ConsultIcon />, screen: 'consultations' },
    { label: 'Listen', icon: <ListenIcon />, screen: 'mic', isMic: true },
    { label: 'Dictate', icon: <DictateIcon />, screen: 'mic', isMic: true },
    { label: 'Projects', icon: <FolderIcon />, screen: 'projects' },
    { label: 'Tasks', icon: <TasksIcon />, screen: 'tasks' },
  ];

  // Map current screen to bottom nav value
  const getBottomNavValue = () => {
    const item = bottomNavItems.find(item => item.screen === currentScreen);
    return item ? item.screen : 'main';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          {!isMobile && (
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
          )}
          <Typography 
            variant={isMobile ? 'subtitle1' : 'h6'} 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' },
            }}
          >
            ConsultFlow Pro
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

      {/* Desktop Drawer - Hidden on mobile */}
      {!isMobile && (
        <Drawer
          variant="persistent"
          anchor="left"
          open={drawerOpen}
          onClose={handleDrawerClose}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
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
                }}
                selected={currentScreen === item.screen}
                sx={{
                  minHeight: 48,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                  '&.Mui-selected': {
                    bgcolor: 'action.selected',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Drawer>
      )}

      <Main open={drawerOpen} isMobile={isMobile}>
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }} />
        <Box sx={{ 
          width: '100%',
          maxWidth: '100%',
          overflowX: 'hidden',
          paddingBottom: isMobile ? '80px' : 0, // Space for bottom nav on mobile
        }}>
          {children}
        </Box>
      </Main>

      {/* Bottom Navigation for Mobile */}
      {isMobile && (
        <Paper 
          sx={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            zIndex: (theme) => theme.zIndex.drawer + 1,
            borderTop: '1px solid',
            borderColor: 'divider',
          }} 
          elevation={3}
        >
          <BottomNavigation
            value={getBottomNavValue() === 'mic' ? currentScreen : getBottomNavValue()}
            onChange={(event, newValue) => {
              // Mic button is handled by onClick on BottomNavigationAction
              if (newValue === 'mic' || bottomNavItems.find(item => item.screen === newValue)?.isMic) {
                return;
              }
              onScreenChange(newValue);
            }}
            showLabels
            sx={{
              height: 64,
              '& .MuiBottomNavigationAction-root': {
                minWidth: 0,
                padding: '4px 2px',
                maxWidth: '14.28%', // 7 items = ~14.28% each
                '&.Mui-selected': {
                  color: 'primary.main',
                },
              },
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.65rem',
                marginTop: '2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              },
            }}
          >
            {bottomNavItems.map((item) => (
              <BottomNavigationAction
                key={item.screen}
                label={item.label}
                value={item.isMic ? currentScreen : item.screen}
                icon={item.icon}
                onClick={(e) => {
                  if (item.isMic) {
                    e.preventDefault();
                    // Trigger voice assistant via global handler
                    if ((window as any).__voiceAssistantMicClick) {
                      (window as any).__voiceAssistantMicClick();
                    }
                  }
                }}
                sx={{
                  ...(item.isMic && {
                    '& .MuiBottomNavigationAction-root': {
                      minWidth: 0,
                    },
                  }),
                }}
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}

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

