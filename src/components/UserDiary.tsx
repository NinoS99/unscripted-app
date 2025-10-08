"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiCalendar } from 'react-icons/fi';

interface WatchedEntry {
  id: number;
  type: 'show' | 'season';
  name: string;
  posterPath: string | null;
  showId: number;
  seasonNumber?: number;
  createdAt: Date;
  isNested?: boolean;
}

interface UserDiaryProps {
  username: string;
  accountCreatedAt: Date;
}

export default function UserDiary({ username, accountCreatedAt }: UserDiaryProps) {
  const [timeline, setTimeline] = useState<Record<string, WatchedEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${username}/watched-timeline?year=${selectedYear}`);
        
        if (response.ok) {
          const data = await response.json();
          setTimeline(data.timeline);
        } else {
          console.error('Failed to fetch watched timeline');
          setTimeline({});
        }
      } catch (error) {
        console.error('Error fetching watched timeline:', error);
        setTimeline({});
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, [username, selectedYear]);

  const currentYear = new Date().getFullYear();
  const accountCreatedYear = new Date(accountCreatedAt).getFullYear();
  const years = Array.from({ length: currentYear - accountCreatedYear + 1 }, (_, i) => currentYear - i);

  const getEntityLink = (entry: WatchedEntry) => {
    if (entry.type === 'season') {
      return `/show/${entry.showId}/season/${entry.seasonNumber}`;
    }
    return `/show/${entry.showId}`;
  };

  const timelineDates = Object.keys(timeline);

  return (
    <div className="hidden lg:flex lg:flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0 h-9">
        <h3 className="text-base font-semibold text-green-500 flex items-center gap-2">
          <FiCalendar className="w-4 h-4" />
          Watch Diary
        </h3>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-400">Year:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            disabled={loading}
            className="bg-gray-700 text-white text-xs rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-green-400 disabled:opacity-50"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="border-b border-gray-600 mb-3 flex-shrink-0"></div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto pr-2 min-h-0">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-700 mt-1" />
                <div className="flex-1">
                  <div className="h-3 bg-gray-700 rounded w-20 mb-2" />
                  <div className="h-4 bg-gray-700 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : timelineDates.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-400 text-xs">No watched content this year</p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-1 top-1 bottom-1 w-px bg-gray-600" />

            {/* Timeline entries */}
            <div className="space-y-4">
              {timelineDates.map((date) => (
                <div key={date} className="relative pl-5">
                  {/* Date dot */}
                  <div className="absolute left-0 top-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-gray-800" />
                  
                  {/* Date label */}
                  <div className="text-xs font-medium text-gray-400 mb-1.5">
                    {date}
                  </div>

                  {/* Watched entries for this date */}
                  <div className="space-y-1">
                    {timeline[date].map((entry) => (
                      <Link
                        key={entry.id}
                        href={getEntityLink(entry)}
                        className={`block px-2 py-1.5 bg-gray-700/30 rounded hover:bg-gray-700/50 transition-colors group ${
                          entry.isNested ? 'ml-4' : ''
                        }`}
                      >
                        <p className="text-xs text-white group-hover:text-green-400 transition-colors line-clamp-2 leading-snug flex items-start gap-1">
                          {entry.isNested && <span className="text-green-500 text-sm font-bold flex-shrink-0">└─</span>}
                          <span className="flex-1">
                            {entry.type === 'show' && !entry.isNested && 'Finished '}
                            {entry.name}
                          </span>
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

