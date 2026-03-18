export interface Movie {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl?: string;
  trailerUrl?: string;
  category: 'movie' | 'series';
  genre: string[];
  releaseYear: number;
  rating: number;
  duration?: string;
  is4K?: boolean;
  episodes?: Episode[];
}

export interface Episode {
  id: string;
  title: string;
  season: number;
  episode: number;
  thumbnail: string;
  videoUrl: string;
  duration: string;
}

export interface Download {
  id: string;
  movieId: string;
  title: string;
  thumbnail: string;
  progress: number;
  status: 'downloading' | 'completed' | 'paused' | 'error';
  size: string;
  downloadedSize: string;
}

export type UserRole = 'user' | 'admin' | 'main_admin';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
}
