import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import OpenAIService from '../services/OpenAIService';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onApiKeySet: (hasKey: boolean) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  onApiKeySet,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [useOpenAI, setUseOpenAI] = useState(true);

  useEffect(() => {
    if (visible) {
      checkApiKeyStatus();
    }
  }, [visible]);

  const checkApiKeyStatus = async () => {
    try {
      const hasKey = await OpenAIService.hasApiKey();
      setHasApiKey(hasKey);
      onApiKeySet(hasKey);
    } catch (error) {
      console.error('Error checking API key status:', error);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter a valid API key');
      return;
    }

    setIsValidating(true);
    try {
      const success = await OpenAIService.setApiKey(apiKey.trim());
      if (success) {
        const isValid = await OpenAIService.isApiKeyValid();
        if (isValid) {
          setHasApiKey(true);
          onApiKeySet(true);
          Alert.alert('Success', 'OpenAI API key saved and validated successfully!');
          setApiKey('');
        } else {
          Alert.alert('Error', 'Invalid API key. Please check your key and try again.');
        }
      } else {
        Alert.alert('Error', 'Failed to save API key');
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      Alert.alert('Error', 'Failed to validate API key. Please check your internet connection.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveApiKey = () => {
    Alert.alert(
      'Remove API Key',
      'Are you sure you want to remove your OpenAI API key? This will disable AI features.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await OpenAIService.setApiKey('');
              setHasApiKey(false);
              onApiKeySet(false);
              Alert.alert('Success', 'API key removed successfully');
            } catch (error) {
              console.error('Error removing API key:', error);
              Alert.alert('Error', 'Failed to remove API key');
            }
          },
        },
      ]
    );
  };

  const getApiKeyDisplay = () => {
    if (!hasApiKey) return '';
    return 'sk-••••••••••••••••••••••••••••••••••••••••';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>AI Settings</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Configuration</Text>
          <Text style={styles.sectionDescription}>
            AI features are pre-configured and always enabled. You can optionally add your own OpenAI API key for enhanced usage.
          </Text>

            <View style={styles.apiKeyContainer}>
              <Text style={styles.label}>AI Status</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusIndicator, { backgroundColor: '#4CAF50' }]}>
                  <Icon 
                    name="check" 
                    size={16} 
                    color="#ffffff" 
                  />
                </View>
                <Text style={styles.statusText}>
                  AI Features Active
                </Text>
              </View>
            </View>

            <View style={styles.apiKeyDisplay}>
              <Text style={styles.label}>Pre-configured AI Key</Text>
              <View style={styles.apiKeyRow}>
                <Text style={styles.apiKeyText}>sk-••••••••••••••••••••••••••••••••••••••••</Text>
                <View style={styles.preconfiguredBadge}>
                  <Text style={styles.preconfiguredText}>Included</Text>
                </View>
              </View>
            </View>

            <View style={styles.apiKeyInput}>
              <Text style={styles.label}>Add Your Own API Key (Optional)</Text>
              <Text style={styles.optionalText}>
                For higher usage limits, you can add your own OpenAI API key
              </Text>
              <TextInput
                style={styles.input}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="sk-..."
                placeholderTextColor="#666"
                secureTextEntry={!showApiKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.inputActions}>
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={() => setShowApiKey(!showApiKey)}
                >
                  <Icon 
                    name={showApiKey ? 'visibility-off' : 'visibility'} 
                    size={20} 
                    color="#cccccc" 
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, isValidating && styles.disabledButton]}
                  onPress={handleSaveApiKey}
                  disabled={isValidating}
                >
                  <Text style={styles.saveButtonText}>
                    {isValidating ? 'Validating...' : 'Add Key'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Features</Text>
            <Text style={styles.sectionDescription}>
              All AI features are pre-configured and always enabled for the best experience.
            </Text>

            <View style={styles.featureRow}>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>AI Transcription & Analysis</Text>
                <Text style={styles.featureDescription}>
                  OpenAI Whisper transcription with GPT-4 analysis
                </Text>
              </View>
              <View style={styles.enabledBadge}>
                <Icon name="check" size={20} color="#4CAF50" />
                <Text style={styles.enabledText}>Enabled</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Capabilities</Text>
            <View style={styles.capabilitiesList}>
              <View style={styles.capabilityItem}>
                <Icon name="mic" size={20} color="#4CAF50" />
                <Text style={styles.capabilityText}>High-accuracy transcription with Whisper</Text>
              </View>
              <View style={styles.capabilityItem}>
                <Icon name="person" size={20} color="#4CAF50" />
                <Text style={styles.capabilityText}>Advanced speaker identification</Text>
              </View>
              <View style={styles.capabilityItem}>
                <Icon name="analytics" size={20} color="#4CAF50" />
                <Text style={styles.capabilityText}>Conversation analysis and insights</Text>
              </View>
              <View style={styles.capabilityItem}>
                <Icon name="summarize" size={20} color="#4CAF50" />
                <Text style={styles.capabilityText}>Automatic summary generation</Text>
              </View>
              <View style={styles.capabilityItem}>
                <Icon name="task-alt" size={20} color="#4CAF50" />
                <Text style={styles.capabilityText}>Action item extraction</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Getting Started</Text>
            <Text style={styles.helpText}>
              1. Get your OpenAI API key from{' '}
              <Text style={styles.link}>https://platform.openai.com/api-keys</Text>
            </Text>
            <Text style={styles.helpText}>
              2. Enter your API key above and validate it
            </Text>
            <Text style={styles.helpText}>
              3. Enable AI features for enhanced transcription
            </Text>
            <Text style={styles.helpText}>
              4. Start recording with AI-powered analysis
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#16213e',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 20,
    lineHeight: 20,
  },
  apiKeyContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  apiKeyDisplay: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
  },
  apiKeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  apiKeyText: {
    fontSize: 16,
    color: '#cccccc',
    fontFamily: 'monospace',
    flex: 1,
  },
  removeButton: {
    padding: 8,
  },
  apiKeyInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 10,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleButton: {
    padding: 8,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
  },
  featureInfo: {
    flex: 1,
    marginRight: 15,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#cccccc',
  },
  capabilitiesList: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
  },
  capabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  capabilityText: {
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 12,
    flex: 1,
  },
  helpText: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 8,
    lineHeight: 20,
  },
  link: {
    color: '#4CAF50',
    textDecorationLine: 'underline',
  },
  preconfiguredBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  preconfiguredText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  optionalText: {
    fontSize: 12,
    color: '#cccccc',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  enabledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  enabledText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default SettingsModal;
