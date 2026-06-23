import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

// Development/Demo Mock Users
const MOCK_USERS = [
  {
    id: "demo-physician-id",
    name: "Dr. Alex Care",
    email: "physician@datadose.test",
    password: "physician123",
    role: "PHYSICIAN",
    status: "ACTIVE"
  },
  {
    id: "demo-pharmacist-id",
    name: "Pharm. Sarah Dose",
    email: "pharmacist@datadose.test",
    password: "pharmacist123",
    role: "PHARMACIST",
    status: "ACTIVE"
  },
  {
    id: "demo-patient-id",
    name: "John Patient",
    email: "patient@datadose.test",
    password: "patient123",
    role: "PATIENT",
    status: "ACTIVE"
  },
  {
    id: "demo-admin-id",
    name: "Hospital Administrator",
    email: "admin@datadose.test",
    password: "admin123",
    role: "ADMIN",
    status: "ACTIVE"
  },
  {
    id: "demo-system-id",
    name: "System Super Admin",
    email: "system@datadose.test",
    password: "system123",
    role: "SUPER_ADMIN",
    status: "ACTIVE"
  }
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
        const isDemoMode = process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEMO_MODE === "true";

        if (isDemoMode) {
          const mockUser = MOCK_USERS.find(
            (u) => u.email.toLowerCase() === emailTrimmed
          );

          if (mockUser) {
            if (credentials.password === mockUser.password) {
              return {
                id: mockUser.id,
                email: mockUser.email,
                name: mockUser.name,
                role: mockUser.role,
                status: mockUser.status,
              };
            }
            throw new Error("Invalid email or password.");
          }
          throw new Error("Invalid email or password (Demo Mode).");
        }

        // Real database authentication
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
