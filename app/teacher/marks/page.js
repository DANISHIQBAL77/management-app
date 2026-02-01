'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// UI Components
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input, { Select, Textarea } from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';

export default function MarksPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [dataLoading, setDataLoading] = useState(true); // Renamed for clarity
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState(null);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    marks: '',
    totalMarks: '',
    remarks: '',
  });

  // 1. Auth & Initial Data Fetching
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

  // 2. Dependancy Fetches
  useEffect(() => {
    if (selectedClass) {
      fetchClassStudents();
      fetchClassAssignments();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedAssignment) {
      fetchSubmissions();
    }
  }, [selectedAssignment]);

  const fetchTeacherClasses = async () => {
    try {
      const q = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      setClasses(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setDataLoading(false); // Stop the spinner once classes are loaded
    }
  };

  const fetchClassStudents = async () => {
    const q = query(collection(db, 'users'), where('role', '==', 'student'), where('classId', '==', selectedClass));
    const querySnapshot = await getDocs(q);
    setStudents(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchClassAssignments = async () => {
    const q = query(collection(db, 'assignments'), where('classId', '==', selectedClass), where('teacherId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    setAssignments(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchSubmissions = async () => {
    const q = query(collection(db, 'submissions'), where('assignmentId', '==', selectedAssignment));
    const querySnapshot = await getDocs(q);
    setSubmissions(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const calculateGrade = (marks, totalMarks) => {
    const percentage = (marks / totalMarks) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  const handleGradeSubmission = (submission, student) => {
    setCurrentSubmission({ ...submission, studentName: student.name });
    const assignment = assignments.find(a => a.id === selectedAssignment);
    setFormData({
      marks: submission.marks || '',
      totalMarks: assignment?.totalMarks || '',
      remarks: submission.remarks || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const grade = calculateGrade(Number(formData.marks), Number(formData.totalMarks));
      const submissionRef = doc(db, 'submissions', currentSubmission.id);
      await updateDoc(submissionRef, {
        marks: Number(formData.marks),
        totalMarks: Number(formData.totalMarks),
        remarks: formData.remarks,
        grade: grade,
        gradedAt: new Date().toISOString(),
        status: 'graded',
      });
      setAlert({ type: 'success', message: 'Marks updated!' });
      setIsModalOpen(false);
      fetchSubmissions();
    } catch (error) { setAlert({ type: 'error', message: error.message }); }
  };

  // SINGLE CIRCULAR SPINNER LOGIC
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
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Grading & Marks</h1>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} className="mb-6" />}

        <Card className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
            <Select
              label="Select Class"
              value={selectedClass}
              onChange={(e) => { setSelectedClass(e.target.value); setSelectedAssignment(''); }}
              options={[
                ...classes.map(c => ({ value: c.id, label: c.name }))
              ]}
            />
            <Select
              label="Select Assignment"
              value={selectedAssignment}
              onChange={(e) => setSelectedAssignment(e.target.value)}
              disabled={!selectedClass}
              options={[
                ...assignments.map(a => ({ value: a.id, label: `${a.title} (Max: ${a.totalMarks})` }))
              ]}
            />
          </div>
        </Card>

        {selectedClass && selectedAssignment ? (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="p-4 font-bold text-gray-700">Student Name</th>
                    <th className="p-4 font-bold text-gray-700">Status</th>
                    <th className="p-4 font-bold text-gray-700">Marks</th>
                    <th className="p-4 font-bold text-gray-700">Grade</th>
                    <th className="p-4 font-bold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const submission = submissions.find(s => s.studentId === student.id);
                    return (
                      <tr key={student.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-medium">{student.name}</td>
                        <td className="p-4">
                          {!submission ? <Badge variant="outline">Not Submitted</Badge> : 
                           submission.status === 'graded' ? <Badge variant="success">Graded</Badge> : 
                           <Badge variant="primary">Submitted</Badge>}
                        </td>
                        <td className="p-4">{submission?.marks ? `${submission.marks}/${submission.totalMarks}` : '-'}</td>
                        <td className="p-4">{submission?.grade ? <Badge>{submission.grade}</Badge> : '-'}</td>
                        <td className="p-4">
                          {submission && (
                            <Button size="sm" onClick={() => handleGradeSubmission(submission, student)}>
                              {submission.marks ? 'Edit Marks' : 'Grade'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed">
            <p className="text-gray-400 font-medium">Please select a class and an assignment to begin grading.</p>
          </div>
        )}

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Grading: ${currentSubmission?.studentName}`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {currentSubmission?.fileUrl && (
              <div className="p-3 bg-blue-50 rounded flex justify-between items-center">
                <span className="text-sm font-medium">Student's Work:</span>
                <a href={currentSubmission.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm font-bold">View File</a>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Input label="Marks Obtained" type="number" name="marks" value={formData.marks} onChange={(e) => setFormData({...formData, marks: e.target.value})} required />
              <Input label="Total Marks" type="number" name="totalMarks" value={formData.totalMarks} readOnly />
            </div>
            <Textarea label="Feedback/Remarks" name="remarks" value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})} rows={3} />
            <div className="flex gap-3">
              <Button type="submit" fullWidth>Save Grade</Button>
              <Button type="button" variant="outline" fullWidth onClick={() => setIsModalOpen(false)}>Cancel</Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}