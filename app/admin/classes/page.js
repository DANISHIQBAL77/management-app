'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input, { Select } from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import { useFirestore } from '@/lib/hooks/useFirestore';
import { createDocument, updateDocument, deleteDocument } from '@/lib/firestore';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function StudentsPage() {
  const { documents: students, loading } = useFirestore('users', [{ field: 'role', operator: '==', value: 'student' }]);
  const { documents: classes } = useFirestore('classes');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    classId: '',
    rollNumber: '',
    dateOfBirth: '',
    address: '',
  });
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const studentData = {
      ...formData,
      role: 'student',
    };
    
    let result;
    if (editingStudent) {
      result = await updateDocument('users', editingStudent.id, studentData);
    } else {
      result = await createDocument('users', studentData);
    }
    
    if (result.error) {
      setAlert({ type: 'error', message: result.error });
    } else {
      setAlert({ type: 'success', message: `Student ${editingStudent ? 'updated' : 'created'} successfully!` });
      handleCloseModal();
    }
  };
  
  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      phone: student.phone,
      classId: student.classId || '',
      rollNumber: student.rollNumber || '',
      dateOfBirth: student.dateOfBirth || '',
      address: student.address || '',
    });
    setIsModalOpen(true);
  };
  
  const handleDelete = async (studentId) => {
    if (confirm('Are you sure you want to delete this student?')) {
      const result = await deleteDocument('users', studentId);
      if (result.error) {
        setAlert({ type: 'error', message: result.error });
      } else {
        setAlert({ type: 'success', message: 'Student deleted successfully!' });
      }
    }
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      classId: '',
      rollNumber: '',
      dateOfBirth: '',
      address: '',
    });
  };
  
  const columns = [
    { header: 'Roll No', key: 'rollNumber' },
    { header: 'Name', key: 'name' },
    { header: 'Email', key: 'email' },
    { header: 'Phone', key: 'phone' },
    { 
      header: 'Class', 
      key: 'classId',
      render: (student) => {
        const studentClass = classes.find(c => c.id === student.classId);
        return studentClass ? (
          <Badge variant="primary">{studentClass.name}</Badge>
        ) : (
          <Badge variant="default">Not Assigned</Badge>
        );
      }
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (student) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(student)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(student.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];
  
  return (
    <DashboardLayout requiredRole="admin">
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Students Management</h1>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-5 h-5" />
            Add Student
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
          {loading ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading students...</p>
            </div>
          ) : (
            <Table columns={columns} data={students} />
          )}
        </Card>
        
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingStudent ? 'Edit Student' : 'Add New Student'}
          size="lg"
        >
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              
              <Input
                label="Roll Number"
                name="rollNumber"
                value={formData.rollNumber}
                onChange={handleChange}
                required
              />
              
              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              
              <Input
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
              
              <Input
                label="Date of Birth"
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
              
              <Select
                label="Assign to Class"
                name="classId"
                value={formData.classId}
                onChange={handleChange}
                options={classes.map(c => ({ value: c.id, label: c.name }))}
              />
            </div>
            
            <Input
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
            
            <div className="flex gap-4 mt-6">
              <Button type="submit" fullWidth>
                {editingStudent ? 'Update Student' : 'Add Student'}
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