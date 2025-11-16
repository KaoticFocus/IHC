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

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  marginLeft: `-${drawerWidth}px`,
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
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
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  onScreenChange,
  onSettingsClick,
}) => {
  const auth = useAuth();
  const { toggleTheme, theme } = useThemeMode();
  const [drawerOpen, setDrawerOpen] = React.useState(true);
  const [authOpen, setAuthOpen] = React.useState(false);
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
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
        <Toolbar>
          <HelpTooltip title="Toggle navigation menu">
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerToggle}
              edge="start"
            >
              <MenuIcon />
            </IconButton>
          </HelpTooltip>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            IHC Conversation Recorder
          </Typography>
          {auth.user && (
            <Chip
              icon={<CloudSyncIcon />}
              label={auth.user.email?.split('@')[0] || 'User'}
              size="small"
              color="success"
              sx={{ mr: 1, color: 'white' }}
            />
          )}
          <HelpTooltip title="Keyboard shortcuts">
            <IconButton color="inherit" onClick={() => setShortcutsOpen(true)}>
              <KeyboardIcon />
            </IconButton>
          </HelpTooltip>
          <HelpTooltip title={`Switch to ${theme.palette.mode === 'dark' ? 'light' : 'dark'} mode`}>
            <IconButton color="inherit" onClick={toggleTheme}>
              {theme.palette.mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </HelpTooltip>
          <HelpTooltip title={auth.user ? 'Account' : 'Sign in'}>
            <IconButton color="inherit" onClick={() => setAuthOpen(true)}>
              <AccountCircleIcon />
            </IconButton>
          </HelpTooltip>
          <HelpTooltip title="Open settings">
            <IconButton color="inherit" onClick={onSettingsClick}>
              <SettingsIcon />
            </IconButton>
          </HelpTooltip>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="persistent"
        anchor="left"
        open={drawerOpen}
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
              onClick={() => onScreenChange(item.screen)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Main open={drawerOpen}>
        <Toolbar />
        {children}
      </Main>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </Box>
  );
};

