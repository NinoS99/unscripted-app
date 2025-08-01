"use client";

import { useState, useEffect } from "react";
import { FiX, FiAlertCircle } from "react-icons/fi";

interface ErrorNotificationProps {
    message: string;
    isVisible: boolean;
    onClose: () => void;
    duration?: number; // Duration in milliseconds, 0 for no auto-close
}

export default function ErrorNotification({
    message,
    isVisible,
    onClose,
    duration = 5000
}: ErrorNotificationProps) {
    const [isShown, setIsShown] = useState(false);

    useEffect(() => {
        if (isVisible) {
            setIsShown(true);
            
            // Auto-close after duration if specified
            if (duration > 0) {
                const timer = setTimeout(() => {
                    setIsShown(false);
                    setTimeout(onClose, 300); // Wait for fade out animation
                }, duration);
                
                return () => clearTimeout(timer);
            }
        } else {
            setIsShown(false);
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible) return null;

    return (
        <div className={`fixed top-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm transition-opacity duration-300 ${isShown ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <FiAlertCircle className="w-5 h-5" />
                        <h3 className="font-semibold">Error</h3>
                    </div>
                    <p className="text-sm">{message}</p>
                </div>
                <button
                    onClick={() => {
                        setIsShown(false);
                        setTimeout(onClose, 300);
                    }}
                    className="text-red-100 hover:text-white transition-colors ml-2"
                >
                    <FiX className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
} 