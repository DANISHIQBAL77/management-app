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
import { collection, query, where, getDocs, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Megaphone, Plus, Trash2, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatters';

export default function AnnouncementsPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();

  const [announcements, setAnnouncements] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    classId: '',
    priority: 'normal', // high, normal, low
  });

  // Auth Protection
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    if (!authLoading && userData && userData.role !== 'teacher') {
      router.push(`/${userData.role}`);
    }
  }, [user, userData, authLoading, router]);

  // Fetch Data
  useEffect(() => {
    if (user && userData?.role === 'teacher') {
      fetchData();
    }
  }, [user, userData]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch Teacher's Classes
      const qClasses = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
      const classSnap = await getDocs(qClasses);
      const classesData = classSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClasses(classesData);

      // Fetch Announcements (Real-time)
      const qAnnounce = query(
        collection(db, 'announcements'), 
        where('teacherId', '==', user.uid)
      );
      
      const unsubscribe = onSnapshot(qAnnounce, (snapshot) => {
        const announceData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort by date manually if Firestore index isn't ready
        announceData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAnnouncements(announceData);
      });

      setLoading(false);
      return () => unsubscribe();
    } catch (error) {
      console.error("Error fetching announcements:", error);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.classId) {
      setAlert({ type: 'error', message: 'Please select a class.' });
      return;
    }

    setSubmitting(true);
    
    const announcementData = {
      ...formData,
      teacherId: user.uid,
      teacherName: userData.name || 'Teacher',
      createdAt: new Date().toISOString(),
    };
    
    const result = await createDocument('announcements', announcementData);
    
    if (result.error) {
      setAlert({ type: 'error', message: result.error });
    } else {
      setAlert({ type: 'success', message: 'Announcement posted successfully!' });
      handleCloseModal();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this announcement?')) {
      const result = await deleteDocument('announcements', id);
      if (result.error) setAlert({ type: 'error', message: result.error });
      else setAlert({ type: 'success', message: 'Announcement removed.' });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ title: '', content: '', classId: '', priority: 'normal' });
  };

  const columns = [
    { 
      header: 'Title', 
      key: 'title',
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-bold text-gray-900">{item.title}</span>
          <span className="text-xs text-gray-500 truncate max-w-[200px]">{item.content}</span>
        </div>
      )
    },
    { 
      header: 'Class', 
      key: 'classId',
      render: (item) => {
        const classData = classes.find(c => c.id === item.classId);
        return <Badge variant="primary">{classData?.name || 'All Classes'}</Badge>;
      }
    },
    { 
      header: 'Priority', 
      key: 'priority',
      render: (item) => (
        <Badge className={
          item.priority === 'high' ? 'bg-red-100 text-red-700' : 
          item.priority === 'low' ? 'bg-gray-100 text-gray-700' : 
          'bg-blue-100 text-blue-700'
        }>
          {item.priority.toUpperCase()}
        </Badge>
      )
    },
    { 
      header: 'Date', 
      key: 'createdAt', 
      render: (item) => (
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-1" />
          {formatDate(item.createdAt)}
        </div>
      )
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (item) => (
        <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  if (authLoading || loading) return <div className="p-10 text-center">Loading Announcements...</div>;

  return (
    <DashboardLayout requiredRole="teacher">
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-lg text-white">
              <Megaphone className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Announcements</h1>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-5 h-5 mr-2" /> New Announcement
          </Button>
        </div>
        
        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} className="mb-6" />}
        
        <Card>
          <Table columns={columns} data={announcements} />
        </Card>
        
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Post New Announcement" size="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input 
              label="Announcement Title" 
              name="title" 
              value={formData.title} 
              onChange={handleChange} 
              required 
              placeholder="e.g., Class Cancelled or Exam Update"
            />
            
            <Textarea 
              label="Content" 
              name="content" 
              value={formData.content} 
              onChange={handleChange} 
              required 
              rows={4} 
              placeholder="Write your message here..."
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Target Class"
                name="classId"
                value={formData.classId}
                onChange={handleChange}
                required
                options={[
                  ...classes.map(c => ({ value: c.id, label: c.name }))
                ]}
              />
              <Select
                label="Priority Level"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                options={[
                  { value: 'normal', label: 'Normal' },
                  { value: 'high', label: 'High (Urgent)' },
                  { value: 'low', label: 'Low' },
                ]}
              />
            </div>
            
            <div className="flex gap-4 mt-6">
              <Button type="submit" fullWidth disabled={submitting}>
                {submitting ? 'Posting...' : 'Post Announcement'}
              </Button>
              <Button type="button" variant="outline" onClick={handleCloseModal} fullWidth>Cancel</Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}