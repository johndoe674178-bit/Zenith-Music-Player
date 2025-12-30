
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MainView from './components/MainView';
import AlbumsView from './components/AlbumsView';
import Player from './components/Player';
import MiniPlayer from './components/MiniPlayer';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import EditSongModal from './components/EditSongModal';
import QueuePanel from './components/QueuePanel';
import SearchBar from './components/SearchBar';
import SleepTimer from './components/SleepTimer';
import SettingsModal from './components/SettingsModal';
import CreateAlbumModal from './components/CreateAlbumModal';
import { ToastProvider, useToast } from './components/Toast';
import { AuthProvider, useAuth } from './components/AuthContext';
import { useSupabaseSongs } from './hooks/useSupabaseSongs';
import { useLikedSongs } from './hooks/useLikedSongs';
import { usePublicSongs } from './hooks/usePublicSongs';
import { useProfile } from './hooks/useProfile';
import { useRecentlyPlayed } from './hooks/useRecentlyPlayed';
import { useSettings } from './hooks/useSettings';
import { Song, Playlist } from './types';
import { PLAYLISTS as INITIAL_PLAYLISTS, SONGS } from './constants';
import './electron.d.ts'; // Import type declarations

type RepeatMode = 'off' | 'all' | 'one';

// Check if we're in mini player mode (Electron)
const isMiniPlayerMode = () => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    return params.get('miniPlayer') === 'true';
  }
  return false;
};

// Check if running in Electron
const isElectron = () => {
  return typeof window !== 'undefined' && !!window.electronAPI?.isElectron;
};

