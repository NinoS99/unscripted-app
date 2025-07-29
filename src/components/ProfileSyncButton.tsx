"use client";

import { useState } from "react";
import { FiRefreshCw } from "react-icons/fi";

export default function ProfileSyncButton() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [message, setMessage] = useState("");

    const handleSync = async () => {
        setIsSyncing(true);
        setMessage("");

        try {
            const response = await fetch("/api/profile/sync", {
                method: "POST",
            });

            const data = await response.json();

            if (response.ok) {
                setMessage("Profile picture synced successfully!");
                // Reload the page to show the updated profile picture
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                setMessage(data.error || "Failed to sync profile picture");
            }
        } catch {
            setMessage("Error syncing profile picture");
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <FiRefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? "Syncing..." : "Sync Profile Picture"}
            </button>
            {message && (
                <p className={`text-sm ${message.includes('successfully') ? 'text-green-400' : 'text-red-400'}`}>
                    {message}
                </p>
            )}
        </div>
    );
} 