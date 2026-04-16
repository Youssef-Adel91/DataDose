import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

/**
 * PATCH /api/admin/approve-user
 * Body: { userId: string, action: "approve" | "reject" | "elevate_to_admin" }
 *
 * Role enforcement:
 *  - ADMIN      → can approve / reject PENDING users only
 *  - SUPER_ADMIN → can also elevate a user's role to ADMIN
 *
 * No client-side role is trusted — role is read from the server session.
 */
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);

  // ── Server-side authorization gate ────────────────────────────────────────
  const callerRole = (session?.user as any)?.role as string | undefined;
  if (!session || (callerRole !== "ADMIN" && callerRole !== "SUPER_ADMIN")) {
    return NextResponse.json(
      { error: "Forbidden: Insufficient privileges." },
      { status: 403 }
    );
  }

  let body: { userId?: string; action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { userId, action } = body;

  if (!userId || !action) {
    return NextResponse.json(
      { error: "Missing required fields: userId, action." },
      { status: 400 }
    );
  }

  // ── Guard: prevent self-modification ─────────────────────────────────────
  const callerId = (session.user as any)?.id;
  if (callerId === userId) {
    return NextResponse.json(
      { error: "You cannot modify your own account via this endpoint." },
      { status: 400 }
    );
  }

  try {
    // Fetch the target user to validate current state
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // ── Guard: prevent modifying another SUPER_ADMIN ───────────────────────
    if (targetUser.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Cannot modify a SUPER_ADMIN account." },
        { status: 403 }
      );
    }

    if (action === "approve") {
      // Approve: mark user as APPROVED so they can log in
      await prisma.user.update({
        where: { id: userId },
        data: { status: "APPROVED" },
      });
      return NextResponse.json({ message: `User ${targetUser.email} approved successfully.` });
    }

    if (action === "reject") {
      // Reject: mark user as REJECTED — they will be blocked at login
      await prisma.user.update({
        where: { id: userId },
        data: { status: "REJECTED" },
      });
      return NextResponse.json({ message: `User ${targetUser.email} rejected.` });
    }

    if (action === "elevate_to_admin") {
      // ── SUPER_ADMIN only ──────────────────────────────────────────────────
      if (callerRole !== "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "Forbidden: Only SUPER_ADMIN can elevate users to ADMIN." },
          { status: 403 }
        );
      }
      await prisma.user.update({
        where: { id: userId },
        data: { role: "ADMIN", status: "APPROVED" },
      });
      return NextResponse.json({
        message: `User ${targetUser.email} elevated to ADMIN and approved.`,
      });
    }

    return NextResponse.json(
      { error: `Unknown action: ${action}` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[approve-user] DB Error:", error);
    return NextResponse.json(
      { error: "Database operation failed." },
      { status: 500 }
    );
  }
}
