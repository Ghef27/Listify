import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  RefreshControl 
} from 'react-native';
import { Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight, Clock, CircleAlert as AlertCircle } from 'lucide-react-native';
import { Cake } from 'lucide-react-native';
import { Image } from 'react-native';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { StorageService } from '@/utils/storage';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { AddNoteModal } from '@/components/AddNoteModal';
import { ReminderModal } from '@/components/ReminderModal';
import { NoteItem } from '@/components/NoteItem';
import { ReminderTimer } from '@/components/ReminderTimer';
import { Note, ListData } from '@/types';

// ============================================
// CUSTOMIZABLE HEADER CONFIGURATION
// ============================================
// Change these values to customize the main screen header
const MAIN_TITLE = 'Listify';           // Main app title - change this text
const SUBTITLE = 'Your notes & lists';  // Subtitle text - change this text

// Font configuration - uncomment the font family you want to use
const TITLE_FONT = 'Poppins-Bold';      // Options: 'Poppins-Bold', 'Inter-Bold', or leave empty for default
const SUBTITLE_FONT = 'Inter-Regular';  // Options: 'Inter-Regular', 'Poppins-Regular', or leave empty for default

// Style configuration - easily modify colors, sizes, and spacing
const TITLE_COLOR = '#14B8A6';          // Title color (teal to match add button)
const TITLE_ALIGNMENT = 'center';          // Title color (dark gray by default)
const SUBTITLE_COLOR = '#6B7280';       // Subtitle color (medium gray by default)
const TITLE_SIZE = 32;                  // Title font size
const SUBTITLE_SIZE = 16;               // Subtitle font size
const HEADER_BACKGROUND = '#fff';       // Header background color
const TITLE_MARGIN_TOP = 4;             // Space between title and subtitle
// ============================================
export default function HomeScreen() {
  const router = useRouter();
  const [lists, setLists] = useState<ListData[]>([]);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [actionNeededNotes, setActionNeededNotes] = useState<Note[]>([]);
  const [thisMonthBirthdays, setThisMonthBirthdays] = useState<Note[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedNoteForReminder, setSelectedNoteForReminder] = useState<Note | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [titlePulseAnimation] = useState(new Animated.Value(1));

  // Load custom fonts
  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  // Start title pulse animation
  useEffect(() => {
    const pulseAnimation = () => {
      Animated.sequence([
        Animated.timing(titlePulseAnimation, {
          toValue: 1.4,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(titlePulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => pulseAnimation());
    };
    
    pulseAnimation();
  }, [titlePulseAnimation]);
  const loadData = useCallback(async () => {
    const [listsData, notes, actionNotes, allNotes] = await Promise.all([
      StorageService.getLists(),
      StorageService.getNotes(),
      StorageService.getActionNeededNotes(),
      StorageService.getNotes()
    ]);
    
    // Filter out archived lists
    const activeListsData = listsData.filter(list => !list.archived && list.name !== 'Birthdays');
    
    // Calculate note counts for each list
    const listsWithCounts = activeListsData.map(list => ({
      ...list,
      count: notes.filter(note => note.listName === list.name && !note.completed).length
    }));
    
    setLists(listsWithCounts);
    setActionNeededNotes(actionNotes);
    
    // Get this month's birthdays
    const currentMonth = new Date().getMonth() + 1;
    const birthdayNotes = allNotes.filter(note => 
      note.listName === 'Birthdays' && 
      note.birthdayMonth === currentMonth
    );
    setThisMonthBirthdays(birthdayNotes);
    
    // Get recent notes (last 5)
    const recent = await StorageService.getRecentNotesIncludingArchived(5);
    setRecentNotes(recent);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh data when screen comes into focus (e.g., returning from settings)
  useEffect(() => {
    const focusHandler = () => {
      loadData();
    };
    
    // Listen for focus events
    const unsubscribe = router.addListener?.('focus', focusHandler);
    return unsubscribe;
  }, [router, loadData]);

  // Add focus listener to refresh data when screen becomes active
  useEffect(() => {
    const unsubscribe = router.addListener?.('focus', () => {
      console.log('Home screen focused, reloading data...');
      loadData();
    });
    return unsubscribe;
  }, [router, loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleAddNote = async (text: string, listName: string) => {
    await StorageService.addNote(text, listName);
    await loadData();
  };

  const handleToggleComplete = async (noteId: string) => {
    const note = recentNotes.find(n => n.id === noteId);
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

  const navigateToList = (listName: string) => {
    router.push(`/list/${encodeURIComponent(listName)}`);
  };

  // Don't render until fonts are loaded
  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Animated.Text style={[
          styles.title,
          { 
            fontFamily: TITLE_FONT,
            color: TITLE_COLOR,
            fontSize: TITLE_SIZE,
            transform: [{ scale: titlePulseAnimation }]
          }
        ]}>
          {MAIN_TITLE}
        </Animated.Text>
        <Text style={[
          styles.subtitle,
          { 
            fontFamily: SUBTITLE_FONT,
            color: SUBTITLE_COLOR,
            fontSize: SUBTITLE_SIZE,
            marginTop: TITLE_MARGIN_TOP
          }
        ]}>
          {SUBTITLE}
        </Text>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {actionNeededNotes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AlertCircle size={20} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Action Needed</Text>
            </View>
            {actionNeededNotes.map((note) => (
              <View key={note.id} style={styles.actionNeededItem}>
                <NoteItem
                  note={note}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteNote}
                  onSetReminder={handleSetReminder}
                  showDeleteButton={true}
                  showReminderButton={true}
                  onPress={(note) => navigateToList(note.listName)}
                />
                {note.reminderDate && (
                  <View style={styles.timerContainer}>
                    <ReminderTimer
                      reminderDate={new Date(note.reminderDate)}
                      isExpired={note.reminderExpired}
                      onExpire={() => handleReminderExpire(note.id)}
                    />
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {thisMonthBirthdays.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Cake size={20} color="#00d0ce" />
              <Text style={styles.sectionTitle}>This Month's Birthdays</Text>
            </View>
            {thisMonthBirthdays.map((birthday) => {
              const daysUntil = birthday.birthdayMonth && birthday.birthdayDay ? 
                (() => {
                  const today = new Date();
                  const currentYear = today.getFullYear();
                  let birthdayDate = new Date(currentYear, birthday.birthdayMonth - 1, birthday.birthdayDay);
                  
                  if (birthdayDate < today) {
                    birthdayDate = new Date(currentYear + 1, birthday.birthdayMonth - 1, birthday.birthdayDay);
                  }
                  
                  return Math.ceil((birthdayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                })() : 0;
              
              return (
                <TouchableOpacity
                  key={birthday.id}
                  style={styles.birthdayCard}
                  onPress={() => router.push('/birthdays')}
                  activeOpacity={0.7}
                >
                  {birthday.birthdayImage ? (
                    <Image 
                      source={{ uri: birthday.birthdayImage }} 
                      style={styles.birthdayImage}
                    />
                  ) : (
                    <View style={styles.birthdayImagePlaceholder}>
                      <Cake size={20} color="#14B8A6" />
                    </View>
                  )}
                  
                  <View style={styles.birthdayInfo}>
                    <Text style={styles.birthdayName}>{birthday.text}</Text>
                    <Text style={styles.birthdayDate}>
                      {birthday.birthdayMonth && birthday.birthdayDay && 
                        new Date(2000, birthday.birthdayMonth - 1, birthday.birthdayDay)
                          .toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
                      }
                    </Text>
                    <Text style={styles.birthdayDays}>
                      {daysUntil === 0 ? '🎉 Today!' : 
                       daysUntil === 1 ? '🎂 Tomorrow' : 
                       `🗓️ ${daysUntil} days`}
                    </Text>
                  </View>
                  
                  <View style={styles.birthdayBadge}>
                    <Text style={styles.birthdayBadgeText}>Birthday</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Lists</Text>
          {lists.map((list) => (
            <TouchableOpacity
              key={list.name}
              style={styles.listItem}
              onPress={() => navigateToList(list.name)}
              activeOpacity={0.7}
            >
              <View style={styles.listLeft}>
                <View style={[styles.colorDot, { backgroundColor: list.color }]} />
                <View>
                  <Text style={styles.listName}>{list.name}</Text>
                  <Text style={styles.listCount}>
                    {list.count} {list.count === 1 ? 'item' : 'items'}
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {recentNotes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={20} color="#6B7280" />
              <Text style={styles.sectionTitle}>Recent Notes</Text>
            </View>
            {recentNotes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDeleteNote}
                onSetReminder={handleSetReminder}
                showDeleteButton={true}
                showReminderButton={true}
                onPress={(note) => navigateToList(note.listName)}
              />
            ))}
          </View>
        )}

        {lists.length === 0 && recentNotes.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Welcome to Listify!</Text>
            <Text style={styles.emptyText}>
              Start by creating your first note. Tap the + button below to get started.
            </Text>
          </View>
        )}
      </ScrollView>

      <FloatingActionButton onPress={() => setShowAddModal(true)} />

      <AddNoteModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddNote}
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
    paddingVertical: 20,
    backgroundColor: HEADER_BACKGROUND, // Use customizable background color
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
  },
  // Title styling - font family, color, and size are now configurable above
  title: {
    fontWeight: 'bold',
    // textAlign: TITLE_ALIGNMENT, // Use the new variable here  
    // fontSize, color, and fontFamily are applied inline for easy customization
  },
  // Subtitle styling - font family, color, and size are now configurable above
  subtitle: {
    // fontSize, color, fontFamily, and marginTop are applied inline for easy customization
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
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  listItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  listLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  listName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  listCount: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  actionNeededItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  timerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  birthdayCard: {
    backgroundColor: '#f0f6f6ff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00d0ce',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  birthdayImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  birthdayImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  birthdayInfo: {
    flex: 1,
  },
  birthdayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F766E',
    marginBottom: 2,
  },
  birthdayDate: {
    fontSize: 14,
    color: '#0F766E',
    marginBottom: 2,
  },
  birthdayDays: {
    fontSize: 12,
   // fontWeight: '600',
    color: '#0F766E', //#14B8A6
  },
  birthdayBadge: {
    backgroundColor: '#14B8A6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  birthdayBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});