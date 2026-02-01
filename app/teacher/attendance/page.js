'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/lib/hooks/useAuth';
import { getDocuments, markAttendance, getAttendanceByDate } from '@/lib/firestore';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getTodayDate } from '@/lib/utils/formatters';
import { ATTENDANCE_STATUS } from '@/lib/utils/constants';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function AttendancePage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [alert, setAlert] = useState(null);
  
  const [dataLoading, setDataLoading] = useState(true); // Unified Loading State
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 1. Auth and Initial Class Fetch
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (userData?.role !== 'teacher') {
        router.push(`/${userData?.role || 'login'}`);
      } else {
        fetchTeacherClasses();
      }
    }
  }, [user, userData, authLoading]);

  const fetchTeacherClasses = async () => {
    try {
      const q = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      setClasses(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setDataLoading(false);
    }
  };

  // 2. Fetch Students and existing Attendance when class/date changes
  useEffect(() => {
    if (selectedClass) {
      loadStudentsAndAttendance();
    }
  }, [selectedClass, selectedDate]);

  const loadStudentsAndAttendance = async () => {
    setStudentsLoading(true);
    try {
      // Load Students
      const { data } = await getDocuments('users', [
        { field: 'role', operator: '==', value: 'student' },
        { field: 'classId', operator: '==', value: selectedClass }
      ]);
      setStudents(data || []);

      // Load existing attendance for this date
      const attendanceResult = await getAttendanceByDate(selectedClass, selectedDate);
      const attendanceMap = {};
      if (attendanceResult.data) {
        attendanceResult.data.forEach(record => {
          attendanceMap[record.studentId] = record.status;
        });
      }
      setAttendance(attendanceMap);
    } catch (error) {
      console.error("Error loading student data:", error);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      for (const student of students) {
        const status = attendance[student.id] || ATTENDANCE_STATUS.ABSENT;
        await markAttendance(selectedClass, selectedDate, student.id, status);
      }
      setAlert({ type: 'success', message: 'Attendance marked successfully!' });
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to save attendance.' });
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case ATTENDANCE_STATUS.PRESENT: return <CheckCircle className="w-5 h-5 text-green-600" />;
      case ATTENDANCE_STATUS.LATE: return <Clock className="w-5 h-5 text-yellow-600" />;
      default: return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case ATTENDANCE_STATUS.PRESENT: return <Badge variant="success">Present</Badge>;
      case ATTENDANCE_STATUS.LATE: return <Badge variant="warning">Late</Badge>;
      default: return <Badge variant="danger">Absent</Badge>;
    }
  };

  // SINGLE CIRCULAR SPINNER (Matches Marks/Assignments/Announcements)
  if (authLoading || dataLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="p-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Mark Attendance</h1>
        
        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} className="mb-6" />}
        
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Select
              label="Select Class"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              options={[
               ...classes.map(c => ({ value: c.id, label: c.name }))
              ]}
            />
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-10 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>
          
          {selectedClass && (
            <>
              {studentsLoading ? (
                <div className="text-center py-12">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-12 text-gray-500 border-2 border-dashed rounded-xl">
                  No students assigned to this class.
                </div>
              ) : (
                <div className="space-y-4">
                  {students.map(student => (
                    <div key={student.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-4 mb-4 md:mb-0">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{student.name}</p>
                          <p className="text-xs text-gray-500">Roll No: {student.rollNumber || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2 mr-4">
                          {getStatusIcon(attendance[student.id])}
                          {getStatusBadge(attendance[student.id])}
                        </div>
                        
                        <div className="flex bg-white p-1 rounded-lg border shadow-sm">
                          <button
                            onClick={() => handleStatusChange(student.id, ATTENDANCE_STATUS.PRESENT)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${attendance[student.id] === ATTENDANCE_STATUS.PRESENT ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                          >
                            Present
                          </button>
                          <button
                            onClick={() => handleStatusChange(student.id, ATTENDANCE_STATUS.LATE)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${attendance[student.id] === ATTENDANCE_STATUS.LATE ? 'bg-yellow-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                          >
                            Late
                          </button>
                          <button
                            onClick={() => handleStatusChange(student.id, ATTENDANCE_STATUS.ABSENT)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${attendance[student.id] === ATTENDANCE_STATUS.ABSENT ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                          >
                            Absent
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-8">
                    <Button onClick={handleSubmit} fullWidth disabled={saving}>
                      {saving ? 'Saving...' : 'Submit Attendance'}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}