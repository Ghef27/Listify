import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  RefreshControl,
  Image,
  TouchableOpacity,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Cake, Calendar, Plus, Edit3, Trash2 } from 'lucide-react-native';
import { StorageService } from '@/utils/storage';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { AddBirthdayModal } from '@/components/AddBirthdayModal';
import { Note } from '@/types';

// ============================================
// CUSTOMIZABLE BIRTHDAY CARD STYLING
// ============================================
const BIRTHDAY_COLORS = {
  primary: '#EC4899',           // Main pink color
  primaryLight: '#FDF2F8',     // Light pink background
  primaryBorder: '#FBCFE8',    // Pink border
  secondary: '#BE185D',        // Darker pink for text
  accent: '#F97316',           // Orange accent for highlights
  neutral: '#6B7280',          // Gray for regular text
  background: '#fff',          // Card background
  shadow: '#000',              // Shadow color
};

const ANIMATION_CONFIG = {
  pulseScale: 1.02,            // Scale factor for pulse animation
  pulseDuration: 2000,         // Pulse animation duration in ms
  shadowIntensity: 0.15,       // Shadow intensity for highlighted cards
};
// ============================================
export default function BirthdaysScreen() {
  const [birthdays, setBirthdays] = useState<Note[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBirthday, setEditingBirthday] = useState<Note | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pulseAnimations, setPulseAnimations] = useState<Record<string, Animated.Value>>({});

  const loadBirthdays = useCallback(async () => {
    const allNotes = await StorageService.getNotes();
    const birthdayNotes = allNotes.filter(note => note.listName === 'Birthdays');
    
    // Sort birthdays by upcoming dates
    const sortedBirthdays = birthdayNotes.sort((a, b) => {
      if (!a.birthdayMonth || !a.birthdayDay || !b.birthdayMonth || !b.birthdayDay) return 0;
      
      const today = new Date();
      const currentYear = today.getFullYear();
      
      // Create dates for this year
      let dateA = new Date(currentYear, a.birthdayMonth - 1, a.birthdayDay);
      let dateB = new Date(currentYear, b.birthdayMonth - 1, b.birthdayDay);
      
      // If the birthday has passed this year, use next year
      if (dateA < today) {
        dateA = new Date(currentYear + 1, a.birthdayMonth - 1, a.birthdayDay);
      }
      if (dateB < today) {
        dateB = new Date(currentYear + 1, b.birthdayMonth - 1, b.birthdayDay);
      }
      
      return dateA.getTime() - dateB.getTime();
    });
    
    setBirthdays(sortedBirthdays);
    
    // Initialize pulse animations for this month birthdays
    const animations: Record<string, Animated.Value> = {};
    const currentMonth = new Date().getMonth() + 1;
    
    sortedBirthdays.forEach(birthday => {
      if (birthday.birthdayMonth === currentMonth) {
        animations[birthday.id] = new Animated.Value(1);
        
        // Start pulse animation
        const pulseAnimation = () => {
          Animated.sequence([
            Animated.timing(animations[birthday.id], {
              toValue: ANIMATION_CONFIG.pulseScale,
              duration: ANIMATION_CONFIG.pulseDuration / 2,
              useNativeDriver: true,
            }),
            Animated.timing(animations[birthday.id], {
              toValue: 1,
              duration: ANIMATION_CONFIG.pulseDuration / 2,
              useNativeDriver: true,
            }),
          ]).start(() => pulseAnimation());
        };
        
        pulseAnimation();
      }
    });
    
    setPulseAnimations(animations);
  }, []);

  useEffect(() => {
    loadBirthdays();
  }, [loadBirthdays]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBirthdays();
    setRefreshing(false);
  }, [loadBirthdays]);

  const handleAddBirthday = async (name: string, month: number, day: number, image?: string) => {
    await StorageService.addBirthdayNote(name, month, day, image);
    await loadBirthdays();
  };

  const handleEditBirthday = (birthday: Note) => {
    setEditingBirthday(birthday);
    setShowEditModal(true);
  };

  const handleUpdateBirthday = async (name: string, month: number, day: number, image?: string) => {
    if (!editingBirthday) return;
    
    await StorageService.updateNote(editingBirthday.id, {
      text: name,
      birthdayMonth: month,
      birthdayDay: day,
      birthdayImage: image,
    });
    
    await loadBirthdays();
    setEditingBirthday(null);
  };

  const handleDeleteBirthday = async (birthdayId: string) => {
    await StorageService.deleteNote(birthdayId);
    await loadBirthdays();
  };
  const getUpcomingBirthdayInfo = (month: number, day: number) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    
    let birthdayDate = new Date(currentYear, month - 1, day);
    
    // If birthday has passed this year, use next year
    if (birthdayDate < today) {
      birthdayDate = new Date(currentYear + 1, month - 1, day);
    }
    
    const daysUntil = Math.ceil((birthdayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isThisMonth = month === currentMonth;
    
    return { daysUntil, isThisMonth, birthdayDate };
  };

  const formatBirthdayDate = (month: number, day: number) => {
    const date = new Date(2000, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Birthdays</Text>
        <Text style={styles.subtitle}>
          {birthdays.length} {birthdays.length === 1 ? 'birthday' : 'birthdays'} tracked
        </Text>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {birthdays.length === 0 ? (
          <View style={styles.emptyState}>
            <Cake size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Birthdays Added</Text>
            <Text style={styles.emptyText}>
              Tap the + button to add birthdays and never forget to celebrate!
            </Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {birthdays.map((birthday) => {
              if (!birthday.birthdayMonth || !birthday.birthdayDay) return null;
              
              const { daysUntil, isThisMonth } = getUpcomingBirthdayInfo(
                birthday.birthdayMonth, 
                birthday.birthdayDay
              );
              
              const AnimatedCard = pulseAnimations[birthday.id] ? Animated.View : View;
              const animationProps = pulseAnimations[birthday.id] ? {
                style: {
                  transform: [{ scale: pulseAnimations[birthday.id] }]
                }
              } : {};
              
              return (
                <AnimatedCard
                  key={birthday.id} 
                  {...animationProps}
                >
                  <View
                  style={[
                    styles.birthdayCard,
                    isThisMonth && styles.birthdayCardHighlighted,
                    isThisMonth && { 
                      shadowOpacity: ANIMATION_CONFIG.shadowIntensity,
                      elevation: 6 
                    }
                  ]}
                  >
                  <View style={styles.birthdayContent}>
                    {birthday.birthdayImage ? (
                      <Image 
                        source={{ uri: birthday.birthdayImage }} 
                        style={styles.birthdayImage}
                      />
                    ) : (
                      <View style={styles.birthdayImagePlaceholder}>
                        <Cake size={24} color={BIRTHDAY_COLORS.primary} />
                      </View>
                    )}
                    
                    <View style={styles.birthdayInfo}>
                      <Text style={styles.birthdayName}>{birthday.text}</Text>
                      <Text style={styles.birthdayDate}>
                        {formatBirthdayDate(birthday.birthdayMonth, birthday.birthdayDay)}
                      </Text>
                      <View style={styles.daysContainer}>
                        <Calendar size={14} color={isThisMonth ? BIRTHDAY_COLORS.primary : BIRTHDAY_COLORS.neutral} />
                        <Text style={[
                          styles.daysText,
                          isThisMonth && styles.daysTextHighlighted
                        ]}>
                          {daysUntil === 0 ? 'Today!' : 
                           daysUntil === 1 ? 'Tomorrow' : 
                           `${daysUntil} days`}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={styles.editButton}
                        onPress={() => handleEditBirthday(birthday)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Edit3 size={16} color={BIRTHDAY_COLORS.neutral} />
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={() => handleDeleteBirthday(birthday.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {isThisMonth && (
                    <View style={styles.thisMonthBadge}>
                      <Text style={styles.thisMonthBadgeText}>This Month</Text>
                    </View>
                  )}
                  </View>
                </AnimatedCard>
              );
            })}
          </View>
        )}
      </ScrollView>

      <FloatingActionButton onPress={() => setShowAddModal(true)} />

      <AddBirthdayModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddBirthday}
      />

      <AddBirthdayModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingBirthday(null);
        }}
        onSave={handleUpdateBirthday}
        editingBirthday={editingBirthday}
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
    backgroundColor: BIRTHDAY_COLORS.background,
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
    color: BIRTHDAY_COLORS.neutral,
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
  timeline: {
    paddingHorizontal: 16,
  },
  birthdayCard: {
    backgroundColor: BIRTHDAY_COLORS.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: BIRTHDAY_COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  birthdayCardHighlighted: {
    backgroundColor: BIRTHDAY_COLORS.primaryLight,
    borderWidth: 2,
    borderColor: BIRTHDAY_COLORS.primary,
  },
  birthdayContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  birthdayImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  birthdayImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BIRTHDAY_COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: BIRTHDAY_COLORS.primaryBorder,
  },
  birthdayInfo: {
    flex: 1,
  },
  birthdayName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  birthdayDate: {
    fontSize: 16,
    color: BIRTHDAY_COLORS.neutral,
    marginBottom: 8,
  },
  daysContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  daysText: {
    fontSize: 14,
    fontWeight: '600',
    color: BIRTHDAY_COLORS.neutral,
    marginLeft: 6,
  },
  daysTextHighlighted: {
    color: BIRTHDAY_COLORS.primary,
  },
  actionButtons: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  thisMonthBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: BIRTHDAY_COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  thisMonthBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: BIRTHDAY_COLORS.background,
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
    color: BIRTHDAY_COLORS.neutral,
    textAlign: 'center',
    lineHeight: 22,
  },
});