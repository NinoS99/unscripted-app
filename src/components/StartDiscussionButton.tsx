"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import DiscussionFormModal from "./DiscussionFormModal";
import { FaMugHot } from "react-icons/fa";

interface StartDiscussionButtonProps {
    entityType: "show" | "season" | "episode";
    entityId: number;
    entityName: string;
    entityData?: {
        rating?: number;
        isFavorited?: boolean;
    };
}

export default function StartDiscussionButton({ 
    entityType, 
    entityId, 
    entityName, 
    entityData 
}: StartDiscussionButtonProps) {
    const { user } = useUser();
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!user) return null;

    return (
        <>
            <div className="mt-2">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                    <FaMugHot className="w-4 h-4" />
                    Start a Discussion
                </button>
            </div>

            <DiscussionFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                entityType={entityType}
                entityId={entityId}
                entityName={entityName}
                entityData={entityData}
            />
        </>
    );
}
