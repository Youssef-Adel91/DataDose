'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    // Route to role-specific dashboard
    const dashboardRoutes: Record<string, string> = {
      pharmacist: '/dashboard/pharmacist',
      physician: '/dashboard/physician',
      admin: '/dashboard/admin',
      super_admin: '/dashboard/system',
    };

    const route = dashboardRoutes[user.role];
    if (route) {
      router.push(route);
    } else {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-bg">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full"
      />
    </div>
  );
}
