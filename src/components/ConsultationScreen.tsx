import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DocumentPicker from 'react-native-document-picker';
import { Consultation, CreateConsultationInput } from '../types/Consultation';
import ConsultationService from '../services/ConsultationService';

interface ConsultationScreenProps {
  visible: boolean;
  onClose: () => void;
}

const ConsultationScreen: React.FC<ConsultationScreenProps> = ({ visible, onClose }) => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [uploading, setUploading] = useState(false);

  const [consultationForm, setConsultationForm] = useState<CreateConsultationInput>({
    title: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    address: '',
    consultationDate: new Date(),
    notes: '',
  });

  const [notesText, setNotesText] = useState('');

  useEffect(() => {
    if (visible) {
      loadConsultations();
    }
  }, [visible]);

  const loadConsultations = async () => {
    try {
      setLoading(true);
      setError(null);
      await ConsultationService.initialize();
      
      if (!ConsultationService.isAvailable()) {
        setError('Consultation management requires Supabase authentication. Please configure Supabase in settings.');
        setLoading(false);
        return;
      }

      const allConsultations = await ConsultationService.getAllConsultations();
      setConsultations(allConsultations);
    } catch (err) {
      console.error('Error loading consultations:', err);
      setError((err as Error).message || 'Failed to load consultations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConsultation = async () => {
    if (!consultationForm.title.trim()) {
      Alert.alert('Error', 'Please enter a consultation title');
      return;
    }

    try {
      setError(null);
      const newConsultation = await ConsultationService.createConsultation(consultationForm);
      setConsultations([newConsultation, ...consultations]);
      setShowCreateModal(false);
      setConsultationForm({
        title: '',
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        address: '',
        consultationDate: new Date(),
        notes: '',
      });
      Alert.alert('Success', 'Consultation created successfully');
    } catch (err) {
      Alert.alert('Error', (err as Error).message || 'Failed to create consultation');
    }
  };

  const handleDeleteConsultation = async (consultationId: string) => {
    Alert.alert(
      'Delete Consultation',
      'Are you sure you want to delete this consultation? All photos and notes will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setError(null);
              await ConsultationService.deleteConsultation(consultationId);
              setConsultations(consultations.filter(c => c.id !== consultationId));
              if (selectedConsultation?.id === consultationId) {
                setShowViewModal(false);
                setSelectedConsultation(null);
              }
            } catch (err) {
              Alert.alert('Error', (err as Error).message || 'Failed to delete consultation');
            }
          },
        },
      ]
    );
  };

  const handlePhotoUpload = async () => {
    if (!selectedConsultation) return;

    try {
      setUploading(true);
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.images],
        allowMultiSelection: false,
      });

      if (result && result.length > 0) {
        const file = result[0];
        const fileName = file.name || `photo_${Date.now()}.jpg`;
        const mimeType = file.type || 'image/jpeg';

        await ConsultationService.uploadPhoto(
          selectedConsultation.id,
          file.uri,
          fileName,
          mimeType
        );

        // Reload consultation
        const updatedConsultation = await ConsultationService.getConsultation(selectedConsultation.id);
        if (updatedConsultation) {
          setConsultations(consultations.map(c => c.id === updatedConsultation.id ? updatedConsultation : c));
          setSelectedConsultation(updatedConsultation);
        }

        Alert.alert('Success', 'Photo uploaded successfully');
      }
    } catch (err: any) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled
        return;
      }
      Alert.alert('Error', (err as Error).message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (consultationId: string, photoId: string) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setError(null);
              await ConsultationService.deletePhoto(consultationId, photoId);
              
              // Reload consultation
              const updatedConsultation = await ConsultationService.getConsultation(consultationId);
              if (updatedConsultation) {
                setConsultations(consultations.map(c => c.id === updatedConsultation.id ? updatedConsultation : c));
                if (selectedConsultation?.id === consultationId) {
                  setSelectedConsultation(updatedConsultation);
                }
              }
            } catch (err) {
              Alert.alert('Error', (err as Error).message || 'Failed to delete photo');
            }
          },
        },
      ]
    );
  };

  const handleSaveNotes = async () => {
    if (!selectedConsultation) return;

    try {
      setError(null);
      await ConsultationService.updateConsultation({
        id: selectedConsultation.id,
        notes: notesText,
      });
      
      // Reload consultation
      const updatedConsultation = await ConsultationService.getConsultation(selectedConsultation.id);
      if (updatedConsultation) {
        setConsultations(consultations.map(c => c.id === updatedConsultation.id ? updatedConsultation : c));
        setSelectedConsultation(updatedConsultation);
      }
      
      setShowNotesModal(false);
      Alert.alert('Success', 'Notes saved successfully');
    } catch (err) {
      Alert.alert('Error', (err as Error).message || 'Failed to save notes');
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderConsultationItem = ({ item }: { item: Consultation }) => (
    <TouchableOpacity
      style={styles.consultationItem}
      onPress={() => {
        setSelectedConsultation(item);
        setShowViewModal(true);
      }}
    >
      <View style={styles.consultationHeader}>
        <Text style={styles.consultationTitle}>{item.title}</Text>
        {item.hasRecording && (
          <View style={styles.recordedBadge}>
            <Icon name="mic" size={16} color="#4CAF50" />
            <Text style={styles.recordedBadgeText}>Recorded</Text>
          </View>
        )}
      </View>
      {item.clientName && (
        <Text style={styles.consultationClient}>Client: {item.clientName}</Text>
      )}
      <Text style={styles.consultationDate}>{formatDate(item.consultationDate)}</Text>
      <View style={styles.consultationBadges}>
        <View style={styles.badge}>
          <Icon name="photo-camera" size={14} color="#666" />
          <Text style={styles.badgeText}>{item.photos.length} photos</Text>
        </View>
        {item.notes && (
          <View style={styles.badge}>
            <Icon name="note" size={14} color="#666" />
            <Text style={styles.badgeText}>Has notes</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Consultations</Text>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            style={styles.addButton}
          >
            <Icon name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
          </View>
        ) : consultations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="mic-off" size={64} color="#999" />
            <Text style={styles.emptyText}>No consultations yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first consultation to start tracking meetings
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Icon name="add" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create Consultation</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={consultations}
            renderItem={renderConsultationItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
          />
        )}

        {/* Create Consultation Modal */}
        <Modal
          visible={showCreateModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCreateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Consultation</Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <Icon name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalBody}>
                <TextInput
                  style={styles.input}
                  placeholder="Consultation Title *"
                  value={consultationForm.title}
                  onChangeText={(text) => setConsultationForm({ ...consultationForm, title: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Client Name"
                  value={consultationForm.clientName}
                  onChangeText={(text) => setConsultationForm({ ...consultationForm, clientName: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Client Email"
                  value={consultationForm.clientEmail}
                  onChangeText={(text) => setConsultationForm({ ...consultationForm, clientEmail: text })}
                  keyboardType="email-address"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Client Phone"
                  value={consultationForm.clientPhone}
                  onChangeText={(text) => setConsultationForm({ ...consultationForm, clientPhone: text })}
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Address"
                  value={consultationForm.address}
                  onChangeText={(text) => setConsultationForm({ ...consultationForm, address: text })}
                  multiline
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Notes (optional)"
                  value={consultationForm.notes}
                  onChangeText={(text) => setConsultationForm({ ...consultationForm, notes: text })}
                  multiline
                  numberOfLines={4}
                />
              </ScrollView>
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleCreateConsultation}
                >
                  <Text style={styles.saveButtonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* View Consultation Modal */}
        <Modal
          visible={showViewModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowViewModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectedConsultation?.title}
                </Text>
                <TouchableOpacity onPress={() => setShowViewModal(false)}>
                  <Icon name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalBody}>
                {selectedConsultation?.clientName && (
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>Client:</Text> {selectedConsultation.clientName}
                  </Text>
                )}
                {selectedConsultation?.clientEmail && (
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>Email:</Text> {selectedConsultation.clientEmail}
                  </Text>
                )}
                {selectedConsultation?.clientPhone && (
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>Phone:</Text> {selectedConsultation.clientPhone}
                  </Text>
                )}
                {selectedConsultation?.address && (
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>Address:</Text> {selectedConsultation.address}
                  </Text>
                )}
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Date:</Text> {selectedConsultation ? formatDate(selectedConsultation.consultationDate) : ''}
                </Text>

                {selectedConsultation?.notes && (
                  <View style={styles.notesSection}>
                    <Text style={styles.sectionTitle}>Notes</Text>
                    <View style={styles.notesBox}>
                      <Text style={styles.notesText}>{selectedConsultation.notes}</Text>
                    </View>
                  </View>
                )}

                {selectedConsultation?.photos && selectedConsultation.photos.length > 0 && (
                  <View style={styles.photosSection}>
                    <Text style={styles.sectionTitle}>
                      Photos ({selectedConsultation.photos.length})
                    </Text>
                    <FlatList
                      data={selectedConsultation.photos}
                      horizontal
                      keyExtractor={(item) => item.id}
                      renderItem={({ item }) => (
                        <View style={styles.photoItem}>
                          {item.url ? (
                            <Image source={{ uri: item.url }} style={styles.photoImage} />
                          ) : (
                            <View style={styles.photoPlaceholder}>
                              <Icon name="photo-camera" size={32} color="#999" />
                            </View>
                          )}
                          <TouchableOpacity
                            style={styles.deletePhotoButton}
                            onPress={() => handleDeletePhoto(selectedConsultation!.id, item.id)}
                          >
                            <Icon name="delete" size={16} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      )}
                    />
                  </View>
                )}
              </ScrollView>
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    setNotesText(selectedConsultation?.notes || '');
                    setShowNotesModal(true);
                  }}
                >
                  <Icon name="note" size={20} color="#2196F3" />
                  <Text style={styles.actionButtonText}>
                    {selectedConsultation?.notes ? 'Edit Notes' : 'Add Notes'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handlePhotoUpload}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="#2196F3" />
                  ) : (
                    <>
                      <Icon name="photo-camera" size={20} color="#2196F3" />
                      <Text style={styles.actionButtonText}>Add Photo</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => selectedConsultation && handleDeleteConsultation(selectedConsultation.id)}
                >
                  <Icon name="delete" size={20} color="#f44336" />
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Notes Modal */}
        <Modal
          visible={showNotesModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowNotesModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Consultation Notes</Text>
                <TouchableOpacity onPress={() => setShowNotesModal(false)}>
                  <Icon name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <TextInput
                  style={[styles.input, styles.textArea, { minHeight: 200 }]}
                  placeholder="Add notes about the consultation..."
                  value={notesText}
                  onChangeText={setNotesText}
                  multiline
                  numberOfLines={10}
                />
              </View>
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowNotesModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveNotes}
                >
                  <Text style={styles.saveButtonText}>Save Notes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 5,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 15,
    margin: 15,
    borderRadius: 5,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 5,
    marginTop: 20,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  listContainer: {
    padding: 15,
  },
  consultationItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  consultationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  consultationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  recordedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recordedBadgeText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
  },
  consultationClient: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  consultationDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  consultationBadges: {
    flexDirection: 'row',
    gap: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 5,
    backgroundColor: '#2196F3',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  detailLabel: {
    fontWeight: 'bold',
    color: '#333',
  },
  notesSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  notesBox: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 5,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  photosSection: {
    marginTop: 20,
  },
  photoItem: {
    marginRight: 10,
    position: 'relative',
  },
  photoImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
  },
  photoPlaceholder: {
    width: 150,
    height: 150,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deletePhotoButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#f44336',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
    backgroundColor: '#e3f2fd',
  },
  actionButtonText: {
    color: '#2196F3',
    fontSize: 14,
    marginLeft: 5,
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  deleteButtonText: {
    color: '#f44336',
  },
});

export default ConsultationScreen;

