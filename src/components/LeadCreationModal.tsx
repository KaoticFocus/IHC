import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ContactInfo, ProjectInfo, LeadSource } from '../types/Lead';
import LeadManagementService from '../services/LeadManagementService';

interface LeadCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onLeadCreated: (leadId: string) => void;
}

const LeadCreationModal: React.FC<LeadCreationModalProps> = ({
  visible,
  onClose,
  onLeadCreated,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Contact Information
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phoneNumbers: { primary: '' },
    emailAddresses: { primary: '' },
  });

  // Lead Source
  const [leadSource, setLeadSource] = useState<LeadSource>({
    type: 'referral',
    details: '',
  });

  // Projects
  const [projects, setProjects] = useState<ProjectInfo[]>([
    {
      id: '1',
      name: '',
      type: 'kitchen',
      description: '',
      priority: 'medium',
      status: 'lead',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const steps = [
    { title: 'Contact Information', icon: 'person' },
    { title: 'Lead Source', icon: 'source' },
    { title: 'Project Details', icon: 'construction' },
    { title: 'Review & Create', icon: 'check' },
  ];

  const projectTypes = [
    { value: 'kitchen', label: 'Kitchen' },
    { value: 'bathroom', label: 'Bathroom' },
    { value: 'basement', label: 'Basement' },
    { value: 'addition', label: 'Addition' },
    { value: 'exterior', label: 'Exterior' },
    { value: 'whole_house', label: 'Whole House' },
    { value: 'other', label: 'Other' },
  ];

  const leadSourceTypes = [
    { value: 'referral', label: 'Referral' },
    { value: 'website', label: 'Website' },
    { value: 'social_media', label: 'Social Media' },
    { value: 'advertisement', label: 'Advertisement' },
    { value: 'walk_in', label: 'Walk-in' },
    { value: 'repeat_client', label: 'Repeat Client' },
    { value: 'other', label: 'Other' },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateLead = async () => {
    try {
      setIsCreating(true);
      
      // Validate required fields
      if (!contactInfo.firstName || !contactInfo.lastName || !contactInfo.address) {
        Alert.alert('Validation Error', 'Please fill in all required contact information.');
        return;
      }

      if (!projects[0].name || !projects[0].description) {
        Alert.alert('Validation Error', 'Please provide project name and description.');
        return;
      }

      const lead = await LeadManagementService.createLead(contactInfo, leadSource, projects);
      onLeadCreated(lead.id);
      
      Alert.alert(
        'Lead Created',
        `Lead created successfully for ${contactInfo.firstName} ${contactInfo.lastName}`,
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      console.error('Error creating lead:', error);
      Alert.alert('Error', 'Failed to create lead. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const addProject = () => {
    const newProject: ProjectInfo = {
      id: Date.now().toString(),
      name: '',
      type: 'kitchen',
      description: '',
      priority: 'medium',
      status: 'lead',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setProjects([...projects, newProject]);
  };

  const removeProject = (index: number) => {
    if (projects.length > 1) {
      setProjects(projects.filter((_, i) => i !== index));
    }
  };

  const updateProject = (index: number, updates: Partial<ProjectInfo>) => {
    const updatedProjects = projects.map((project, i) => 
      i === index ? { ...project, ...updates } : project
    );
    setProjects(updatedProjects);
  };

  const renderContactInfo = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Contact Information</Text>
      
      <View style={styles.inputRow}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.input}
            value={contactInfo.firstName}
            onChangeText={(text) => setContactInfo({ ...contactInfo, firstName: text })}
            placeholder="John"
          />
        </View>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Last Name *</Text>
          <TextInput
            style={styles.input}
            value={contactInfo.lastName}
            onChangeText={(text) => setContactInfo({ ...contactInfo, lastName: text })}
            placeholder="Smith"
          />
        </View>
      </View>

      <Text style={styles.label}>Address *</Text>
      <TextInput
        style={styles.input}
        value={contactInfo.address}
        onChangeText={(text) => setContactInfo({ ...contactInfo, address: text })}
        placeholder="123 Main Street"
      />

      <View style={styles.inputRow}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>City *</Text>
          <TextInput
            style={styles.input}
            value={contactInfo.city}
            onChangeText={(text) => setContactInfo({ ...contactInfo, city: text })}
            placeholder="Anytown"
          />
        </View>
        <View style={styles.quarterInput}>
          <Text style={styles.label}>State *</Text>
          <TextInput
            style={styles.input}
            value={contactInfo.state}
            onChangeText={(text) => setContactInfo({ ...contactInfo, state: text })}
            placeholder="CA"
            maxLength={2}
          />
        </View>
        <View style={styles.quarterInput}>
          <Text style={styles.label}>ZIP *</Text>
          <TextInput
            style={styles.input}
            value={contactInfo.zipCode}
            onChangeText={(text) => setContactInfo({ ...contactInfo, zipCode: text })}
            placeholder="12345"
            maxLength={5}
          />
        </View>
      </View>

      <Text style={styles.label}>Primary Phone *</Text>
      <TextInput
        style={styles.input}
        value={contactInfo.phoneNumbers.primary}
        onChangeText={(text) => setContactInfo({ 
          ...contactInfo, 
          phoneNumbers: { ...contactInfo.phoneNumbers, primary: text }
        })}
        placeholder="(555) 123-4567"
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Primary Email *</Text>
      <TextInput
        style={styles.input}
        value={contactInfo.emailAddresses.primary}
        onChangeText={(text) => setContactInfo({ 
          ...contactInfo, 
          emailAddresses: { ...contactInfo.emailAddresses, primary: text }
        })}
        placeholder="john@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
    </View>
  );

  const renderLeadSource = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Lead Source</Text>
      
      <Text style={styles.label}>How did they find you? *</Text>
      <View style={styles.optionsGrid}>
        {leadSourceTypes.map((source) => (
          <TouchableOpacity
            key={source.value}
            style={[
              styles.optionButton,
              leadSource.type === source.value && styles.selectedOption
            ]}
            onPress={() => setLeadSource({ ...leadSource, type: source.value as any })}
          >
            <Text style={[
              styles.optionText,
              leadSource.type === source.value && styles.selectedOptionText
            ]}>
              {source.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Details</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={leadSource.details}
        onChangeText={(text) => setLeadSource({ ...leadSource, details: text })}
        placeholder="Additional details about how they found you..."
        multiline
        numberOfLines={3}
      />
    </View>
  );

  const renderProjects = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Project Details</Text>
        <TouchableOpacity style={styles.addButton} onPress={addProject}>
          <Icon name="add" size={20} color="#4CAF50" />
          <Text style={styles.addButtonText}>Add Project</Text>
        </TouchableOpacity>
      </View>

      {projects.map((project, index) => (
        <View key={project.id} style={styles.projectCard}>
          <View style={styles.projectHeader}>
            <Text style={styles.projectNumber}>Project {index + 1}</Text>
            {projects.length > 1 && (
              <TouchableOpacity onPress={() => removeProject(index)}>
                <Icon name="close" size={20} color="#ff4444" />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.label}>Project Name *</Text>
          <TextInput
            style={styles.input}
            value={project.name}
            onChangeText={(text) => updateProject(index, { name: text })}
            placeholder="Kitchen Remodel"
          />

          <Text style={styles.label}>Project Type *</Text>
          <View style={styles.optionsGrid}>
            {projectTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.optionButton,
                  project.type === type.value && styles.selectedOption
                ]}
                onPress={() => updateProject(index, { type: type.value as any })}
              >
                <Text style={[
                  styles.optionText,
                  project.type === type.value && styles.selectedOptionText
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={project.description}
            onChangeText={(text) => updateProject(index, { description: text })}
            placeholder="Describe what the homeowner wants to do..."
            multiline
            numberOfLines={3}
          />
        </View>
      ))}
    </View>
  );

  const renderReview = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review & Create</Text>
      
      <View style={styles.reviewCard}>
        <Text style={styles.reviewTitle}>Contact Information</Text>
        <Text style={styles.reviewText}>
          {contactInfo.firstName} {contactInfo.lastName}
        </Text>
        <Text style={styles.reviewText}>
          {contactInfo.address}, {contactInfo.city}, {contactInfo.state} {contactInfo.zipCode}
        </Text>
        <Text style={styles.reviewText}>{contactInfo.phoneNumbers.primary}</Text>
        <Text style={styles.reviewText}>{contactInfo.emailAddresses.primary}</Text>
      </View>

      <View style={styles.reviewCard}>
        <Text style={styles.reviewTitle}>Lead Source</Text>
        <Text style={styles.reviewText}>
          {leadSourceTypes.find(s => s.value === leadSource.type)?.label}
        </Text>
        {leadSource.details && (
          <Text style={styles.reviewText}>{leadSource.details}</Text>
        )}
      </View>

      <View style={styles.reviewCard}>
        <Text style={styles.reviewTitle}>Projects ({projects.length})</Text>
        {projects.map((project, index) => (
          <View key={project.id} style={styles.projectReview}>
            <Text style={styles.reviewText}>
              {index + 1}. {project.name} ({projectTypes.find(t => t.value === project.type)?.label})
            </Text>
            <Text style={styles.reviewSubtext}>{project.description}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderContactInfo();
      case 1: return renderLeadSource();
      case 2: return renderProjects();
      case 3: return renderReview();
      default: return renderContactInfo();
    }
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
          <Text style={styles.title}>Create New Lead</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View style={styles.progressBar}>
          {steps.map((step, index) => (
            <View key={index} style={styles.progressStep}>
              <View style={[
                styles.progressIcon,
                index <= currentStep && styles.progressIconActive
              ]}>
                <Icon 
                  name={step.icon} 
                  size={16} 
                  color={index <= currentStep ? '#ffffff' : '#666'} 
                />
              </View>
              <Text style={[
                styles.progressText,
                index <= currentStep && styles.progressTextActive
              ]}>
                {step.title}
              </Text>
            </View>
          ))}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderCurrentStep()}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.backButton]}
            onPress={handleBack}
            disabled={currentStep === 0}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          {currentStep === steps.length - 1 ? (
            <TouchableOpacity
              style={[styles.button, styles.createButton, isCreating && styles.disabledButton]}
              onPress={handleCreateLead}
              disabled={isCreating}
            >
              {isCreating ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.createButtonText}>Create Lead</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.nextButton]}
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          )}
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
  progressBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#16213e',
  },
  progressStep: {
    flex: 1,
    alignItems: 'center',
  },
  progressIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  progressIconActive: {
    backgroundColor: '#4CAF50',
  },
  progressText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  progressTextActive: {
    color: '#4CAF50',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  label: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 15,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  quarterInput: {
    flex: 0.5,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderColor: '#4CAF50',
  },
  optionText: {
    color: '#ffffff',
    fontSize: 14,
  },
  selectedOptionText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  projectCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  projectNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  reviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  reviewText: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 5,
  },
  reviewSubtext: {
    fontSize: 12,
    color: '#cccccc',
    marginBottom: 5,
    fontStyle: 'italic',
  },
  projectReview: {
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#4CAF50',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#4CAF50',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#666',
  },
});

export default LeadCreationModal;
