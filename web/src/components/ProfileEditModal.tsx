import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Avatar,
  IconButton,
  Typography,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Grid,
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  PhotoCamera as PhotoCameraIcon,
  AccountCircle as AccountCircleIcon,
  EmojiEmotions as EmojiIcon,
  AutoAwesome as AIIcon,
} from '@mui/icons-material';
import { useAuth, UserProfile } from '../context/AuthContext';
import { ErrorService } from '../services/ErrorService';
import { getSupabaseClient } from '../services/SupabaseService';
import OpenAIService from '../services/OpenAIService';

interface ProfileEditModalProps {
  open: boolean;
  onClose: () => void;
}

// Emoji categories
const EMOJI_CATEGORIES = {
  'Smileys & People': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓'],
  'Animals & Nature': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐓', '🦃', '🦤', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦫', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔'],
  'Food & Drink': ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🥞', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🌮', '🌯', '🥗', '🥘', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕️', '🍵', '🥃', '🍺', '🍻', '🥂', '🍷', '🥴', '🍸', '🍹', '🧉', '🍾', '🧊'],
  'Activities': ['⚽️', '🏀', '🏈', '⚾️', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🥅', '🏒', '🏑', '🏏', '🥍', '🏹', '🎣', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🏋️‍♀️', '🏋️', '🏋️‍♂️', '🤼‍♀️', '🤼', '🤼‍♂️', '🤸‍♀️', '🤸', '🤸‍♂️', '⛹️‍♀️', '⛹️', '⛹️‍♂️', '🤺', '🤾‍♀️', '🤾', '🤾‍♂️', '🏌️‍♀️', '🏌️', '🏌️‍♂️', '🏇', '🧘‍♀️', '🧘', '🧘‍♂️', '🏄‍♀️', '🏄', '🏄‍♂️', '🏊‍♀️', '🏊', '🏊‍♂️', '🤽‍♀️', '🤽', '🤽‍♂️', '🚣‍♀️', '🚣', '🚣‍♂️', '🧗‍♀️', '🧗', '🧗‍♂️', '🚵‍♀️', '🚵', '🚵‍♂️', '🚴‍♀️', '🚴', '🚴‍♂️', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🤹‍♀️', '🤹', '🤹‍♂️', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰', '🧩'],
  'Travel & Places': ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛴', '🚲', '🛵', '🏍️', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🚁', '🚟', '🚠', '🚡', '🛰️', '🚀', '🛸', '🛎️', '🧳', '⌛️', '⏳', '⌚️', '⏰', '⏱️', '⏲️', '🕰️', '🕛', '🕧', '🕐', '🕜', '🕑', '🕝', '🕒', '🕞', '🕓', '🕟', '🕔', '🕠', '🕕', '🕡', '🕖', '🕢', '🕗', '🕣', '🕘', '🕤', '🕙', '🕥', '🕚', '🕦'],
  'Objects': ['💎', '🔪', '⚔️', '🛡️', '🚬', '⚰️', '⚱️', '🏺', '🔮', '📿', '💈', '⚗️', '🔭', '🔬', '🕳️', '💊', '💉', '🩸', '🩹', '🩺', '🔋', '🔌', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '🕹️', '🗜️', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '⏱️', '⏲️', '⏰', '🕰️', '⌚️', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌚️', '📱', '📲'],
  'Symbols': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈️', '♉️', '♊️', '♋️', '♌️', '♍️', '♎️', '♏️', '♐️', '♑️', '♒️', '♓️', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚️', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕️', '🛑', '⛔️', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗️', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯️', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿️', '🅿️', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🔢', '#️⃣', '*️⃣', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'],
};

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ open, onClose }) => {
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [emojiTab, setEmojiTab] = useState(0);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<UserProfile>>({
    first_name: '',
    last_name: '',
    phone: '',
    work_email: '',
    avatar_url: '',
  });

  useEffect(() => {
    if (open && profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        work_email: profile.work_email || '',
        avatar_url: profile.avatar_url || '',
      });
      setError(null);
    }
  }, [open, profile]);

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarClick = () => {
    setShowAvatarOptions(true);
  };

  const handleUploadImage = () => {
    setShowAvatarOptions(false);
    fileInputRef.current?.click();
  };

  const handleChooseEmoji = () => {
    setShowAvatarOptions(false);
    setShowEmojiPicker(true);
  };

  const handleGenerateAI = () => {
    setShowAvatarOptions(false);
    setShowAIGenerator(true);
    setGeneratedImageUrl(null);
    setAiPrompt('');
  };

  const handleGenerateImage = async () => {
    if (!aiPrompt.trim()) {
      setError('Please enter a description for the image');
      return;
    }

    setGeneratingImage(true);
    setError(null);

    try {
      const hasApiKey = await OpenAIService.hasApiKey();
      if (!hasApiKey) {
        throw new Error('OpenAI API key not configured. Please set your API key in Settings.');
      }

      const imageUrl = await OpenAIService.generateImage(
        `Professional profile picture avatar: ${aiPrompt}. Clean, modern, suitable for a business profile.`,
        '512x512'
      );
      
      setGeneratedImageUrl(imageUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to generate image');
      ErrorService.handleError(err, 'aiImageGeneration');
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleUseGeneratedImage = async () => {
    if (!generatedImageUrl || !user) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      // Download the image from OpenAI URL
      const response = await fetch(generatedImageUrl);
      const blob = await response.blob();
      
      // Upload to Supabase Storage
      const fileExt = 'png';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: 'image/png',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      await updateProfile({ avatar_url: urlData.publicUrl });
      await refreshProfile();

      setFormData((prev) => ({ ...prev, avatar_url: urlData.publicUrl }));
      setShowAIGenerator(false);
      setGeneratedImageUrl(null);
      setAiPrompt('');
    } catch (err: any) {
      setError(err.message || 'Failed to save generated image');
      ErrorService.handleError(err, 'saveGeneratedImage');
    } finally {
      setLoading(false);
    }
  };

  const handleEmojiSelect = async (emoji: string) => {
    setShowEmojiPicker(false);
    setLoading(true);
    setError(null);

    try {
      // Store emoji as data URL (emoji character encoded)
      // We'll store it as a special format: "emoji:😀"
      const emojiUrl = `emoji:${emoji}`;
      await updateProfile({ avatar_url: emojiUrl });
      await refreshProfile();
      setFormData((prev) => ({ ...prev, avatar_url: emojiUrl }));
    } catch (err: any) {
      setError(err.message || 'Failed to set emoji');
      ErrorService.handleError(err, 'emojiSelect');
    } finally {
      setLoading(false);
    }
  };


  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      await updateProfile({ avatar_url: urlData.publicUrl });
      await refreshProfile();

      setFormData((prev) => ({ ...prev, avatar_url: urlData.publicUrl }));
    } catch (err: any) {
      setError(err.message || 'Failed to upload avatar');
      ErrorService.handleError(err, 'avatarUpload');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      setError('You must be signed in to update your profile');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await updateProfile(formData);
      onClose();
    } catch (err: any) {
      // Provide user-friendly error message for missing table
      const errorMessage = err.message || 'Failed to update profile';
      if (errorMessage.includes('schema cache') || errorMessage.includes('table not found') || errorMessage.includes('Database table not found')) {
        setError('Profile feature requires database setup. Please contact support or check database configuration.');
      } else {
        setError(errorMessage);
      }
      ErrorService.handleError(err, 'profileUpdate');
    } finally {
      setLoading(false);
    }
  };

  const displayName = profile?.first_name || profile?.last_name
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
    : profile?.full_name || user?.email?.split('@')[0] || 'User';

  const displayEmail = user?.email || 'Not signed in';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Edit Profile</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Box sx={{ position: 'relative', mb: 2 }}>
            <Avatar
              src={formData.avatar_url?.startsWith('emoji:') ? undefined : formData.avatar_url}
              sx={{
                width: 100,
                height: 100,
                bgcolor: 'primary.main',
                fontSize: '2.5rem',
              }}
            >
              {formData.avatar_url?.startsWith('emoji:') ? (
                <Typography sx={{ fontSize: '3rem' }}>
                  {formData.avatar_url.replace('emoji:', '')}
                </Typography>
              ) : !formData.avatar_url ? (
                <AccountCircleIcon sx={{ fontSize: 100 }} />
              ) : null}
            </Avatar>
            <IconButton
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              }}
              onClick={handleAvatarClick}
              disabled={uploading || loading}
            >
              {uploading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <PhotoCameraIcon />
              )}
            </IconButton>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarUpload}
            />
          </Box>
          <Typography variant="h6">{displayName}</Typography>
          <Typography variant="body2" color="text.secondary">
            {displayEmail}
          </Typography>
          {user?.app_metadata?.provider === 'google' && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              Signed in with Google
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="First Name"
              value={formData.first_name || ''}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Last Name"
              value={formData.last_name || ''}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              margin="normal"
            />
          </Box>

          <TextField
            fullWidth
            label="Phone Number"
            value={formData.phone || ''}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            margin="normal"
            placeholder="(555) 123-4567"
          />

          <TextField
            fullWidth
            label="Work Email"
            type="email"
            value={formData.work_email || ''}
            onChange={(e) => handleInputChange('work_email', e.target.value)}
            margin="normal"
            placeholder="work@example.com"
            helperText={
              user?.app_metadata?.provider === 'google'
                ? 'This can be different from your Google login email'
                : 'Optional: Use a different email for work communications'
            }
          />

          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Login Email:</strong> {displayEmail}
            </Typography>
            {user?.app_metadata?.provider === 'google' && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Your login email is managed by Google and cannot be changed here.
              </Typography>
            )}
          </Box>
        </Box>

        {/* Avatar Options Dialog */}
        <Dialog open={showAvatarOptions} onClose={() => setShowAvatarOptions(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Choose Avatar</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<PhotoCameraIcon />}
                onClick={handleUploadImage}
                sx={{ py: 1.5 }}
              >
                Upload Image
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<EmojiIcon />}
                onClick={handleChooseEmoji}
                sx={{ py: 1.5 }}
              >
                Choose Emoji
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<AIIcon />}
                onClick={handleGenerateAI}
                sx={{ py: 1.5 }}
              >
                Generate with AI
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAvatarOptions(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>

        {/* AI Image Generator Dialog */}
        <Dialog 
          open={showAIGenerator} 
          onClose={() => {
            setShowAIGenerator(false);
            setGeneratedImageUrl(null);
            setAiPrompt('');
          }} 
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h6">Generate Profile Image with AI</Typography>
          </DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            
            <TextField
              fullWidth
              label="Describe your profile image"
              placeholder="e.g., professional headshot of a contractor, friendly business person, modern avatar"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              margin="normal"
              multiline
              rows={3}
              disabled={generatingImage || !!generatedImageUrl}
              helperText="Describe what you want your profile picture to look like"
            />

            {generatingImage && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 3 }}>
                <CircularProgress />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Generating your image... This may take a moment.
                </Typography>
              </Box>
            )}

            {generatedImageUrl && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Generated Image Preview:
                </Typography>
                <Box
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 2,
                    display: 'flex',
                    justifyContent: 'center',
                    bgcolor: 'background.paper',
                  }}
                >
                  <Avatar
                    src={generatedImageUrl}
                    sx={{
                      width: 200,
                      height: 200,
                      border: 2,
                      borderColor: 'primary.main',
                    }}
                  />
                </Box>
                <Alert severity="info" sx={{ mt: 2 }}>
                  Review the generated image. Click "Use This Image" to set it as your avatar, or generate a new one.
                </Alert>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setShowAIGenerator(false);
                setGeneratedImageUrl(null);
                setAiPrompt('');
              }}
              disabled={generatingImage}
            >
              Cancel
            </Button>
            {!generatedImageUrl && (
              <Button
                onClick={handleGenerateImage}
                variant="contained"
                disabled={!aiPrompt.trim() || generatingImage}
                startIcon={<AIIcon />}
              >
                {generatingImage ? 'Generating...' : 'Generate Image'}
              </Button>
            )}
            {generatedImageUrl && (
              <>
                <Button
                  onClick={() => {
                    setGeneratedImageUrl(null);
                    setAiPrompt('');
                  }}
                  variant="outlined"
                >
                  Generate Another
                </Button>
                <Button
                  onClick={handleUseGeneratedImage}
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Use This Image'}
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>

        {/* Emoji Picker Dialog */}
        <Dialog 
          open={showEmojiPicker} 
          onClose={() => setShowEmojiPicker(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: { maxHeight: '70vh' }
          }}
        >
          <DialogTitle>
            <Typography variant="h6">Choose an Emoji</Typography>
          </DialogTitle>
          <DialogContent>
            <Tabs 
              value={emojiTab} 
              onChange={(_, newValue) => setEmojiTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
            >
              {Object.keys(EMOJI_CATEGORIES).map((category) => (
                <Tab key={category} label={category} />
              ))}
            </Tabs>
            <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
              <Grid container spacing={1}>
                {Object.values(EMOJI_CATEGORIES)[emojiTab].map((emoji, index) => (
                  <Grid item key={index}>
                    <Paper
                      sx={{
                        width: 50,
                        height: 50,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '1.8rem',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.2s',
                      }}
                      onClick={() => handleEmojiSelect(emoji)}
                    >
                      {emoji}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowEmojiPicker(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={loading || uploading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

