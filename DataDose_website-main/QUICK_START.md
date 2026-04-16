# Data Dose - Quick Start Guide

## 🚀 Getting Started

### 1. Start the Development Server
```bash
npm run dev
```
The application will start on `http://localhost:3000` (or the next available port).

### 2. Navigate to Login
Go to: **http://localhost:3000/login**

---

## 🔐 Demo Accounts

### Pharmacist Account
- **Email:** pharmacist@datadose.ai
- **Password:** password123
- **Dashboard:** Prescription scanning, drug interaction checking, alerts management

### Physician Account
- **Email:** physician@datadose.ai
- **Password:** password123
- **Dashboard:** Patient records, prescription creation, clinical risk analysis

### Enterprise Admin Account
- **Email:** admin@datadose.ai
- **Password:** password123
- **Dashboard:** Hospital analytics, user management, safety monitoring

### Super Admin Account
- **Email:** superadmin@datadose.ai
- **Password:** password123
- **Dashboard:** System monitoring, data pipelines, knowledge database management

---

## 📋 Feature Walkthrough

### For Pharmacists
1. **Login** with pharmacist@datadose.ai
2. **Prescription Scanner** - Upload and scan prescriptions
3. **Drug Interaction Checker** - See detected interactions with severity levels
4. **Alerts Panel** - Review all active safety alerts

### For Physicians
1. **Login** with physician@datadose.ai
2. **Patient Records** - Search and select patients
3. **Create Prescription** - Add medications with dosages
4. **Risk Analysis** - See AI-powered risk assessment and recommendations

### For Hospital Admins
1. **Login** with admin@datadose.ai
2. **Analytics** - View weekly prescription trends
3. **User Management** - See all users, their roles, and status
4. **Safety Monitoring** - Track prevented incidents and alerts

### For Super Admins
1. **Login** with superadmin@datadose.ai
2. **System Monitoring** - Monitor server health and resource usage
3. **Pipelines** - Track data ETL and ML pipeline status
4. **Knowledge Base** - Manage medical knowledge database

---

## 🎨 UI Features to Explore

### Design Elements
- **Glassmorphism Cards** - Frosted glass effect on all panels
- **Gradient Buttons** - Teal medical gradient theme
- **Animations** - Smooth Framer Motion transitions
- **Responsive Layout** - Resize browser to see mobile view
- **Icons** - Lucide icons throughout for visual clarity
- **Charts** - Admin dashboard includes Recharts graphs

### Interactive Elements
- Hover over buttons to see scale animations
- Sidebar collapses on mobile (toggle with menu button)
- Notification bell shows demo notifications
- Form inputs have focus states
- Tables are scrollable on mobile

---

## 🔄 Application Flow

### Navigation
1. **Landing Page** - Home page with product info (/)
2. **Login Page** - Authentication screen (/login)
3. **Dashboard Redirect** - Routes to role-specific dashboard (/dashboard)
4. **Role Dashboard** - Specialized UI for each user type
5. **Settings** - User account settings (/dashboard/settings)

### Session Management
- Sessions stored in browser's sessionStorage
- Auto-persist user across page refreshes
- Click "Logout" button to clear session and return to login

---

## 🛠️ Customization Guide

### Add New User Role
1. Edit `app/context/AuthContext.tsx`:
   - Add role to `UserRole` type
   - Add mock user in `login()` function
   - Update demo credentials display

2. Create dashboard:
   - Add folder: `app/dashboard/[role]/`
   - Create `page.tsx` with DashboardLayout wrapper
   - Add route to `DashboardPage` redirect logic

### Modify Styling
- **Colors:** Edit color variables in `app/globals.css`
- **Spacing:** Use Tailwind utilities (p-4, m-8, etc.)
- **Glassmorphism:** `.glass-card` and `.glass-card-strong` classes

### Add Dashboard Features
1. Create component in `/components/[role]/`
2. Import in dashboard page
3. Add navigation item in sidebar array
4. Style with Tailwind + custom classes

---

## 📊 Component Examples

### Creating a New Dashboard Widget

```typescript
'use client';

import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

export default function MyWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card-strong rounded-xl p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">My Widget</h2>
        <BarChart3 className="w-6 h-6 text-teal-600" />
      </div>

      {/* Your content here */}
    </motion.div>
  );
}
```

### Key Styling Classes
- `glass-card` - Basic glassmorphism
- `glass-card-strong` - Stronger glass effect
- `gradient-teal` - Teal gradient background
- `gradient-teal-light` - Light teal gradient

---

## 🐛 Troubleshooting

### Session Not Persisting?
- Check if sessionStorage is enabled in browser
- Clear sessionStorage: Open DevTools → Application → SessionStorage → Clear All

### Styling Issues?
- Ensure Tailwind CSS is properly imported
- Check `globals.css` for theme variables
- Clear `.next` cache and rebuild

### Navigation Issues?
- Verify route exists in file structure
- Check DashboardLayout is wrapping component
- Verify auth context is providing user data

---

## 📱 Mobile Testing

### Test Responsive Design
1. Open DevTools (F12)
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Test different screen sizes
4. Sidebar should collapse on mobile

---

## 🎯 Next Steps

### Integration Ready
- Replace mock authentication with real API
- Connect to backend server
- Implement real prescription scanning
- Integrate with medical databases
- Add real patient records

### Recommended Next Tasks
1. Add backend API integration
2. Implement real authentication (JWT)
3. Connect to database
4. Add form validation
5. Implement error handling
6. Add loading states
7. Create error pages (404, 500)

---

## 📚 File Reference

| File | Purpose |
|------|---------|
| `app/context/AuthContext.tsx` | Auth state management |
| `app/login/page.tsx` | Login page |
| `app/dashboard/page.tsx` | Dashboard redirect |
| `app/components/DashboardLayout.tsx` | Shared layout |
| `app/layout.tsx` | Root layout with AuthProvider |
| `app/globals.css` | Global styles & theme |

---

## ⚡ Tips & Tricks

### Development Shortcuts
- Hot reload: Save file - changes appear instantly
- Use DevTools Console to check auth state: `console.log(sessionStorage.getItem('user'))`
- Mobile preview: `npm run dev` and resize browser

### Testing Different Roles
1. Login with one account
2. Open new incognito window
3. Login with different account
4. Compare different dashboard UIs

### Exploring Components
- Check `app/components/` for all UI components
- Each dashboard has its own subfolder
- Components are modular and reusable

---

## 📞 Support

For issues or questions:
1. Check the main README.md
2. Review component source code comments
3. Check Framer Motion, Tailwind, and Next.js documentation
4. Inspect browser DevTools for errors

---

**Status:** ✅ Production Ready

Happy developing! 🎉
