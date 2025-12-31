
import React, { useRef, useState } from 'react';
import { Playlist, Song } from '../types';
import SongContextMenu from './SongContextMenu';

interface MainViewProps {
  playlist: Playlist;
  currentSongId: string | undefined;
  onPlaySong: (song: Song) => void;
  isPlaying: boolean;
  onUpdateSongCover?: (songId: string, newCoverUrl: string, albumName?: string) => void;
  likedSongIds: Set<string>;
  onToggleLike: (song: Song) => void;
  onTogglePublic?: (songId: string, isPublic: boolean) => void;
  showPublicToggle?: boolean;
  onEditSong?: (song: Song) => void;
  onDeleteSong?: (songId: string) => void;
  currentUserId?: string;
  onAddToQueue?: (song: Song) => void;
  onPlayNext?: (song: Song) => void;
}

const PlayingBars: React.FC = () => (
  <div className="flex items-end space-x-[2px] h-3 w-3">
    <div className="w-[3px] bg-[#1DB954] animate-[bounce_0.6s_infinite_alternate]" style={{ animationDelay: '0s' }}></div>
    <div className="w-[3px] bg-[#1DB954] animate-[bounce_0.8s_infinite_alternate]" style={{ animationDelay: '0.2s' }}></div>
    <div className="w-[3px] bg-[#1DB954] animate-[bounce_0.7s_infinite_alternate]" style={{ animationDelay: '0.1s' }}></div>
  </div>
);

