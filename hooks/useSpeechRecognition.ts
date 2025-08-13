import { useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import * as Speech from 'expo-speech';

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const startListening = useCallback(() => {
    if (Platform.OS === 'web') {
      // Web speech recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => {
          setIsListening(true);
        };
        
        recognition.onresult = (event: any) => {
          const result = event.results[0][0].transcript;
          setTranscript(result);
          setIsListening(false);
        };
        
        recognition.onerror = () => {
          setIsListening(false);
          Alert.alert('Error', 'Speech recognition failed. Please try again.');
        };
        
        recognition.onend = () => {
          setIsListening(false);
        };
        
        recognition.start();
      } else {
        Alert.alert('Not Supported', 'Speech recognition is not supported in this browser.');
      }
    } else {
      // For mobile platforms, we'll simulate speech recognition
      // In a real app, you would use expo-speech or react-native-voice
      setIsListening(true);
      
      // Simulate speech recognition with a timeout
      setTimeout(() => {
        setIsListening(false);
        Alert.alert('Speech Recognition', 'Speech recognition is not fully implemented for mobile. Please type your note instead.');
      }, 2000);
    }
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  };
}