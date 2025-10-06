"use client";
import Image from 'next/image';
import Link from 'next/link';

interface UserShowcaseProps {
  username: string;
  topFourShows: Array<{
    id: number;
    name: string;
    posterPath: string | null;
  }>;
  isOwnProfile: boolean;
}

export default function UserShowcase({ username, topFourShows, isOwnProfile }: UserShowcaseProps) {
  if (topFourShows.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 px-4 md:px-0">
      {/* Header - matching Activity Feed style */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-green-500">
          {isOwnProfile ? 'Your Showcase' : `${username}'s Showcase`}
        </h2>
      </div>
      <div className="border-b border-gray-600 mb-4"></div>

      {/* Content */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {topFourShows.map((show, index) => (
          <Link
            key={show.id}
            href={`/show/${show.id}`}
            className="group relative"
            title={show.name}
          >
            <div className="relative aspect-[2/3] max-w-[300px] max-h-[450px] rounded-lg overflow-hidden bg-gray-700 border border-gray-600 group-hover:border-gray-500 transition-colors">
              <Image
                src={show.posterPath ? `https://image.tmdb.org/t/p/w500${show.posterPath}` : '/noPoster.jpg'}
                alt={show.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* Position number overlay */}
              <div className="absolute top-2 left-2 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{index + 1}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
