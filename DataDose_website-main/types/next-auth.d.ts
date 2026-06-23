import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'PATIENT' | 'PHYSICIAN' | 'PHARMACIST' | 'ADMIN' | 'SUPER_ADMIN';
      status: 'PENDING' | 'APPROVED' | 'REJECTED';
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: 'PATIENT' | 'PHYSICIAN' | 'PHARMACIST' | 'ADMIN' | 'SUPER_ADMIN';
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'PATIENT' | 'PHYSICIAN' | 'PHARMACIST' | 'ADMIN' | 'SUPER_ADMIN';
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
  }
}
