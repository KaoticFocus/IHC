import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Share,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AIAnalysis } from '../services/OpenAIService';

interface AIAnalysisViewerProps {
  visible: boolean;
  onClose: () => void;
  analysis: AIAnalysis | null;
}

const AIAnalysisViewer: React.FC<AIAnalysisViewerProps> = ({
  visible,
  onClose,
  analysis,
}) => {
  if (!analysis) return null;

  const getSentimentColor = (sentiment: string): string => {
    switch (sentiment) {
      case 'positive':
        return '#4CAF50';
      case 'negative':
        return '#f44336';
      default:
        return '#FF9800';
    }
  };

  const getSentimentIcon = (sentiment: string): string => {
    switch (sentiment) {
      case 'positive':
        return 'sentiment-very-satisfied';
      case 'negative':
        return 'sentiment-very-dissatisfied';
      default:
        return 'sentiment-neutral';
    }
  };

  const handleShareAnalysis = async () => {
    try {
      const analysisText = `
AI Conversation Analysis

SUMMARY:
${analysis.summary}

KEY POINTS:
${analysis.keyPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')}

ACTION ITEMS:
${analysis.actionItems.map((item, index) => `${index + 1}. ${item}`).join('\n')}

SENTIMENT: ${analysis.sentiment.toUpperCase()}

TOPICS DISCUSSED:
${analysis.topics.map((topic, index) => `${index + 1}. ${topic}`).join('\n')}

SPEAKER INSIGHTS:
${Object.entries(analysis.speakerInsights).map(([speaker, insights]) => 
  `${speaker}: ${insights.role} - ${insights.sentiment} sentiment`
).join('\n')}
      `;

      await Share.share({
        message: analysisText,
        title: 'AI Conversation Analysis',
      });
    } catch (error) {
      console.error('Error sharing analysis:', error);
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
          <Text style={styles.title}>AI Analysis</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleShareAnalysis}
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

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Summary Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="summarize" size={24} color="#4CAF50" />
              <Text style={styles.sectionTitle}>Summary</Text>
            </View>
            <Text style={styles.summaryText}>{analysis.summary}</Text>
          </View>

          {/* Sentiment Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon 
                name={getSentimentIcon(analysis.sentiment)} 
                size={24} 
                color={getSentimentColor(analysis.sentiment)} 
              />
              <Text style={styles.sectionTitle}>Sentiment Analysis</Text>
            </View>
            <View style={[styles.sentimentBadge, { backgroundColor: getSentimentColor(analysis.sentiment) }]}>
              <Text style={styles.sentimentText}>
                {analysis.sentiment.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Key Points Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="key" size={24} color="#2196F3" />
              <Text style={styles.sectionTitle}>Key Points</Text>
            </View>
            {analysis.keyPoints.map((point, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.listText}>{point}</Text>
              </View>
            ))}
          </View>

          {/* Action Items Section */}
          {analysis.actionItems.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="task-alt" size={24} color="#FF9800" />
                <Text style={styles.sectionTitle}>Action Items</Text>
              </View>
              {analysis.actionItems.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={[styles.bulletPoint, { backgroundColor: '#FF9800' }]} />
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Topics Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="topic" size={24} color="#9C27B0" />
              <Text style={styles.sectionTitle}>Topics Discussed</Text>
            </View>
            <View style={styles.topicsContainer}>
              {analysis.topics.map((topic, index) => (
                <View key={index} style={styles.topicChip}>
                  <Text style={styles.topicText}>{topic}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Speaker Insights Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="people" size={24} color="#607D8B" />
              <Text style={styles.sectionTitle}>Speaker Insights</Text>
            </View>
            {Object.entries(analysis.speakerInsights).map(([speaker, insights]) => (
              <View key={speaker} style={styles.speakerCard}>
                <View style={styles.speakerHeader}>
                  <Text style={styles.speakerName}>{speaker}</Text>
                  <View style={[styles.roleBadge, { backgroundColor: '#4CAF50' }]}>
                    <Text style={styles.roleText}>{insights.role}</Text>
                  </View>
                </View>
                <View style={styles.speakerDetails}>
                  <View style={styles.speakerDetailItem}>
                    <Text style={styles.detailLabel}>Sentiment:</Text>
                    <Text style={[styles.detailValue, { color: getSentimentColor(insights.sentiment) }]}>
                      {insights.sentiment}
                    </Text>
                  </View>
                  <View style={styles.speakerDetailItem}>
                    <Text style={styles.detailLabel}>Main Topics:</Text>
                    <Text style={styles.detailValue}>
                      {insights.mainTopics.join(', ')}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
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
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 15,
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 10,
  },
  summaryText: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
  },
  sentimentBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  sentimentText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginTop: 6,
    marginRight: 12,
  },
  listText: {
    fontSize: 14,
    color: '#ffffff',
    flex: 1,
    lineHeight: 20,
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicChip: {
    backgroundColor: 'rgba(156, 39, 176, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#9C27B0',
  },
  topicText: {
    color: '#9C27B0',
    fontSize: 12,
    fontWeight: '600',
  },
  speakerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  speakerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  speakerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  speakerDetails: {
    gap: 8,
  },
  speakerDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#cccccc',
    marginRight: 8,
    minWidth: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#ffffff',
    flex: 1,
  },
});

export default AIAnalysisViewer;
