'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardGrid } from '@/components/ui/Card';
import { BookOpen, Calendar, FileText, Users } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useFirestore } from '@/lib/hooks/useFirestore';

export default function TeacherDashboard() {
  const { userData } = useAuth();
  const { documents: classes } = useFirestore('classes', [{ field: 'teacherId', operator: '==', value: userData?.uid || '' }]);
  const { documents: assignments } = useFirestore('assignments', [{ field: 'teacherId', operator: '==', value: userData?.uid || '' }]);
  
  const stats = [
    {
      title: 'My Classes',
      value: classes.length,
      icon: BookOpen,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Assignments',
      value: assignments.length,
      icon: FileText,
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Students',
      value: 0, // Calculate from classes
      icon: Users,
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Today\'s Classes',
      value: 0,
      icon: Calendar,
      color: 'from-orange-500 to-red-500',
    },
  ];
  
  return (
    <DashboardLayout requiredRole="teacher">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome, {userData?.name}!</h1>
        <p className="text-gray-600 mb-8">Here's your teaching overview</p>
        
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
        
        <div className="grid grid-cols-2 gap-6 mt-8">
          <Card title="Upcoming Classes">
            <p className="text-gray-600">No classes scheduled for today</p>
          </Card>
          
          <Card title="Recent Submissions">
            <p className="text-gray-600">No recent submissions</p>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
