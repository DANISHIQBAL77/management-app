'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/lib/hooks/useAuth';
import { useFirestore } from '@/lib/hooks/useFirestore';
import { getDocuments } from '@/lib/firestore';
import { markAttendance, getAttendanceByDate } from '@/lib/firestore';
import { getTodayDate } from '@/lib/utils/formatters';
import { ATTENDANCE_STATUS } from '@/lib/utils/constants';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function AttendancePage() {
  const { userData } = useAuth();
  const { documents: classes } = useFirestore('classes', [
    { field: 'teacherId', operator: '==', value: userData?.uid || '' }
  ]);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    if (selectedClass) {
      loadStudents();
      loadAttendance();
    }
  }, [selectedClass, selectedDate]);
  
  const loadStudents = async () => {
    setLoading(true);
    const { data } = await getDocuments('users', [
      { field: 'role', operator: '==', value: 'student' },
      { field: 'classId', operator: '==', value: selectedClass }
    ]);
    setStudents(data || []);
    setLoading(false);
  };
  
  const loadAttendance = async () => {
    const { data } = await getAttendanceByDate(selectedClass, selectedDate);
    const attendanceMap = {};
    if (data) {
      data.forEach(record => {
        attendanceMap[record.studentId] = record.status;
      });
    }
    setAttendance(attendanceMap);
  };
  
  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };
  
  const handleSubmit = async () => {
    setSaving(true);
    
    for (const student of students) {
      const status = attendance[student.id] || ATTENDANCE_STATUS.ABSENT;
      await markAttendance(selectedClass, selectedDate, student.id, status);
    }
    
    setAlert({ type: 'success', message: 'Attendance marked successfully!' });
    setSaving(false);
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case ATTENDANCE_STATUS.PRESENT:
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case ATTENDANCE_STATUS.LATE:
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case ATTENDANCE_STATUS.PRESENT:
        return <Badge variant="success">Present</Badge>;
      case ATTENDANCE_STATUS.LATE:
        return <Badge variant="warning">Late</Badge>;
      default:
        return <Badge variant="danger">Absent</Badge>;
    }
  };
  
  return (
    <DashboardLayout requiredRole="teacher">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Mark Attendance</h1>
        
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
            className="mb-6"
          />
        )}
        
        <Card>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <Select
              label="Select Class"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              options={classes.map(c => ({ value: c.id, label: c.name }))}
            />
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-10 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                />
              </div>
            </div>
          </div>
          
          {selectedClass && (
            <>
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading students...</p>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No students assigned to this class
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6">
                    {students.map(student => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{student.name}</p>
                            <p className="text-sm text-gray-600">Roll: {student.rollNumber}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {getStatusIcon(attendance[student.id])}
                          {getStatusBadge(attendance[student.id])}
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleStatusChange(student.id, ATTENDANCE_STATUS.PRESENT)}
                              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                attendance[student.id] === ATTENDANCE_STATUS.PRESENT
                                  ? 'bg-green-600 text-white'
                                  : 'bg-white border-2 border-green-600 text-green-600 hover:bg-green-50'
                              }`}
                            >
                              Present
                            </button>
                            
                            <button
                              onClick={() => handleStatusChange(student.id, ATTENDANCE_STATUS.LATE)}
                              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                attendance[student.id] === ATTENDANCE_STATUS.LATE
                                  ? 'bg-yellow-600 text-white'
                                  : 'bg-white border-2 border-yellow-600 text-yellow-600 hover:bg-yellow-50'
                              }`}
                            >
                              Late
                            </button>
                            
                            <button
                              onClick={() => handleStatusChange(student.id, ATTENDANCE_STATUS.ABSENT)}
                              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                attendance[student.id] === ATTENDANCE_STATUS.ABSENT
                                  ? 'bg-red-600 text-white'
                                  : 'bg-white border-2 border-red-600 text-red-600 hover:bg-red-50'
                              }`}
                            >
                              Absent
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Button onClick={handleSubmit} fullWidth disabled={saving}>
                    {saving ? 'Saving Attendance...' : 'Save Attendance'}
                  </Button>
                </>
              )}
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
