"use client";

import { useUser } from "@clerk/nextjs";
import CreateWatchListForm from "../../../components/CreateWatchListForm";

export default function NewWatchListPage() {
    const { user } = useUser();

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
            <div className="container mx-auto px-4 py-4">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-4">Create New Watch List</h1>
                        <div className="border-b border-gray-600"></div>
                    </div>
                    
                    <CreateWatchListForm />
                </div>
            </div>
        </div>
    );
} 