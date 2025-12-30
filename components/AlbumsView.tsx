
import React from 'react';
import { Playlist } from '../types';

interface AlbumsViewProps {
  albums: Playlist[];
  onAlbumSelect: (albumId: string) => void;
}

const AlbumsView: React.FC<AlbumsViewProps> = ({ albums, onAlbumSelect }) => {
  return (
    <div className="flex-1 bg-gradient-to-b from-[#1a1a1a] to-black overflow-y-auto relative rounded-lg m-2 ml-0 p-8 pt-20">
      <div className="flex flex-col space-y-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Albums</h1>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
          {albums.map((album) => (
            <div 
              key={album.id}
              onClick={() => onAlbumSelect(album.id)}
              className="bg-[#181818] p-4 rounded-lg hover:bg-[#282828] transition-all duration-300 group cursor-pointer shadow-lg"
            >
              <div className="relative aspect-square mb-4 shadow-2xl">
                <img 
                  src={album.coverUrl} 
                  alt={album.name} 
                  className="w-full h-full object-cover rounded-md"
                />
                <button className="absolute bottom-2 right-2 w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center text-black opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-xl hover:scale-105">
                  <i className="fas fa-play ml-1"></i>
                </button>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold truncate text-white">{album.name}</h3>
                <p className="text-sm text-gray-400 truncate">
                  {album.songs[0]?.artist || 'Unknown Artist'}
                </p>
              </div>
            </div>
          ))}
        </div>

        {albums.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center">
              <i className="fas fa-compact-disc text-4xl text-gray-600"></i>
            </div>
            <h2 className="text-xl font-bold">No albums found</h2>
            <p className="text-gray-400">Try importing some local files or adding songs to your library.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlbumsView;
