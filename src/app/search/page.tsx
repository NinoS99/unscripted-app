import prisma from "@/lib/client";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FaCheck, FaTimes } from "react-icons/fa";
import { Network } from "@prisma/client";

import MobileShowCard from "@/components/MobileShowCard";

const decodeQuery = (query: string | string[] | undefined) => {
    if (!query) return "";
    if (Array.isArray(query)) return decodeURIComponent(query[0]);
    return decodeURIComponent(query);
};

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

export default async function SearchPage(props: {
    searchParams: Promise<{ query?: string }>;
}) {
    const searchParams = await props.searchParams;
    const query = decodeQuery(searchParams.query);

    if (!query) return notFound();

    const shows = await prisma.show.findMany({
        where: {
            name: {
                contains: query,
                mode: "insensitive",
            },
        },
        orderBy: {
            tmdbRating: "desc",
        },
        take: 20,
        include: {
            tags: {
                include: {
                    tag: true,
                },
            },
            ShowsOnNetworks: {
                include: {
                    network: true,
                },
            },
        },
    });

    return (
        <div className="container mx-auto p-4 md:p-6 space-y-6">
            <h1 className="text-l font-semibold text-green-300">
                SHOWING MATCHES FOR &quot;{query}&quot;
            </h1>
            <div className="border-t border-gray-200 mb-8"></div>

            {shows.length === 0 ? (
                <p className="text-green-300">No shows found</p>
            ) : (
                <div className="responsive-grid w-full">
                    {shows.map((show) => (
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
                                    </div>

                                    {/* Show name (always visible) */}
                                    <div className="p-2 text-sm font-medium text-black min-h-[40px] flex items-center justify-center bg-gray-300">
                                        <span className="line-clamp-2 text-s sm:text-sm text-center justify-center">
                                            {show.name}
                                        </span>
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

                                        {show.tmdbRating && (
                                            <div className="mb-2">
                                                <span className="text-md font-bold">
                                                    Rating:{" "}
                                                </span>
                                                <span className="text-md">
                                                    {show.tmdbRating.toFixed(1)}
                                                    /10
                                                </span>
                                            </div>
                                        )}

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

                                        {show.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-5">
                                                {show.tags
                                                    .slice(0, 3)
                                                    .map(({ tag }) => (
                                                        <span
                                                            key={tag.id}
                                                            className="px-2 py-1 bg-gray-700 rounded-full text-xs"
                                                        >
                                                            {tag.name}
                                                        </span>
                                                    ))}
                                            </div>
                                        )}
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
                                        tags: show.tags.map(({ tag }) => ({
                                            id: String(tag.id),
                                            name: tag.name,
                                        })),
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
            )}
        </div>
    );
}
