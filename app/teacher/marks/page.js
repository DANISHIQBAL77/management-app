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
  const [dataLoading, setDataLoading] = useState(true); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState(null);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    marks: '',
    totalMarks: '',
    remarks: '',
  });

  const getFileType = (fileName) => {
    if (!fileName) return null;
    const extension = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return 'image';
    if (['mp4', 'webm', 'ogg'].includes(extension)) return 'video';
    if (['pdf'].includes(extension)) return 'pdf';
    return 'document';
  };

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
      setDataLoading(false);
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

  const handleGradeSubmission = (submission, student) => {
    setCurrentSubmission({ ...submission, studentName: student.name });
    const assignment = assignments.find(a => a.id === selectedAssignment);
    setFormData({
      marks: submission.marks || '',
      totalMarks: submission.totalMarks || assignment?.totalMarks || '',
      remarks: submission.remarks || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submissionRef = doc(db, 'submissions', currentSubmission.id);
      await updateDoc(submissionRef, {
        marks: Number(formData.marks),
        totalMarks: Number(formData.totalMarks),
        remarks: formData.remarks,
        status: 'graded',
        gradedAt: new Date().toISOString(),
      });
      setAlert({ type: 'success', message: 'Grade updated!' });
      setIsModalOpen(false);
      fetchSubmissions();
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    }
  };

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="p-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Grading</h1>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} className="mb-6" />}

        <Card className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
            <Select
              label="Select Class"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              options={classes.map(c => ({ value: c.id, label: c.name }))}
            />
            <Select
              label="Select Assignment"
              value={selectedAssignment}
              onChange={(e) => setSelectedAssignment(e.target.value)}
              disabled={!selectedClass}
              options={assignments.map(a => ({ value: a.id, label: a.title }))}
            />
          </div>
        </Card>

        {selectedAssignment && (
          <Card>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-gray-50 text-sm">
                  <th className="p-4 font-bold">Student</th>
                  <th className="p-4 font-bold">File</th>
                  <th className="p-4 font-bold text-center">Marks</th>
                  <th className="p-4 font-bold">Remarks</th> {/* NEW COLUMN */}
                  <th className="p-4 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const submission = submissions.find(s => s.studentId === student.id);
                  return (
                    <tr key={student.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium">{student.name}</td>
                      <td className="p-4">
                        {submission?.fileName ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-blue-600 truncate max-w-[120px]">
                              {submission.fileName}
                            </span>
                          </div>
                        ) : <span className="text-gray-300">No file</span>}
                      </td>
                      <td className="p-4 text-center">
                         {submission?.marks !== undefined ? (
                           <Badge variant="success">{submission.marks}/{submission.totalMarks}</Badge>
                         ) : "-"}
                      </td>
                      {/* SHOW REMARKS IN ROW */}
                      <td className="p-4">
                        <span className="text-sm text-gray-600 italic truncate max-w-[150px] block">
                          {submission?.remarks || <span className="text-gray-300">No remarks</span>}
                        </span>
                      </td>
                      <td className="p-4 flex justify-center gap-2">
                        {submission && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => window.open(submission.fileUrl, '_blank')}
                              disabled={!submission.fileUrl}
                              title={!submission.fileUrl ? "No URL found in database" : "View File"}
                            >
                              View
                            </Button>
                            <Button size="sm" onClick={() => handleGradeSubmission(submission, student)}>
                              Grade
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Review: ${currentSubmission?.studentName}`}>
          <div className="mb-6 space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="bg-white rounded border flex items-center justify-center min-h-[150px]">
                {currentSubmission?.fileUrl ? (
                  <>
                    {getFileType(currentSubmission.fileName) === 'image' && (
                      <img src={currentSubmission.fileUrl} className="max-h-[300px] w-full object-contain" alt="preview" />
                    )}
                    {getFileType(currentSubmission.fileName) === 'video' && (
                      <video src={currentSubmission.fileUrl} controls className="max-h-[300px] w-full" />
                    )}
                    {getFileType(currentSubmission.fileName) === 'pdf' && (
                      <iframe src={currentSubmission.fileUrl} className="w-full h-[300px]" title="PDF Preview" />
                    )}
                  </>
                ) : (
                  <div className="text-center p-6 text-gray-500 text-sm">
                    No preview available for: {currentSubmission?.fileName}
                  </div>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Marks" type="number" value={formData.marks} onChange={(e) => setFormData({...formData, marks: e.target.value})} required />
              <Input label="Out of" type="number" value={formData.totalMarks} readOnly />
            </div>
            <Textarea label="Remarks" value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})} rows={2} placeholder="Add feedback..." />
            <Button type="submit" fullWidth>Save Marks</Button>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}