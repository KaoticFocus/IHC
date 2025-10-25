import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RNFS from 'react-native-fs';
import { share } from 'react-native-share';

interface ContractorScopeViewerProps {
  visible: boolean;
  onClose: () => void;
  scopeOfWork: any;
  sessionId?: string;
}

const ContractorScopeViewer: React.FC<ContractorScopeViewerProps> = ({
  visible,
  onClose,
  scopeOfWork,
  sessionId,
}) => {
  const contractorScope = scopeOfWork?.contractorScope;

  const exportScope = async () => {
    if (!contractorScope) return;

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `Contractor_Scope_${timestamp}.txt`;
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

      let content = `CONTRACTOR SCOPE OF WORK\n`;
      content += `Project: ${contractorScope.projectTitle}\n`;
      content += `Generated: ${new Date().toLocaleDateString()}\n`;
      content += `Session ID: ${sessionId || 'N/A'}\n\n`;

      content += `PROJECT OVERVIEW:\n`;
      content += `${contractorScope.projectOverview}\n\n`;

      content += `CONSTRUCTION PHASES:\n\n`;

      contractorScope.constructionPhases.forEach((phase: any, index: number) => {
        content += `${index + 1}. ${phase.phaseName}\n`;
        content += `   Description: ${phase.phaseDescription}\n`;
        content += `   Duration: ${phase.estimatedDuration}\n`;
        
        if (phase.dependencies && phase.dependencies.length > 0) {
          content += `   Dependencies: ${phase.dependencies.join(', ')}\n`;
        }
        
        content += `   Line Items:\n`;
        phase.lineItems.forEach((item: any, itemIndex: number) => {
          content += `     ${itemIndex + 1}. ${item.item}\n`;
          content += `        Description: ${item.description}\n`;
          content += `        Unit: ${item.unit}\n`;
          if (item.estimatedQuantity) {
            content += `        Estimated Quantity: ${item.estimatedQuantity}\n`;
          }
          if (item.notes) {
            content += `        Notes: ${item.notes}\n`;
          }
          content += `\n`;
        });
        content += `\n`;
      });

      content += `TOTAL ESTIMATED TIMELINE: ${contractorScope.totalEstimatedTimeline}\n\n`;

      content += `NEXT STEPS:\n`;
      contractorScope.nextSteps.forEach((step: string, index: number) => {
        content += `${index + 1}. ${step}\n`;
      });

      await RNFS.writeFile(filePath, content, 'utf8');

      // Share the file
      await share({
        title: 'Contractor Scope of Work',
        message: 'Contractor scope of work document',
        url: `file://${filePath}`,
        type: 'text/plain',
      });

      Alert.alert('Success', 'Contractor scope exported successfully!');
    } catch (error) {
      console.error('Error exporting contractor scope:', error);
      Alert.alert('Error', 'Failed to export contractor scope');
    }
  };

  if (!contractorScope) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.title}>Contractor Scope of Work</Text>
          <TouchableOpacity style={styles.exportButton} onPress={exportScope}>
            <Icon name="share" size={24} color="#4CAF50" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.projectTitle}>{contractorScope.projectTitle}</Text>
            <Text style={styles.overview}>{contractorScope.projectOverview}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Construction Phases</Text>
            {contractorScope.constructionPhases.map((phase: any, index: number) => (
              <View key={index} style={styles.phaseContainer}>
                <View style={styles.phaseHeader}>
                  <Text style={styles.phaseNumber}>{index + 1}</Text>
                  <View style={styles.phaseInfo}>
                    <Text style={styles.phaseName}>{phase.phaseName}</Text>
                    <Text style={styles.phaseDuration}>{phase.estimatedDuration}</Text>
                  </View>
                </View>
                
                <Text style={styles.phaseDescription}>{phase.phaseDescription}</Text>
                
                {phase.dependencies && phase.dependencies.length > 0 && (
                  <View style={styles.dependenciesContainer}>
                    <Text style={styles.dependenciesLabel}>Dependencies:</Text>
                    <Text style={styles.dependenciesText}>
                      {phase.dependencies.join(', ')}
                    </Text>
                  </View>
                )}

                <View style={styles.lineItemsContainer}>
                  <Text style={styles.lineItemsTitle}>Line Items:</Text>
                  {phase.lineItems.map((item: any, itemIndex: number) => (
                    <View key={itemIndex} style={styles.lineItem}>
                      <View style={styles.lineItemHeader}>
                        <Text style={styles.lineItemNumber}>{itemIndex + 1}.</Text>
                        <Text style={styles.lineItemName}>{item.item}</Text>
                        <Text style={styles.lineItemUnit}>({item.unit})</Text>
                      </View>
                      <Text style={styles.lineItemDescription}>{item.description}</Text>
                      {item.estimatedQuantity && (
                        <Text style={styles.lineItemQuantity}>
                          Est. Quantity: {item.estimatedQuantity}
                        </Text>
                      )}
                      {item.notes && (
                        <Text style={styles.lineItemNotes}>Notes: {item.notes}</Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Project Timeline</Text>
            <Text style={styles.timeline}>{contractorScope.totalEstimatedTimeline}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Next Steps</Text>
            {contractorScope.nextSteps.map((step: string, index: number) => (
              <View key={index} style={styles.nextStepItem}>
                <Text style={styles.nextStepNumber}>{index + 1}.</Text>
                <Text style={styles.nextStepText}>{step}</Text>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#2c3e50',
    paddingTop: 50,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  exportButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  projectTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  overview: {
    fontSize: 16,
    color: '#34495e',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  phaseContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  phaseNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3498db',
    marginRight: 10,
    minWidth: 25,
  },
  phaseInfo: {
    flex: 1,
  },
  phaseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  phaseDuration: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  phaseDescription: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
    marginBottom: 10,
  },
  dependenciesContainer: {
    backgroundColor: '#ecf0f1',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  dependenciesLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  dependenciesText: {
    fontSize: 12,
    color: '#34495e',
  },
  lineItemsContainer: {
    marginTop: 10,
  },
  lineItemsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  lineItem: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 5,
    marginBottom: 8,
  },
  lineItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  lineItemNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3498db',
    marginRight: 8,
    minWidth: 20,
  },
  lineItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  lineItemUnit: {
    fontSize: 12,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  lineItemDescription: {
    fontSize: 13,
    color: '#34495e',
    lineHeight: 18,
    marginBottom: 5,
  },
  lineItemQuantity: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '600',
  },
  lineItemNotes: {
    fontSize: 12,
    color: '#e67e22',
    fontStyle: 'italic',
    marginTop: 3,
  },
  timeline: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    textAlign: 'center',
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 6,
  },
  nextStepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3498db',
    marginRight: 10,
    minWidth: 20,
  },
  nextStepText: {
    fontSize: 14,
    color: '#34495e',
    flex: 1,
    lineHeight: 20,
  },
});

export default ContractorScopeViewer;
