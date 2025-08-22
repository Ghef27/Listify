import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Settings, X, Save } from 'lucide-react-native';
import { StorageService } from '@/utils/storage';
import { NoteItem } from '@/components/NoteItem';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { AddNoteModal } from '@/components/AddNoteModal';
import { ReminderModal } from '@/components/ReminderModal';
import { Note, ListData } from '@/types';

export default function ListScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [lists, setLists] = useState<ListData[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedNoteForReminder, setSelectedNoteForReminder] = useState<Note | null>(null);
  const [editListName, setEditListName] = useState('');
  const [editListColor, setEditListColor] = useState('#2563EB');
  const [refreshing, setRefreshing] = useState(false);

  const colors = [
    '#14B8A6','#10B981', '#059669','#047857','#86e546ff','#f80303ff','#DC2626', '#DB2777', '#BE185D','#B45309','#D97706','#CA8A04', '#d9c87aff',
    '#e0e546ff','#46b5e5ff','#7C3AED',    '#4F46E5',   '#a546e5ff',    '#081401ff' 
     
  ];

  const currentList = lists.find(list => list.name === name);
  const listColor = currentList?.color || '#14B8A6';

  const loadNotes = useCallback(async () => {
    if (!name) return;
    const allNotes = await StorageService.getNotes();
    const listsData = await StorageService.getLists();
    setLists(listsData);
    
    const listNotes = allNotes.filter(note => note.listName === name);
    
    // Sort incomplete notes by most recent first (updatedAt desc)
    const incompleteNotes = listNotes
      .filter(note => !note.completed)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    // Sort completed notes by most recent first (updatedAt desc)  
    const completedNotes = listNotes
      .filter(note => note.completed)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    // Keep completed notes at the bottom, but both groups sorted by most recent
    const sortedNotes = [...incompleteNotes, ...completedNotes];
    
    setNotes(sortedNotes);
  }, [name]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotes();
    setRefreshing(false);
  }, [loadNotes]);

  const handleToggleComplete = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      await StorageService.updateNote(noteId, { completed: !note.completed });
      await loadNotes();
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    await StorageService.deleteNote(noteId);
    await loadNotes();
  };

  const handleAddNote = async (text: string, listName: string) => {
    await StorageService.addNote(text, listName);
    await loadNotes();
  };

  const handleSetReminder = (note: Note) => {
    setSelectedNoteForReminder(note);
    setShowReminderModal(true);
  };

  const handleSaveReminder = async (reminderDate: Date) => {
    if (!selectedNoteForReminder) return;

    try {
      await StorageService.setNoteReminder(
        selectedNoteForReminder.id,
        reminderDate
      );

      await loadNotes();
      setSelectedNoteForReminder(null);
    } catch (error) {
      console.error('Error saving reminder:', error);
    }
  };

  const handleEditList = () => {
    if (currentList) {
      setEditListName(currentList.name);
      setEditListColor(currentList.color);
      setShowEditModal(true);
    }
  };

  const handleSaveListEdit = async () => {
    if (editListName.trim() && name) {
      await StorageService.updateList(name, editListName.trim(), editListColor);
      setShowEditModal(false);
      
      if (editListName.trim() !== name) {
        Alert.alert('List Updated', 'List name has been changed.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        await loadNotes();
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <View style={[styles.colorIndicator, { backgroundColor: listColor }]} />
          <Text style={styles.title}>{name}</Text>
        </View>
        <TouchableOpacity onPress={handleEditList} style={styles.settingsButton}>
          <Settings size={20} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {notes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No notes in {name}</Text>
            <Text style={styles.emptyText}>
              Tap the + button to add your first note to this list
            </Text>
          </View>
        ) : (
          notes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              onToggleComplete={handleToggleComplete}
              onDelete={handleDeleteNote}
              onSetReminder={handleSetReminder}
              showDeleteButton={true}
              showReminderButton={true}
            />
          ))
        )}
      </ScrollView>

      <FloatingActionButton onPress={() => setShowAddModal(true)} />

      <AddNoteModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddNote}
        initialList={name}
        lists={lists}
      />

      <ReminderModal
        visible={showReminderModal}
        onClose={() => {
          setShowReminderModal(false);
          setSelectedNoteForReminder(null);
        }}
        onSave={handleSaveReminder}
        noteText={selectedNoteForReminder?.text || ''}
      />

      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <X size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit List</Text>
            <TouchableOpacity onPress={handleSaveListEdit} disabled={!editListName.trim()}>
              <Save size={24} color={editListName.trim() ? "#14B8A6" : "#9CA3AF"} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>List Name</Text>
            <TextInput
              style={styles.textInput}
              value={editListName}
              onChangeText={setEditListName}
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
                    editListColor === color && styles.colorOptionSelected
                  ]}
                  onPress={() => setEditListColor(color)}
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
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backButton: { padding: 8, marginLeft: -8 },
  titleContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center', marginHorizontal: 16 },
  colorIndicator: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  title: { fontSize: 20, fontWeight: '600', color: '#1F2937' },
  settingsButton: { padding: 8 },
  content: { flex: 1, paddingTop: 8 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#1F2937', marginBottom: 8 },
  emptyText: { fontSize: 16, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  modalContainer: { flex: 1, backgroundColor: '#F9FAFB' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  modalContent: { flex: 1, padding: 16 },
  inputLabel: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 8, marginTop: 16 },
  textInput: { backgroundColor: '#fff', borderRadius: 8, padding: 12, fontSize: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorOption: { width: 40, height: 40, borderRadius: 20, borderWidth: 3, borderColor: 'transparent' },
  colorOptionSelected: { borderColor: '#1F2937' },
});
