
import React, { useState, useRef } from 'react';
import { PLAYLISTS } from '../constants';
import { GoogleGenAI, Type } from "@google/genai";
import { Song, Playlist } from '../types';

interface SidebarProps {
  onPlaylistSelect: (id: string) => void;
  selectedPlaylistId: string;
  onAddSongToLibrary: (song: Song) => void;
  onImportLocalSongs: (songs: Song[]) => void;
  onUploadToCloud?: (file: File) => void;
  customPlaylists: Playlist[];
  isLoggedIn?: boolean;
  uploading?: boolean;
  onCreateAlbum?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  onPlaylistSelect,
  selectedPlaylistId,
  onAddSongToLibrary,
  onImportLocalSongs,
  onUploadToCloud,
  customPlaylists,
  isLoggedIn = false,
  uploading = false,
  onCreateAlbum
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cloudUploadRef = useRef<HTMLInputElement>(null);

  const handleCloudUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadToCloud) {
      onUploadToCloud(file);
    }
    e.target.value = '';
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Search for music tracks related to "${searchQuery}". Provide 3 real-world popular songs.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                artist: { type: Type.STRING },
                album: { type: Type.STRING },
                duration: { type: Type.INTEGER }
              },
              required: ['title', 'artist', 'album', 'duration']
            }
          }
        }
      });

      const jsonStr = response.text?.trim() || '[]';
      const songsData = JSON.parse(jsonStr);

      if (songsData.length === 0) {
        setSearchError("No songs found. Try a different search term.");
        setSearchResults([]);
      } else {
        const mappedSongs: Song[] = songsData.map((s: any, idx: number) => ({
          id: `search-${Date.now()}-${idx}`,
          ...s,
          coverUrl: `https://picsum.photos/seed/${s.title.replace(/\s/g, '')}/300/300`,
          audioUrl: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${(idx % 8) + 1}.mp3`
        }));
        setSearchResults(mappedSongs);
      }
    } catch (error) {
      console.error("Search failed", error);
      setSearchError("Unable to search right now. Please check your connection or try again later.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newSongs: Song[] = Array.from(files).map((file: File, idx: number) => ({
      id: `local-${Date.now()}-${idx}`,
      title: file.name.replace(/\.[^/.]+$/, ""),
      artist: "Local Artist",
      album: "Local Files",
      duration: 0,
      coverUrl: `https://picsum.photos/seed/local-${idx}/300/300`,
      audioUrl: URL.createObjectURL(file),
      isLocal: true
    }));

    onImportLocalSongs(newSongs);
  };

  const clearSearch = () => {
    setSearchResults([]);
    setSearchError(null);
    setSearchQuery('');
  };

  return (
    <div className="w-64 bg-black flex flex-col h-full p-2 space-y-2">
      <input
        type="file"
        multiple
        accept="audio/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <input
        type="file"
        accept="audio/*"
        className="hidden"
        ref={cloudUploadRef}
        onChange={handleCloudUpload}
      />

      {/* Navigation Top */}
      <div className="bg-[#121212] rounded-lg p-3 space-y-1">
        <div
          onClick={() => onPlaylistSelect(PLAYLISTS[0].id)}
          className={`flex items-center space-x-4 p-3 rounded-md cursor-pointer transition-colors font-bold ${selectedPlaylistId === PLAYLISTS[0].id ? 'text-white' : 'text-gray-400 hover:text-white'}`}
        >
          <i className="fas fa-home text-xl"></i>
          <span>Home</span>
        </div>

        <div
          onClick={() => onPlaylistSelect('albums-view')}
          className={`flex items-center space-x-4 p-3 rounded-md cursor-pointer transition-colors font-bold ${selectedPlaylistId === 'albums-view' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
        >
          <i className="fas fa-compact-disc text-xl"></i>
          <span>Albums</span>
        </div>

        <form onSubmit={handleSearch} className="relative mt-2 px-1">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
          <input
            type="text"
            placeholder="Search songs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#242424] text-white text-sm pl-10 pr-4 py-2 rounded-full focus:outline-none focus:ring-1 focus:ring-white transition-all placeholder:text-gray-500"
          />
          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <i className="fas fa-spinner fa-spin text-gray-400 text-xs"></i>
            </div>
          )}
        </form>
      </div>

      {/* Library Section */}
      <div className="bg-[#121212] rounded-lg flex-1 overflow-hidden flex flex-col">
        <div className="p-4 flex items-center justify-between text-gray-400">
          <div className="flex items-center space-x-2 hover:text-white cursor-pointer transition-colors font-bold">
            <i className="fas fa-book text-xl"></i>
            <span>Your Library</span>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="hover:text-white hover:bg-gray-800 p-2 rounded-full transition-all"
            title="Import Local Songs"
          >
            <i className="fas fa-plus"></i>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="px-2 space-y-1 mb-2">
          <button
            onClick={() => onPlaylistSelect('liked')}
            className={`w-full flex items-center p-2 space-x-3 rounded-md transition-all text-left ${selectedPlaylistId === 'liked' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'}`}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-700 to-blue-300 rounded flex items-center justify-center">
              <i className="fas fa-heart text-white"></i>
            </div>
            <span className="font-semibold text-sm">Liked Songs</span>
          </button>
          <button
            onClick={() => onPlaylistSelect('recently-played')}
            className={`w-full flex items-center p-2 space-x-3 rounded-md transition-all text-left ${selectedPlaylistId === 'recently-played' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'}`}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-orange-400 rounded flex items-center justify-center">
              <i className="fas fa-history text-white"></i>
            </div>
            <span className="font-semibold text-sm">Recently Played</span>
          </button>
          <button
            onClick={() => onPlaylistSelect('local')}
            className={`w-full flex items-center p-2 space-x-3 rounded-md transition-all text-left ${selectedPlaylistId === 'local' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'}`}
          >
            <div className="w-12 h-12 bg-[#056952] rounded flex items-center justify-center">
              <i className="fas fa-folder text-white"></i>
            </div>
            <span className="font-semibold text-sm">Local Files</span>
          </button>
          <button
            onClick={() => onPlaylistSelect('discover')}
            className={`w-full flex items-center p-2 space-x-3 rounded-md transition-all text-left ${selectedPlaylistId === 'discover' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'}`}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-500 rounded flex items-center justify-center">
              <i className="fas fa-globe text-white"></i>
            </div>
            <span className="font-semibold text-sm">Discover</span>
          </button>
          {isLoggedIn && (
            <>
              <button
                onClick={() => onPlaylistSelect('cloud')}
                className={`w-full flex items-center p-2 space-x-3 rounded-md transition-all text-left ${selectedPlaylistId === 'cloud' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'}`}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-400 rounded flex items-center justify-center">
                  <i className="fas fa-cloud text-white"></i>
                </div>
                <span className="font-semibold text-sm">My Uploads</span>
              </button>
              <button
                onClick={() => cloudUploadRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center p-2 space-x-3 rounded-md transition-all text-left text-gray-400 hover:bg-[#1a1a1a] hover:text-white disabled:opacity-50"
              >
                <div className="w-12 h-12 bg-zinc-700 rounded flex items-center justify-center">
                  {uploading ? (
                    <i className="fas fa-spinner fa-spin text-white"></i>
                  ) : (
                    <i className="fas fa-cloud-upload-alt text-white"></i>
                  )}
                </div>
                <span className="font-semibold text-sm">{uploading ? 'Uploading...' : 'Upload Music'}</span>
              </button>
              <button
                onClick={onCreateAlbum}
                className="w-full flex items-center p-2 space-x-3 rounded-md transition-all text-left text-gray-400 hover:bg-[#1a1a1a] hover:text-white"
              >
                <div className="w-12 h-12 bg-zinc-700 rounded flex items-center justify-center">
                  <i className="fas fa-compact-disc text-white"></i>
                </div>
                <span className="font-semibold text-sm">Create Album</span>
              </button>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 border-t border-gray-800/50 pt-2">
          {searchError && (
            <div className="px-2 py-3 mb-2 bg-red-900/10 border border-red-500/20 rounded-md flex items-start space-x-2 text-red-400/80 animate-in fade-in slide-in-from-top-1">
              <i className="fas fa-exclamation-circle mt-0.5 text-xs"></i>
              <div className="flex-1">
                <p className="text-[11px] font-medium leading-tight">{searchError}</p>
                <button
                  onClick={() => setSearchError(null)}
                  className="text-[10px] mt-1 hover:underline text-gray-500"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {searchResults.length > 0 ? (
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-gray-500 px-2 mb-1">Search Results</p>
              {searchResults.map((song) => (
                <button
                  key={song.id}
                  onClick={() => onAddSongToLibrary(song)}
                  className="w-full flex items-center p-2 space-x-3 rounded-md transition-all text-left text-gray-400 hover:bg-[#1a1a1a] hover:text-white group"
                >
                  <img src={song.coverUrl} className="w-10 h-10 rounded shadow object-cover" />
                  <div className="flex-1 overflow-hidden">
                    <p className="font-semibold truncate text-sm">{song.title}</p>
                    <p className="text-xs truncate">{song.artist}</p>
                  </div>
                  <i className="fas fa-play text-xs opacity-0 group-hover:opacity-100 transition-opacity"></i>
                </button>
              ))}
              <button
                onClick={clearSearch}
                className="w-full text-center text-xs text-gray-500 hover:text-white py-2 transition-colors"
              >
                Clear Search
              </button>
            </div>
          ) : (
            customPlaylists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => onPlaylistSelect(playlist.id)}
                className={`w-full flex items-center p-2 space-x-3 rounded-md transition-all text-left ${selectedPlaylistId === playlist.id
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
                  }`}
              >
                <img
                  src={playlist.coverUrl}
                  alt={playlist.name}
                  className="w-12 h-12 rounded shadow-lg object-cover"
                />
                <div className="flex-1 overflow-hidden">
                  <p className="font-semibold truncate text-sm">{playlist.name}</p>
                  <p className="text-xs truncate">Playlist • {playlist.songs.length} songs</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
