'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Calendar,
  FileText,
  BarChart,
  Bell,
  Settings 
} from 'lucide-react';

export default function Sidebar({ role }) {
  const pathname = usePathname();
  
  const adminLinks = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/students', label: 'Students', icon: Users },
    { href: '/admin/teachers', label: 'Teachers', icon: GraduationCap },
    { href: '/admin/classes', label: 'Classes', icon: BookOpen },
    { href: '/admin/subjects', label: 'Subjects', icon: FileText },
  ];
  
  const teacherLinks = [
    { href: '/teacher', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/teacher/attendance', label: 'Attendance', icon: Calendar },
    { href: '/teacher/assignments', label: 'Assignments', icon: FileText },
    { href: '/teacher/marks', label: 'Marks', icon: BarChart },
    { href: '/teacher/announcements', label: 'Announcements', icon: Bell },
  ];
  
  const studentLinks = [
    { href: '/student', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/student/profile', label: 'Profile', icon: Users },
    { href: '/student/attendance', label: 'Attendance', icon: Calendar },
    { href: '/student/assignments', label: 'Assignments', icon: FileText },
    { href: '/student/marks', label: 'Marks', icon: BarChart },
  ];
  
  const links = role === 'admin' ? adminLinks : role === 'teacher' ? teacherLinks : studentLinks;
  
  return (
    <aside className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white min-h-screen">
      <div className="p-6">
        <div className="space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg'
                    : 'hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-semibold">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
