import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Mic, Square, X } from 'lucide-react';
import { apiService, tokenService } from '../../services/apiService';
import './VoiceExpenseLogger.css';

const VOICE_EXPENSE_API_URL = 'http://localhost:8080/api/voice-expense';

interface VoiceTransaction {
  amount: number;
  type: string;
  category: string;
  description: string;
  date: string;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface WebkitSpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

declare global {
  interface Window {
    webkitSpeechRecognition?: WebkitSpeechRecognitionConstructor;
  }
}

const VoiceExpenseLogger: React.FC = () => {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recognizedTextRef = useRef<string>('');
  const confirmationTranscriptRef = useRef<string>('');
  const confirmSaveRef = useRef<(() => void) | null>(null);
  const rejectSaveRef = useRef<(() => void) | null>(null);
  const shouldAutoParseOnStopRef = useRef<boolean>(false);
  const confirmationFallbackTimeoutRef = useRef<number | null>(null);

  const [recognizedText, setRecognizedText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [recognitionError, setRecognitionError] = useState<string>('');
  const [apiError, setApiError] = useState<string>('');
  const [isSpeechSupported, setIsSpeechSupported] = useState<boolean>(true);
  const [editableTransaction, setEditableTransaction] = useState<VoiceTransaction | null>(null);
  const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState<boolean>(false);
  const [isListeningForConfirmation, setIsListeningForConfirmation] = useState<boolean>(false);
  const [isTextToSpeechSupported, setIsTextToSpeechSupported] = useState<boolean>(true);
  const [isSpeakingPrompt, setIsSpeakingPrompt] = useState<boolean>(false);
  const [confirmationMessage, setConfirmationMessage] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string>('');

  const ensureMicrophonePermission = async (): Promise<boolean> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return true;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch {
      return false;
    }
  };

  const interpretConfirmation = (text: string): 'yes' | 'no' | 'unknown' => {
    const normalized = text.trim().toLowerCase();

    if (!normalized) {
      return 'unknown';
    }

    const yesWords = ['yes', 'yeah', 'yup', 'confirm', 'save', 'add it', 'proceed'];
    const noWords = ['no', 'nope', 'cancel', 'stop', 'do not', "don't", 'not now'];

    if (yesWords.some((word) => normalized.includes(word))) {
      return 'yes';
    }

    if (noWords.some((word) => normalized.includes(word))) {
      return 'no';
    }

    return 'unknown';
  };

  const parseVoiceText = useCallback(async (manualText?: string) => {
    const cleanedText = (manualText ?? recognizedTextRef.current).trim();

    if (!cleanedText) {
      setApiError('Please record or type a sentence before submitting.');
      return;
    }

    setIsSubmitting(true);
    setApiError('');
    setSaveSuccess('');

    try {
      const token = tokenService.getToken();
      const response = await fetch(VOICE_EXPENSE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: cleanedText }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const payload = (await response.json()) as Partial<VoiceTransaction>;

      const normalizedTransaction: VoiceTransaction = {
        amount: Number(payload.amount ?? 0),
        type: (payload.type ?? 'EXPENSE').toString(),
        category: (payload.category ?? 'Other').toString(),
        description: (payload.description ?? '').toString(),
        date: (payload.date ?? new Date().toISOString().split('T')[0]).toString(),
      };

      const formattedAmount = new Intl.NumberFormat('en-IN').format(normalizedTransaction.amount);
      const safeCategory = normalizedTransaction.category?.trim() || 'Other';
      const prompt = `Should I add rupees ${formattedAmount} to ${safeCategory}? Say yes to confirm or no to cancel.`;

      setEditableTransaction(normalizedTransaction);
      setIsAwaitingConfirmation(true);
      setConfirmationMessage(prompt);

      let hasStartedConfirmationListening = false;

      const startConfirmationListening = () => {
        if (hasStartedConfirmationListening) {
          return;
        }

        if (!recognitionRef.current) {
          return;
        }

        try {
          hasStartedConfirmationListening = true;
          if (confirmationFallbackTimeoutRef.current) {
            window.clearTimeout(confirmationFallbackTimeoutRef.current);
            confirmationFallbackTimeoutRef.current = null;
          }
          shouldAutoParseOnStopRef.current = false;
          confirmationTranscriptRef.current = '';
          setRecognitionError('');
          recognitionRef.current.start();
          setIsListeningForConfirmation(true);
        } catch (micError) {
          setRecognitionError(`Confirmation voice listen failed: ${(micError as Error).message}`);
          setIsListeningForConfirmation(false);
        }
      };

      if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
        setIsTextToSpeechSupported(false);
        startConfirmationListening();
      } else {
        setIsTextToSpeechSupported(true);
        const utterance = new SpeechSynthesisUtterance(prompt);
        utterance.rate = 1;
        utterance.pitch = 1;

        utterance.onstart = () => {
          setIsSpeakingPrompt(true);
        };

        utterance.onend = () => {
          setIsSpeakingPrompt(false);
          startConfirmationListening();
        };

        utterance.onerror = () => {
          setIsSpeakingPrompt(false);
          startConfirmationListening();
        };

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);

        // Safety fallback: if speech synthesis callbacks are delayed, still start listening.
        confirmationFallbackTimeoutRef.current = window.setTimeout(() => {
          startConfirmationListening();
        }, 2000);
      }
    } catch (error) {
      setApiError(`Failed to parse voice input: ${(error as Error).message}`);
      setEditableTransaction(null);
      setIsAwaitingConfirmation(false);
      setConfirmationMessage('');
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  useEffect(() => {
    if (!window.webkitSpeechRecognition) {
      setIsSpeechSupported(false);
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let transcript = '';
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
      }
      const cleanedTranscript = transcript.trim();

      if (isListeningForConfirmation) {
        confirmationTranscriptRef.current = cleanedTranscript;
      } else {
        setRecognizedText(cleanedTranscript);
        recognizedTextRef.current = cleanedTranscript;
      }

      setRecognitionError('');
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      const readableError =
        event.error === 'not-allowed'
          ? 'Microphone access was denied. Please allow microphone permission and try again.'
          : `Speech recognition failed: ${event.error}`;
      setRecognitionError(readableError);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);

      if (isListeningForConfirmation) {
        const decision = interpretConfirmation(confirmationTranscriptRef.current);
        setIsListeningForConfirmation(false);

        if (decision === 'yes') {
          confirmSaveRef.current?.();
          return;
        }

        if (decision === 'no') {
          rejectSaveRef.current?.();
          return;
        }

        if (isAwaitingConfirmation) {
          setRecognitionError('Please say clearly "yes" or "no" for confirmation.');
        }
        return;
      }

      if (shouldAutoParseOnStopRef.current && recognizedTextRef.current.trim().length > 0) {
        parseVoiceText(recognizedTextRef.current);
      }

      shouldAutoParseOnStopRef.current = false;
    };

    recognitionRef.current = recognition;

    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      if (confirmationFallbackTimeoutRef.current) {
        window.clearTimeout(confirmationFallbackTimeoutRef.current);
        confirmationFallbackTimeoutRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isAwaitingConfirmation, isListeningForConfirmation, parseVoiceText]);

  useEffect(() => {
    if (!saveSuccess) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSaveSuccess('');
    }, 3500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [saveSuccess]);

  const toggleListening = async () => {
    if (!isSpeechSupported || !recognitionRef.current) {
      setRecognitionError('Speech recognition is not supported in this browser.');
      return;
    }

    setRecognitionError('');
    setApiError('');
    setSaveSuccess('');

    if (isListening) {
      shouldAutoParseOnStopRef.current = true;
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const hasPermission = await ensureMicrophonePermission();
    if (!hasPermission) {
      setRecognitionError('Microphone permission is required. Please allow access and try again.');
      return;
    }

    try {
      setRecognizedText('');
      recognizedTextRef.current = '';
      // Parse command whether recognition stops manually or auto-stops after silence.
      shouldAutoParseOnStopRef.current = true;
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      setIsListening(false);
      setRecognitionError(`Unable to start microphone: ${(error as Error).message}`);
    }
  };

  const handleConfirmSave = useCallback(async () => {
    if (!editableTransaction) {
      return;
    }

    if (isListeningForConfirmation && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListeningForConfirmation(false);
    }

    setIsSaving(true);
    setApiError('');

    try {
      const normalizedType = editableTransaction.type.toUpperCase() === 'INCOME' ? 'INCOME' : 'EXPENSE';
      const categories = await apiService.getCategories();
      const normalizedCategory = editableTransaction.category.trim().toLowerCase();

      const exactCategory = categories.find((cat: any) =>
        (cat.type ? cat.type.toUpperCase() : normalizedType) === normalizedType &&
        cat.name?.toLowerCase() === normalizedCategory
      );

      const containsCategory = categories.find((cat: any) =>
        (cat.type ? cat.type.toUpperCase() : normalizedType) === normalizedType &&
        cat.name?.toLowerCase().includes(normalizedCategory)
      );

      const fallbackCategory = categories.find((cat: any) =>
        (cat.type ? cat.type.toUpperCase() : normalizedType) === normalizedType
      );

      const selectedCategory = exactCategory || containsCategory || fallbackCategory;

      if (!selectedCategory) {
        throw new Error('No category is available to save this transaction');
      }

      const parsedDate = new Date(editableTransaction.date);
      const safeDate = Number.isNaN(parsedDate.getTime())
        ? new Date().toISOString().split('T')[0]
        : editableTransaction.date;

      await apiService.addTransaction({
        description: editableTransaction.description || `${editableTransaction.category} via voice`,
        amount: editableTransaction.amount,
        type: normalizedType,
        categoryId: Number(selectedCategory.id),
        date: safeDate,
      });

      setIsAwaitingConfirmation(false);
      setConfirmationMessage('');
      setSaveSuccess('Transaction added successfully.');
    } catch (error) {
      setApiError(`Failed to save transaction: ${(error as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  }, [editableTransaction, isListeningForConfirmation]);

  const handleRejectSave = useCallback(() => {
    if (isListeningForConfirmation && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setIsAwaitingConfirmation(false);
    setIsListeningForConfirmation(false);
    setConfirmationMessage('');
    setEditableTransaction(null);
    setSaveSuccess('Transaction was not added.');
  }, [isListeningForConfirmation]);

  useEffect(() => {
    confirmSaveRef.current = () => {
      void handleConfirmSave();
    };
    rejectSaveRef.current = handleRejectSave;
  }, [handleConfirmSave, handleRejectSave]);

  return (
    <div className="voice-fab-root">
      {isAwaitingConfirmation && (
        <div className="voice-fab-confirmation-card">
          <p>{confirmationMessage}</p>
          <div className="voice-fab-confirmation-actions">
            <button type="button" className="voice-primary-button" onClick={handleConfirmSave} disabled={isSaving}>
              <CheckCircle2 size={16} />
              <span>Yes</span>
            </button>
            <button type="button" className="voice-secondary-button" onClick={handleRejectSave} disabled={isSaving}>
              <X size={16} />
              <span>No</span>
            </button>
          </div>
          {!isTextToSpeechSupported && (
            <p className="voice-fab-small-note">Text-to-speech not available. Please answer yes or no.</p>
          )}
        </div>
      )}

      <div className="voice-fab-status-stack" aria-live="polite">
        {recognizedText && !isAwaitingConfirmation && (
          <div className="voice-loading-state">Heard: {recognizedText}</div>
        )}
        {recognitionError && <p className="voice-alert voice-alert-error">{recognitionError}</p>}
        {apiError && <p className="voice-alert voice-alert-error">{apiError}</p>}
        {saveSuccess && (
          <p className="voice-alert voice-alert-success">
            <CheckCircle2 size={16} />
            <span>{saveSuccess}</span>
          </p>
        )}
        {isListening && <div className="voice-loading-state">Listening... tap again to stop</div>}
        {isSubmitting && <div className="voice-loading-state">Processing your command...</div>}
        {isSpeakingPrompt && <div className="voice-loading-state">Speaking confirmation prompt...</div>}
        {isListeningForConfirmation && <div className="voice-loading-state">Listening for yes or no...</div>}
        {isSaving && <div className="voice-loading-state">Saving transaction...</div>}
      </div>

      <button
        type="button"
        onClick={toggleListening}
        disabled={isSubmitting || isSaving || isAwaitingConfirmation}
        className={`voice-fab-button ${isListening ? 'voice-mic-listening' : ''}`}
        aria-label={isListening ? 'Stop voice command' : 'Start voice command'}
        title={isListening ? 'Tap to stop listening' : 'Voice quick add'}
      >
        {isListening ? <Square size={22} /> : <Mic size={22} />}
      </button>
    </div>
  );
};

export default VoiceExpenseLogger;