const AppContent: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { songs: cloudSongs, uploadSong, uploadAlbum, deleteSong, updateSong, togglePublic, loading: songsLoading } = useSupabaseSongs();
  const { likedSongs, likedSongIds, toggleLike } = useLikedSongs();
  const { publicSongs } = usePublicSongs();
  const { profile, updateDisplayName } = useProfile();
  const { recentlyPlayed, addToRecentlyPlayed } = useRecentlyPlayed();
  const { settings, updateSetting, resetSettings } = useSettings();

  // We move the base songs into state so that edits (like custom covers) persist across the session
  const [librarySongs, setLibrarySongs] = useState<Song[]>(SONGS);
  /* 
    INITIAL_PLAYLISTS is now empty, so we default to an empty array.
    We also removed the deep copy logic since it's empty anyway, but keeping the structure is fine.
  */
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [localSongs, setLocalSongs] = useState<Song[]>([]);
  // Default to 'cloud' since we have no default playlists
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('cloud');
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCreateAlbumModal, setShowCreateAlbumModal] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [editingSong, setEditingSong] = useState<Song | null>(null);

  // Queue state
  const [queue, setQueue] = useState<Song[]>([]);
  const [showQueue, setShowQueue] = useState(false);

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { showToast } = useToast();

  // Combine cloud songs with local/library songs
  const allSongs = useMemo(() => {
    return [...cloudSongs, ...librarySongs, ...localSongs];
  }, [cloudSongs, librarySongs, localSongs]);

  // Derive unique albums from all available sources
  const derivedAlbums = useMemo((): Playlist[] => {
    const allAvailableSongs = [...allSongs, ...likedSongs];
    const albumMap = new Map<string, Playlist>();

    allAvailableSongs.forEach(song => {
      const key = `${song.album}-${song.artist}`;
      if (!albumMap.has(key)) {
        albumMap.set(key, {
          id: `album-${song.album.replace(/\s+/g, '-').toLowerCase()}`,
          name: song.album,
          description: `Album • ${song.artist}`,
          coverUrl: song.coverUrl,
          songs: [],
          type: 'playlist'
        });
      }
      const albumObj = albumMap.get(key)!;
      if (!albumObj.songs.find(s => s.id === song.id)) {
        albumObj.songs.push(song);
      }
    });

    return Array.from(albumMap.values());
  }, [allSongs, likedSongs]);

  const activePlaylist = useMemo((): Playlist => {
    if (selectedPlaylistId === 'liked') {
      return {
        id: 'liked',
        name: 'Liked Songs',
        description: 'Your favorite tracks.',
        coverUrl: 'https://images.unsplash.com/photo-1514525253361-bee8718a300c?w=400&h=400&fit=crop',
        songs: likedSongs,
        type: 'liked'
      };
    }
    if (selectedPlaylistId === 'local') {
      return {
        id: 'local',
        name: 'Local Files',
        description: 'Music from your device.',
        coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop',
        songs: localSongs,
        type: 'local'
      };
    }
    if (selectedPlaylistId === 'cloud') {
      return {
        id: 'cloud',
        name: 'My Uploads',
        description: 'Your uploaded music.',
        coverUrl: 'https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=400&h=400&fit=crop',
        songs: cloudSongs,
        type: 'playlist'
      };
    }
    if (selectedPlaylistId === 'discover') {
      return {
        id: 'discover',
        name: 'Discover',
        description: 'Public songs from the community.',
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop',
        songs: publicSongs,
        type: 'playlist'
      };
    }
    if (selectedPlaylistId === 'recently-played') {
      return {
        id: 'recently-played',
        name: 'Recently Played',
        description: 'Your listening history.',
        coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
        songs: recentlyPlayed,
        type: 'playlist'
      };
    }

    if (selectedPlaylistId.startsWith('album-')) {
      const foundAlbum = derivedAlbums.find(a => a.id === selectedPlaylistId);
      if (foundAlbum) return foundAlbum;
    }

    return playlists.find(p => p.id === selectedPlaylistId) || playlists[0] || {
      id: 'empty',
      name: 'No Playlist',
      description: '',
      coverUrl: '',
      songs: [],
      type: 'playlist'
    };
  }, [selectedPlaylistId, playlists, likedSongs, localSongs, cloudSongs, publicSongs, recentlyPlayed, derivedAlbums]);

  // Sync state with Electron for mini player
  useEffect(() => {
    if (window.electronAPI?.isElectron) {
      // Update shared state when currentSong or isPlaying changes
      window.electronAPI.updateSharedState({ currentSong, isPlaying });
    }
  }, [currentSong, isPlaying]);

  // Listen for playback state updates from other windows
  useEffect(() => {
    if (window.electronAPI?.isElectron) {
      window.electronAPI.onPlaybackStateUpdate((state) => {
        if (state.currentSong && state.currentSong.id !== currentSong?.id) {
          setCurrentSong(state.currentSong);
        }
        if (state.isPlaying !== isPlaying) {
          setIsPlaying(state.isPlaying);
        }
      });

      // Listen for playback actions from mini player
      window.electronAPI.onPlaybackAction((action) => {
        switch (action) {
          case 'toggle-play':
            setIsPlaying(prev => !prev);
            break;
          case 'next':
            // Will be handled by handleNext
            break;
          case 'prev':
            // Will be handled by handlePrev
            break;
        }
      });

      // Get initial shared state
      window.electronAPI.getSharedState().then((state) => {
        if (state.currentSong) {
          setCurrentSong(state.currentSong);
        }
        setIsPlaying(state.isPlaying);
      });
    }
  }, []);

  const handleTogglePlay = useCallback(() => {
    const newIsPlaying = !isPlaying;
    setIsPlaying(newIsPlaying);
    if (window.electronAPI?.isElectron) {
      window.electronAPI.updateSharedState({ isPlaying: newIsPlaying });
    }
  }, [isPlaying]);

  const handlePlaySong = useCallback((song: Song) => {
    if (currentSong?.id === song.id) {
      setIsPlaying((prev) => !prev);
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
      addToRecentlyPlayed(song);
    }
  }, [currentSong, addToRecentlyPlayed]);

  const handleNext = useCallback(() => {
    // Check if there are songs in the queue first
    if (queue.length > 0) {
      const [nextFromQueue, ...rest] = queue;
      setQueue(rest);
      setCurrentSong(nextFromQueue);
      addToRecentlyPlayed(nextFromQueue);
      setIsPlaying(true);
      return;
    }

    if (activePlaylist.songs.length === 0) return;

    if (shuffle) {
      // Pick a random song that's not the current one
      const otherSongs = activePlaylist.songs.filter(s => s.id !== currentSong?.id);
      if (otherSongs.length > 0) {
        const randomIndex = Math.floor(Math.random() * otherSongs.length);
        const nextSong = otherSongs[randomIndex];
        setCurrentSong(nextSong);
        addToRecentlyPlayed(nextSong);
      } else if (repeat === 'all') {
        // If only one song and repeat all, replay it
        setCurrentSong(activePlaylist.songs[0]);
      }
    } else {
      const currentIndex = activePlaylist.songs.findIndex((s) => s.id === currentSong?.id);
      if (currentIndex === -1) {
        setCurrentSong(activePlaylist.songs[0]);
        addToRecentlyPlayed(activePlaylist.songs[0]);
      } else {
        const nextIndex = (currentIndex + 1) % activePlaylist.songs.length;
        // If we've reached the end and repeat is off, stop
        if (nextIndex === 0 && repeat === 'off') {
          setIsPlaying(false);
          return;
        }
        const nextSong = activePlaylist.songs[nextIndex];
        setCurrentSong(nextSong);
        addToRecentlyPlayed(nextSong);
      }
    }
    setIsPlaying(true);
  }, [currentSong, activePlaylist, shuffle, repeat, queue, addToRecentlyPlayed]);

  const handleShuffleChange = useCallback((shuffleOn: boolean) => {
    setShuffle(shuffleOn);
    showToast(shuffleOn ? 'Shuffle on' : 'Shuffle off', 'info', shuffleOn ? 'fas fa-random' : 'fas fa-random');
  }, [showToast]);

  const handleRepeatChange = useCallback((mode: RepeatMode) => {
    setRepeat(mode);
    const messages = { off: 'Repeat off', all: 'Repeat all', one: 'Repeat one' };
    const icons = { off: 'fas fa-redo', all: 'fas fa-redo', one: 'fas fa-redo' };
    showToast(messages[mode], 'info', icons[mode]);
  }, [showToast]);

  // Queue handlers
  const handleAddToQueue = useCallback((song: Song) => {
    setQueue(prev => [...prev, song]);
    showToast(`Added "${song.title}" to queue`, 'success', 'fas fa-list');
  }, [showToast]);

  const handlePlayNext = useCallback((song: Song) => {
    setQueue(prev => [song, ...prev]);
    showToast(`"${song.title}" will play next`, 'success', 'fas fa-play');
  }, [showToast]);

  const handleRemoveFromQueue = useCallback((index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleClearQueue = useCallback(() => {
    setQueue([]);
    showToast('Queue cleared', 'info', 'fas fa-trash');
  }, [showToast]);

  const handleReorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    setQueue(prev => {
      const newQueue = [...prev];
      const [removed] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, removed);
      return newQueue;
    });
  }, []);

  const handleSleepTimerEnd = useCallback(() => {
    setIsPlaying(false);
    showToast('Sleep timer ended. Playback stopped.', 'info', 'fas fa-moon');
  }, [showToast]);

  const handlePrev = useCallback(() => {
    const currentIndex = activePlaylist.songs.findIndex((s) => s.id === currentSong?.id);
    if (currentIndex === -1 || activePlaylist.songs.length === 0) return;
    const prevIndex = (currentIndex - 1 + activePlaylist.songs.length) % activePlaylist.songs.length;
    setCurrentSong(activePlaylist.songs[prevIndex]);
    setIsPlaying(true);
  }, [currentSong, activePlaylist]);

  const handleToggleLike = useCallback((song: Song) => {
    if (user) {
      toggleLike(song);
    } else {
      // For non-logged in users, use local state (existing behavior)
      // This could prompt them to login instead
      setShowAuthModal(true);
    }
  }, [user, toggleLike]);

  const handleAddSongToLibrary = useCallback((song: Song) => {
    if (user) {
      toggleLike(song);
    }
    setCurrentSong(song);
    setIsPlaying(true);
    setSelectedPlaylistId('liked');
  }, [user, toggleLike]);

  const handleImportLocalSongs = useCallback((newSongs: Song[]) => {
    setLocalSongs(prev => [...newSongs, ...prev]);
    if (newSongs.length > 0) {
      setCurrentSong(newSongs[0]);
      setIsPlaying(true);
      setSelectedPlaylistId('local');
    }
  }, []);

  const handleUploadToCloud = useCallback(async (file: File) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Use profile display name as artist
    const artistName = profile?.display_name || user.email?.split('@')[0] || 'Unknown Artist';
    const song = await uploadSong(file, { artist: artistName });
    if (song) {
      setCurrentSong(song);
      setIsPlaying(true);
      setSelectedPlaylistId('cloud');
    }
  }, [user, profile, uploadSong]);

  const handleCreateAlbum = useCallback(async (songs: { file: File, title: string }[], metadata: { title: string; artist: string; cover?: File }) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // We pass the uploadAlbum function directly to the modal, but we could wrap it here if we wanted addl logic
    const newSongs = await uploadAlbum(songs, metadata);
    if (newSongs.length > 0) {
      showToast('Album created successfully!', 'success', 'fas fa-compact-disc');
      setSelectedPlaylistId('cloud');
    } else {
      showToast('Failed to create album', 'error', 'fas fa-exclamation-circle');
    }
  }, [user, uploadAlbum, showToast]);

  const handleUpdateSongCover = useCallback((songId: string, newCoverUrl: string, albumToApply?: string) => {
    const updateInList = (list: Song[]) => list.map(s => {
      const matches = albumToApply ? s.album === albumToApply : s.id === songId;
      return matches ? { ...s, coverUrl: newCoverUrl } : s;
    });

    setLibrarySongs(updateInList);
    setLocalSongs(updateInList);
    setPlaylists(prev => prev.map(p => ({
      ...p,
      songs: updateInList(p.songs)
    })));

    if (currentSong) {
      const matchesCurrent = albumToApply ? currentSong.album === albumToApply : currentSong.id === songId;
      if (matchesCurrent) {
        setCurrentSong(prev => prev ? { ...prev, coverUrl: newCoverUrl } : null);
      }
    }
  }, [currentSong]);

  const handleDeleteSong = useCallback(async (songId: string) => {
    const success = await deleteSong(songId);
    if (success) {
      showToast('Song deleted', 'success', 'fas fa-trash');
      // If the deleted song is currently playing, stop it
      if (currentSong?.id === songId) {
        setCurrentSong(null);
        setIsPlaying(false);
      }
    } else {
      showToast('Failed to delete song', 'error', 'fas fa-exclamation-circle');
    }
  }, [deleteSong, currentSong, showToast]);

  const handleEditSong = useCallback((song: Song) => {
    setEditingSong(song);
  }, []);

  const handleSaveEditedSong = useCallback(async (songId: string, updates: { title: string; artist: string; album: string }) => {
    const success = await updateSong(songId, updates);
    if (success) {
      showToast('Song updated', 'success', 'fas fa-check');
    }
    return success;
  }, [updateSong, showToast]);

  const handleToggleMiniPlayer = useCallback(async () => {
    if (window.electronAPI) {
      await window.electronAPI.toggleMiniPlayer();
    }
  }, []);

  const handleExpandPlayer = useCallback(async () => {
    if (window.electronAPI) {
      await window.electronAPI.toggleMiniPlayer();
    }
  }, []);

  // If in mini player mode, render only the mini player
  if (isMiniPlayerMode()) {
    return (
      <MiniPlayer
        currentSong={currentSong}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onNext={handleNext}
        onPrev={handlePrev}
        onExpandPlayer={handleExpandPlayer}
      />
    );
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-black select-none text-white font-['Figtree']">
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div
            className="mobile-menu-overlay active lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar with mobile toggle */}
        <div className={`sidebar-container ${mobileMenuOpen ? 'open' : ''}`}>
          <Sidebar
            selectedPlaylistId={selectedPlaylistId}
            onPlaylistSelect={setSelectedPlaylistId}
            onAddSongToLibrary={handleAddSongToLibrary}
            onImportLocalSongs={handleImportLocalSongs}
            onUploadToCloud={handleUploadToCloud}
            customPlaylists={playlists}
            isLoggedIn={!!user}
            uploading={songsLoading}
            onCreateAlbum={() => setShowCreateAlbumModal(true)}
          />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden relative main-content">
          <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-4 md:px-8 z-20 pointer-events-none">
            {/* Hamburger Menu Button */}
            <div className="flex items-center space-x-2 pointer-events-auto">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="hamburger-btn w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors lg:hidden"
              >
                <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
              </button>
              <button
                onClick={() => window.history.back()}
                className="w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors hidden md:flex"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <button className="w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors hidden md:flex">
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>

            {/* Search Bar - hide on very small screens */}
            <div className="flex-1 max-w-md mx-2 md:mx-8 pointer-events-auto hidden sm:block search-container">
              <SearchBar
                songs={allSongs}
                onPlaySong={handlePlaySong}
                onAddToQueue={handleAddToQueue}
              />
            </div>

            <div className="flex items-center space-x-4 pointer-events-auto">
              {user ? (
                <>
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
                    title="Settings"
                  >
                    <i className="fas fa-cog"></i>
                  </button>
                  <button
                    onClick={() => signOut()}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-1.5 rounded-full text-sm font-bold transition-colors"
                  >
                    Log Out
                  </button>
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="flex items-center space-x-2 bg-black/40 hover:bg-black/60 text-white p-1 pr-3 rounded-full text-xs font-bold transition-all"
                    title="Edit profile"
                  >
                    <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-black font-bold">
                      {(profile?.display_name || user.email)?.[0].toUpperCase()}
                    </div>
                    <span>{profile?.display_name || user.email?.split('@')[0]}</span>
                    <i className="fas fa-caret-down text-[10px] ml-1"></i>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
                    title="Settings"
                  >
                    <i className="fas fa-cog"></i>
                  </button>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="bg-white text-black px-4 py-1.5 rounded-full text-sm font-bold hover:scale-105 transition-transform"
                  >
                    Sign Up
                  </button>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="bg-transparent text-white px-4 py-1.5 rounded-full text-sm font-bold hover:text-emerald-400 transition-colors"
                  >
                    Log In
                  </button>
                </>
              )}
            </div>
          </div>

          {selectedPlaylistId === 'albums-view' ? (
            <AlbumsView
              albums={derivedAlbums}
              onAlbumSelect={setSelectedPlaylistId}
            />
          ) : (
            <MainView
              playlist={activePlaylist}
              currentSongId={currentSong?.id}
              onPlaySong={handlePlaySong}
              isPlaying={isPlaying}
              onUpdateSongCover={handleUpdateSongCover}
              likedSongIds={likedSongIds}
              onToggleLike={handleToggleLike}
              onTogglePublic={togglePublic}
              showPublicToggle={selectedPlaylistId === 'cloud'}
              onEditSong={handleEditSong}
              onDeleteSong={handleDeleteSong}
              currentUserId={user?.id}
              onAddToQueue={handleAddToQueue}
              onPlayNext={handlePlayNext}
            />
          )}
        </div>
      </div>

      <Player
        currentSong={currentSong}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onNext={handleNext}
        onPrev={handlePrev}
        onShuffleChange={handleShuffleChange}
        onRepeatChange={handleRepeatChange}
        onQueueToggle={() => setShowQueue(prev => !prev)}
        queueCount={queue.length}
        showQueue={showQueue}
        onSleepTimerEnd={handleSleepTimerEnd}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        currentName={profile?.display_name || ''}
        onSave={updateDisplayName}
      />

      <EditSongModal
        isOpen={!!editingSong}
        song={editingSong}
        onClose={() => setEditingSong(null)}
        onSave={handleSaveEditedSong}
      />

      {/* Queue Panel */}
      {showQueue && (
        <QueuePanel
          queue={queue}
          currentSong={currentSong}
          onPlaySong={handlePlaySong}
          onRemoveFromQueue={handleRemoveFromQueue}
          onClearQueue={handleClearQueue}
          onReorderQueue={handleReorderQueue}
          onClose={() => setShowQueue(false)}
        />
      )}

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        onUpdateSetting={updateSetting}
        onResetSettings={resetSettings}
      />

      <CreateAlbumModal
        isOpen={showCreateAlbumModal}
        onClose={() => setShowCreateAlbumModal(false)}
        onUploadAlbum={handleCreateAlbum}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
