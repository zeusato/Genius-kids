export const INSTRUMENTS = [
    { id: 'piano', name: 'Piano', detail: 'Ấm áp & trong trẻo', icon: '🎹', color: '#d5aa70' },
    { id: 'electric', name: 'Piano điện', detail: 'Êm như mây', icon: '✨', color: '#bca1d4' },
    { id: 'organ', name: 'Organ', detail: 'Ngân cùng ngón tay', icon: '🎼', color: '#7fb6af' },
    { id: 'guitar', name: 'Guitar', detail: 'Dây đàn tí tách', icon: '🎸', color: '#d79177' },
    { id: 'wood', name: 'Đàn gỗ', detail: 'Lóc cóc vui tai', icon: '🪵', color: '#90ae79' },
    { id: 'musicbox', name: 'Hộp nhạc', detail: 'Lấp lánh như sao', icon: '🎠', color: '#dba2b0' },
] as const;
export type InstrumentId = typeof INSTRUMENTS[number]['id'];
export interface NoteEvent { midi: number | null; at: number; beats: number }
export interface Song {
    id: string; melodyFamilyId: string; title: string; originalTitle: string; art: string;
    bpm: number; meter: string; level: 'easy' | 'medium' | 'hard'; notes: NoteEvent[]; totalBeats: number;
    source: { url: string; book: string; page: string; sha256: string; transpose: number };
}
export interface Step { pitches: number[]; beats: number; gapBeats?: number; holdMs?: number }
export interface Lesson { id: string; title: string; subtitle: string; instruction: string; tip: string; icon: string; steps: Step[]; demonstration?: 'hand' | 'keys' }
export const NOTE_NAMES = ['Đô', 'Đô ♯', 'Rê', 'Rê ♯', 'Mi', 'Fa', 'Fa ♯', 'Sol', 'Sol ♯', 'La', 'La ♯', 'Si'];
export const LETTER_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
export const noteName = (midi: number, letters = false) => (letters ? LETTER_NAMES : NOTE_NAMES)[midi % 12];
export const isBlack = (midi: number) => [1, 3, 6, 8, 10].includes(midi % 12);
export const validMidi = (n: number) => Number.isInteger(n) && n >= 60 && n <= 84;
export const SONG_IDS = ['25432-hotcrossbuns','25432-londonbridge','25432-polly','25432-avignon','25432-lucylocket','25432-schlaf','25432-aikendrum','25432-margerydaw','25432-threelittlekittens','25432-looby','25418-girls','25418-mulberry','25418-oranges','25418-lavender','25418-threeships','25418-dingdong','25418-threeblindmice','25418-dickory','25418-sixpence','25418-bopeep','25418-baabaa','25418-jackandjill','25418-hushaby','25418-kingcole'];
export const LEVEL_NAMES = { easy: 'Khởi đầu', medium: 'Quen tay', hard: 'Thử sức' };
export interface Preferences { instrument: InstrumentId; volume: number; labels: 'solfege' | 'letters' | 'none'; guidance: boolean }
export const defaultPreferences: Preferences = { instrument: 'piano', volume: .55, labels: 'solfege', guidance: true };
