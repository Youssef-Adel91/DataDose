'use client';

import { motion } from 'framer-motion';
import {
  Heart,
  FileText,
  Activity,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import DashboardLayout from '@/app/components/DashboardLayout';
import MyHealthProfile from '@/app/components/patient/MyHealthProfile';
import AIPatientInsights from '@/app/components/patient/AIPatientInsights';

const sidebarItems = [
  {
    label: 'My Health Profile',
    icon: <Heart className="w-5 h-5" />,
    href: '#profile',
  },
  {
    label: 'Active Prescriptions',
    icon: <FileText className="w-5 h-5" />,
    href: '#prescriptions',
  },
  {
    label: 'AI Insights',
    icon: <Lightbulb className="w-5 h-5" />,
    href: '#insights',
    badge: 2,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function PatientDashboard() {
  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Patient Portal">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, Sara</h1>
          <p className="text-slate-600 mt-2">
            Your personal health portal powered by DataDose AI.
          </p>
        </motion.div>

        {/* Alerts */}
        <motion.div variants={itemVariants}>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-4">
            <div className="p-2 bg-orange-100 rounded-lg shrink-0">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-orange-900">Medical Alert active</h3>
              <p className="text-sm text-orange-800 mt-1">
                Your medical history indicates an allergy to <strong>Penicillin</strong>. 
                Our AI engines actively scan all new prescriptions to prevent adverse reactions.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Main Components */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
             <MyHealthProfile />
          </div>
          <div className="lg:col-span-2 space-y-6">
             <AIPatientInsights />
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
