import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { addComment } from "@/lib/comments";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { discussionId, content, parentId, spoiler = false } = body;

    if (!discussionId || !content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: discussionId and content" },
        { status: 400 }
      );
    }

    if (content.trim().length > 10000) {
      return NextResponse.json(
        { error: "Comment content too long (max 10,000 characters)" },
        { status: 400 }
      );
    }

    const comment = await addComment(
      parseInt(discussionId),
      userId,
      content.trim(),
      parentId ? parseInt(parentId) : undefined,
      spoiler
    );

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Error adding comment:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("Parent comment not found")) {
        return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
      }
      if (error.message.includes("Comment nesting too deep")) {
        return NextResponse.json({ error: "Comment nesting too deep" }, { status: 400 });
      }
      if (error.message.includes("Parent comment does not belong to this discussion")) {
        return NextResponse.json({ error: "Invalid parent comment" }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
