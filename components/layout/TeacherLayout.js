'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import TeacherLayout from '@/components/layout/TeacherLayout';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function MarksPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState(null);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    marks: '',
    totalMarks: '',
    remarks: '',
  });

  useEffect(() => {
    if (user) {
      fetchTeacherClasses();
    }
  }, [user]);

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
    } catch (error) {
      console.error('Error:', error);
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
      console.error('Error:', error);
    }
  };

  const fetchClassAssignments = async () => {
    try {
      const q = query(
        collection(db, 'assignments'),
        where('classId', '==', selectedClass)
      );
      const querySnapshot = await getDocs(q);
      const assignmentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error:', error);
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
      console.error('Error:', error);
    }
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
      
      setAlert({ type: 'success', message: 'Marks added successfully!' });
      setIsModalOpen(false);
      fetchSubmissions();
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    }
  };

  const getSubmissionStatus = (studentId) => {
    const submission = submissions.find(s => s.studentId === studentId);
    if (!submission) return { status: 'Not Submitted', color: 'bg-gray-100 text-gray-800' };
    if (submission.status === 'graded') return { status: `${submission.marks}/${submission.totalMarks}`, color: 'bg-green-100 text-green-800' };
    return { status: 'Submitted', color: 'bg-blue-100 text-blue-800' };
  };

  return (
    <TeacherLayout>
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Grade Students</h1>

      {alert && (
        <div className={`mb-6 p-4 rounded-lg ${alert.type === 'success' ? 'bg-green-50 border-l-4 border-green-600 text-green-800' : 'bg-red-50 border-l-4 border-red-600 text-red-800'}`}>
          <p>{alert.message}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg"
            >
              <option value="">Choose a class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Assignment</label>
            <select
              value={selectedAssignment}
              onChange={(e) => setSelectedAssignment(e.target.value)}
              disabled={!selectedClass}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg"
            >
              <option value="">Choose assignment</option>
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedClass && selectedAssignment && students.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left">Student</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-left">Marks</th>
                <th className="px-6 py-4 text-left">Grade</th>
                <th className="px-6 py-4 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const submission = submissions.find(s => s.studentId === student.id);
                const status = getSubmissionStatus(student.id);
                
                return (
                  <tr key={student.id} className="border-b hover:bg-blue-50">
                    <td className="px-6 py-4">{student.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${status.color}`}>
                        {status.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{submission?.marks || '-'}</td>
                    <td className="px-6 py-4">{submission?.grade || '-'}</td>
                    <td className="px-6 py-4">
                      {submission && (
                        <button
                          onClick={() => handleGradeSubmission(submission, student)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          {submission.marks ? 'Edit' : 'Grade'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <h2 className="text-2xl font-bold">Grade - {currentSubmission?.studentName}</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block mb-2">Marks Obtained</label>
                  <input
                    type="number"
                    value={formData.marks}
                    onChange={(e) => setFormData({...formData, marks: e.target.value})}
                    className="w-full px-4 py-3 border-2 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2">Total Marks</label>
                  <input
                    type="number"
                    value={formData.totalMarks}
                    onChange={(e) => setFormData({...formData, totalMarks: e.target.value})}
                    className="w-full px-4 py-3 border-2 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block mb-2">Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                  className="w-full px-4 py-3 border-2 rounded-lg"
                  rows="3"
                />
              </div>

              <div className="flex gap-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg">Save</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 border-2 py-3 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
}