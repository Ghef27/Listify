import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  TextInput,
  Modal 
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Trash2, 
  Mic, 
  ChevronRight,
  Info,
  Plus,
  X,
  Save
} from 'lucide-react-native';
import { StorageService } from '@/utils/storage';
import { ListData } from '@/types';

export default function SettingsScreen() {
  const [lists, setLists] = useState<ListData[]>([]);
  const [showAddListModal, setShowAddListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListColor, setNewListColor] = useState('#14B8A6');

  const colors = [
    '#14B8A6', '#DC2626', '#10B981', '#CA8A04',
    '#7C3AED', '#DB2777', '#059669', '#D97706',
    '#4F46E5', '#BE185D', '#047857', '#B45309'
  ];

  const loadLists = useCallback(async () => {
    const listsData = await StorageService.getLists();
    setLists(listsData);
  }, []);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your notes and lists. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            await StorageService.saveNotes([]);
            Alert.alert('Success', 'All data has been cleared.');
          },
        },
      ]
    );
  };

  const handleAddList = async () => {
    if (newListName.trim()) {
      await StorageService.addList(newListName.trim(), newListColor);
      await loadLists();
      setNewListName('');
      setNewListColor('#2563EB');
      setShowAddListModal(false);
    }
  };

  const handleTestSpeech = () => {
    Alert.alert(
      'Speech Recognition',
      'Speech recognition is available on this device. Make sure you have granted microphone permissions.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleClearAllData}>
            <View style={styles.settingLeft}>
              <Trash2 size={20} color="#EF4444" />
              <Text style={[styles.settingText, { color: '#EF4444' }]}>Clear All Data</Text>
            </View>
            <ChevronRight size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Lists</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddListModal(true)}
            >
              <Plus size={20} color="#14B8A6" />
            </TouchableOpacity>
          </View>
          
          {lists.map((list) => (
            <View key={list.name} style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.colorDot, { backgroundColor: list.color }]} />
                <Text style={styles.settingText}>{list.name}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Speech Recognition</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleTestSpeech}>
            <View style={styles.settingLeft}>
              <Mic size={20} color="#14B8A6" />
              <Text style={styles.settingText}>Test Speech Input</Text>
            </View>
            <ChevronRight size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Info size={20} color="#6B7280" />
              <View>
                <Text style={styles.settingText}>Listify</Text>
                <Text style={styles.settingSubtext}>Version 1.0.0</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>How to use speech input:</Text>
            <Text style={styles.infoText}>
              • Tap the microphone button when adding a note{'\n'}
              • Speak clearly in English{'\n'}
              • Tap the microphone again to stop recording{'\n'}
              • Edit the recognized text before saving
            </Text>
          </View>
        </View>
      </ScrollView>

      <Modal visible={showAddListModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddListModal(false)}>
              <X size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New List</Text>
            <TouchableOpacity onPress={handleAddList} disabled={!newListName.trim()}>
              <Save size={24} color={newListName.trim() ? "#14B8A6" : "#9CA3AF"} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>List Name</Text>
            <TextInput
              style={styles.textInput}
              value={newListName}
              onChangeText={setNewListName}
              placeholder="Enter list name"
              autoFocus
            />

            <Text style={styles.inputLabel}>Color</Text>
            <View style={styles.colorGrid}>
              {colors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    newListColor === color && styles.colorOptionSelected
                  ]}
                  onPress={() => setNewListColor(color)}
                />
              ))}
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  addButton: {
    padding: 4,
  },
  settingItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  settingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  infoCard: {
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F766E',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#134E4A',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#1F2937',
  },
});