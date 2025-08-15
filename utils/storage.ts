import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note, ListData } from '@/types';
import { notificationManager } from './notifications';
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
      return notesFromStorage.map((note: any) => ({
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
        if (oldNote.notificationId && updates.reminderDate !== oldNote.reminderDate) {
          await notificationManager.cancelNotification(oldNote.notificationId);
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
      if (noteToDelete?.notificationId) {
        notificationManager.cancelNotification(noteToDelete.notificationId);
      }
      const filteredNotes = notes.filter(note => note.id !== id);
      await this.saveNotes(filteredNotes);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  }

  static async setNoteReminder(
    noteId: string,
    reminderDateTime: Date
  ): Promise<void> {
    try {
      // --- DIAGNOSTIC LOGGING ---
      console.log('--- StorageService: setNoteReminder triggered ---');
      console.log(`[5] Received noteId: ${noteId}`);
      console.log(`[6] Received reminderDateTime: ${reminderDateTime.toISOString()}`);

      const notes = await this.getNotes();
      const note = notes.find(n => n.id === noteId);

      if (!note) {
        console.error('[!] Note not found in storage!');
        return;
      }

      if (note.notificationId) {
        console.log(`[7] Cancelling existing notification: ${note.notificationId}`);
        notificationManager.cancelNotification(note.notificationId);
      }

      const fireAt = new Date(reminderDateTime);
      console.log(`[8] Created 'fireAt' Date object: ${fireAt.toISOString()}`);
      
      const now = new Date();
      if (fireAt <= now) {
        console.error(`[!] CRITICAL: Time is in the past! fireAt: ${fireAt.toISOString()}, now: ${now.toISOString()}`);
        return;
      }

      console.log('[9] Calling NotificationService.scheduleNotification...');
      const notificationId = notificationManager.scheduleNotification(
        'Listify Reminder',
        note.text,
        fireAt
      );
      
      console.log(`[12] Received notificationId from service: ${notificationId}`);

      await this.updateNote(noteId, {
        reminderDate: fireAt,
        notificationId: notificationId || undefined,
      });
      console.log('[13] Note updated in storage with new reminder info.');

    } catch (error) {
      console.error('Error in setNoteReminder:', error);
    }
    console.log('--- StorageService: setNoteReminder finished ---');
  }

  // ... other functions like getLists, saveLists etc. remain the same
  static async getLists(): Promise<ListData[]> {
    try {
      const listsJson = await AsyncStorage.getItem(LISTS_KEY);
      const lists = listsJson ? JSON.parse(listsJson) : [];
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
}
