'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardGrid } from '@/components/ui/Card';
import { BookOpen, Calendar, FileText, Award } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useFirestore } from '@/lib/hooks/useFirestore';

export default function StudentDashboard() {
  const { user, userData } = useAuth();
  const { documents: assignments } = useFirestore('assignments', [
    { field: 'classId', operator: '==', value: userData?.classId || '' }
  ]);
  
  const stats = [
    {
      title: 'My Class',
      value: userData?.classId ? '1' : '0',
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
      title: 'Attendance',
      value: '85%',
      icon: Calendar,
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Average Marks',
      value: '0',
      icon: Award,
      color: 'from-orange-500 to-red-500',
    },
  ];
  
  return (
    <DashboardLayout requiredRole="student">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome, {userData?.name}!</h1>
        <p className="text-gray-600 mb-8">Here's your academic overview</p>
        
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
          <Card title="Upcoming Assignments">
            {assignments.length === 0 ? (
              <p className="text-gray-600">No assignments available</p>
            ) : (
              <div className="space-y-3">
                {assignments.slice(0, 5).map(assignment => (
                  <div key={assignment.id} className="p-3 bg-blue-50 rounded-lg">
                    <p className="font-semibold text-gray-900">{assignment.title}</p>
                    <p className="text-sm text-gray-600">Due: {assignment.dueDate}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
          
          <Card title="Recent Announcements">
            <p className="text-gray-600">No recent announcements</p>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
