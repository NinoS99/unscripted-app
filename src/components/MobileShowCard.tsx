// Updated MobileShowCard.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FaCheck, FaTimes } from 'react-icons/fa'

type ShowCardBase = {
    id: string | number;  // Accept both string and number IDs
    name: string;
    posterPath: string | null;
    tagline: string | null;
    overview: string | null;
    isRunning: boolean;
    tmdbRating: number | null;
  };
  
  type TagType = {
    id: string;
    name: string;
  };
  
  type NetworkType = {
    id: string;
    name: string;
    logoPath: string | null;
  };
  
  export type MobileShowCardProps = ShowCardBase & {
    tags: TagType[];
    networks: NetworkType[];
  };

  export default function MobileShowCard({ show }: { show: MobileShowCardProps }) {
    const [isFlipped, setIsFlipped] = useState(false);
  
    return (
      <div 
        className={`flip-card h-full ${isFlipped ? 'flipped' : ''}`}
        onClick={() => setIsFlipped(!isFlipped)}
        style={{ minHeight: '300px' }}
      >
        <div className="flip-card-inner">
          {/* Front of the card */}
          <div className="flip-card-front">
            <div className="bg-gray-300 rounded-xl shadow overflow-hidden h-full flex flex-col">
              <div className="aspect-[2/3] relative">
                <Image
                  src={show.posterPath ? `https://image.tmdb.org/t/p/w500${show.posterPath}` : "/noPoster.jpg"}
                  alt={show.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority={false}
                />
              </div>
              <div className="p-4 text-sm font-medium text-black min-h-[40px] flex items-center justify-center bg-gray-300">
                <span className="line-clamp-2 text-xs sm:text-sm text-center justify-center ,-2">{show.name}</span>
              </div>
            </div>
          </div>
  
          {/* Back of the card */}
          <div className="flip-card-back bg-green-600 bg-opacity-90 text-white rounded-xl p-3 overflow-y-auto">
            <div className="h-full flex flex-col">
              <h3 className="font-bold text-lg mb-2">{show.name}</h3>
  
              <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar mb-2">
                {show.tagline && (
                  <p className="border-l-2 border-green-300 pl-2 italic text-sm mb-3">
                    {show.tagline}
                  </p>
                )}
  
                {show.overview && (
                  <p className="border-l-2 border-green-300 pl-2 text-xs mb-3">
                    {show.overview}
                  </p>
                )}
  
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-bold">On Air:</span>
                  {show.isRunning ? (
                    <span className="flex items-center text-green-400 text-sm">
                      <FaCheck className="mr-1" />
                    </span>
                  ) : (
                    <span className="flex items-center text-red-400 text-sm">
                      <FaTimes className="mr-1" />
                    </span>
                  )}
                </div>
  
                {show.tmdbRating && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-bold">Rating:</span>
                    <span className="text-sm">
                      {show.tmdbRating.toFixed(1)}/10
                    </span>
                  </div>
                )}
  
                {show.networks.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-sm font-bold mb-2">Watch on:</h4>
                    <div className="flex flex-wrap gap-2">
                      {show.networks.map((network) => (
                        <div key={network.id} className="flex items-center gap-2 bg-green-700 px-2 py-1 rounded">
                          {network.logoPath ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w92${network.logoPath}`}
                              alt={network.name}
                              width={24}
                              height={24}
                              className="object-contain"
                            />
                          ) : (
                            <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                              <span className="text-xs">TV</span>
                            </div>
                          )}
                          <span className="text-xs">{network.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
  
                {show.tags.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-bold mb-2">Tags:</h4>
                    <div className="flex flex-wrap gap-2">
                      {show.tags.slice(0, 5).map((tag) => (
                        <span
                          key={tag.id}
                          className="px-2 py-1 bg-green-700 rounded-full text-xs"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
  
              <Link
                href={`/shows/${show.id}`}
                className="mt-auto py-2 px-4 bg-white text-green-600 font-bold rounded-lg text-center hover:bg-gray-100 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Discover More
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }