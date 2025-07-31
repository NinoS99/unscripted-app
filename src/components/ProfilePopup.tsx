"use client";
import { useState, useRef, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import Image from "next/image";
import EditProfileForm from "./EditProfileForm";

export default function ProfilePopup() {
    const { user, isLoaded } = useUser();
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
        openUserProfile({
            appearance: {
                variables: {
                    colorPrimary: '#22c55e', // green-500
                    colorBackground: '#111827', // gray-900
                    colorText: '#ffffff', // white
                    colorTextSecondary: '#9ca3af', // gray-400
                    colorInputBackground: '#374151', // gray-700
                    colorInputText: '#ffffff', // white
                    colorNeutral: '#6b7280', // gray-500
                    colorSuccess: '#10b981', // green-500
                    colorWarning: '#f59e0b', // amber-500
                    colorDanger: '#ef4444', // red-500
                }
            }
        });
        setShowPopup(false);
    };

    // Don't render until user is loaded
    if (!isLoaded || !user) return null;

    return (
        <div className="relative" ref={popupRef}>
            {/* Profile image button */}
            <button
                onClick={() => setShowPopup(!showPopup)}
                className="rounded-full overflow-hidden border-2 border-gray-200 hover:border-green-500 transition-all flex items-center justify-center w-9 h-9 cursor-pointer" // Fixed dimensions
                aria-label="Profile menu"
            >
                <Image
                    src={user.imageUrl || "/noAvatar.png"}
                    alt="Profile"
                    width={36} // Slightly larger than container to prevent squishing
                    height={36}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        // Fallback to noAvatar if image fails
                        const target = e.target as HTMLImageElement;
                        target.src = "/noAvatar.png";
                    }}
                />
            </button>

            {/* Profile popup */}
            {showPopup && (
                <div className="absolute right-0 mt-2 w-64 bg-gray-900 rounded-md shadow-lg z-50 border border-gray-600 animate-fade-in">
                    <div className="p-1">
                        <button
                            onClick={handleAccountSettings}
                            className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-400 rounded"
                        >
                            Account Settings
                        </button>
                        
                        <button
                            onClick={() => {
                                setShowEditForm(true);
                                setShowPopup(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-400 rounded"
                        >
                            Edit Bio & Socials
                        </button>
                        
                        <button
                            onClick={() => signOut()}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-400 rounded"
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