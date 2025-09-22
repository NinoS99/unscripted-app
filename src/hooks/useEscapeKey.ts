import { useEffect } from 'react';

/**
 * Custom hook to handle escape key press for closing modals
 * 
 * @param isOpen - Boolean indicating if the modal is open
 * @param onClose - Function to call when escape is pressed
 */
export function useEscapeKey(isOpen: boolean, onClose: () => void) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen, onClose]);
}
