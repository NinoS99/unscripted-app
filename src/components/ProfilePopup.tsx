"use client";
import { useState, useRef, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import Image from "next/image";
import EditProfileForm from "./EditProfileForm";

export default function ProfilePopup() {
    const { user } = useUser();
    const { signOut, openUserProfile } = useClerk();
    const [showPopup, setShowPopup] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);
    const clerkModalActive = useRef(false);

    const closeAll = () => {
        if (!clerkModalActive.current) {
            setShowPopup(false);
            setShowEditForm(false);
        }
    };

    // Handle click outside and Escape key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closeAll();
            }
        };

        // Detect when Clerk opens a modal
        const handleClerkModalOpen = () => {
            clerkModalActive.current = true;
        };

        const handleClerkModalClose = () => {
            clerkModalActive.current = false;
            closeAll(); // Close our dropdown when Clerk modal closes
        };

        document.addEventListener("keydown", handleEscape);
        window.addEventListener("clerk-modal-open", handleClerkModalOpen);
        window.addEventListener("clerk-modal-close", handleClerkModalClose);

        return () => {
            document.removeEventListener("keydown", handleEscape);
            window.removeEventListener("clerk-modal-open", handleClerkModalOpen);
            window.removeEventListener("clerk-modal-close", handleClerkModalClose);
        };
    }, []);

    const handleAccountSettings = () => {
        clerkModalActive.current = true;
        openUserProfile();
        setShowPopup(false);
    };

    if (!user) return null;

    return (
        <div className="relative" ref={popupRef}>
            {/* Profile image button */}
            <button
                onClick={() => setShowPopup(!showPopup)}
                className="rounded-full overflow-hidden border-2 border-gray-200 hover:border-green-500 transition-all flex items-center justify-center w-9 h-9 cursor-pointer" // Fixed dimensions
                aria-label="Profile menu"
            >
                <Image
                    src={user.imageUrl?.includes('clerk.com') 
                        ? user.imageUrl 
                        : `${user.imageUrl}?v=${user.id}`}
                    alt="Profile"
                    width={36} // Slightly larger than container to prevent squishing
                    height={36}
                    className="w-full h-full object-cover"
                />
            </button>

            {/* Profile popup */}
            {showPopup && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50 border border-gray-200 animate-fade-in">
                    <div className="p-1">
                        <button
                            onClick={handleAccountSettings}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                        >
                            Account Settings
                        </button>
                        
                        <button
                            onClick={() => {
                                setShowEditForm(true);
                                setShowPopup(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                        >
                            Edit Bio & Socials
                        </button>
                        
                        <button
                            onClick={() => signOut()}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            )}

            {/* Edit form */}
            {showEditForm && (
                <EditProfileForm
                    onClose={() => {
                        setShowEditForm(false);
                    }}
                />
            )}
        </div>
    );
}