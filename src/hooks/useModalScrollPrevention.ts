import { useEffect } from 'react';

/**
 * Custom hook to prevent background scrolling when a modal is open
 * Works on desktop and mobile (including iOS Safari and Android browsers)
 * 
 * @param isOpen - Boolean indicating if the modal is open
 */
export function useModalScrollPrevention(isOpen: boolean) {
    useEffect(() => {
        if (isOpen) {
            // Store current scroll position
            const scrollY = window.scrollY;
            
            // Prevent scrolling on both body and html
            document.body.style.overflow = "hidden";
            document.body.style.position = "fixed";
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = "100%";
            
            // Additional mobile-specific prevention
            document.documentElement.style.overflow = "hidden";
            
            // Prevent touch events from scrolling
            const preventTouchMove = (e: TouchEvent) => {
                // Allow scrolling within the modal content
                const target = e.target as Element;
                const modalContent = target.closest('.modal-content');
                if (!modalContent) {
                    e.preventDefault();
                }
            };
            
            document.addEventListener('touchmove', preventTouchMove, { passive: false });
            
            return () => {
                // Restore scrolling
                document.body.style.overflow = "unset";
                document.body.style.position = "static";
                document.body.style.top = "auto";
                document.body.style.width = "auto";
                document.documentElement.style.overflow = "unset";
                
                // Restore scroll position
                window.scrollTo(0, scrollY);
                
                // Remove touch event listener
                document.removeEventListener('touchmove', preventTouchMove);
            };
        } else {
            document.body.style.overflow = "unset";
            document.body.style.position = "static";
            document.body.style.top = "auto";
            document.body.style.width = "auto";
            document.documentElement.style.overflow = "unset";
        }

        // Cleanup function to restore scrolling when component unmounts
        return () => {
            document.body.style.overflow = "unset";
            document.body.style.position = "static";
            document.body.style.top = "auto";
            document.body.style.width = "auto";
            document.documentElement.style.overflow = "unset";
        };
    }, [isOpen]);
}
