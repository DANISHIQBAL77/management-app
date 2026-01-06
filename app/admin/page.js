'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardGrid } from '@/components/ui/Card';
import { Users, GraduationCap, BookOpen, FileText } from 'lucide-react';
import { useFirestore } from '@/lib/hooks/useFirestore';

export default function AdminDashboard() {
  const { documents: students } = useFirestore('users', [{ field: 'role', operator: '==', value: 'student' }]);
  const { documents: teachers } = useFirestore('users', [{ field: 'role', operator: '==', value: 'teacher' }]);
  const { documents: classes } = useFirestore('classes');
  const { documents: assignments } = useFirestore('assignments');
  
  const stats = [
    {
      title: 'Total Students',
      value: students.length,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      link: '/admin/students'
    },
    {
      title: 'Total Teachers',
      value: teachers.length,
      icon: GraduationCap,
      color: 'from-purple-500 to-pink-500',
      link: '/admin/teachers'
    },
    {
      title: 'Active Classes',
      value: classes.length,
      icon: BookOpen,
      color: 'from-green-500 to-emerald-500',
      link: '/admin/classes'
    },
    {
      title: 'Assignments',
      value: assignments.length,
      icon: FileText,
      color: 'from-orange-500 to-red-500',
      link: '/admin/assignments'
    },
  ];
  
  return (
    <DashboardLayout requiredRole="admin">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
        
        <CardGrid cols={4}>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} hover>
                <div className={`bg-gradient-to-r ${stat.color} rounded-xl p-6 text-white`}>
                  <div className="flex items-center justify-between mb-4">
                    <Icon className="w-12 h-12" />
                    <div className="text-4xl font-bold">{stat.value}</div>
                  </div>
                  <h3 className="text-xl font-semibold">{stat.title}</h3>
                </div>
              </Card>
            );
          })}
        </CardGrid>
        
        <div className="mt-8">
          <Card title="Recent Activity">
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">New student registered</p>
                  <p className="text-sm text-gray-600">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Assignment submitted</p>
                  <p className="text-sm text-gray-600">5 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">New class created</p>
                  <p className="text-sm text-gray-600">1 day ago</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