const MainView: React.FC<MainViewProps> = ({
  playlist,
  currentSongId,
  onPlaySong,
  isPlaying,
  onUpdateSongCover,
  likedSongIds,
  onToggleLike,
  onTogglePublic,
  showPublicToggle = false,
  onEditSong,
  onDeleteSong,
  currentUserId,
  onAddToQueue,
  onPlayNext,
}) => {
  const headerGradient =
    playlist.id === 'liked' ? 'from-purple-900/80' :
      playlist.id === 'local' ? 'from-emerald-900/80' :
        playlist.id === 'cloud' ? 'from-teal-900/80' :
          playlist.id === 'recently-played' ? 'from-amber-900/80' :
            playlist.id === 'discover' ? 'from-pink-900/80' :
              playlist.id.startsWith('album-') ? 'from-indigo-900/80' :
                'from-zinc-800/80';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal states
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [pendingCoverUrl, setPendingCoverUrl] = useState<string | null>(null);
  const [pendingLikeSong, setPendingLikeSong] = useState<Song | null>(null);
  const [contextMenu, setContextMenu] = useState<{ song: Song; position: { x: number; y: number } } | null>(null);

  const handleArtClick = (e: React.MouseEvent, song: Song) => {
    e.stopPropagation();
    setEditingSong(song);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleArtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingSong) {
      const url = URL.createObjectURL(file);
      setPendingCoverUrl(url);
    } else {
      setEditingSong(null);
    }
  };

  const confirmUpdate = (applyToAll: boolean) => {
    if (editingSong && pendingCoverUrl && onUpdateSongCover) {
      onUpdateSongCover(
        editingSong.id,
        pendingCoverUrl,
        applyToAll ? editingSong.album : undefined
      );
    }
    setEditingSong(null);
    setPendingCoverUrl(null);
  };

  const cancelUpdate = () => {
    setEditingSong(null);
    setPendingCoverUrl(null);
  };

  const handleLikeClick = (e: React.MouseEvent, song: Song) => {
    e.stopPropagation();
    setPendingLikeSong(song);
  };

  const confirmToggleLike = () => {
    if (pendingLikeSong) onToggleLike(pendingLikeSong);
    setPendingLikeSong(null);
  };

  const cancelToggleLike = () => setPendingLikeSong(null);

  const handleContextMenu = (e: React.MouseEvent, song: Song) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ song, position: { x: e.clientX, y: e.clientY } });
  };

  return (
    <div className="flex-1 bg-gradient-to-b from-[#121212] to-black overflow-y-auto relative rounded-lg m-2 ml-0">
      {/* Context Menu */}
      {contextMenu && (
        <SongContextMenu
          song={contextMenu.song}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onEdit={onEditSong}
          onDelete={onDeleteSong}
          onToggleLike={onToggleLike}
          isLiked={likedSongIds.has(contextMenu.song.id)}
          isOwner={contextMenu.song.user_id === currentUserId}
        />
      )}
      <style>
        {`
          @keyframes bounce {
            from { height: 20%; }
            to { height: 100%; }
          }
        `}
      </style>
      <input
        type="file"
        className="hidden"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleArtChange}
      />

      {/* Album Art Confirmation Modal */}
      {pendingCoverUrl && editingSong && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#282828] w-full max-w-md rounded-xl p-8 shadow-2xl animate-[fade-in_0.2s,zoom-in_0.2s] border border-white/10">
            <h3 className="text-2xl font-extrabold mb-2">Update Artwork</h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              We've uploaded your new image. How should we apply it?
            </p>

            <div className="flex items-center space-x-6 mb-8 bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="relative w-24 h-24 shadow-2xl">
                <img src={pendingCoverUrl} className="w-full h-full rounded shadow object-cover" />
                <div className="absolute -top-2 -right-2 bg-[#1DB954] text-black w-6 h-6 rounded-full flex items-center justify-center text-[10px] shadow-lg">
                  <i className="fas fa-check"></i>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-white font-bold truncate text-lg">{editingSong.album}</p>
                <p className="text-[#1DB954] text-sm font-semibold truncate">{editingSong.artist}</p>
                <p className="text-gray-500 text-xs mt-1">Current song: {editingSong.title}</p>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={() => confirmUpdate(true)}
                className="w-full bg-[#1DB954] text-black font-bold py-3.5 rounded-full hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
              >
                Apply to Entire Album
              </button>
              <button
                onClick={() => confirmUpdate(false)}
                className="w-full bg-white/10 text-white font-bold py-3.5 rounded-full hover:bg-white/20 active:scale-95 transition-all"
              >
                Just This Song
              </button>
              <button
                onClick={cancelUpdate}
                className="w-full text-gray-500 font-bold py-2 hover:text-white transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Like Confirmation Modal */}
      {pendingLikeSong && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#282828] w-full max-w-sm rounded-xl p-8 shadow-2xl animate-[fade-in_0.2s,zoom-in_0.2s] border border-white/10 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${likedSongIds.has(pendingLikeSong.id) ? 'bg-red-500/10 text-red-500' : 'bg-[#1DB954]/10 text-[#1DB954]'}`}>
              <i className={`${likedSongIds.has(pendingLikeSong.id) ? 'fas' : 'far'} fa-heart text-2xl`}></i>
            </div>
            <h3 className="text-xl font-bold mb-2">
              {likedSongIds.has(pendingLikeSong.id) ? 'Remove from Liked?' : 'Add to Liked Songs?'}
            </h3>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              {likedSongIds.has(pendingLikeSong.id)
                ? `Take "${pendingLikeSong.title}" out of your library?`
                : `Save "${pendingLikeSong.title}" by ${pendingLikeSong.artist} to your collection?`}
            </p>
            <div className="flex flex-col space-y-3">
              <button
                onClick={confirmToggleLike}
                className="w-full bg-white text-black font-bold py-3 rounded-full hover:scale-[1.02] active:scale-95 transition-all"
              >
                Confirm
              </button>
              <button
                onClick={cancelToggleLike}
                className="w-full bg-white/5 text-gray-300 font-bold py-3 rounded-full hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`p-8 flex items-end space-x-6 pb-10 bg-gradient-to-b ${headerGradient} to-[#121212]`}>
        <img
          src={playlist.coverUrl}
          alt={playlist.name}
          className="w-52 h-52 shadow-2xl rounded-sm object-cover"
        />
        <div className="flex flex-col space-y-4">
          <span className="text-xs font-bold uppercase">{playlist.id.startsWith('album-') ? 'Album' : 'Playlist'}</span>
          <h1 className="text-7xl font-extrabold tracking-tighter">{playlist.name}</h1>
          <p className="text-sm text-gray-300 font-medium">{playlist.description}</p>
          <div className="flex items-center space-x-2 text-sm font-semibold">
            <span className="text-white">Zenith User</span>
            <span className="text-gray-400">• {playlist.songs.length} {playlist.songs.length === 1 ? 'song' : 'songs'}</span>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="px-8 py-6 flex items-center space-x-8">
        <button
          onClick={() => playlist.songs.length > 0 && onPlaySong(playlist.songs[0])}
          disabled={playlist.songs.length === 0}
          className="w-14 h-14 bg-[#1DB954] rounded-full flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50"
        >
          <i className={`fas ${isPlaying && playlist.songs.some(s => s.id === currentSongId) ? 'fa-pause' : 'fa-play'} text-xl ml-1`}></i>
        </button>
        <button className="text-3xl text-gray-400 hover:text-white transition-colors">
          <i className="far fa-heart"></i>
        </button>
        <button className="text-3xl text-gray-400 hover:text-white transition-colors">
          <i className="fas fa-ellipsis-h"></i>
        </button>
      </div>

      {/* Songs Table */}
      <div className="px-8 pb-10">
        {playlist.songs.length > 0 ? (
          <table className="w-full text-left text-gray-400 text-sm border-separate border-spacing-y-1">
            <thead>
              <tr className="border-b border-gray-800 text-[11px] uppercase tracking-widest font-bold">
                <th className="pb-3 w-10 text-center">#</th>
                <th className="pb-3">Title</th>
                <th className="pb-3 hidden md:table-cell text-xs">Album</th>
                <th className="pb-3 w-10 text-center"></th>
                {showPublicToggle && <th className="pb-3 w-16 text-center">Public</th>}
                <th className="pb-3 w-12 text-center"><i className="far fa-clock text-xs"></i></th>
              </tr>
            </thead>
            <tbody>
              <tr className="h-4"></tr>
              {playlist.songs.map((song, index) => {
                const isActive = song.id === currentSongId;
                const isLiked = likedSongIds.has(song.id);
                return (
                  <tr
                    key={song.id}
                    onClick={() => onPlaySong(song)}
                    onContextMenu={(e) => handleContextMenu(e, song)}
                    className="group hover:bg-white/10 transition-colors cursor-pointer rounded-md overflow-hidden"
                  >
                    <td className={`p-3 text-center rounded-l-md w-10 ${isActive ? 'text-[#1DB954]' : ''}`}>
                      <div className="flex items-center justify-center">
                        {isActive && isPlaying ? (
                          <PlayingBars />
                        ) : (
                          <>
                            <span className="group-hover:hidden text-xs">{index + 1}</span>
                            <i className={`fas fa-play hidden group-hover:inline text-[10px] ${isActive ? 'text-[#1DB954]' : 'text-white'}`}></i>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-4">
                        <div className="relative w-10 h-10 group/art">
                          <img src={song.coverUrl} className="w-10 h-10 rounded shadow object-cover" />
                          <div
                            onClick={(e) => handleArtClick(e, song)}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover/art:opacity-100 flex items-center justify-center transition-opacity"
                          >
                            <i className="fas fa-camera text-xs text-white"></i>
                          </div>
                        </div>
                        <div className="overflow-hidden">
                          <p className={`font-semibold truncate ${isActive ? 'text-[#1DB954]' : 'text-white'}`}>{song.title}</p>
                          <p className="text-xs group-hover:text-white truncate">{song.artist}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell group-hover:text-white text-xs">
                      {song.album}
                    </td>
                    <td className="p-3 text-center w-10">
                      <button
                        onClick={(e) => handleLikeClick(e, song)}
                        className={`transition-all ${isLiked ? 'text-[#1DB954]' : 'text-gray-400 opacity-0 group-hover:opacity-100 hover:text-white'}`}
                      >
                        <i className={`${isLiked ? 'fas' : 'far'} fa-heart text-xs`}></i>
                      </button>
                    </td>
                    {showPublicToggle && (
                      <td className="p-3 text-center w-16">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePublic?.(song.id, !song.isPublic);
                          }}
                          className={`transition-all px-2 py-1 rounded-full text-[10px] font-bold ${song.isPublic
                            ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                            : 'bg-gray-700/50 text-gray-500 hover:bg-gray-600/50 hover:text-gray-300'
                            }`}
                          title={song.isPublic ? 'Click to make private' : 'Click to make public'}
                        >
                          {song.isPublic ? (
                            <><i className="fas fa-globe mr-1"></i>Public</>
                          ) : (
                            <><i className="fas fa-lock mr-1"></i>Private</>
                          )}
                        </button>
                      </td>
                    )}
                    <td className="p-3 rounded-r-md text-xs group-hover:text-white text-center w-12">
                      {song.duration > 0 ? `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}` : '--:--'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center mb-2 shadow-xl">
              <i className={`fas ${playlist.id === 'cloud' ? 'fa-cloud-upload-alt' :
                playlist.id === 'liked' ? 'fa-heart' :
                  playlist.id === 'recently-played' ? 'fa-history' :
                    playlist.id === 'discover' ? 'fa-globe' :
                      playlist.id === 'local' ? 'fa-folder-open' :
                        playlist.id.startsWith('album-') ? 'fa-compact-disc' :
                          'fa-music'
                } text-4xl text-gray-500`}></i>
            </div>
            <h2 className="text-2xl font-bold">
              {playlist.id === 'cloud' ? 'No uploaded songs yet' :
                playlist.id === 'liked' ? 'No liked songs yet' :
                  playlist.id === 'recently-played' ? 'No recently played songs' :
                    playlist.id === 'discover' ? 'Nothing to discover yet' :
                      playlist.id === 'local' ? 'No local files imported' :
                        playlist.id.startsWith('album-') ? 'Album is empty' :
                          'No songs here yet'}
            </h2>
            <p className="text-gray-400 max-w-md">
              {playlist.id === 'cloud'
                ? 'Upload your music to the cloud and access it anywhere. Click "Upload Music" in the sidebar to get started.'
                : playlist.id === 'liked'
                  ? 'Click the heart icon on any song to save it to your collection.'
                  : playlist.id === 'recently-played'
                    ? 'Songs you play will appear here for quick access.'
                    : playlist.id === 'discover'
                      ? 'Public songs from other users will appear here. Be the first to share!'
                      : playlist.id === 'local'
                        ? 'Click the plus icon in your library to add audio files from your device.'
                        : playlist.id.startsWith('album-')
                          ? 'This album has no tracks yet.'
                          : 'Start adding songs to build your collection.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainView;
