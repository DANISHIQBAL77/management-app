'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardGrid } from '@/components/ui/Card';
import { BookOpen, Calendar, FileText, Award } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useFirestore } from '@/lib/hooks/useFirestore';

export default function StudentDashboard() {
  const { user, userData } = useAuth();
  
  // Existing Assignments Fetch
  const { documents: assignments } = useFirestore('assignments', [
    { field: 'classId', operator: '==', value: userData?.classId || '' }
  ]);

  // Backend Integration: Fetch Attendance
  const { documents: attendanceData } = useFirestore('attendance', [
    { field: 'studentId', operator: '==', value: user?.uid || '' }
  ]);

  // Backend Integration: Fetch Announcements
  const { documents: announcements } = useFirestore('notifications', [
    { field: 'recipientId', operator: 'in', value: ['all', user?.uid || ''] }
  ]);

  // Calculation for Attendance Percentage
  const totalDays = attendanceData.length;
  const presentDays = attendanceData.filter(doc => doc.status === 'present').length;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
  
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
      value: `${attendancePercentage}%`, // Integrated backend value
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
            {/* Backend Integration: Showing dynamic announcements */}
            {announcements.length === 0 ? (
              <p className="text-gray-600">No recent announcements</p>
            ) : (
              <div className="space-y-3">
                {announcements.slice(0, 5).map(announcement => (
                  <div key={announcement.id} className="p-3 border-l-4 border-blue-500 bg-gray-50 rounded-r-lg">
                    <p className="font-semibold text-gray-900">{announcement.title}</p>
                    <p className="text-sm text-gray-600">{announcement.message}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}