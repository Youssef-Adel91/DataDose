import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/pending-users
 * Returns all users with ApprovalStatus = PENDING.
 * Requires ADMIN or SUPER_ADMIN session role — server-side enforced.
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  // ── Server-side authorization gate ────────────────────────────────────────
  const callerRole = (session?.user as any)?.role;
  if (!session || (callerRole !== "ADMIN" && callerRole !== "SUPER_ADMIN")) {
    return NextResponse.json(
      { error: "Forbidden: Insufficient privileges." },
      { status: 403 }
    );
  }

  try {
    const pendingUsers = await prisma.user.findMany({
      where: { status: "PENDING" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        verificationDocument: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ users: pendingUsers });
  } catch (error: any) {
    console.error("[pending-users] DB Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending users." },
      { status: 500 }
    );
  }
}
