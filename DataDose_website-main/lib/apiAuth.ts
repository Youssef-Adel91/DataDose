import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from './auth';

type AllowedRole = 'PATIENT' | 'PHYSICIAN' | 'PHARMACIST' | 'ADMIN' | 'SUPER_ADMIN';

interface AuthResult {
  authorized: true;
  userId: string;
  email: string;
  role: AllowedRole;
}

interface AuthError {
  authorized: false;
  response: NextResponse;
}

/**
 * Server-side API route authentication & authorization helper.
 *
 * Usage in any API route:
 *   const auth = await requireAuth(['PHYSICIAN', 'PHARMACIST']);
 *   if (!auth.authorized) return auth.response;
 *   // auth.userId, auth.email, auth.role are now available
 */
export async function requireAuth(
  allowedRoles?: AllowedRole[]
): Promise<AuthResult | AuthError> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      ),
    };
  }

  const user = session.user;
  const role = user.role as AllowedRole;

  // If specific roles are required, check them
  if (allowedRoles && allowedRoles.length > 0) {
    // SUPER_ADMIN always has access
    if (role !== 'SUPER_ADMIN' && !allowedRoles.includes(role)) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Forbidden: You do not have permission to access this resource.' },
          { status: 403 }
        ),
      };
    }
  }

  return {
    authorized: true,
    userId: user.id,
    email: user.email ?? '',
    role,
  };
}
