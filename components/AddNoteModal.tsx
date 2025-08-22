import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Mic, MicOff, Send } from 'lucide-react-native';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { ListData } from '@/types';
import { StorageService } from '@/utils/storage';

interface AddNoteModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (text: string, listName: string) => void;
  initialList?: string;
  lists: ListData[];
}

export function AddNoteModal({ visible, onClose, onSave, initialList, lists }: AddNoteModalProps) {
  const [text, setText] = useState('');
  const scrollViewRef = React.useRef<ScrollView>(null);
  const itemLayouts = React.useRef<Record<string, number>>({}); // ADDED FOR JUMP SCROLL
  const [selectedList, setSelectedList] = useState(initialList || lists[0]?.name || '');
  
  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening, 
    resetTranscript 
  } = useSpeechRecognition();

  // Reload lists when modal becomes visible
  useEffect(() => {
    if (visible) {
      // Reset selected list to first available list when modal opens
      const activeList = lists.find(list => !list.archived);
      if (activeList && (!selectedList || lists.find(l => l.name === selectedList)?.archived)) {
        setSelectedList(activeList.name);
      }
    }
  }, [visible, lists, selectedList]);

useEffect(() => {
  // Only run this effect if the modal is visible
  if (!visible) return;

  // Wait for the UI to settle after a list is selected or on initial render
  setTimeout(() => {
    if (scrollViewRef.current && selectedList) {
      const xOffset = itemLayouts.current[selectedList];
      if (xOffset !== undefined) {
        scrollViewRef.current.scrollTo({ x: xOffset, animated: true });
      }
    }
  }, 100);
}, [selectedList, visible, lists]);

//Added this from gemini for scroll jump

useEffect(() => {
    if (scrollViewRef.current && lists.length > 0 && initialList) {
      const selectedIndex = lists.findIndex(list => list.name === initialList);
      if (selectedIndex !== -1) {
        // You may need to adjust this value based on the actual chip width
        const itemWidth = 100;
        const xOffset = selectedIndex * itemWidth;

        scrollViewRef.current.scrollTo({ x: xOffset, animated: true });
      }
    }
  }, [lists, initialList]);

  const handleSave = () => {
    if (text.trim()) {
      onSave(text.trim(), selectedList);
      setText('');
      onClose();
    }
  };

  const handleClose = () => {
    setText('');
    resetTranscript();
    onClose();
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.title}>Add Note</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Select List</Text>
         <ScrollView 
  ref={scrollViewRef}
  horizontal 
  showsHorizontalScrollIndicator={false} 
  style={styles.listsContainer}
>
            {lists.filter(list => !list.archived).map((list) => (
<TouchableOpacity
  key={list.name}
  onLayout={(event) => {
    // This correctly gets the x position of the chip
    itemLayouts.current[list.name] = event.nativeEvent.layout.x;
  }}
  style={[
    styles.listChip,
    { borderColor: list.color },
    selectedList === list.name && { backgroundColor: list.color }
  ]}
  onPress={() => setSelectedList(list.name)}
>
  <Text style={[
    styles.listChipText,
    selectedList === list.name && styles.listChipTextSelected
  ]}>
    {list.name}
  </Text>
</TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={text}
              onChangeText={setText}
              placeholder="What's on your mind?"
              multiline
              autoFocus
              textAlignVertical="top"
            />
          </View>
          
          <View style={styles.bottomButtons}>
            <TouchableOpacity 
              style={[styles.micButton, isListening && styles.micButtonActive]}
              onPress={toggleListening}
            >
              {isListening ? (
                <MicOff size={24} color="#fff" />
              ) : (
                <Mic size={24} color="#14B8A6" />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleSave} 
              style={[styles.saveButtonBottom, !text.trim() && styles.saveButtonDisabled]}
              disabled={!text.trim()}
            >
              <Send size={20} color={text.trim() ? "#fff" : "#9CA3AF"} />
              <Text style={[styles.saveButtonText, !text.trim() && styles.saveButtonTextDisabled]}>
                Save Note
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  bottomSection: {
    padding: 16,
    paddingBottom: 32,
  },
  inputContainer: {
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bottomButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonActive: {
    backgroundColor: '#EF4444',
  },
  saveButtonBottom: {
    flex: 1,
    backgroundColor: '#14B8A6',
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#9CA3AF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  listsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  listChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  listChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  listChipTextSelected: {
    color: '#fff',
  },
});