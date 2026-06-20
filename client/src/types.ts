export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt?: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  language: string;
  audioUrl: string;
  backgroundUrl: string;
  lyrics: string;
  createdAt: string;
}

export interface LyricsLine {
  time: number; // Time in seconds
  text: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
