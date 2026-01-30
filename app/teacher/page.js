'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';

export default function TeacherDashboard() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    
    if (!loading && userData && userData.role !== 'teacher') {
      router.push(`/${userData.role}`);
    }
  }, [user, userData, loading, router]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user || !userData) {
    return null;
  }

  const stats = [
    {
      title: 'My Classes',
      value: '0',
      icon: '📚',
      color: 'from-blue-500 to-cyan-500',
      link: '/teacher/classes'
    },
    {
      title: 'Assignments',
      value: '0',
      icon: '📝',
      color: 'from-purple-500 to-pink-500',
      link: '/teacher/assignments'
    },
    {
      title: 'Students',
      value: '0',
      icon: '👨‍🎓',
      color: 'from-green-500 to-emerald-500',
      link: '/teacher/students'
    },
    {
      title: "Today's Classes",
      value: '0',
      icon: '📅',
      color: 'from-orange-500 to-red-500',
      link: '/teacher/schedule'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Navbar */}
      <nav className="bg-white shadow-lg border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-bold text-xl">
                🎓 Smart School
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-gray-100 rounded-lg">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {userData?.name?.charAt(0) || 'T'}
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-gray-900">{userData?.name || 'Teacher'}</div>
                  <div className="text-gray-500 text-xs capitalize">{userData?.role || 'teacher'}</div>
                </div>
              </div>
              
              <button
                onClick={() => router.push('/login')}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome, {userData?.name}! 👋</h1>
          <p className="text-gray-600">Here's your teaching overview</p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300">
              <div className={`bg-gradient-to-r ${stat.color} rounded-xl p-6 text-white`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-5xl">{stat.icon}</div>
                  <div className="text-4xl font-bold">{stat.value}</div>
                </div>
                <h3 className="text-xl font-semibold">{stat.title}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/teacher/attendance" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all hover:scale-105">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-3xl">
                ✓
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Mark Attendance</h3>
                <p className="text-gray-600 text-sm">Take today's attendance</p>
              </div>
            </div>
          </Link>

          <Link href="/teacher/assignments" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all hover:scale-105">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-3xl">
                📝
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Create Assignment</h3>
                <p className="text-gray-600 text-sm">Add new assignments</p>
              </div>
            </div>
          </Link>

          <Link href="/teacher/marks" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all hover:scale-105">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-3xl">
                📊
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Grade Students</h3>
                <p className="text-gray-600 text-sm">Add marks & feedback</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              📅 Upcoming Classes
            </h2>
            <div className="text-gray-600">
              <p>No classes scheduled for today</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              📬 Recent Submissions
            </h2>
            <div className="text-gray-600">
              <p>No recent submissions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}