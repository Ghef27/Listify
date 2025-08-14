import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Check, Trash2 } from 'lucide-react-native';
import { Note } from '@/types';

interface NoteItemProps {
  note: Note;
  onToggleComplete: (noteId: string) => void;
  onDelete?: (noteId: string) => void;
  onPress?: (note: Note) => void;
  showDeleteButton?: boolean;
}

export function NoteItem({ note, onToggleComplete, onDelete, onPress, showDeleteButton = false }: NoteItemProps) {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => onPress?.(note)}
      activeOpacity={0.7}
    >
      <TouchableOpacity
        style={[styles.checkbox, note.completed && styles.checkboxCompleted]}
        onPress={() => onToggleComplete(note.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {note.completed && <Check size={16} color="#fff" strokeWidth={3} />}
      </TouchableOpacity>
      
      <View style={styles.content}>
        <Text style={[
          styles.text, 
          note.completed && styles.textCompleted
        ]}>
          {note.text}
        </Text>
        <Text style={styles.listName}>{note.listName}</Text>
      </View>
      
      {showDeleteButton && onDelete && (
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => onDelete(note.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Trash2 size={18} color="#EF4444" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#14B8A6',
    borderColor: '#14B8A6',
  },
  content: {
    flex: 1,
  },
  text: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 22,
  },
  textCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  listName: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
});