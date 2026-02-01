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
import { Plus, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatters';

export default function AssignmentsPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();

  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alert, setAlert] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classId: '',
    dueDate: '',
    totalMarks: '',
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (userData?.role !== 'teacher') {
        router.push(`/${userData?.role || 'login'}`);
      } else {
        fetchInitialData();
      }
    }
  }, [user, userData, authLoading]);

  const fetchInitialData = async () => {
    try {
      const qClasses = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
      const classSnap = await getDocs(qClasses);
      setClasses(classSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const qAssign = query(collection(db, 'assignments'), where('teacherId', '==', user.uid));
      onSnapshot(qAssign, (snapshot) => {
        setAssignments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setDataLoading(false); // Stop spinner once first batch of data arrives
      });
    } catch (error) {
      console.error(error);
      setDataLoading(false);
    }
  };

  // ... (Keep handleChange, handleFileChange, handleSubmit, handleDelete as they were)
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.classId) return setAlert({ type: 'error', message: 'Select a class.' });
    setUploading(true);
    let fileUrl = null;
    if (file) {
      const result = await uploadAssignment(file, Date.now().toString(), user.uid);
      if (result.error) { setAlert({ type: 'error', message: result.error }); setUploading(false); return; }
      fileUrl = result.url;
    }
    const result = await createDocument('assignments', { ...formData, teacherId: user.uid, fileUrl, totalMarks: parseInt(formData.totalMarks), status: 'active', createdAt: new Date().toISOString() });
    if (result.error) setAlert({ type: 'error', message: result.error });
    else { setAlert({ type: 'success', message: 'Created!' }); handleCloseModal(); }
    setUploading(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ title: '', description: '', classId: '', dueDate: '', totalMarks: '' });
    setFile(null);
  };

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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Assignments</h1>
          <Button onClick={() => setIsModalOpen(true)}><Plus className="w-5 h-5 mr-2" /> Create Assignment</Button>
        </div>
        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} className="mb-6" />}
        <Card>
          <Table columns={[
            { header: 'Title', key: 'title' },
            { header: 'Class', key: 'classId', render: (a) => <Badge variant="primary">{classes.find(c => c.id === a.classId)?.name || 'N/A'}</Badge> },
            { header: 'Due Date', key: 'dueDate', render: (a) => formatDate(a.dueDate) },
            { header: 'Marks', key: 'totalMarks', render: (a) => <Badge>{a.totalMarks}</Badge> },
            { header: 'Actions', key: 'id', render: (a) => <button onClick={() => deleteDocument('assignments', a.id)} className="p-2 text-red-600"><Trash2 className="w-4 h-4" /></button> }
          ]} data={assignments} />
        </Card>
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="New Assignment">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Title" name="title" value={formData.title} onChange={handleChange} required />
            <Textarea label="Description" name="description" value={formData.description} onChange={handleChange} required />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Class" name="classId" value={formData.classId} onChange={handleChange} required options={[...classes.map(c => ({ value: c.id, label: c.name }))]} />
              <Input label="Due Date" type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} required />
            </div>
            <Input label="Total Marks" type="number" name="totalMarks" value={formData.totalMarks} onChange={handleChange} required />
            <input type="file" onChange={handleFileChange} className="w-full border p-2 rounded" />
            <Button type="submit" fullWidth disabled={uploading}>{uploading ? 'Processing...' : 'Create'}</Button>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}