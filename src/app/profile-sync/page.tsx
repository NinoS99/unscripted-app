import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ProfileSyncButton from "@/components/ProfileSyncButton";

export default async function ProfileSyncPage() {
    const { userId } = await auth();
    
    if (!userId) {
        redirect("/sign-in");
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-md mx-auto">
                    <h1 className="text-2xl font-bold mb-6">Profile Picture Sync</h1>
                    <p className="text-gray-300 mb-6">
                        If your profile picture isn&apos;t updating properly, click the button below to manually sync it from Clerk to the database.
                    </p>
                    
                    <ProfileSyncButton />
                    
                    <div className="mt-8 p-4 bg-gray-800 rounded-lg">
                        <h2 className="text-lg font-semibold mb-2">How it works:</h2>
                        <ul className="text-sm text-gray-300 space-y-1">
                            <li>• Updates your profile picture URL in the database</li>
                            <li>• Syncs the current Clerk profile picture</li>
                            <li>• Refreshes the page to show the updated picture</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
} 