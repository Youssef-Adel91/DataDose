import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

// ─── Demo accounts (kept in sync with app/login/page.tsx DEMO_ACCOUNTS) ────────
// These are upserted into the real DB on first login so production deployments
// never hit a "user not found" error for demo credentials.
const DEMO_USERS = [
  {
    name: "Hospital Administrator",
    email: "admin@datadose.demo",
    password: "Demo@Admin2026",
    role: "ADMIN" as const,
  },
  {
    name: "Dr. Alex Care",
    email: "physician@datadose.demo",
    password: "Demo@Physician2026",
    role: "PHYSICIAN" as const,
  },
  {
    name: "Pharm. Sarah Dose",
    email: "pharmacist@datadose.demo",
    password: "Demo@Pharmacist2026",
    role: "PHARMACIST" as const,
  },
  {
    name: "John Patient",
    email: "patient@datadose.demo",
    password: "Demo@Patient2026",
    role: "PATIENT" as const,
  },
];

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password.");
        }

        const emailTrimmed = credentials.email.trim().toLowerCase();

        // ── Check if this is a demo account login ─────────────────────────────
        const demoConfig = DEMO_USERS.find(
          (u) => u.email.toLowerCase() === emailTrimmed
        );

        if (demoConfig) {
          // Verify the plain-text demo password matches
          if (credentials.password !== demoConfig.password) {
            throw new Error("Invalid email or password.");
          }

          // Upsert the demo user into the real Postgres DB so the session can
          // reference a real DB row. This means the first login auto-creates
          // the account — no manual seeding step needed in production.
          let dbUser: any = null;
          try {
            const hashedPwd = await bcrypt.hash(demoConfig.password, 10);
            dbUser = await prisma.user.upsert({
              where: { email: demoConfig.email },
              update: { status: "APPROVED" }, // ensure demo accounts stay active
              create: {
                email: demoConfig.email,
                name: demoConfig.name,
                password: hashedPwd,
                role: demoConfig.role,
                status: "APPROVED",
              },
            });
          } catch (dbError) {
            // If DB is completely unreachable, fall back to in-memory session
            // so the demo still works on a cold deployment.
            console.warn("[Auth] DB upsert failed for demo user — using in-memory fallback:", dbError);
            return {
              id: `demo-${demoConfig.role.toLowerCase()}`,
              email: demoConfig.email,
              name: demoConfig.name,
              role: demoConfig.role,
              status: "APPROVED",
            };
          }

          return {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role,
            status: dbUser.status,
          };
        }

        // ── Real database authentication ──────────────────────────────────────
        let user: any = null;

        try {
          user = await prisma.user.findUnique({
            where: { email: emailTrimmed }
          });
        } catch (dbError) {
          console.error("Database connection error:", dbError);
          throw new Error("Unable to connect to the hospital database. Please contact IT support.");
        }

        if (!user) {
          throw new Error("Invalid email or password.");
        }

        // Verify password with bcrypt
        const isMatch = await bcrypt.compare(credentials.password, user.password);
        if (!isMatch) {
          throw new Error("Invalid email or password.");
        }

        // Approval gate — new staff must be approved by admin
        if (user.status === "PENDING") {
          throw new Error(
            "Your account is pending administrator approval. You will be notified once approved."
          );
        }

        if (user.status === "REJECTED") {
          throw new Error(
            "Your account has been deactivated. Please contact the hospital administration."
          );
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.status = (user as any).status;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).status = token.status;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
