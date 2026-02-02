'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase'; // Ensure storage is imported
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// UI Components
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';

export default function StudentMarksPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [submissions, setSubmissions] = useState([]);
  const [assignmentsMap, setAssignmentsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);
  const [newFile, setNewFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else {
        fetchData();
      }
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    try {
      const assignmentsSnap = await getDocs(collection(db, 'assignments'));
      const aMap = {};
      assignmentsSnap.docs.forEach(doc => {
        aMap[doc.id] = doc.data().title;
      });
      setAssignmentsMap(aMap);

      const q = query(collection(db, 'submissions'), where('studentId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      setSubmissions(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (submission) => {
    setSelectedSub(submission);
    setIsEditModalOpen(true);
  };

  const handleUpdateSubmission = async (e) => {
    e.preventDefault();
    if (!newFile) {
      setAlert({ type: 'error', message: 'Please select a new file to upload.' });
      return;
    }

    setUploading(true);
    try {
      // 1. Upload new file to Storage
      const fileRef = ref(storage, `submissions/${user.uid}_${Date.now()}_${newFile.name}`);
      const uploadResult = await uploadBytes(fileRef, newFile);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // 2. Update Firestore document
      const subRef = doc(db, 'submissions', selectedSub.id);
      await updateDoc(subRef, {
        fileUrl: downloadURL,
        fileName: newFile.name,
        submittedAt: new Date(), // Update timestamp
        status: 'pending' // Reset status to pending so teacher can re-grade
      });

      setAlert({ type: 'success', message: 'Work updated successfully!' });
      setIsEditModalOpen(false);
      setNewFile(null);
      fetchData(); // Refresh list
    } catch (error) {
      setAlert({ type: 'error', message: 'Update failed: ' + error.message });
    } finally {
      setUploading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const subjects = [...new Set(submissions.map(s => s.subject || 'General'))];

  return (
    <DashboardLayout requiredRole="student">
      <div className="p-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">My Performance</h1>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} className="mb-6" />}

        {/* OLD CARDS LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {subjects.map((subject) => {
            const subjectSubmissions = submissions.filter(s => (s.subject || 'General') === subject);
            const totalObtained = subjectSubmissions.reduce((acc, curr) => acc + (curr.marks || 0), 0);
            const totalPossible = subjectSubmissions.reduce((acc, curr) => acc + (curr.totalMarks || 0), 0);
            return (
              <Card key={subject} className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-xl">
                <h3 className="text-lg font-bold opacity-80 uppercase tracking-wider">{subject}</h3>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-black">{totalObtained}</span>
                  <span className="text-xl opacity-60">/ {totalPossible}</span>
                </div>
                <p className="mt-2 text-sm opacity-90">Overall Score</p>
              </Card>
            );
          })}
        </div>

        {/* ASSIGNMENT TABLE */}
        <Card title="Detailed Results">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-gray-50 text-sm">
                  <th className="p-4 font-bold">Assignment Title</th>
                  <th className="p-4 font-bold text-center">Marks</th>
                  <th className="p-4 font-bold">Remarks</th>
                  <th className="p-4 font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr key={sub.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold text-gray-900">{assignmentsMap[sub.assignmentId] || "Assignment"}</p>
                      <p className="text-[10px] text-gray-400 truncate max-w-[150px]">{sub.fileName}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-bold text-gray-800">{sub.marks ?? '--'}</span>
                      <span className="text-gray-400 text-xs">/{sub.totalMarks}</span>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-gray-600 italic">{sub.remarks || "No remarks"}</p>
                    </td>
                    <td className="p-4 text-center">
                      <Button variant="outline" size="sm" onClick={() => handleEditClick(sub)}>
                        Edit Work
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* EDIT POPUP (MODAL) */}
        <Modal 
          isOpen={isEditModalOpen} 
          onClose={() => !uploading && setIsEditModalOpen(false)} 
          title="Update Submission"
        >
          <form onSubmit={handleUpdateSubmission} className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Current File</p>
              <p className="text-sm text-gray-700 font-medium truncate">{selectedSub?.fileName || 'No file attached'}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">Upload New Version</label>
              <input 
                type="file" 
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                onChange={(e) => setNewFile(e.target.files[0])}
                disabled={uploading}
              />
              <p className="text-[10px] text-gray-400 italic">Uploading a new file will reset your grading status to "Pending Review".</p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" fullWidth disabled={uploading}>
                {uploading ? 'Uploading...' : 'Confirm Update'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                fullWidth 
                onClick={() => setIsEditModalOpen(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}