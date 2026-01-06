'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { GraduationCap, Users, BookOpen, Award } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { user, userData, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && user && userData) {
      router.push(`/${userData.role}`);
    }
  }, [user, userData, loading, router]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-xl font-semibold">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-white mb-16">
          <h1 className="text-6xl font-bold mb-4">🎓 Smart School</h1>
          <p className="text-2xl opacity-90">Modern Institute Management System</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-white text-center hover:scale-105 transition-transform">
            <GraduationCap className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Students</h3>
            <p className="opacity-80">Manage student records & progress</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-white text-center hover:scale-105 transition-transform">
            <Users className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Teachers</h3>
            <p className="opacity-80">Faculty management & assignments</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-white text-center hover:scale-105 transition-transform">
            <BookOpen className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Classes</h3>
            <p className="opacity-80">Organize courses & schedules</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-white text-center hover:scale-105 transition-transform">
            <Award className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Performance</h3>
            <p className="opacity-80">Track marks & attendance</p>
          </div>
        </div>
        
        <div className="text-center">
          <button
            onClick={() => router.push('/login')}
            className="bg-white text-purple-600 px-12 py-4 rounded-full text-xl font-bold hover:bg-gray-100 shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105"
          >
            Get Started →
          </button>
        </div>
      </div>
    </div>
  );
}
