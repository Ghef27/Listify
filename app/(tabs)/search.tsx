import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X } from 'lucide-react-native';
import { StorageService } from '@/utils/storage';
import { NoteItem } from '@/components/NoteItem';
import { ReminderModal } from '@/components/ReminderModal';
import { Note } from '@/types';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedNoteForReminder, setSelectedNoteForReminder] = useState<Note | null>(null);

  const loadNotes = useCallback(async () => {
    const [notes, lists] = await Promise.all([
      StorageService.getNotes(),
      StorageService.getLists()
    ]);
    
    // Filter out notes from archived lists
    const archivedListNames = lists
      .filter(list => list.archived)
      .map(list => list.name);
    
    const activeNotes = notes.filter(note => !archivedListNames.includes(note.listName));
    setAllNotes(activeNotes);
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = allNotes.filter(note =>
        note.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.listName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredNotes(filtered);
    } else {
      setFilteredNotes([]);
    }
  }, [searchQuery, allNotes]);

  const handleToggleComplete = async (noteId: string) => {
    const note = allNotes.find(n => n.id === noteId);
    if (note) {
      await StorageService.updateNote(noteId, { completed: !note.completed });
      await loadNotes();
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    await StorageService.deleteNote(noteId);
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


  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search notes and lists..."
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <X size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content}>
        {searchQuery.trim() === '' ? (
          <View style={styles.emptyState}>
            <Search size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Search your notes</Text>
            <Text style={styles.emptyText}>
              Type in the search box above to find notes across all your lists
            </Text>
          </View>
        ) : filteredNotes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptyText}>
              Try searching with different keywords
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsCount}>
              {filteredNotes.length} {filteredNotes.length === 1 ? 'result' : 'results'} found
            </Text>
            {filteredNotes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDeleteNote}
                onSetReminder={handleSetReminder}
                showDeleteButton={true}
                showReminderButton={true}
              />
            ))}
          </>
        )}
      </ScrollView>

      <ReminderModal
        visible={showReminderModal}
        onClose={() => {
          setShowReminderModal(false);
          setSelectedNoteForReminder(null);
        }}
        onSave={handleSaveReminder}
        noteText={selectedNoteForReminder?.text || ''}
      />
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: '#1F2937',
  },
  clearButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
  resultsCount: {
    fontSize: 14,
    color: '#6B7280',
    marginHorizontal: 20,
    marginBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
});