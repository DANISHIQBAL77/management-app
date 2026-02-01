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
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plus, Trash2, Megaphone } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatters';

export default function AnnouncementsPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();

  const [announcements, setAnnouncements] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alert, setAlert] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  const [formData, setFormData] = useState({ title: '', content: '', classId: '', priority: 'normal' });

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

      const qAnnounce = query(collection(db, 'announcements'), where('teacherId', '==', user.uid));
      onSnapshot(qAnnounce, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAnnouncements(data);
        setDataLoading(false);
      });
    } catch (error) {
      console.error(error);
      setDataLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.classId) return setAlert({ type: 'error', message: 'Select a class.' });
    const result = await createDocument('announcements', { ...formData, teacherId: user.uid, createdAt: new Date().toISOString() });
    if (result.error) setAlert({ type: 'error', message: result.error });
    else { setAlert({ type: 'success', message: 'Posted!' }); setIsModalOpen(false); setFormData({ title: '', content: '', classId: '', priority: 'normal' }); }
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
          <div className="flex items-center gap-3">
             <div className="p-3 bg-blue-600 rounded-lg text-white"><Megaphone className="w-6 h-6" /></div>
             <h1 className="text-4xl font-bold text-gray-900">Announcements</h1>
          </div>
          <Button onClick={() => setIsModalOpen(true)}><Plus className="w-5 h-5 mr-2" /> New Announcement</Button>
        </div>
        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} className="mb-6" />}
        <Card>
          <Table columns={[
            { header: 'Title', key: 'title' },
            { header: 'Class', key: 'classId', render: (i) => <Badge variant="primary">{classes.find(c => c.id === i.classId)?.name || 'N/A'}</Badge> },
            { header: 'Priority', key: 'priority', render: (i) => <Badge className={i.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}>{i.priority.toUpperCase()}</Badge> },
            { header: 'Date', key: 'createdAt', render: (i) => formatDate(i.createdAt) },
            { header: 'Actions', key: 'id', render: (i) => <button onClick={() => deleteDocument('announcements', i.id)} className="p-2 text-red-600"><Trash2 className="w-4 h-4" /></button> }
          ]} data={announcements} />
        </Card>
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Announcement">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Title" name="title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
            <Textarea label="Content" name="content" value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} required />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Class" name="classId" value={formData.classId} onChange={(e) => setFormData({...formData, classId: e.target.value})} required options={[ ...classes.map(c => ({ value: c.id, label: c.name }))]} />
              <Select label="Priority" name="priority" value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} options={[{ value: 'normal', label: 'Normal' }, { value: 'high', label: 'High' }]} />
            </div>
            <Button type="submit" fullWidth>Post Announcement</Button>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}