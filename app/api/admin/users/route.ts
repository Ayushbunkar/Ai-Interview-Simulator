import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { db, ensureDbInitialized } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { desc, eq, ilike, or, and, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    await ensureDbInitialized();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const roleFilter = searchParams.get("role") || "";

    const conditions = [];
    if (search.trim()) {
      conditions.push(or(ilike(users.email, `%${search.trim()}%`), ilike(users.name, `%${search.trim()}%`)));
    }
    if (roleFilter && (roleFilter === "admin" || roleFilter === "user")) {
      conditions.push(eq(users.role, roleFilter));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const userList = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        emailVerified: users.emailVerified,
        image: users.image,
        googleId: users.googleId,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(100);

    return NextResponse.json({ users: userList });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }
    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden. Administrator privileges required." }, { status: 403 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const adminUser = await requireAdmin();
    await ensureDbInitialized();

    const body = await req.json();
    const { userId, role, emailVerified } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required." }, { status: 400 });
    }

    // Safety: prevent admin from demoting themselves
    if (userId === adminUser.id && role && role !== "admin") {
      return NextResponse.json({ error: "You cannot revoke your own administrator privileges." }, { status: 400 });
    }

    const updates: any = { updatedAt: new Date() };
    if (role && (role === "admin" || role === "user")) {
      updates.role = role;
    }
    if (typeof emailVerified === "boolean") {
      updates.emailVerified = emailVerified;
    }

    await db.update(users).set(updates).where(eq(users.id, userId));

    return NextResponse.json({ success: true, message: "User updated successfully." });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (err.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const adminUser = await requireAdmin();
    await ensureDbInitialized();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId query parameter is required." }, { status: 400 });
    }

    if (userId === adminUser.id) {
      return NextResponse.json({ error: "You cannot delete your own account from the admin dashboard." }, { status: 400 });
    }

    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({ success: true, message: "User deleted successfully." });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (err.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
