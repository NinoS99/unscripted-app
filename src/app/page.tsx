import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/client";
import Image from "next/image";
import Link from "next/link";
import { FiPlay, FiCalendar } from "react-icons/fi";

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
  const showsOnAir = await prisma.show.findMany({
    where: { isRunning: true },
    take: 12,
    include: {
      _count: {
        select: {
          showReviews: true,
        },
      },
    },
    orderBy: { firstAirDate: 'desc' },
  });

  // Fetch stats based on user login status
  let totalReviews: number;
  let totalComments: number;
  let totalLikes: number;
  let totalStarsSum: { _sum: { rating: number | null } };

  if (userId) {
    // User-specific stats
    totalReviews = await prisma.showReview.count({
      where: { userId },
    });
    totalComments = await prisma.reviewComment.count({
      where: { userId },
    });
    totalLikes = await prisma.like.count({
      where: { userId },
    });
    totalStarsSum = await prisma.rating.aggregate({
      where: { userId },
      _sum: {
        rating: true,
      },
    });
  } else {
    // Platform-wide stats
    totalReviews = await prisma.showReview.count();
    totalComments = await prisma.reviewComment.count();
    totalLikes = await prisma.like.count({
      where: {
        showReviewId: { not: null },
      },
    });
    totalStarsSum = await prisma.rating.aggregate({
      _sum: {
        rating: true,
      },
    });
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Banner with Moving Show Posters */}
      <div className="relative h-96 md:h-[32rem] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/80 via-gray-900/80 to-green-900/80 z-10"></div>
        
        {/* Moving Banner */}
        <div className="absolute inset-0 animate-scroll">
          {/* First set of posters */}
          {topRatedShows.map((show) => (
            <div key={`first-${show.id}`} className="w-48 md:w-64 h-full mx-2">
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
            <div key={`second-${show.id}`} className="w-48 md:w-64 h-full mx-2">
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

        {/* Hero Content */}
        <div className="relative z-20 flex items-center justify-center h-full text-center">
          <div className="lg:px-16 xl:px-32 2xl:px-64 mx-auto w-full">
            <div className="p-8">
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
              <h2 className="text-2xl font-bold text-green-500">Currently On Air</h2>
            </div>
          </div>
          <div className="border-b border-gray-600 mb-6"></div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {showsOnAir.map((show) => (
              <div key={show.id} className="group">
                <Link href={`/show/${show.id}`}>
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2 hover:scale-105 transition-transform">
                    <Image
                      src={show.posterPath ? `https://image.tmdb.org/t/p/w500${show.posterPath}` : "/noPoster.jpg"}
                      alt={show.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                    <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                      ON AIR
                    </div>
                  </div>
                  <h3 className="text-white text-sm font-medium truncate">{show.name}</h3>
                  <p className="text-gray-400 text-xs">
                    {show._count.showReviews} reviews
                  </p>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Stats - Only show for logged in users */}
        {userId && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <FiCalendar className="text-2xl text-green-500" />
              <h2 className="text-2xl font-bold text-green-500">Your Platform Stats</h2>
            </div>
            <div className="border-b border-gray-600 mb-6"></div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-green-500 mb-2">
                  {totalReviews}
                </div>
                <div className="text-gray-300">Reviews Made</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-green-500 mb-2">
                  {totalComments}
                </div>
                <div className="text-gray-300">Comments Made</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-green-500 mb-2">
                  {totalLikes}
                </div>
                <div className="text-gray-300">Roses Given</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-green-500 mb-2">
                  {totalStarsSum._sum.rating || 0}
                </div>
                <div className="text-gray-300">Stars Given</div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
