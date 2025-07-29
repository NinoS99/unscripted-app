"use client";

import Link from "next/link";
import { FiExternalLink } from "react-icons/fi";

interface ReviewLinkProps {
    reviewType: "show" | "season" | "episode";
    reviewId: number;
    username: string;
    className?: string;
}

export default function ReviewLink({ reviewType, reviewId, className = "", username }: ReviewLinkProps) {
    return (
        <Link
            href={`/${username}/review/${reviewType}/${reviewId}`}
            className={`inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors ${className}`}
        >
            <span>View Full Review</span>
            <FiExternalLink className="w-4 h-4" />
        </Link>
    );
} 