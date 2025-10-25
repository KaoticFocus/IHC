import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Lead } from '../types/Lead';
import LeadManagementService from '../services/LeadManagementService';

interface LeadManagementScreenProps {
  onLeadSelected: (lead: Lead) => void;
  onBack: () => void;
  onCreateLead: () => void;
}

const LeadManagementScreen: React.FC<LeadManagementScreenProps> = ({
  onLeadSelected,
  onBack,
  onCreateLead,
}) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All Leads', color: '#ffffff' },
    { value: 'new', label: 'New', color: '#2196F3' },
    { value: 'contacted', label: 'Contacted', color: '#FF9800' },
    { value: 'consultation_scheduled', label: 'Scheduled', color: '#9C27B0' },
    { value: 'consultation_completed', label: 'Completed', color: '#4CAF50' },
    { value: 'quoted', label: 'Quoted', color: '#FF5722' },
    { value: 'closed_won', label: 'Won', color: '#4CAF50' },
    { value: 'closed_lost', label: 'Lost', color: '#f44336' },
  ];

  useEffect(() => {
    loadLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, searchQuery, selectedStatus]);

  const loadLeads = async () => {
    try {
      setIsLoading(true);
      const allLeads = await LeadManagementService.getAllLeads();
      setLeads(allLeads);
    } catch (error) {
      console.error('Error loading leads:', error);
      Alert.alert('Error', 'Failed to load leads');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeads();
    setRefreshing(false);
  };

  const filterLeads = () => {
    let filtered = leads;

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(lead => lead.status === selectedStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.contactInfo.firstName.toLowerCase().includes(query) ||
        lead.contactInfo.lastName.toLowerCase().includes(query) ||
        lead.contactInfo.address.toLowerCase().includes(query) ||
        lead.contactInfo.city.toLowerCase().includes(query) ||
        lead.projects.some(project =>
          project.name.toLowerCase().includes(query) ||
          project.type.toLowerCase().includes(query)
        )
      );
    }

    setFilteredLeads(filtered);
  };

  const getStatusColor = (status: Lead['status']): string => {
    const option = statusOptions.find(opt => opt.value === status);
    return option?.color || '#666';
  };

  const getStatusLabel = (status: Lead['status']): string => {
    const option = statusOptions.find(opt => opt.value === status);
    return option?.label || status;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getProjectTypes = (lead: Lead): string => {
    const types = lead.projects.map(project => {
      switch (project.type) {
        case 'kitchen': return 'Kitchen';
        case 'bathroom': return 'Bathroom';
        case 'basement': return 'Basement';
        case 'addition': return 'Addition';
        case 'exterior': return 'Exterior';
        case 'whole_house': return 'Whole House';
        default: return 'Other';
      }
    });
    return types.join(', ');
  };

  const renderLeadItem = ({ item }: { item: Lead }) => (
    <TouchableOpacity
      style={styles.leadItem}
      onPress={() => onLeadSelected(item)}
    >
      <View style={styles.leadHeader}>
        <View style={styles.leadInfo}>
          <Text style={styles.leadName}>
            {item.contactInfo.firstName} {item.contactInfo.lastName}
          </Text>
          <Text style={styles.leadAddress}>
            {item.contactInfo.address}, {item.contactInfo.city}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>

      <View style={styles.leadDetails}>
        <View style={styles.detailRow}>
          <Icon name="construction" size={16} color="#4CAF50" />
          <Text style={styles.detailText}>{getProjectTypes(item)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="phone" size={16} color="#2196F3" />
          <Text style={styles.detailText}>{item.contactInfo.phoneNumbers.primary}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="calendar-today" size={16} color="#FF9800" />
          <Text style={styles.detailText}>Created {formatDate(item.createdAt)}</Text>
        </View>
      </View>

      {item.propertyInfo.estimatedValue && (
        <View style={styles.propertyInfo}>
          <Icon name="home" size={16} color="#9C27B0" />
          <Text style={styles.propertyText}>
            Est. Value: ${item.propertyInfo.estimatedValue.toLocaleString()}
          </Text>
          {item.propertyInfo.yearConstructed && (
            <Text style={styles.propertyText}>
              • Built {item.propertyInfo.yearConstructed}
            </Text>
          )}
        </View>
      )}

      <View style={styles.leadFooter}>
        <View style={styles.projectCount}>
          <Text style={styles.projectCountText}>
            {item.projects.length} project{item.projects.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.documentCount}>
          <Icon name="description" size={16} color="#666" />
          <Text style={styles.documentCountText}>
            {item.documents.length} doc{item.documents.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="person-add" size={64} color="#666" />
      <Text style={styles.emptyTitle}>No Leads Found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery || selectedStatus !== 'all'
          ? 'Try adjusting your search or filter'
          : 'Create your first lead to get started'
        }
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Icon name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Lead Management</Text>
        <TouchableOpacity style={styles.createButton} onPress={onCreateLead}>
          <Icon name="add" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search leads..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="clear" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statusFilter}
        >
          {statusOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.statusOption,
                selectedStatus === option.value && styles.selectedStatusOption,
                { borderColor: option.color }
              ]}
              onPress={() => setSelectedStatus(option.value)}
            >
              <Text style={[
                styles.statusOptionText,
                selectedStatus === option.value && { color: option.color }
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredLeads}
        renderItem={renderLeadItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4CAF50"
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#16213e',
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  createButton: {
    padding: 8,
  },
  searchSection: {
    padding: 20,
    backgroundColor: '#16213e',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 8,
  },
  statusFilter: {
    marginBottom: 10,
  },
  statusOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedStatusOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusOptionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
    flexGrow: 1,
  },
  leadItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  leadAddress: {
    fontSize: 14,
    color: '#cccccc',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  leadDetails: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 8,
  },
  propertyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'rgba(156, 39, 176, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  propertyText: {
    fontSize: 12,
    color: '#9C27B0',
    marginLeft: 4,
    fontWeight: '600',
  },
  leadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectCount: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  projectCountText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  documentCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentCountText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default LeadManagementScreen;
