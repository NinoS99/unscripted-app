import prisma from "@/lib/client";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

// Utility to decode query param if needed
const decodeQuery = (query: string | string[] | undefined) => {
    if (!query) return "";
    if (Array.isArray(query)) return decodeURIComponent(query[0]);
    return decodeURIComponent(query);
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
    });

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-semibold text-green-600">
            Search Results for &quot;{query}&quot;
            </h1>

            {shows.length === 0 ? (
                <p className="text-gray-600">No shows found.</p>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
                    {shows.map((show) => (
                        <Link key={show.id} href={`/shows/${show.id}`}>
                            <div className="bg-white rounded-2xl shadow hover:shadow-md transition overflow-hidden">
                                <Image
                                    src={
                                        show.posterPath
                                            ? `https://image.tmdb.org/t/p/w500${show.posterPath}`
                                            : "/noPoster.png"
                                    }
                                    alt={show.name}
                                    width={300}
                                    height={450}
                                    className="w-full h-auto"
                                />
                                <div className="p-2 text-sm font-medium text-green-600">
                                    {show.name}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
