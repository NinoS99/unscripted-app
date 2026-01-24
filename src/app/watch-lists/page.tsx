import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { FiPlus } from "react-icons/fi";

export default async function WatchListsPage() {
    const { userId } = await auth();

    return (
        <div className="min-h-screen bg-gray-900">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Watch Lists
                    </h1>
                    <p className="text-xl md:text-2xl text-green-200 mb-8 max-w-3xl mx-auto leading-relaxed">
                        Bring the drama. Curate your chaos. Watchlists let you group the wildest, juiciest reality shows all in one place — and yes, <em>you</em> will want to share.
                    </p>
                    
                    {userId && (
                        <Link
                            href="/watch-list/new"
                            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl"
                        >
                            <FiPlus className="w-5 h-5" />
                            Create Your Own Watch List
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
} 