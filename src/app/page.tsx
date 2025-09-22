import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";
import Image from "next/image";
import Link from "next/link";
import { FiPlay } from "react-icons/fi";
import { FaCheck, FaTimes } from "react-icons/fa";
import { Network } from "@prisma/client";
import MobileShowCard from "@/components/MobileShowCard";

// Helper function to deduplicate networks
const getUniqueNetworks = (
    showsOnNetworks: { network: Network }[]
): Network[] => {
    const networkMap = new Map<string, Network>();

    showsOnNetworks.forEach(({ network }) => {
        if (!networkMap.has(network.name)) {
            networkMap.set(network.name, network);
        } else {
            const existing = networkMap.get(network.name)!;
            if (!existing.logoPath && network.logoPath) {
                networkMap.set(network.name, network);
            }
        }
    });

    return Array.from(networkMap.values());
};

// Helper function to calculate optimal number of shows to display for complete rows
const getOptimalShowCount = (totalShows: number, maxShows: number = 20): number => {
    // Grid breakpoints and their column counts (matching responsive-grid CSS)
    const columnCounts = [2, 3, 4, 5, 6]; // mobile, sm, md, lg, xl+
    
    // Find the LCM (Least Common Multiple) of all column configurations
    // This ensures the number works for all breakpoints
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const lcm = columnCounts.reduce((acc, curr) => (acc * curr) / gcd(acc, curr));
    
    // Find the largest multiple of LCM that doesn't exceed our limits
    const availableShows = Math.min(totalShows, maxShows);
    const optimalCount = Math.floor(availableShows / lcm) * lcm;
    
    // If LCM is too large, try smaller common multiples
    if (optimalCount === 0) {
        // Try multiples of 12 (works for 2,3,4,6), then 10 (works for 2,5), then 6 (works for 2,3,6)
        const fallbacks = [12, 10, 6, 4, 2];
        for (const fallback of fallbacks) {
            const count = Math.floor(availableShows / fallback) * fallback;
            if (count > 0) return count;
        }
        return Math.min(availableShows, 2); // Minimum fallback
    }
    
    return optimalCount;
};

