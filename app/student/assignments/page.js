'use client';
import { useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardGrid } from '@/components/ui/Card';
import { FileText, Clock, Send, CheckCircle, Paperclip, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useFirestore } from '@/lib/hooks/useFirestore';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function StudentAssignmentsPage() {
  const { user, userData } = useAuth();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeAssignmentId, setActiveAssignmentId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch assignments and submissions
  const { documents: assignments, loading: assignmentsLoading } = useFirestore('assignments', [
    { field: 'classId', operator: '==', value: userData?.classId || '' }
  ]);

  const { documents: submissions } = useFirestore('submissions', [
    { field: 'studentId', operator: '==', value: user?.uid || '' }
  ]);

  const submittedIds = submissions.map(s => s.assignmentId);
  const pendingCount = assignments.length - submittedIds.length;

  const stats = [
    { title: 'Total Assigned', value: assignments.length, icon: FileText, color: 'from-blue-500 to-cyan-500' },
    { title: 'Pending', value: pendingCount, icon: AlertCircle, color: 'from-orange-500 to-red-500' },
    { title: 'Completed', value: submittedIds.length, icon: CheckCircle, color: 'from-green-500 to-emerald-500' },
  ];

  const handleFileChange = (e, assignmentId) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setActiveAssignmentId(assignmentId);
    }
  };

  const handleUpload = async (assignmentId) => {
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      await addDoc(collection(db, 'submissions'), {
        assignmentId,
        studentId: user.uid,
        studentName: userData.name,
        rollNo: userData.rollNo || 'N/A',
        fileName: selectedFile.name,
        submittedAt: serverTimestamp(),
        status: 'submitted'
      });
      setSelectedFile(null);
      setActiveAssignmentId(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DashboardLayout requiredRole="student">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">My Assignments</h1>
        <p className="text-gray-600 mb-8">Manage your tasks and submit your work</p>

        {/* Stats Cards - Gradient Style */}
        <CardGrid cols={3}>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} hover>
                <div className={`bg-gradient-to-r ${stat.color} rounded-xl p-6 text-white h-[140px] flex flex-col justify-between shadow-lg`}>
                  <div className="flex items-start justify-between">
                    <Icon className="w-10 h-10 opacity-80" />
                    <div className="text-4xl font-black">{stat.value}</div>
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider opacity-90">{stat.title}</h3>
                </div>
              </Card>
            );
          })}
        </CardGrid>

        {/* Assignment List - Original Row Layout */}
        <div className="mt-10 space-y-4">
          {assignmentsLoading ? (
            <p className="text-gray-500 italic">Loading...</p>
          ) : (
            assignments.map((assignment) => {
              const isDone = submittedIds.includes(assignment.id);
              const isFilePicked = activeAssignmentId === assignment.id && selectedFile;

              return (
                <div key={assignment.id} className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${isDone ? 'bg-green-50' : 'bg-blue-50'}`}>
                        <FileText className={isDone ? 'text-green-600' : 'text-blue-600'} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-lg">{assignment.title}</p>
                        <p className="text-sm text-gray-600">{assignment.description}</p>
                        <p className="text-xs text-gray-400 mt-1 uppercase font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Due: {assignment.dueDate}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isDone ? (
                        <div className="flex items-center gap-1 text-green-600 font-bold text-sm bg-green-50 px-4 py-2 rounded-lg border border-green-100">
                          <CheckCircle className="w-4 h-4" /> Submitted
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input 
                            type="file" 
                            className="hidden" 
                            id={`file-${assignment.id}`}
                            onChange={(e) => handleFileChange(e, assignment.id)}
                          />
                          
                          {isFilePicked ? (
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-[10px] text-blue-600 font-bold truncate max-w-[150px]">
                                {selectedFile.name}
                              </span>
                              <button 
                                onClick={() => handleUpload(assignment.id)}
                                disabled={isUploading}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-all flex items-center gap-2"
                              >
                                <Send className="w-4 h-4" /> {isUploading ? 'Sending...' : 'Confirm'}
                              </button>
                            </div>
                          ) : (
                            <label 
                              htmlFor={`file-${assignment.id}`}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 cursor-pointer flex items-center gap-2 transition-all shadow-md shadow-blue-100"
                            >
                              <Paperclip className="w-4 h-4" /> Attach File
                            </label>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}