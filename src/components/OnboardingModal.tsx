import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import OpenAIService from '../services/OpenAIService';

interface OnboardingModalProps {
  visible: boolean;
  onComplete: (hasApiKey: boolean) => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({
  visible,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const steps = [
    {
      title: 'Welcome to Contractor Voice Notes',
      subtitle: 'AI-Powered Client Meeting Documentation',
      icon: 'psychology',
      content: (
        <View style={styles.stepContent}>
          <Text style={styles.stepText}>
            This AI-powered app is designed specifically for residential remodeling contractors and tradespeople to professionally document client meetings with intelligent transcription and analysis.
          </Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Icon name="psychology" size={20} color="#2196F3" />
              <Text style={styles.featureText}>AI-powered transcription with 95%+ accuracy</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="summarize" size={20} color="#2196F3" />
              <Text style={styles.featureText}>Automatic meeting summaries</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="task-alt" size={20} color="#2196F3" />
              <Text style={styles.featureText}>Action item extraction</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="analytics" size={20} color="#2196F3" />
              <Text style={styles.featureText}>Client insights & project analysis</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="mic" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Record meetings up to 2+ hours</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="share" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Export professional meeting notes</Text>
            </View>
          </View>
        </View>
      ),
    },
    {
      title: 'AI Features Included',
      subtitle: 'Professional-grade transcription and analysis',
      icon: 'auto-awesome',
      content: (
        <View style={styles.stepContent}>
          <Text style={styles.stepText}>
            Your app comes pre-configured with AI capabilities:
          </Text>
          <View style={styles.aiFeatures}>
            <View style={styles.aiFeatureItem}>
              <Icon name="auto-awesome" size={20} color="#2196F3" />
              <Text style={styles.aiFeatureText}>OpenAI Whisper transcription</Text>
            </View>
            <View style={styles.aiFeatureItem}>
              <Icon name="person" size={20} color="#2196F3" />
              <Text style={styles.aiFeatureText}>Speaker identification (Contractor vs Client)</Text>
            </View>
            <View style={styles.aiFeatureItem}>
              <Icon name="summarize" size={20} color="#2196F3" />
              <Text style={styles.aiFeatureText}>Meeting summaries for follow-up</Text>
            </View>
            <View style={styles.aiFeatureItem}>
              <Icon name="task-alt" size={20} color="#2196F3" />
              <Text style={styles.aiFeatureText}>Extract action items & commitments</Text>
            </View>
            <View style={styles.aiFeatureItem}>
              <Icon name="analytics" size={20} color="#2196F3" />
              <Text style={styles.aiFeatureText}>Client sentiment & project insights</Text>
            </View>
            <View style={styles.aiFeatureItem}>
              <Icon name="topic" size={20} color="#2196F3" />
              <Text style={styles.aiFeatureText}>Topic categorization & key points</Text>
            </View>
          </View>
          <Text style={styles.noteText}>
            All AI features are included and ready to use - no additional setup required!
          </Text>
        </View>
      ),
    },
    {
      title: 'Ready to Start',
      subtitle: 'Begin recording your first client meeting',
      icon: 'play-arrow',
      content: (
        <View style={styles.stepContent}>
          <Text style={styles.stepText}>
            You're all set! The app is pre-configured with AI capabilities and ready to use.
          </Text>
          <View style={styles.readyFeatures}>
            <View style={styles.readyFeatureItem}>
              <Icon name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.readyFeatureText}>AI transcription enabled</Text>
            </View>
            <View style={styles.readyFeatureItem}>
              <Icon name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.readyFeatureText}>Meeting analysis ready</Text>
            </View>
            <View style={styles.readyFeatureItem}>
              <Icon name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.readyFeatureText}>Professional summaries enabled</Text>
            </View>
            <View style={styles.readyFeatureItem}>
              <Icon name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.readyFeatureText}>Action item tracking active</Text>
            </View>
          </View>
          <Text style={styles.readyText}>
            Tap "Complete" to start recording your first client meeting with AI-powered documentation!
          </Text>
        </View>
      ),
    },
  ];

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding - AI is pre-configured
      onComplete(true);
    }
  };

  const handleSkip = () => {
    // AI is always enabled, so complete with AI features
    onComplete(true);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => onComplete(false)}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.progressBar}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index <= currentStep && styles.progressDotActive,
                ]}
              />
            ))}
          </View>
          <Text style={styles.stepCounter}>
            {currentStep + 1} of {steps.length}
          </Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.stepHeader}>
            <View style={styles.iconContainer}>
              <Icon name={currentStepData.icon} size={48} color="#4CAF50" />
            </View>
            <Text style={styles.stepTitle}>{currentStepData.title}</Text>
            <Text style={styles.stepSubtitle}>{currentStepData.subtitle}</Text>
          </View>

          {currentStepData.content}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.buttonRow}>
            {currentStep > 0 && (
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}
            
            <View style={styles.rightButtons}>
              {currentStep < steps.length - 1 && (
                <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                  <Text style={styles.skipButtonText}>Skip</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.nextButton, isValidating && styles.disabledButton]}
                onPress={handleNext}
                disabled={isValidating}
              >
                <Text style={styles.nextButtonText}>
                  {isValidating ? 'Validating...' : 
                   currentStep === steps.length - 1 ? 'Complete' : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  progressBar: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: '#4CAF50',
  },
  stepCounter: {
    color: '#cccccc',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
  },
  stepContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
  },
  stepText: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 24,
    marginBottom: 20,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 12,
  },
  aiFeatures: {
    gap: 12,
    marginBottom: 20,
  },
  aiFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiFeatureText: {
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 12,
  },
  noteText: {
    fontSize: 12,
    color: '#cccccc',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  readyFeatures: {
    gap: 12,
    marginBottom: 20,
  },
  readyFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readyFeatureText: {
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 12,
  },
  readyText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
  instructionsList: {
    marginBottom: 20,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#ffffff',
    flex: 1,
  },
  apiKeyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#ffffff',
  },
  toggleButton: {
    padding: 8,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#cccccc',
    fontSize: 16,
  },
  rightButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  skipButtonText: {
    color: '#cccccc',
    fontSize: 16,
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OnboardingModal;
