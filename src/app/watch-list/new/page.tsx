"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { FiX } from "react-icons/fi";
import CreateWatchListForm from "../../../components/CreateWatchListForm";

export default function NewWatchListPage() {
    const { user } = useUser();
    const router = useRouter();

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center text-white">
                    <p>Please sign in to create a watch list.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-bold text-white">Create New Watch List</h1>
                        <button
                            onClick={() => router.back()}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <FiX className="w-6 h-6" />
                        </button>
                    </div>
                    
                    <CreateWatchListForm />
                </div>
            </div>
        </div>
    );
} 