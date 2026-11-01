import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db, ensureDbInitialized } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/password";
import { generateVerificationToken } from "@/lib/auth/tokens";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const body = await req.json();
    const { name, email, password } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check existing
    const existing = await db.select().from(users).where(eq(users.email, normalizedEmail));
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: "An account with this email already exists. Please log in." }, { status: 409 });
    }

    // Check if first user -> grant admin
    const userCountRes = await db.select({ count: sql<number>`count(*)` }).from(users);
    const userCount = Number(userCountRes[0]?.count || 0);
    const role = userCount === 0 ? "admin" : "user";

    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();

    await db.insert(users).values({
      id: userId,
      email: normalizedEmail,
      name: name?.trim() || normalizedEmail.split("@")[0],
      passwordHash,
      role,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const token = await generateVerificationToken(normalizedEmail);

    return NextResponse.json({
      success: true,
      message: "Account created successfully. Please verify your email.",
      email: normalizedEmail,
      verificationToken: process.env.NODE_ENV !== "production" ? token : undefined,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create account." }, { status: 500 });
  }
}
