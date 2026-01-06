'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input, { Select, Textarea } from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/lib/hooks/useAuth';
import { useFirestore } from '@/lib/hooks/useFirestore';
import { createDocument, deleteDocument } from '@/lib/firestore';
import { uploadAssignment } from '@/lib/storage';
import { Plus, Upload, Trash2, FileText, Download } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatters';

export default function AssignmentsPage() {
  const { userData } = useAuth();
  const { documents: assignments } = useFirestore('assignments', [
    { field: 'teacherId', operator: '==', value: userData?.uid || '' }
  ]);
  const { documents: classes } = useFirestore('classes', [
    { field: 'teacherId', operator: '==', value: userData?.uid || '' }
  ]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alert, setAlert] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classId: '',
    dueDate: '',
    totalMarks: '',
  });
  const [file, setFile] = useState(null);
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    let fileUrl = null;
    if (file) {
      const result = await uploadAssignment(file, Date.now().toString(), userData.uid);
      if (result.error) {
        setAlert({ type: 'error', message: result.error });
        setUploading(false);
        return;
      }
      fileUrl = result.url;
    }
    
    const assignmentData = {
      ...formData,
      teacherId: userData.uid,
      teacherName: userData.name,
      fileUrl,
      totalMarks: parseInt(formData.totalMarks),
      status: 'active',
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
      if (result.error) {
        setAlert({ type: 'error', message: result.error });
      } else {
        setAlert({ type: 'success', message: 'Assignment deleted successfully!' });
      }
    }
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      title: '',
      description: '',
      classId: '',
      dueDate: '',
      totalMarks: '',
    });
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
    { 
      header: 'Due Date', 
      key: 'dueDate',
      render: (assignment) => formatDate(assignment.dueDate)
    },
    { 
      header: 'Total Marks', 
      key: 'totalMarks',
      render: (assignment) => <Badge>{assignment.totalMarks}</Badge>
    },
    {
      header: 'File',
      key: 'fileUrl',
      render: (assignment) => assignment.fileUrl ? (
        <a
          href={assignment.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          View File
        </a>
      ) : (
        <span className="text-gray-400">No file</span>
      )
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (assignment) => (
        <button
          onClick={() => handleDelete(assignment.id)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];
  
  return (
    <DashboardLayout requiredRole="teacher">
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Assignments</h1>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-5 h-5" />
            Create Assignment
          </Button>
        </div>
        
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
            className="mb-6"
          />
        )}
        
        <Card>
          <Table columns={columns} data={assignments} />
        </Card>
        
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title="Create New Assignment"
          size="lg"
        >
          <form onSubmit={handleSubmit}>
            <Input
              label="Assignment Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., Chapter 5 Questions"
            />
            
            <Textarea
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Describe the assignment..."
              rows={4}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Select Class"
                name="classId"
                value={formData.classId}
                onChange={handleChange}
                required
                options={classes.map(c => ({ value: c.id, label: c.name }))}
              />
              
              <Input
                label="Due Date"
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                required
              />
            </div>
            
            <Input
              label="Total Marks"
              type="number"
              name="totalMarks"
              value={formData.totalMarks}
              onChange={handleChange}
              required
              placeholder="e.g., 100"
            />
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload File (Optional)
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                />
              </div>
              {file && (
                <p className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {file.name}
                </p>
              )}
            </div>
            
            <div className="flex gap-4 mt-6">
              <Button type="submit" fullWidth disabled={uploading}>
                {uploading ? 'Creating Assignment...' : 'Create Assignment'}
              </Button>
              <Button type="button" variant="outline" onClick={handleCloseModal} fullWidth>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
