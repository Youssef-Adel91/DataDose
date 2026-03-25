'use client';

import { motion } from 'framer-motion';
import { Users, Plus, Shield, Trash2, Edit } from 'lucide-react';

const users = [
  {
    id: 1,
    name: 'John Smith',
    role: 'Pharmacist',
    status: 'active',
    lastLogin: '5 min ago',
    department: 'Pharmacy',
  },
  {
    id: 2,
    name: 'Dr. Sarah Johnson',
    role: 'Physician',
    status: 'active',
    lastLogin: '20 min ago',
    department: 'Cardiology',
  },
  {
    id: 3,
    name: 'Alice Brown',
    role: 'Admin',
    status: 'active',
    lastLogin: '2 hours ago',
    department: 'Administration',
  },
  {
    id: 4,
    name: 'Michael Chen',
    role: 'Pharmacist',
    status: 'inactive',
    lastLogin: '3 days ago',
    department: 'Pharmacy',
  },
];

const roleColors = {
  Pharmacist: 'bg-blue-100 text-blue-700',
  Physician: 'bg-teal-100 text-teal-700',
  Admin: 'bg-purple-100 text-purple-700',
};

export default function UserManagement() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card-strong rounded-xl p-8"
      id="users"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-teal text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add User
        </motion.button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Name</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Role</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Department</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Last Login</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, i) => (
              <motion.tr
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.05 * i }}
                whileHover={{ backgroundColor: 'rgba(20, 184, 166, 0.05)' }}
                className="border-b border-slate-200 hover:bg-teal-50/30 transition"
              >
                <td className="py-4 px-4">
                  <p className="font-semibold text-slate-900">{user.name}</p>
                </td>
                <td className="py-4 px-4">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      roleColors[user.role as keyof typeof roleColors]
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="py-4 px-4 text-sm text-slate-600">{user.department}</td>
                <td className="py-4 px-4">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="py-4 px-4 text-sm text-slate-600">{user.lastLogin}</td>
                <td className="py-4 px-4 flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    className="p-2 hover:bg-blue-50 rounded-lg transition text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    className="p-2 hover:bg-red-50 rounded-lg transition text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
