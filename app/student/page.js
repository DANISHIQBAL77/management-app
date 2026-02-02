'use client';
import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardGrid } from '@/components/ui/Card';
import { BookOpen, Calendar, FileText, Award, Bell, X } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useFirestore } from '@/lib/hooks/useFirestore';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy, limit } from 'firebase/firestore';

export default function StudentDashboard() {
  const { user, userData } = useAuth();
  
  // --- Notification Logic (Personal Notifications) ---
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (user?.uid) {
      const q = query(
        collection(db, 'notifications'), // Personal alerts (leave as is)
        where('recipientId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsubscribe();
    }
  }, [user]);

  // --- FIXED ASSIGNMENTS FETCH ---
  const { documents: assignments } = useFirestore('assignments', [
    { field: 'classId', operator: '==', value: userData?.classId || '' }
  ]);

  // --- FIXED ANNOUNCEMENTS FETCH ---
  // Changed collection name from 'notifications' to 'announcements' to match teacher page
  const { documents: announcements } = useFirestore('announcements', [
    { field: 'classId', operator: '==', value: userData?.classId || '' }
  ]);

  const { documents: attendanceData } = useFirestore('attendance', [
    { field: 'studentId', operator: '==', value: user?.uid || '' }
  ]);

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
      value: `${attendancePercentage}%`,
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome, {userData?.name}!</h1>
            <p className="text-gray-600">Here's your academic overview</p>
          </div>
        </div>

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
                    <p className="text-sm text-gray-600">Due: {assignment.dueDate || 'No Date'}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
          
          <Card title="Recent Announcements">
            {announcements.length === 0 ? (
              <p className="text-gray-600">No recent announcements</p>
            ) : (
              <div className="space-y-3">
                {/* Sorted manually for string-based createdAt */}
                {[...announcements]
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .slice(0, 5)
                  .map(announcement => (
                  <div key={announcement.id} className="p-3 border-l-4 border-blue-500 bg-gray-50 rounded-r-lg">
                    <p className="font-semibold text-gray-900">{announcement.title}</p>
                    <p className="text-sm text-gray-600">{announcement.content}</p>
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