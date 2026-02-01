'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input, { Select, Textarea } from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/lib/hooks/useAuth';
import { createDocument, deleteDocument } from '@/lib/firestore';
import { uploadAssignment } from '@/lib/storage';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plus, Trash2, FileText, Download } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatters';

export default function AssignmentsPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();

  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alert, setAlert] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classId: '',
    dueDate: '',
    totalMarks: '',
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    if (!authLoading && userData && userData.role !== 'teacher') {
      router.push(`/${userData.role}`);
    }
  }, [user, userData, authLoading, router]);

  useEffect(() => {
    if (user && userData?.role === 'teacher') {
      fetchData();
    }
  }, [user, userData]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const qClasses = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
      const classSnap = await getDocs(qClasses);
      const classesData = classSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClasses(classesData);

      const qAssign = query(collection(db, 'assignments'), where('teacherId', '==', user.uid));
      const unsubscribe = onSnapshot(qAssign, (snapshot) => {
        const assignData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAssignments(assignData);
      });

      setLoading(false);
      return () => unsubscribe();
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.classId) {
      setAlert({ type: 'error', message: 'Please select a class.' });
      return;
    }

    setUploading(true);
    let fileUrl = null;
    if (file) {
      const result = await uploadAssignment(file, Date.now().toString(), user.uid);
      if (result.error) {
        setAlert({ type: 'error', message: result.error });
        setUploading(false);
        return;
      }
      fileUrl = result.url;
    }
    
    const assignmentData = {
      ...formData,
      teacherId: user.uid,
      teacherName: userData.name || 'Teacher',
      fileUrl,
      totalMarks: parseInt(formData.totalMarks),
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    const result = await createDocument('assignments', assignmentData);
    
    if (result.error) {
      setAlert({ type: 'error', message: result.error });
    } else {
      setAlert({ type: 'success', message: 'Assignment created successfully!' });
      handleCloseModal();
    }
    setUploading(false);
  };

  const handleDelete = async (assignmentId) => {
    if (confirm('Are you sure you want to delete this assignment?')) {
      const result = await deleteDocument('assignments', assignmentId);
      if (result.error) setAlert({ type: 'error', message: result.error });
      else setAlert({ type: 'success', message: 'Assignment deleted successfully!' });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ title: '', description: '', classId: '', dueDate: '', totalMarks: '' });
    setFile(null);
  };

  const columns = [
    { header: 'Title', key: 'title' },
    { 
      header: 'Class', 
      key: 'classId',
      render: (assignment) => {
        const classData = classes.find(c => c.id === assignment.classId);
        return classData ? <Badge variant="primary">{classData.name}</Badge> : 'N/A';
      }
    },
    { header: 'Due Date', key: 'dueDate', render: (assignment) => formatDate(assignment.dueDate) },
    { header: 'Marks', key: 'totalMarks', render: (assignment) => <Badge>{assignment.totalMarks}</Badge> },
    {
      header: 'Actions',
      key: 'actions',
      render: (assignment) => (
        <button onClick={() => handleDelete(assignment.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  if (authLoading || loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Assignments</h1>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-5 h-5 mr-2" /> Create Assignment
          </Button>
        </div>
        
        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} className="mb-6" />}
        
        <Card>
          <Table columns={columns} data={assignments} />
        </Card>
        
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Create New Assignment" size="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Assignment Title" name="title" value={formData.title} onChange={handleChange} required />
            <Textarea label="Description" name="description" value={formData.description} onChange={handleChange} required rows={3} />
            
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Select Class"
                name="classId"
                value={formData.classId}
                onChange={handleChange}
                required
                options={[
                  ...classes.map(c => ({ value: c.id, label: c.name }))
                ]}
              />
              <Input label="Due Date" type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} required />
            </div>
            
            <Input label="Total Marks" type="number" name="totalMarks" value={formData.totalMarks} onChange={handleChange} required />
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Upload File (Optional)</label>
              <input type="file" onChange={handleFileChange} className="w-full border p-2 rounded" />
            </div>
            
            <div className="flex gap-4 mt-6">
              <Button type="submit" fullWidth disabled={uploading}>
                {uploading ? 'Creating...' : 'Create Assignment'}
              </Button>
              <Button type="button" variant="outline" onClick={handleCloseModal} fullWidth>Cancel</Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}