import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note, ListData } from '@/types';

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

  static async addBirthdayNote(
    name: string, 
    month: number, 
    day: number, 
    image?: string
  ): Promise<void> {
    try {
      const notes = await this.getNotes();
      const newNote: Note = {
        id: Date.now().toString(),
        text: name,
        listName: 'Birthdays',
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        birthdayMonth: month,
        birthdayDay: day,
        birthdayImage: image,
      };
      notes.push(newNote);
      await this.saveNotes(notes);
    } catch (error) {
      console.error('Error adding birthday note:', error);
    }
  }
  static async updateNote(id: string, updates: Partial<Note>): Promise<void> {
    try {
      const notes = await this.getNotes();
      const noteIndex = notes.findIndex(note => note.id === id);
      if (noteIndex !== -1) {
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
      const filteredNotes = notes.filter(note => note.id !== id);
      await this.saveNotes(filteredNotes);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  }

  static async setNoteReminder(noteId: string, reminderDateTime: Date): Promise<void> {
    try {
      await this.updateNote(noteId, {
        reminderDate: reminderDateTime,
        reminderExpired: false,
      });
    } catch (error) {
      console.error('Error setting reminder:', error);
    }
  }

  static async getLists(): Promise<ListData[]> {
    try {
      const listsJson = await AsyncStorage.getItem(LISTS_KEY);
      const lists = listsJson ? JSON.parse(listsJson) : [];
      if (lists.length === 0) {
        const defaultLists: ListData[] = [
          { name: 'Personal', color: '#14B8A6' },
          { name: 'Work', color: '#10B981' },
          { name: 'Shopping', color: '#059669' },
          { name: 'Birthdays', color: '#EC4899' },
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
      const [lists, notes] = await Promise.all([
        this.getLists(),
        this.getNotes()
      ]);
      
      // Update the list
      const listIndex = lists.findIndex(list => list.name === oldName);
      if (listIndex !== -1) {
        lists[listIndex] = { ...lists[listIndex], name: newName, color };
        await this.saveLists(lists);
      }
      
      // Update all notes that reference this list
      if (oldName !== newName) {
        const updatedNotes = notes.map(note => 
          note.listName === oldName 
            ? { ...note, listName: newName, updatedAt: new Date() }
            : note
        );
        await this.saveNotes(updatedNotes);
      }
    } catch (error) {
      console.error('Error updating list:', error);
    }
  }

  static async toggleListArchive(listName: string): Promise<void> {
    try {
      console.log('toggleListArchive called for:', listName);
      const lists = await this.getLists();
      console.log('Current lists:', lists.map(l => ({ name: l.name, archived: l.archived })));
      const listIndex = lists.findIndex(list => list.name === listName);
      if (listIndex !== -1) {
        lists[listIndex] = { 
          ...lists[listIndex], 
          archived: !lists[listIndex].archived 
        };
        console.log('Updated list:', lists[listIndex]);
        await this.saveLists(lists);
        console.log('Lists saved successfully');
      }
    } catch (error) {
      console.error('Error toggling list archive:', error);
    }
  }
  static async getRecentNotes(limit: number = 5): Promise<Note[]> {
    try {
      const notes = await this.getNotes();
      const lists = await this.getLists();
      const archivedListNames = lists
        .filter(list => list.archived)
        .map(list => list.name);
      
      return notes
        .filter(note => !archivedListNames.includes(note.listName) && note.listName !== 'Birthdays')
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent notes:', error);
      return [];
    }
  }

  static async getRecentNotesIncludingArchived(limit: number = 5): Promise<Note[]> {
    try {
      const notes = await this.getNotes();
      return notes
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent notes including archived:', error);
      return [];
    }
  }
  static async getActionNeededNotes(): Promise<Note[]> {
    try {
      const notes = await this.getNotes();
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      return notes.filter(note => {
        if (!note.reminderDate || note.completed) return false;
        
        const reminderDate = new Date(note.reminderDate);
        
        // Include expired reminders (red ones)
        if (reminderDate < now && note.reminderExpired) {
          return true;
        }
        
        // Include reminders that expire today
        return reminderDate >= today && reminderDate < tomorrow;
      });
    } catch (error) {
      console.error('Error getting action needed notes:', error);
      return [];
    }
  }
}