export default async function Home() {
  const { userId } = await auth();

  let username: string | null = null;

  if (userId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    username = dbUser?.username ?? null;
  }

  // Fetch specific shows for banner
  const topRatedShows = await prisma.show.findMany({
    where: { 
      id: { in: [29, 179, 160, 435, 133, 433, 303, 479, 45, 451] }, // Replace with your desired show IDs
    },
    orderBy: { id: 'asc' },
  });


  // Fetch shows currently on air
  const allShowsOnAir = await prisma.show.findMany({
    where: { isRunning: true },
    take: 20,
    include: {
      _count: {
        select: {
          showReviews: true,
        },
      },
      ShowsOnNetworks: {
        include: {
          network: true,
        },
      },
    },
    orderBy: { firstAirDate: 'desc' },
  });

  // Calculate optimal number of shows for complete rows across all breakpoints
  const optimalShowCount = getOptimalShowCount(allShowsOnAir.length, 20);
  const showsOnAir = allShowsOnAir.slice(0, optimalShowCount);


  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Banner with Moving Show Posters */}
      <div className="relative h-96 md:h-[32rem] w-full bg-gray-900">
        {/* Properly containerized hero content */}
        <div className="container mx-auto px-4 h-full relative overflow-hidden">
          {/* Background gradient within container */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-900/80 via-gray-900/80 to-green-900/80 z-10"></div>
          
          {/* Moving Banner within container */}
          <div className="absolute inset-0 flex items-center">
            <div className="animate-scroll h-full">
              {/* First set of posters */}
              {topRatedShows.map((show) => (
                <div key={`first-${show.id}`} className="w-48 md:w-64 h-full mx-2 flex-shrink-0">
                  <Image
                    src={show.posterPath ? `https://image.tmdb.org/t/p/w500${show.posterPath}` : "/noPoster.jpg"}
                    alt={show.name}
                    width={256}
                    height={384}
                    className="w-full h-full object-cover rounded-lg shadow-lg"
                  />
                </div>
              ))}
              {/* Duplicate set for seamless loop */}
              {topRatedShows.map((show) => (
                <div key={`second-${show.id}`} className="w-48 md:w-64 h-full mx-2 flex-shrink-0">
                  <Image
                    src={show.posterPath ? `https://image.tmdb.org/t/p/w500${show.posterPath}` : "/noPoster.jpg"}
                    alt={show.name}
                    width={256}
                    height={384}
                    className="w-full h-full object-cover rounded-lg shadow-lg"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Hero Content */}
          <div className="relative z-20 flex items-center h-full text-center">
            <div className="w-full py-8">
              <h1 className="text-4xl md:text-6xl font-bold text-green-300 mb-4">
                {username ? `Welcome back, ${username}!` : "Welcome to unscripted"}
              </h1>
              <p className="text-xl md:text-2xl text-green-200 mb-8 max-w-2xl mx-auto">
                {username
                  ? "unscripted is your ultimate destination for Reality TV discussions, insights, and drama!"
                  : "Sign up or sign in to join the conversation about your favorite Reality TV shows"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Currently On Air */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FiPlay className="text-2xl text-green-500" />
              <h2 className="text-2xl font-bold text-green-500">On Air / Upcoming Episodes</h2>
            </div>
          </div>
          <div className="border-b border-gray-600 mb-6"></div>
          
          <div className="responsive-grid w-full">
            {showsOnAir.map((show) => (
              <div key={show.id} className="group relative h-full">
                {/* Desktop version */}
                <Link
                  href={`/show/${show.id}`}
                  className="hidden md:block h-full"
                >
                  <div className="bg-gray-300 rounded-xl shadow hover:shadow-lg transition overflow-hidden h-full flex flex-col w-full">
                    {/* Image with consistent aspect ratio */}
                    <div className="aspect-[2/3] relative">
                      <Image
                        src={
                          show.posterPath
                            ? `https://image.tmdb.org/t/p/w500${show.posterPath}`
                            : "/noPoster.jpg"
                        }
                        alt={show.name}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                        className="object-cover"
                        priority={false}
                      />
                      {/* Show name overlaid at bottom */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <span className="text-sm font-bold text-white line-clamp-2">
                          {show.name}
                        </span>
                      </div>
                    </div>

                    {/* Desktop hover overlay */}
                    <div className="absolute inset-0 bg-green-600 bg-opacity-80 opacity-0 group-hover:opacity-97 transition-opacity duration-200 p-3 text-white overflow-y-auto rounded-xl">
                      <h3 className="font-bold text-lg mb-2">
                        {show.name}
                      </h3>

                      {show.tagline && (
                        <div className="max-h-[100px] overflow-y-auto pr-2 custom-scrollbar mb-5">
                          <p className="border-l-2 border-green-300 pl-2 italic text-m">
                            {show.tagline}
                          </p>
                        </div>
                      )}

                      {!show.tagline && show.overview && (
                        <div className="max-h-[100px] overflow-y-auto pr-2 custom-scrollbar mb-5">
                          <p className="border-l-2 border-green-300 pl-2 text-sm">
                            {show.overview}
                          </p>
                        </div>
                      )}

                      {show.tagline && show.overview && (
                        <div className="max-h-[100px] overflow-y-auto pr-2 custom-scrollbar mb-5">
                          <p className="border-l-2 border-green-300 pl-2 text-sm">
                            {show.overview}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-md font-bold">
                          On air:
                        </span>
                        {show.isRunning ? (
                          <FaCheck className="text-green-400" />
                        ) : (
                          <FaTimes className="text-red-400" />
                        )}
                      </div>

                      {show.ShowsOnNetworks?.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-md font-bold mb-1.5">
                            Watch On:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {getUniqueNetworks(
                              show.ShowsOnNetworks
                            ).map((network) => {
                              return (
                                <div
                                  key={network.id}
                                  className="flex items-center gap-2 bg-green-700 px-2 py-1 rounded"
                                >
                                  {network.logoPath ? (
                                    <Image
                                      src={`https://image.tmdb.org/t/p/w92${network.logoPath}`}
                                      alt={
                                        network.name
                                      }
                                      width={
                                        24
                                      }
                                      height={
                                        24
                                      }
                                      className="object-contain"
                                    />
                                  ) : (
                                    <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                                      <span className="text-xs">
                                        TV
                                      </span>
                                    </div>
                                  )}
                                  <span className="text-xs">
                                    {
                                      network.name
                                    }
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="mt-4 pt-2 border-t border-green-300">
                        <p className="text-sm">
                          {show._count.showReviews} reviews
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Mobile version */}
                <div className="block md:hidden h-full">
                  <MobileShowCard
                    show={{
                      id: String(show.id), // Convert to string
                      name: show.name,
                      posterPath: show.posterPath,
                      tagline: show.tagline,
                      overview: show.overview,
                      isRunning: show.isRunning,
                      tmdbRating: show.tmdbRating,
                      tags: [],
                      networks: getUniqueNetworks(
                        show.ShowsOnNetworks
                      ).map((network) => ({
                        id: String(network.id),
                        name: network.name,
                        logoPath: network.logoPath,
                      })),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
