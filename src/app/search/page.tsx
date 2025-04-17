import prisma from "@/lib/client";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FaCheck, FaTimes } from "react-icons/fa";

const decodeQuery = (query: string | string[] | undefined) => {
    if (!query) return "";
    if (Array.isArray(query)) return decodeURIComponent(query[0]);
    return decodeURIComponent(query);
};

// Helper function to deduplicate networks
const getUniqueNetworks = (showsOnNetworks: { network: any }[]) => {
    const networkMap = new Map();

    showsOnNetworks.forEach(({ network }) => {
        if (!networkMap.has(network.name)) {
            // If network name not seen before, add it
            networkMap.set(network.name, network);
        } else {
            // If network name exists, keep the one with logoPath if available
            const existing = networkMap.get(network.name);
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
        <div className="p-4 md:p-6 space-y-6">
            <h1 className="text-l font-semibold text-green-300">
                SHOWING MATCHES FOR &quot;{query}&quot;
            </h1>
            <div className="border-t border-gray-200 mb-8"></div>

            {shows.length === 0 ? (
                <p className="text-green-300">No shows found</p>
            ) : (
                <div className="responsive-grid w-full">
                    {shows.map((show) => (
                        <Link
                            key={show.id}
                            href={`/shows/${show.id}`}
                            className="group relative"
                        >
                            <div className="bg-gray-300 rounded-xl shadow hover:shadow-lg transition overflow-hidden h-full flex flex-col w-full">
                                {/* Image with consistent aspect ratio */}
                                <div className="aspect-[2/3] relative">
                                    <Image
                                        src={
                                            show.posterPath
                                                ? `https://image.tmdb.org/t/p/w500${show.posterPath}`
                                                : "/noPoster.png"
                                        }
                                        alt={show.name}
                                        fill
                                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                                        className="object-cover"
                                        priority={false}
                                    />
                                </div>

                                {/* Show name (always visible) */}
                                <div className="p-2 text-sm font-medium text-black min-h-[40px] flex items-center bg-gray-300">
                                    <span className="line-clamp-2 text-s sm:text-sm">
                                        {show.name}
                                    </span>
                                </div>

                                {/* Desktop hover overlay */}
                                <div className="hidden md:block absolute inset-0 bg-green-600 bg-opacity-80 opacity-0 group-hover:opacity-97 transition-opacity duration-200 p-3 text-white overflow-y-auto rounded-xl">
                                    <h3 className="font-bold text-lg mb-2">
                                        {show.name}
                                    </h3>

                                    <div className="max-h-[100px] overflow-y-auto pr-2 custom-scrollbar mb-5">
                                        {show.tagline ? (
                                            <p className="border-l-2 border-green-300 pl-2 italic text-m">
                                                {show.tagline}
                                            </p>
                                        ) : show.overview ? (
                                            <p className="border-l-2 border-green-300 pl-2 text-sm">
                                                {show.overview}
                                            </p>
                                        ) : null}
                                    </div>

                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm font-bold">On air:</span>
                                        {show.isRunning ? (
                                            <FaCheck className="text-green-400" />
                                        ) : (
                                            <FaTimes className="text-red-400" />
                                        )}
                                    </div>

                                    {show.tmdbRating && (
                                        <div className="mb-2">
                                            <span className="text-sm font-bold">
                                                Rating:{" "}
                                            </span>
                                            <span className="text-sm">
                                                {show.tmdbRating.toFixed(1)}/10
                                            </span>
                                        </div>
                                    )}

                                    {show.ShowsOnNetworks?.length > 0 && (
                                        <div className="mt-3">
                                            <h4 className="text-sm font-bold">
                                                Watch On:
                                            </h4>
                                            <div className="flex space-x-2 overflow-x-auto pb-2 -mx-1 px-1">
                                                {getUniqueNetworks(
                                                    show.ShowsOnNetworks
                                                ).map((network) => {
                                                    return (
                                                        <div
                                                            key={`${network.id}-${network.name}`}
                                                            className="flex-shrink-0"
                                                        >
                                                            <Image
                                                                src={
                                                                    !network.logoPath
                                                                        ? "/television.png"
                                                                        : `https://image.tmdb.org/t/p/w92${network.logoPath}`
                                                                }
                                                                alt={
                                                                    network.name
                                                                }
                                                                width={32}
                                                                height={32}
                                                                className='w-8 h-8 object-contain bg-gray-200 p-1 rounded mt-1'
                                                                title={
                                                                    network.name
                                                                }
                                                            />
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
                    ))}
                </div>
            )}
        </div>
    );
}
