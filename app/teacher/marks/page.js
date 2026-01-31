'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function MarksPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState(null);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    marks: '',
    totalMarks: '',
    remarks: '',
    grade: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    
    if (!authLoading && userData && userData.role !== 'teacher') {
      router.push(`/${userData.role}`);
    }
  }, [user, userData, authLoading, router]);

  useEffect(() => {
    if (user && userData?.role === 'teacher') {
      fetchTeacherClasses();
    }
  }, [user, userData]);

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
      const classesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClasses(classesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setLoading(false);
    }
  };

  const fetchClassStudents = async () => {
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'student'),
        where('classId', '==', selectedClass)
      );
      const querySnapshot = await getDocs(q);
      const studentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchClassAssignments = async () => {
    try {
      const q = query(
        collection(db, 'assignments'),
        where('classId', '==', selectedClass),
        where('teacherId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const assignmentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const q = query(
        collection(db, 'submissions'),
        where('assignmentId', '==', selectedAssignment)
      );
      const querySnapshot = await getDocs(q);
      const submissionsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      grade: submission.grade || '',
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
      
      setAlert({ type: 'success', message: 'Marks added successfully!' });
      handleCloseModal();
      fetchSubmissions();
    } catch (error) {
      console.error('Error saving marks:', error);
      setAlert({ type: 'error', message: error.message });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentSubmission(null);
    setFormData({
      marks: '',
      totalMarks: '',
      remarks: '',
      grade: '',
    });
  };

  const getStudentById = (studentId) => {
    return students.find(s => s.id === studentId);
  };

  const getSubmissionStatus = (studentId) => {
    const submission = submissions.find(s => s.studentId === studentId);
    if (!submission) return { status: 'Not Submitted', color: 'bg-gray-100 text-gray-800' };
    if (submission.status === 'graded') return { status: `Graded: ${submission.marks}/${submission.totalMarks}`, color: 'bg-green-100 text-green-800' };
    return { status: 'Submitted', color: 'bg-blue-100 text-blue-800' };
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <nav className="bg-white shadow-lg border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/teacher')} className="text-gray-600 hover:text-gray-900">
                Back
              </button>
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-bold text-xl">
                Grade Students
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Add Marks and Grades</h1>

        {alert && (
          <div className={`mb-6 p-4 rounded-lg ${alert.type === 'success' ? 'bg-green-50 border-l-4 border-green-600 text-green-800' : 'bg-red-50 border-l-4 border-red-600 text-red-800'}`}>
            <div className="flex items-center justify-between">
              <p>{alert.message}</p>
              <button onClick={() => setAlert(null)} className="text-2xl">&times;</button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Class <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedAssignment('');
                }}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              >
                <option value="">Choose a class</option>
                {classes.map((classData) => (
                  <option key={classData.id} value={classData.id}>
                    {classData.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Assignment <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedAssignment}
                onChange={(e) => setSelectedAssignment(e.target.value)}
                disabled={!selectedClass}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none disabled:bg-gray-100"
              >
                <option value="">Choose an assignment</option>
                {assignments.map((assignment) => (
                  <option key={assignment.id} value={assignment.id}>
                    {assignment.title} (Total: {assignment.totalMarks} marks)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {selectedClass && selectedAssignment && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
              <h2 className="text-2xl font-bold text-white">Students and Submissions</h2>
            </div>

            {students.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No students assigned to this class
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Roll No</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Student Name</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Marks</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Grade</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {students.map((student) => {
                      const submission = submissions.find(s => s.studentId === student.id);
                      const statusInfo = getSubmissionStatus(student.id);
                      
                      return (
                        <tr key={student.id} className="hover:bg-blue-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-900">{student.rollNumber || 'N/A'}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">{student.name}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                              {statusInfo.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {submission?.marks ? `${submission.marks}/${submission.totalMarks}` : '-'}
                          </td>
                          <td className="px-6 py-4">
                            {submission?.grade && (
                              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">
                                {submission.grade}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {submission ? (
                              <button
                                onClick={() => handleGradeSubmission(submission, student)}
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold text-sm"
                              >
                                {submission.marks ? 'Edit Marks' : 'Add Marks'}
                              </button>
                            ) : (
                              <span className="text-gray-400 text-sm">Not submitted</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {!selectedClass && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Select a Class</h3>
            <p className="text-gray-600">Choose a class and assignment to start grading</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                Grade Submission - {currentSubmission?.studentName}
              </h2>
              <button onClick={handleCloseModal} className="text-white text-3xl hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center">
                &times;
              </button>
            </div>
            
          <form onSubmit={handleSubmit} className="p-6">
  {currentSubmission?.fileUrl && (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
      <p className="text-sm text-gray-700 mb-2">Submitted File:</p>
      <a
        href={currentSubmission.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline font-semibold"
      >
        View Submission
      </a>
    </div>
  )}

              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Marks Obtained <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="marks"
                    value={formData.marks}
                    onChange={handleChange}
                    required
                    min="0"
                    max={formData.totalMarks}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Total Marks <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="totalMarks"
                    value={formData.totalMarks}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                </div>
              </div>

              {formData.marks && formData.totalMarks && (
                <div className="mb-4 p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    Percentage: <span className="font-bold">{((formData.marks / formData.totalMarks) * 100).toFixed(2)}%</span>
                  </p>
                  <p className="text-sm text-gray-700">
                    Grade: <span className="font-bold text-purple-600">{calculateGrade(Number(formData.marks), Number(formData.totalMarks))}</span>
                  </p>
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Remarks / Feedback
                </label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Add feedback for the student..."
                  rows="4"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                />
              </div>
              
              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-xl transition-all"
                >
                  Save Marks
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}