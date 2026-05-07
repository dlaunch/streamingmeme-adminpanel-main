import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default-secret-change-this"
);

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    const user = await db
      .select({
        id: userProfiles.id,
        email: userProfiles.email,
        displayName: userProfiles.displayName,
        firstName: userProfiles.firstName,
        lastName: userProfiles.lastName,
        avatarUrl: userProfiles.avatarUrl,
        isActive: userProfiles.isActive,
      })
      .from(userProfiles)
      .where(eq(userProfiles.id, userId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user: user[0] });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
