import { headers } from "next/headers";
import { Webhook } from "svix";
import { UserJSON, WebhookEvent } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/client";

export async function POST(req: Request) {
    const WEBHOOK_SECRET =
        process.env.NODE_ENV === "production"
            ? process.env.CLERK_WEBHOOK_SECRET_PROD
            : process.env.CLERK_WEBHOOK_SECRET_DEV;

    if (!WEBHOOK_SECRET) {
        return new NextResponse("Webhook secret missing", { status: 400 });
    }

    const payload = await req.text();
    const headerPayload = await headers();
    const svixId = (await headerPayload).get("svix-id")!;
    const svixTimestamp = (await headerPayload).get("svix-timestamp")!;
    const svixSignature = (await headerPayload).get("svix-signature")!;

    const wh = new Webhook(WEBHOOK_SECRET);
    let evt: WebhookEvent;

    try {
        evt = wh.verify(payload, {
            "svix-id": svixId,
            "svix-timestamp": svixTimestamp,
            "svix-signature": svixSignature,
        }) as WebhookEvent;
    } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return new NextResponse("Invalid signature", { status: 400 });
    }

    const eventType = evt.type;
    const data = evt.data as UserJSON;

    if (eventType === "user.created" || eventType === "user.updated") {
        const userId = data.id;
        const email = data.email_addresses?.[0]?.email_address;
        const username = data.username;
        const imageUrl = data.image_url;

        if (!userId) {
            return NextResponse.json(
                { error: "Missing Clerk user ID" },
                { status: 400 }
            );
        }

        if (!email || !username) {
            return new NextResponse("Missing email or username", {
                status: 400,
            });
        }

        if (eventType === "user.created") {
            try {
                await prisma.user.create({
                    data: {
                        id: evt.data.id,
                        email: email,
                        username: username,
                        profilePicture: imageUrl || "/noAvatar.png",
                    },
                });
                return new Response("User has been created!", { status: 200 });
            } catch (err) {
                console.log(err);
                return new Response("Failed to create the user!", {
                    status: 500,
                });
            }
        }

        if (eventType === "user.updated") {
            try {
                await prisma.user.update({
                    where: {
                        id: evt.data.id,
                    },
                    data: {
                        username: username,
                        profilePicture: imageUrl || "/noAvatar.png",
                    },
                });
                return new Response("User has been updated!", { status: 200 });
            } catch (err) {
                console.log(err);
                return new Response("Failed to update the user!", {
                    status: 500,
                });
            }
        }
    }

    if (eventType === "user.deleted") {
        try {
            await prisma.user.delete({
                where: {
                    id: data.id,
                },
            });
            return new Response("User has been deleted!", { status: 200 });
        } catch (err) {
            console.log(err);
            return new Response("Failed to delete the user!", { status: 500 });
        }
    }

    return new NextResponse("Event ignored", { status: 200 });
}
