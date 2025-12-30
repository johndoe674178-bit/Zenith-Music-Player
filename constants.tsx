
import { Song, Playlist } from './types';

export const SONGS: Song[] = [
  {
    id: '1',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: 200,
    coverUrl: 'https://picsum.photos/seed/blinding/300/300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    id: '2',
    title: 'Levitating',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    duration: 203,
    coverUrl: 'https://picsum.photos/seed/levitating/300/300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    id: '3',
    title: 'Stay',
    artist: 'The Kid LAROI & Justin Bieber',
    album: 'F*CK LOVE 3',
    duration: 141,
    coverUrl: 'https://picsum.photos/seed/stay/300/300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
  {
    id: '4',
    title: 'Heat Waves',
    artist: 'Glass Animals',
    album: 'Dreamland',
    duration: 238,
    coverUrl: 'https://picsum.photos/seed/heatwaves/300/300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  },
  {
    id: '5',
    title: 'Save Your Tears',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: 215,
    coverUrl: 'https://picsum.photos/seed/tears/300/300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  },
  {
    id: '6',
    title: 'As It Was',
    artist: 'Harry Styles',
    album: "Harry's House",
    duration: 167,
    coverUrl: 'https://picsum.photos/seed/asitwas/300/300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  },
  {
    id: '7',
    title: 'Good 4 U',
    artist: 'Olivia Rodrigo',
    album: 'SOUR',
    duration: 178,
    coverUrl: 'https://picsum.photos/seed/good4u/300/300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
  }
];

export const PLAYLISTS: Playlist[] = [
  {
    id: 'p1',
    name: 'Top Hits 2024',
    description: 'The biggest tracks right now.',
    coverUrl: 'https://picsum.photos/seed/p1/400/400',
    songs: [SONGS[0], SONGS[1], SONGS[2], SONGS[3]],
  },
  {
    id: 'p2',
    name: 'Lo-fi Chill',
    description: 'Focus and relax with these beats.',
    coverUrl: 'https://picsum.photos/seed/p2/400/400',
    songs: [SONGS[4], SONGS[5]],
  },
  {
    id: 'p3',
    name: 'Party Mix',
    description: 'Get the energy up.',
    coverUrl: 'https://picsum.photos/seed/p3/400/400',
    songs: SONGS,
  }
];
