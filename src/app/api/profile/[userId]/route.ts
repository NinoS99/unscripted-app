import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/client';

// Ensure that params are awaited properly
export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // Destructure `params` correctly
    const { userId } = await params; // We must await params

    // Fetch the authenticated user's ID
    const { userId: authUserId } = await auth();

    // Fetch the user data from the database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if the logged-in user is the same as the target user
    const isOwner = authUserId === userId;

    const response: any = {
      id: user.id,
      username: user.username,
      profilePicture: user.profilePicture,
      bio: user.bio,
      twitter: user.twitter,
      instagram: user.instagram,
      createdAt: user.createdAt,
      isOwner,
    };

    // Include sensitive info if the user is the owner
    if (isOwner) {
      response.email = user.email;
      response.updatedAt = user.updatedAt;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('[PROFILE_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
