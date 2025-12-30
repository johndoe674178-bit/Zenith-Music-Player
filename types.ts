
export interface Song {
  id: string;
  user_id?: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  coverUrl: string;
  audioUrl: string;
  isLocal?: boolean;
  isPublic?: boolean;
  trackNumber?: number; // Added for album ordering
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  songs: Song[];
  type?: 'playlist' | 'liked' | 'local';
}
