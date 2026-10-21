export type BuddyMode = 'simple' | 'local' | 'exam' | 'socratic';

export type BuddyLanguage = 'en' | 'ss' | 'zu' | 'sw';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface BuddyRequest {
  conversationId?: string;
  message: string;
  mode: BuddyMode;
  language: BuddyLanguage;
  history: ChatTurn[];
}

export interface KeyTerm {
  term: string;
  meaning: string;
}

export interface BuddyReply {
  conversationId: string;
  mode: BuddyMode;
  explanation: string;
  localExample: string | null;
  keyTerms: KeyTerm[];
  examTrap: string | null;
  checkQuestion: string | null;
  outlineSection: string | null;
  cached: boolean;
}

export type ApiErrorCode =
  | 'RATE_LIMITED'
  | 'DAILY_LIMIT'
  | 'OFF_TOPIC'
  | 'PROVIDER_ERROR'
  | 'BAD_REQUEST';

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  retryAfterSeconds?: number;
}

export const LANGUAGES: { value: BuddyLanguage; label: string; nativeLabel: string }[] = [
  { value: 'en', label: 'English', nativeLabel: 'English' },
  { value: 'ss', label: 'siSwati', nativeLabel: 'Siswati' },
  { value: 'zu', label: 'isiZulu', nativeLabel: 'isiZulu' },
  { value: 'sw', label: 'Kiswahili', nativeLabel: 'Kiswahili' },
];

export const MODES: {
  value: BuddyMode;
  label: string;
  description: string;
}[] = [
  { value: 'simple', label: 'Explain simply', description: 'Plain, beginner-friendly explanations with no jargon.' },
  { value: 'local', label: 'Local example', description: 'Azure ideas explained with everyday African examples.' },
  { value: 'exam', label: 'Exam tips', description: 'Focus on what trips people up on the AZ-900 exam.' },
  { value: 'socratic', label: 'Socratic', description: 'Guiding questions that help you reason to the answer.' },
];

export const SUGGESTIONS = [
  'What is high availability?',
  'IaaS vs PaaS vs SaaS?',
  'What is an availability zone?',
  'What does the shared responsibility model mean?',
  'Explain scalability vs elasticity',
];
