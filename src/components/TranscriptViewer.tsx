import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Share,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RNFS from 'react-native-fs';
import TranscriptionService, { TranscriptEntry } from '../services/TranscriptionService';

interface TranscriptViewerProps {
  visible: boolean;
  onClose: () => void;
  transcriptEntries: TranscriptEntry[];
  sessionId: string;
}

const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  visible,
  onClose,
  transcriptEntries,
  sessionId,
}) => {
  const [formattedTranscript, setFormattedTranscript] = useState('');

  useEffect(() => {
    if (transcriptEntries.length > 0) {
      const formatted = TranscriptionService.formatTranscript(transcriptEntries);
      setFormattedTranscript(formatted);
    }
  }, [transcriptEntries]);

  const handleExportTranscript = async () => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `transcript_${sessionId}_${timestamp}.txt`;
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      
      await RNFS.writeFile(filePath, formattedTranscript, 'utf8');
      
      Alert.alert(
        'Transcript Exported',
        `Transcript saved as ${fileName}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Error', 'Failed to export transcript');
    }
  };

  const handleShareTranscript = async () => {
    try {
      await Share.share({
        message: formattedTranscript,
        title: 'Conversation Transcript',
      });
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Share Error', 'Failed to share transcript');
    }
  };

  const getSpeakerColor = (speaker: string): string => {
    switch (speaker) {
      case 'Consultant':
        return '#4CAF50';
      case 'Patient':
        return '#2196F3';
      case 'Speaker 1':
        return '#FF9800';
      case 'Speaker 2':
        return '#9C27B0';
      default:
        return '#666666';
    }
  };

  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
          <Text style={styles.title}>Live Transcript</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleExportTranscript}
            >
              <Icon name="download" size={24} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleShareTranscript}
            >
              <Icon name="share" size={24} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={onClose}
            >
              <Icon name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{transcriptEntries.length}</Text>
            <Text style={styles.statLabel}>Entries</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {transcriptEntries.reduce((count, entry) => count + entry.text.split(' ').length, 0)}
            </Text>
            <Text style={styles.statLabel}>Words</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {transcriptEntries.length > 0 ? formatTime(transcriptEntries[transcriptEntries.length - 1].timestamp) : '0:00'}
            </Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
        </View>

        <ScrollView style={styles.transcriptContainer} showsVerticalScrollIndicator={false}>
          {transcriptEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="text-fields" size={64} color="#666" />
              <Text style={styles.emptyText}>No transcript available yet</Text>
              <Text style={styles.emptySubtext}>Start speaking to see live transcription</Text>
            </View>
          ) : (
            transcriptEntries.map((entry, index) => (
              <View key={entry.id} style={styles.transcriptEntry}>
                <View style={styles.entryHeader}>
                  <View style={[styles.speakerBadge, { backgroundColor: getSpeakerColor(entry.speaker) }]}>
                    <Text style={styles.speakerText}>{entry.speaker}</Text>
                  </View>
                  <Text style={styles.timestamp}>
                    {formatTime(entry.timestamp)}
                  </Text>
                  <View style={styles.confidenceContainer}>
                    <Icon 
                      name="check-circle" 
                      size={16} 
                      color={entry.confidence > 0.8 ? '#4CAF50' : entry.confidence > 0.6 ? '#FF9800' : '#f44336'} 
                    />
                    <Text style={styles.confidenceText}>
                      {Math.round(entry.confidence * 100)}%
                    </Text>
                  </View>
                </View>
                <Text style={styles.entryText}>{entry.text}</Text>
              </View>
            ))
          )}
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
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 15,
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#cccccc',
  },
  transcriptContainer: {
    flex: 1,
    padding: 20,
  },
  transcriptEntry: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  speakerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  speakerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  timestamp: {
    color: '#cccccc',
    fontSize: 12,
    marginRight: 10,
    fontFamily: 'monospace',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  confidenceText: {
    color: '#cccccc',
    fontSize: 12,
    marginLeft: 4,
  },
  entryText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});

export default TranscriptViewer;
