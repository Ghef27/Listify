import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note, ListData } from '@/types';
import { NotificationService } from './notifications';
import { Alert } from 'react-native';

const NOTES_KEY = 'listify_notes';
const LISTS_KEY = 'listify_lists';

export class StorageService {
static async getNotes(): Promise<Note[]> {
    try {
      const notesJson = await AsyncStorage.getItem(NOTES_KEY);
      if (!notesJson) {
        return [];
      }
      
      const notesFromStorage = JSON.parse(notesJson);
      
      // THIS IS THE FIX: Convert date strings back to Date objects
      return notesFromStorage.map((note: Note) => ({
        ...note,
        createdAt: note.createdAt ? new Date(note.createdAt) : undefined,
        updatedAt: note.updatedAt ? new Date(note.updatedAt) : undefined,
        reminderDate: note.reminderDate ? new Date(note.reminderDate) : undefined,
      }));
      
    } catch (error) {
      console.error('Error loading notes:', error);
      return [];
    }
  }

  static async saveNotes(notes: Note[]): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  }

  static async addNote(text: string, listName: string): Promise<void> {
    try {
      const notes = await this.getNotes();
      const newNote: Note = {
        id: Date.now().toString(),
        text,
        listName,
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      notes.push(newNote);
      await this.saveNotes(notes);
    } catch (error) {
      console.error('Error adding note:', error);
    }
  }

  static async updateNote(id: string, updates: Partial<Note>): Promise<void> {
    try {
      const notes = await this.getNotes();
      const noteIndex = notes.findIndex(note => note.id === id);
      if (noteIndex !== -1) {
        const oldNote = notes[noteIndex];
        
        // Cancel old notification if reminder date is being changed
        if (oldNote.notificationId && updates.reminderDate !== oldNote.reminderDate) {
          await NotificationService.cancelNotification(oldNote.notificationId);
        }
        
        notes[noteIndex] = { 
          ...notes[noteIndex], 
          ...updates, 
          updatedAt: new Date() 
        };
        await this.saveNotes(notes);
      }
    } catch (error) {
      console.error('Error updating note:', error);
    }
  }

  static async deleteNote(id: string): Promise<void> {
    try {
      const notes = await this.getNotes();
      const noteToDelete = notes.find(note => note.id === id);
      
      // Cancel notification if it exists
      if (noteToDelete?.notificationId) {
        await NotificationService.cancelNotification(noteToDelete.notificationId);
      }
      
      const filteredNotes = notes.filter(note => note.id !== id);
      await this.saveNotes(filteredNotes);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  }

  static async getLists(): Promise<ListData[]> {
    try {
      const listsJson = await AsyncStorage.getItem(LISTS_KEY);
      const lists = listsJson ? JSON.parse(listsJson) : [];
      
      // If no lists exist, create default ones
      if (lists.length === 0) {
        const defaultLists: ListData[] = [
          { name: 'Personal', color: '#14B8A6' },
          { name: 'Work', color: '#10B981' },
          { name: 'Shopping', color: '#059669' },
        ];
        await this.saveLists(defaultLists);
        return defaultLists;
      }
      
      return lists;
    } catch (error) {
      console.error('Error loading lists:', error);
      return [];
    }
  }

  static async saveLists(lists: ListData[]): Promise<void> {
    try {
      await AsyncStorage.setItem(LISTS_KEY, JSON.stringify(lists));
    } catch (error) {
      console.error('Error saving lists:', error);
    }
  }

  static async addList(name: string, color: string): Promise<void> {
    try {
      const lists = await this.getLists();
      const newList: ListData = { name, color };
      lists.push(newList);
      await this.saveLists(lists);
    } catch (error) {
      console.error('Error adding list:', error);
    }
  }

  static async updateList(oldName: string, newName: string, color: string): Promise<void> {
    try {
      const lists = await this.getLists();
      const listIndex = lists.findIndex(list => list.name === oldName);
      
      if (listIndex !== -1) {
        lists[listIndex] = { name: newName, color };
        await this.saveLists(lists);
        
        // Update all notes that belong to this list
        if (oldName !== newName) {
          const notes = await this.getNotes();
          const updatedNotes = notes.map(note => 
            note.listName === oldName 
              ? { ...note, listName: newName }
              : note
          );
          await this.saveNotes(updatedNotes);
        }
      }
    } catch (error) {
      console.error('Error updating list:', error);
    }
  }

  static async deleteList(name: string): Promise<void> {
    try {
      const lists = await this.getLists();
      const filteredLists = lists.filter(list => list.name !== name);
      await this.saveLists(filteredLists);
      
      // Delete all notes in this list
      const notes = await this.getNotes();
      const filteredNotes = notes.filter(note => note.listName !== name);
      await this.saveNotes(filteredNotes);
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  }

  static async getRecentNotes(limit: number = 5): Promise<Note[]> {
    try {
      const notes = await this.getNotes();
      return notes
        .sort((a, b) => {
          const dateA = typeof a.createdAt === 'string' ? new Date(a.createdAt) : a.createdAt;
          const dateB = typeof b.createdAt === 'string' ? new Date(b.createdAt) : b.createdAt;
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, limit);
    } catch (error) {
      console.error('Error loading recent notes:', error);
      return [];
    }
  }

  static async setNoteReminder(
  noteId: string,
  reminderDateTime: Date  // combined date and time
): Promise<void> {
  // --- THIS IS THE DEBUG ALERT WE ADDED ---
  Alert.alert(
    "DEBUG INFO",
    `1. Value received: ${String(reminderDateTime)}\n` +
    `2. Type of value: ${typeof reminderDateTime}\n` +
    `3. After 'new Date()': ${String(new Date(reminderDateTime))}`
  );
  // --- END OF DEBUG ALERT ---

  try {
    const notes = await this.getNotes();
    const note = notes.find(n => n.id === noteId);

    if (!note) return;

    // Cancel existing notification if any
    if (note.notificationId) {
      await NotificationService.cancelNotification(note.notificationId);
    }

    // Use the already combined date/time
    const fireAt = new Date(reminderDateTime);
    
    // Debug logging
    console.log('Setting reminder for:', fireAt);
    console.log('Current time:', new Date());
    console.log('Time difference (ms):', fireAt.getTime() - new Date().getTime());

    const now = new Date();
    if (fireAt <= now) {
      console.warn('Selected reminder time is in the past:', fireAt, 'Current:', now);
      return; // stop if time is already past
    }

    // Schedule new notification
    const notificationId = await NotificationService.scheduleNotification(
      'Listify Reminder',
      note.text,
      fireAt
    );
    
    console.log('Scheduled notification with ID:', notificationId);

    // Update note with reminder info
    await this.updateNote(noteId, {
      reminderDate: fireAt,
      notificationId: notificationId || undefined,
    });

  } catch (error) {
    console.error('Error setting note reminder:', error);
  }
}}