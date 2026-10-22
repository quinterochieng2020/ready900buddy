/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Volume2 } from 'lucide-react';
import type { BuddyLanguage } from '@/api/types';
import { cn } from '@/lib/utils';

const STORAGE_PREFIX = 'ready900-voice-';
const GLOBAL_STORAGE_KEY = 'ready900-voice-uri';

const LANG_HINT: Record<BuddyLanguage, string[]> = {
  en: ['en'],
  ss: ['ss', 'ssw'],
  zu: ['zu', 'zul'],
  sw: ['sw', 'swa'],
};

export function formatVoiceName(voice: SpeechSynthesisVoice): string {
  const cleanName = voice.name
    .replace(/^Microsoft\s+/i, '')
    .replace(/\s+Desktop/i, '')
    .replace(/\s+Online\s+\(Natural\)/i, ' Natural')
    .replace(/\s+-\s+English\s+\([A-Za-z\s]+\)/i, '')
    .trim();
  return `${cleanName} (${voice.lang})`;
}

interface VoiceContextValue {
  allVoices: SpeechSynthesisVoice[];
  displayVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  selectedVoiceURI: string;
  setSelectedVoiceURI: (uri: string) => void;
  hasNativeVoice: boolean;
  previewVoice: (voiceToPreview?: SpeechSynthesisVoice) => void;
}

const VoiceContext = createContext<VoiceContextValue | null>(null);

export function VoiceProvider({
  language,
  children,
}: {
  language: BuddyLanguage;
  children: React.ReactNode;
}) {
  const [allVoices, setAllVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURIState] = useState<string>(() => {
    try {
      return (
        localStorage.getItem(`${STORAGE_PREFIX}${language}`) ||
        localStorage.getItem(GLOBAL_STORAGE_KEY) ||
        ''
      );
    } catch {
      return '';
    }
  });

  const updateVoices = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      setAllVoices(voices);
    }
  }, []);

  useEffect(() => {
   window.speechSynthesis?.cancel();
    updateVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
      }
    };
  }, [updateVoices]);

  // Filter voices that match the active language hints
  const { displayVoices, hasNativeVoice } = useMemo(() => {
    const hints = LANG_HINT[language] || [];
    const matching = allVoices.filter((v) => {
      const lang = (v.lang || '').toLowerCase().replace('_', '-');
      return hints.some((h) => lang.startsWith(h));
    });

    if (matching.length > 0) {
      return { displayVoices: matching, hasNativeVoice: true };
    }
    // Fallback: If no voice exists for this language, show all voices
    return { displayVoices: allVoices, hasNativeVoice: false };
  }, [allVoices, language]);

  // Sync selected voice when language or displayVoices change
  useEffect(() => {
    if (displayVoices.length === 0) return;

    let savedUri = '';
    try {
      savedUri =
        localStorage.getItem(`${STORAGE_PREFIX}${language}`) ||
        localStorage.getItem(GLOBAL_STORAGE_KEY) ||
        '';
    } catch {
      // ignore
    }

    if (savedUri && displayVoices.some((v) => v.voiceURI === savedUri)) {
      setSelectedVoiceURIState(savedUri);
    } else {
      // Pick default matching voice or the first in list
      const defaultVoice = displayVoices.find((v) => v.default) || displayVoices[0];
      if (defaultVoice) {
        setSelectedVoiceURIState(defaultVoice.voiceURI);
      }
    }
  }, [displayVoices, language]);

  const setSelectedVoiceURI = useCallback(
    (uri: string) => {
      setSelectedVoiceURIState(uri);
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${language}`, uri);
        localStorage.setItem(GLOBAL_STORAGE_KEY, uri);
      } catch {
        // ignore
      }
    },
    [language],
  );

  const selectedVoice = useMemo(() => {
    if (!selectedVoiceURI) {
      return displayVoices[0] || null;
    }
    return (
      displayVoices.find((v) => v.voiceURI === selectedVoiceURI) ||
      allVoices.find((v) => v.voiceURI === selectedVoiceURI) ||
      displayVoices[0] ||
      null
    );
  }, [selectedVoiceURI, displayVoices, allVoices]);

  const previewVoice = useCallback(
    (voiceToPreview?: SpeechSynthesisVoice) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const v = voiceToPreview || selectedVoice;
      const sample =
        language === 'zu'
          ? 'Sawubona! Ngingumngane wakho wokufunda i-AZ-900.'
          : language === 'ss'
            ? 'Sawubona! Ngingumngani wakho wekufundza i-AZ-900.'
            : language === 'sw'
              ? 'Habari! Mimi ni mwenzi wako wa masomo ya AZ-900.'
              : 'Hello! I am your AZ-900 study buddy.';

      const u = new SpeechSynthesisUtterance(sample);
      if (v) u.voice = v;
      window.speechSynthesis.speak(u);
    },
    [language, selectedVoice],
  );

  return (
    <VoiceContext.Provider
      value={{
        allVoices,
        displayVoices,
        selectedVoice,
        selectedVoiceURI,
        setSelectedVoiceURI,
        hasNativeVoice,
        previewVoice,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const ctx = useContext(VoiceContext);
  if (!ctx) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return ctx;
}

export function VoiceSelect() {
  const { displayVoices, selectedVoiceURI, setSelectedVoiceURI, hasNativeVoice } = useVoice();

 if (displayVoices.length === 0 || !hasNativeVoice) {
  return null;
}
  return (
    <div className="relative">
      <select
        value={selectedVoiceURI}
        onChange={(e) => setSelectedVoiceURI(e.target.value)}
        aria-label="Choose voice"
        title={
          hasNativeVoice
            ? 'Select voice for audio reading'
            : 'No native voice on your device for this language. Using fallback voice.'
        }
        className={cn(
          'glass h-10 appearance-none rounded-xl pl-8 pr-7 text-xs font-medium',
          'max-w-[125px] sm:max-w-[170px] truncate',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'cursor-pointer transition-all',
          !hasNativeVoice && 'text-muted-foreground opacity-80',
        )}
      >
        {displayVoices.map((v) => (
          <option key={v.voiceURI} value={v.voiceURI} className="bg-background text-foreground">
            {formatVoiceName(v)}
          </option>
        ))}
      </select>
      <Volume2 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-60" />
      <svg
        className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-60"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}
