"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { FiList } from "react-icons/fi";
import AddToWatchListModal from "./AddToWatchListModal";

interface AddToWatchListButtonProps {
    showId: number;
    showName: string;
}

export default function AddToWatchListButton({ showId, showName }: AddToWatchListButtonProps) {
    const { user } = useUser();
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!user) return null;

    return (
        <>
            <div className="mt-4">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                    <FiList className="w-4 h-4" />
                    Add to Watch List
                </button>
            </div>

            <AddToWatchListModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                showId={showId}
                showName={showName}
            />
        </>
    );
} 