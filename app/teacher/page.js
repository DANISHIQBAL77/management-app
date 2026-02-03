'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { collection, query, where, getDocs, onSnapshot, doc, updateDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Bell, X, CheckCircle, Clock, BookOpen, User } from 'lucide-react';

export default function TeacherDashboard() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();

  // Dashboard Stats State
  const [classCount, setClassCount] = useState('0');
  const [assignmentCount, setAssignmentCount] = useState('0');
  const [studentCount, setStudentCount] = useState('0');
  const [dataLoading, setDataLoading] = useState(true);

  // New State for Recent Activity
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [todayClasses, setTodayClasses] = useState([]);

  // Notifications State
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
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (userData && userData.role !== 'teacher') {
        router.push(`/${userData.role}`);
      } else {
        fetchDashboardData();
        
        // Real-time Notifications Listener
        const q = query(
          collection(db, 'notifications'),
          where('recipientId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(5)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => unsubscribe();
      }
    }
  }, [user, userData, authLoading, router]);

  const fetchDashboardData = async () => {
    if (!user?.uid) return;
    try {
      setDataLoading(true);

      // 1. Fetch Teacher's Classes
      const classesQ = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
      const classesSnap = await getDocs(classesQ);
      const classList = classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClassCount(classList.length.toString());

      // 2. Fetch Teacher's Assignments
      const assignmentsQ = query(collection(db, 'assignments'), where('teacherId', '==', user.uid));
      const assignmentsSnap = await getDocs(assignmentsQ);
      const assignmentList = assignmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAssignmentCount(assignmentList.length.toString());

      // 3. Fetch Student Count
      if (classList.length > 0) {
        const classIds = classList.map(doc => doc.id);
        const studentsQ = query(
          collection(db, 'users'), 
          where('role', '==', 'student'), 
          where('classId', 'in', classIds.slice(0, 10))
        );
        const studentsSnap = await getDocs(studentsQ);
        setStudentCount(studentsSnap.docs.length.toString());
      }

      // 4. Handle Today's Classes
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = days[new Date().getDay()];
      const classesForToday = classList.filter(cls => 
        cls.scheduleDays?.includes(today) || cls.days?.includes(today) || !cls.scheduleDays // Fallback: show all if no schedule set
      );
      setTodayClasses(classesForToday);

      // 5. Handle Recent Submissions
      if (assignmentList.length > 0) {
        const assignmentIds = assignmentList.map(a => a.id).slice(0, 10);
        
        // We query submissions linked to the teacher's assignments
        const submissionsQ = query(
          collection(db, 'submissions'),
          where('assignmentId', 'in', assignmentIds),
          orderBy('submittedAt', 'desc'),
          limit(5)
        );
        
        const subSnap = await getDocs(submissionsQ);
        setRecentSubmissions(subSnap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Cross-reference title from our local assignment list
            assignmentTitle: assignmentList.find(a => a.id === data.assignmentId)?.title || 'Assignment'
          };
        }));
      }

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setDataLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { status: 'read' });
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  if (authLoading || dataLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const stats = [
    { title: 'My Classes', value: classCount, icon: '📚', color: 'from-blue-500 to-cyan-500' },
    { title: 'Assignments', value: assignmentCount, icon: '📝', color: 'from-purple-500 to-pink-500' },
    { title: 'Students', value: studentCount, icon: '👨‍🎓', color: 'from-green-500 to-emerald-500' },
    { title: "Today's Classes", value: todayClasses.length.toString(), icon: '📅', color: 'from-orange-500 to-red-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <nav className="bg-white shadow-lg border-b-4 border-blue-600 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-bold text-xl">
                🎓 Smart School
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative" ref={notificationRef}>
                <button onClick={() => setShowNotifs(!showNotifs)} className="relative p-2 bg-gray-100 rounded-full">
                  <Bell className="w-6 h-6 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                    <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800">Notifications</h3>
                      <button onClick={() => setShowNotifs(false)}><X className="w-4 h-4 text-gray-400" /></button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">No notifications yet</div>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id} 
                            onClick={() => markAsRead(notif.id)}
                            className={`p-4 border-b cursor-pointer transition-colors ${notif.status === 'unread' ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                          >
                            <p className="text-sm font-bold text-gray-900">{notif.title || 'New Update'}</p>
                            <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 px-4 py-2 bg-gray-100 rounded-lg">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {userData?.name?.charAt(0) || 'T'}
                </div>
                <div className="text-sm hidden sm:block">
                  <div className="font-semibold text-gray-900">{userData?.name || 'Teacher'}</div>
                </div>
              </div>
              
              <button onClick={() => router.push('/login')} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome, {userData?.name}! 👋</h1>
          <p className="text-gray-600">Here's your teaching overview</p>
        </div>
        
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/teacher/attendance" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all hover:scale-105">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-3xl">✓</div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Mark Attendance</h3>
                <p className="text-gray-600 text-sm">Take today's attendance</p>
              </div>
            </div>
          </Link>
          <Link href="/teacher/assignments" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all hover:scale-105">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-3xl">📝</div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Create Assignment</h3>
                <p className="text-gray-600 text-sm">Add new assignments</p>
              </div>
            </div>
          </Link>
          <Link href="/teacher/marks" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all hover:scale-105">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-3xl">📊</div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Grade Students</h3>
                <p className="text-gray-600 text-sm">Add marks & feedback</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">📅 Upcoming Classes</h2>
            <div className="space-y-4">
              {todayClasses.length === 0 ? (
                <p className="text-gray-500 italic text-center py-4">No classes scheduled for today</p>
              ) : (
                todayClasses.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-bold text-gray-800">{cls.name}</p>
                        <p className="text-s text-gray-500">Section: {cls.section}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-blue-700 font-medium text-sm">
                      Class Room: {cls.room || 'N/A'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">📬 Recent Submissions</h2>
            <div className="space-y-4">
              {recentSubmissions.length === 0 ? (
                <p className="text-gray-500 italic text-center py-4">No recent submissions</p>
              ) : (
                recentSubmissions.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="font-bold text-gray-800">{sub.studentName}</p>
                        <p className="text-xs text-gray-500">{sub.assignmentTitle}</p>
                      </div>
                    </div>
                    <Link href={`/teacher/marks`} className="text-xs bg-purple-600 text-white px-3 py-1 rounded-full hover:bg-purple-700 transition-colors">
                      Grade
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}