import { useState, useEffect, useCallback } from 'react';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    const onSpeechStart = () => {
      setIsListening(true);
    };
    const onSpeechEnd = () => {
      setIsListening(false);
    };
    const onSpeechError = (e: SpeechErrorEvent) => {
      console.error(e.error);
      setIsListening(false);
    };
    const onSpeechResults = (e: SpeechResultsEvent) => {
      if (e.value && e.value.length > 0) {
        setTranscript(e.value[0]);
      }
      setIsListening(false); // ✅ This is the key fix
    };

    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechResults = onSpeechResults;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startListening = useCallback(async () => {
    try {
      setTranscript('');
      await Voice.start('en-US');
    } catch (e) {
      console.error('startListening error', e);
    }
  }, []);

  const stopListening = useCallback(async () => {
    try {
      await Voice.stop();
    } catch (e) {
      console.error('stopListening error', e);
    }
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
  };
}