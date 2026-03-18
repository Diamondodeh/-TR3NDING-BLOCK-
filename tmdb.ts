const TMDB_API_KEY = '76d5976bcd89fc95d5f49c67e6af7f16';
const BASE_URL = 'https://api.themoviedb.org/3';
export const IMG_BASE = 'https://image.tmdb.org/t/p';

export interface TMDBMovie {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  genre_ids: number[];
  media_type?: string;
}

export interface TMDBMovieDetail extends TMDBMovie {
  genres: { id: number; name: string }[];
  runtime?: number;
  number_of_seasons?: number;
  tagline?: string;
  status?: string;
  videos?: { results: { key: string; site: string; type: string }[] };
  credits?: { cast: { id: number; name: string; character: string; profile_path: string | null }[] };
  similar?: { results: TMDBMovie[] };
}

const GENRE_MAP: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance',
  878: 'Sci-Fi', 10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
  10759: 'Action', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
  10765: 'Sci-Fi', 10766: 'Soap', 10767: 'Talk', 10768: 'War',
};

export const getGenreNames = (ids: number[]): string[] =>
  ids.map(id => GENRE_MAP[id] || 'Other').filter((v, i, a) => a.indexOf(v) === i);

export const posterUrl = (path: string | null, size = 'w500') =>
  path ? `${IMG_BASE}/${size}${path}` : '/placeholder.svg';

export const backdropUrl = (path: string | null, size = 'w1280') =>
  path ? `${IMG_BASE}/${size}${path}` : '/placeholder.svg';

async function fetchTMDB<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return res.json();
}

export const getTrending = () =>
  fetchTMDB<{ results: TMDBMovie[] }>('/trending/all/week').then(r => r.results.slice(0, 20));

export const getPopularMovies = () =>
  fetchTMDB<{ results: TMDBMovie[] }>('/movie/popular').then(r => r.results);

export const getTopRated = () =>
  fetchTMDB<{ results: TMDBMovie[] }>('/movie/top_rated').then(r => r.results);

export const getNowPlaying = () =>
  fetchTMDB<{ results: TMDBMovie[] }>('/movie/now_playing').then(r => r.results);

export const getUpcoming = () =>
  fetchTMDB<{ results: TMDBMovie[] }>('/movie/upcoming').then(r => r.results);

export const getPopularTV = () =>
  fetchTMDB<{ results: TMDBMovie[] }>('/tv/popular').then(r => r.results);

export const getTopRatedTV = () =>
  fetchTMDB<{ results: TMDBMovie[] }>('/tv/top_rated').then(r => r.results);

export const getActionMovies = () =>
  fetchTMDB<{ results: TMDBMovie[] }>('/discover/movie', { with_genres: '28', sort_by: 'popularity.desc' }).then(r => r.results);

export const getAnime = () =>
  fetchTMDB<{ results: TMDBMovie[] }>('/discover/tv', { with_genres: '16', sort_by: 'popularity.desc', with_original_language: 'ja' }).then(r => r.results);

export const getMovieDetails = (id: number) =>
  fetchTMDB<TMDBMovieDetail>(`/movie/${id}`, { append_to_response: 'videos,credits,similar' });

export const getTVDetails = (id: number) =>
  fetchTMDB<TMDBMovieDetail>(`/tv/${id}`, { append_to_response: 'videos,credits,similar' });

export const searchMulti = (query: string) =>
  fetchTMDB<{ results: TMDBMovie[] }>('/search/multi', { query, include_adult: 'false' })
    .then(r => r.results.filter(m => m.media_type === 'movie' || m.media_type === 'tv').slice(0, 20));
