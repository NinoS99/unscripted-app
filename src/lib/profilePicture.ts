import { UserResource } from "@clerk/types";

/**
 * Get the best available profile picture URL
 * The API now handles Clerk imageUrl updates, so this is just a fallback utility
 * Always falls back to /noAvatar.png if nothing is available
 */
export function getProfilePictureUrl(
    userId: string,
    storedProfilePicture: string | null,
    currentUser?: UserResource | null
): string {
    // If this is the current user, always use Clerk's current imageUrl
    if (currentUser && currentUser.id === userId) {
        return currentUser.imageUrl || "/noAvatar.png";
    }
    
    // For other users, use stored profile picture or fallback
    return storedProfilePicture || "/noAvatar.png";
}

/**
 * Check if a profile picture URL is from Clerk
 */
export function isClerkUrl(url: string | null): boolean {
    return url?.includes('clerk.com') || false;
} 