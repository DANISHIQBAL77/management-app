'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardGrid } from '@/components/ui/Card';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useFirestore } from '@/lib/hooks/useFirestore';

export default function StudentAttendancePage() {
  const { user } = useAuth();
  
  // Fetch attendance records for this specific student
  const { documents: attendanceRecords, loading } = useFirestore('attendance', [
    { field: 'studentId', operator: '==', value: user?.uid || '' }
  ]);

  // Calculations
  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter(doc => doc.status === 'present').length;
  const absentDays = attendanceRecords.filter(doc => doc.status === 'absent').length;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const stats = [
    {
      title: 'Attendance Rate',
      value: `${attendancePercentage}%`,
      icon: Calendar,
      color: 'from-blue-600 to-cyan-500',
      isLarge: true
    },
    {
      title: 'Total Days',
      value: totalDays,
      icon: Clock,
      color: 'from-gray-500 to-gray-700',
    },
    {
      title: 'Present',
      value: presentDays,
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Absent',
      value: absentDays,
      icon: XCircle,
      color: 'from-red-500 to-orange-500',
    },
  ];

  return (
    <DashboardLayout requiredRole="student">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">My Attendance</h1>
        <p className="text-gray-600 mb-8">Track your daily presence and consistency</p>

        {/* Attendance Stats Cards */}
        <CardGrid cols={4}>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} hover>
                <div className={`bg-gradient-to-r ${stat.color} rounded-xl p-6 text-white h-[160px] flex flex-col justify-between shadow-lg`}>
                  <div className="flex items-start justify-between">
                    <Icon className="w-10 h-10 opacity-80 shrink-0" />
                    <div className={`text-right font-black leading-tight ml-2 ${stat.isLarge ? 'text-4xl' : 'text-2xl'}`}>
                      {stat.value}
                    </div>
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider opacity-80">{stat.title}</h3>
                </div>
              </Card>
            );
          })}
        </CardGrid>

        {/* Detailed History Table */}
        <div className="mt-8">
          <Card title="Attendance History">
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-4 px-4 text-sm font-bold text-gray-400 uppercase">Date</th>
                    <th className="py-4 px-4 text-sm font-bold text-gray-400 uppercase">Status</th>
                    <th className="py-4 px-4 text-sm font-bold text-gray-400 uppercase">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="3" className="py-10 text-center text-gray-500">Loading records...</td>
                    </tr>
                  ) : attendanceRecords.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="py-10 text-center text-gray-500 italic">No attendance records found.</td>
                    </tr>
                  ) : (
                    attendanceRecords
                      .sort((a, b) => b.date?.seconds - a.date?.seconds) // Sort by newest date
                      .map((record) => (
                        <tr key={record.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4 font-semibold text-gray-900">
                            {record.date?.toDate ? record.date.toDate().toLocaleDateString('en-GB') : record.date}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                              record.status === 'present' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-gray-600 text-sm">
                            {record.remarks || '---'}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}