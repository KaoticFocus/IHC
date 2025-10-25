import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RNFS from 'react-native-fs';

interface ScopeItem {
  category: string;
  description: string;
  details: string[];
}

interface ScopeOfWork {
  projectTitle: string;
  projectOverview: string;
  scopeItems: ScopeItem[];
  estimatedTimeline: string;
  nextSteps: string[];
}

interface ScopeOfWorkViewerProps {
  visible: boolean;
  onClose: () => void;
  scopeOfWork: any | null;
  sessionId: string;
}

const ScopeOfWorkViewer: React.FC<ScopeOfWorkViewerProps> = ({
  visible,
  onClose,
  scopeOfWork,
  sessionId,
}) => {
  if (!scopeOfWork) return null;

  // Determine which scope to display based on currentView
  const currentScope = scopeOfWork.currentView === 'contractor' 
    ? scopeOfWork.contractorScope 
    : scopeOfWork.homeownerScope;
  
  const isContractorScope = scopeOfWork.currentView === 'contractor';

  const handleExportScope = async () => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const scopeType = isContractorScope ? 'contractor' : 'homeowner';
      const fileName = `${scopeType}_scope_of_work_${sessionId}_${timestamp}.txt`;
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      
      const scopeText = formatScopeForExport(currentScope, isContractorScope);
      await RNFS.writeFile(filePath, scopeText, 'utf8');
      
      Alert.alert(
        'Scope of Work Exported',
        `Scope of work saved as ${fileName}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Error', 'Failed to export scope of work');
    }
  };

  const handleShareScope = async () => {
    try {
      const scopeText = formatScopeForExport(scopeOfWork);
      await Share.share({
        message: scopeText,
        title: 'Scope of Work',
      });
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Share Error', 'Failed to share scope of work');
    }
  };

  const formatScopeForExport = (scope: any, isContractor: boolean = false): string => {
    let text = `${isContractor ? 'CONTRACTOR' : 'HOMEOWNER'} SCOPE OF WORK\n`;
    text += `Project: ${scope.projectTitle}\n\n`;
    text += `OVERVIEW\n${scope.projectOverview}\n\n`;
    
    if (isContractor && scope.constructionPhases) {
      text += `CONSTRUCTION PHASES\n`;
      scope.constructionPhases.forEach((phase: any, index: number) => {
        text += `${index + 1}. ${phase.phaseName}\n`;
        text += `   Description: ${phase.phaseDescription}\n`;
        text += `   Duration: ${phase.estimatedDuration}\n`;
        
        if (phase.dependencies && phase.dependencies.length > 0) {
          text += `   Dependencies: ${phase.dependencies.join(', ')}\n`;
        }
        
        text += `   Line Items:\n`;
        phase.lineItems.forEach((item: any, itemIndex: number) => {
          text += `     ${itemIndex + 1}. ${item.item}\n`;
          text += `        Description: ${item.description}\n`;
          text += `        Unit: ${item.unit}\n`;
          if (item.estimatedQuantity) {
            text += `        Estimated Quantity: ${item.estimatedQuantity}\n`;
          }
          if (item.notes) {
            text += `        Notes: ${item.notes}\n`;
          }
          text += `\n`;
        });
        text += `\n`;
      });
      
      text += `TOTAL ESTIMATED TIMELINE\n${scope.totalEstimatedTimeline}\n\n`;
    } else {
      text += `PROJECT DETAILS\n`;
      scope.scopeItems.forEach((item: any, index: number) => {
        text += `${index + 1}. ${item.category}\n`;
        text += `   ${item.description}\n`;
        item.details.forEach((detail: string) => {
          text += `   • ${detail}\n`;
        });
        text += `\n`;
      });
      
      text += `ESTIMATED TIMELINE\n${scope.estimatedTimeline}\n\n`;
    }
    
    text += `NEXT STEPS\n`;
    scope.nextSteps.forEach((step: string, index: number) => {
      text += `${index + 1}. ${step}\n`;
    });
    
    return text;
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
          <Text style={styles.title}>
            {isContractorScope ? 'Contractor Scope of Work' : 'Homeowner Scope of Work'}
          </Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleExportScope}
            >
              <Icon name="download" size={24} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleShareScope}
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
          <View style={styles.projectHeader}>
            <Text style={styles.projectTitle}>{currentScope.projectTitle}</Text>
            <View style={styles.timelineBadge}>
              <Icon name="schedule" size={16} color="#4CAF50" />
              <Text style={styles.timelineText}>
                {isContractorScope ? currentScope.totalEstimatedTimeline : currentScope.estimatedTimeline}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Project Overview</Text>
            <Text style={styles.overviewText}>{currentScope.projectOverview}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {isContractorScope ? 'Construction Phases' : 'What We\'ll Do'}
            </Text>
            {isContractorScope ? (
              currentScope.constructionPhases.map((phase: any, index: number) => (
                <View key={index} style={styles.phaseItem}>
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
              ))
            ) : (
              currentScope.scopeItems.map((item: any, index: number) => (
                <View key={index} style={styles.scopeItem}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryNumber}>{index + 1}</Text>
                    <Text style={styles.categoryTitle}>{item.category}</Text>
                  </View>
                  <Text style={styles.categoryDescription}>{item.description}</Text>
                  <View style={styles.detailsList}>
                    {item.details.map((detail: string, detailIndex: number) => (
                      <View key={detailIndex} style={styles.detailItem}>
                        <Icon name="check-circle" size={16} color="#4CAF50" />
                        <Text style={styles.detailText}>{detail}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What Happens Next</Text>
            <View style={styles.nextStepsList}>
              {currentScope.nextSteps.map((step: string, index: number) => (
                <View key={index} style={styles.nextStepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              This scope of work is based on our consultation and may be adjusted as the project progresses.
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
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  projectTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  timelineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timelineText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  overviewText: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
  },
  scopeItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 10,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 12,
    lineHeight: 20,
  },
  detailsList: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailText: {
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  nextStepsList: {
    gap: 12,
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepText: {
    fontSize: 14,
    color: '#ffffff',
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#cccccc',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Contractor scope styles
  phaseItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  phaseNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginRight: 10,
    minWidth: 25,
  },
  phaseInfo: {
    flex: 1,
  },
  phaseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  phaseDuration: {
    fontSize: 12,
    color: '#cccccc',
    fontStyle: 'italic',
  },
  phaseDescription: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
    marginBottom: 10,
  },
  dependenciesContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 8,
    borderRadius: 5,
    marginBottom: 10,
  },
  dependenciesLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 3,
  },
  dependenciesText: {
    fontSize: 12,
    color: '#cccccc',
  },
  lineItemsContainer: {
    marginTop: 10,
  },
  lineItemsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  lineItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 8,
    borderRadius: 5,
    marginBottom: 6,
  },
  lineItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  lineItemNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginRight: 6,
    minWidth: 15,
  },
  lineItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  lineItemUnit: {
    fontSize: 11,
    color: '#cccccc',
    fontStyle: 'italic',
  },
  lineItemDescription: {
    fontSize: 12,
    color: '#cccccc',
    lineHeight: 16,
    marginBottom: 3,
  },
  lineItemQuantity: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
  },
  lineItemNotes: {
    fontSize: 11,
    color: '#FF9800',
    fontStyle: 'italic',
    marginTop: 2,
  },
});

export default ScopeOfWorkViewer;
