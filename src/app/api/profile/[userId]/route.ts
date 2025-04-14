import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/client';
import { User } from '@prisma/client';

type BaseUserResponse = Pick<User, 
  'id' | 'username' | 'profilePicture' | 'bio' | 
  'twitter' | 'instagram' | 'createdAt'
> & {
  isOwner: boolean;
};

type OwnerUserResponse = BaseUserResponse & Pick<User, 'email' | 'updatedAt'>;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { userId: authUserId } = await auth();

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isOwner = authUserId === userId;
    const baseResponse: BaseUserResponse = {
      id: user.id,
      username: user.username,
      profilePicture: user.profilePicture,
      bio: user.bio,
      twitter: user.twitter,
      instagram: user.instagram,
      createdAt: user.createdAt,
      isOwner,
    };

    if (isOwner) {
      const ownerResponse: OwnerUserResponse = {
        ...baseResponse,
        email: user.email,
        updatedAt: user.updatedAt,
      };
      return NextResponse.json(ownerResponse);
    }

    return NextResponse.json(baseResponse);
  } catch (error) {
    console.error('[PROFILE_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}