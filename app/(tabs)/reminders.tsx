import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Clock } from 'lucide-react-native';
import { StorageService } from '@/utils/storage';
import { NoteItem } from '@/components/NoteItem';
import { ReminderModal } from '@/components/ReminderModal';
import { ReminderTimer } from '@/components/ReminderTimer';
import { AddNoteModal } from '@/components/AddNoteModal';
import { Note, ListData } from '@/types';

export default function RemindersScreen() {
  const insets = useSafeAreaInsets();
  const [notesWithReminders, setNotesWithReminders] = useState<Note[]>([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedNoteForReminder, setSelectedNoteForReminder] = useState<Note | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // State for editing notes
  const [lists, setLists] = useState<ListData[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Renamed for consistency
  const loadData = useCallback(async () => {
    const allNotes = await StorageService.getNotes();
    const listsData = await StorageService.getLists();

    const reminders = allNotes.filter(note => note.reminderDate);
    const sortedReminders = reminders.sort((a, b) => {
      const dateA = new Date(a.reminderDate!);
      const dateB = new Date(b.reminderDate!);
      return dateA.getTime() - dateB.getTime();
    });

    setNotesWithReminders(sortedReminders);
    setLists(listsData);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setShowAddModal(true);
  };

  const handleUpdateNote = async (text: string, listName: string) => {
    if (!editingNote) return;
    await StorageService.updateNote(editingNote.id, { text, listName });
    await loadData(); // Correctly calls the renamed function
  };

  const handleToggleComplete = async (noteId: string) => {
    const note = notesWithReminders.find(n => n.id === noteId);
    if (note) {
      await StorageService.updateNote(noteId, { completed: !note.completed });
      await loadData();
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    await StorageService.deleteNote(noteId);
    await loadData();
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
      await loadData();
      setSelectedNoteForReminder(null);
    } catch (error) {
      console.error('Error saving reminder:', error);
    }
  };

  const handleReminderExpire = async (noteId: string) => {
    await StorageService.updateNote(noteId, { reminderExpired: true });
    await loadData();
  };

  const formatReminderTime = (reminderDate: Date) => {
    const now = new Date();
    const reminder = new Date(reminderDate);
    const diffMs = reminder.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const timeString = reminder.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const dateString = reminder.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    if (diffDays === 0) {
      return `Today at ${timeString}`;
    } else if (diffDays === 1) {
      return `Tomorrow at ${timeString}`;
    } else {
      return `${dateString} at ${timeString}`;
    }
  };

  const isReminderPast = (reminderDate: Date) => {
    return new Date(reminderDate).getTime() < new Date().getTime();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Reminders</Text>
        <Text style={styles.subtitle}>
          {notesWithReminders.length} active {notesWithReminders.length === 1 ? 'reminder' : 'reminders'}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {notesWithReminders.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Active Reminders</Text>
            <Text style={styles.emptyText}>
              Set reminders on your notes to see them here. Tap the bell icon on any note to schedule a reminder.
            </Text>
          </View>
        ) : (
          notesWithReminders.map((note) => (
            <View key={note.id} style={styles.reminderItem}>
              <View style={styles.reminderHeader}>
                <View style={styles.reminderTimeContainer}>
                  <Clock size={16} color={isReminderPast(new Date(note.reminderDate!)) ? "#EF4444" : "#14B8A6"} />
                  <Text style={[
                    styles.reminderTime,
                    isReminderPast(new Date(note.reminderDate!)) && styles.reminderTimePast
                  ]}>
                    {formatReminderTime(new Date(note.reminderDate!))}
                  </Text>
                </View>
                {isReminderPast(new Date(note.reminderDate!)) && (
                  <View style={styles.pastBadge}>
                    <Text style={styles.pastBadgeText}>Past</Text>
                  </View>
                )}
              </View>

              <NoteItem
                note={note}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDeleteNote}
                onSetReminder={handleSetReminder}
                onEdit={handleEditNote}
                showDeleteButton={true}
                showReminderButton={true}
              />

              <View style={styles.timerContainer}>
                <ReminderTimer
                    reminderDate={new Date(note.reminderDate!)}
                    isExpired={note.reminderExpired}
                    onExpire={() => handleReminderExpire(note.id)}
                />
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <AddNoteModal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingNote(null);
        }}
        onSave={editingNote ? handleUpdateNote : () => {}}
        editingNote={editingNote}
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
    </View>
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
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
  reminderItem: {
    marginVertical: 4,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  reminderTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#14B8A6',
    marginLeft: 6,
  },
  reminderTimePast: {
    color: '#EF4444',
  },
  pastBadge: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pastBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  timerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
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