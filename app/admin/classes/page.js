'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function ClassesPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    section: '',
    teacherId: '',
    room: '',
    capacity: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    
    if (!authLoading && userData && userData.role !== 'admin') {
      router.push(`/${userData.role}`);
    }
  }, [user, userData, authLoading, router]);

  useEffect(() => {
    if (user && userData?.role === 'admin') {
      fetchClasses();
      fetchTeachers();
    }
  }, [user, userData]);

  const fetchClasses = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'classes'));
      const classesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClasses(classesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setAlert({ type: 'error', message: 'Failed to load classes' });
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'teacher'));
      const querySnapshot = await getDocs(q);
      const teachersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTeachers(teachersData);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingClass) {
        const classRef = doc(db, 'classes', editingClass.id);
        await updateDoc(classRef, {
          ...formData,
          updatedAt: new Date().toISOString(),
        });
        setAlert({ type: 'success', message: 'Class updated successfully!' });
      } else {
        await addDoc(collection(db, 'classes'), {
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setAlert({ type: 'success', message: 'Class created successfully!' });
      }
      
      handleCloseModal();
      fetchClasses();
    } catch (error) {
      console.error('Error saving class:', error);
      setAlert({ type: 'error', message: error.message });
    }
  };

  const handleEdit = (classData) => {
    setEditingClass(classData);
    setFormData({
      name: classData.name,
      grade: classData.grade,
      section: classData.section || '',
      teacherId: classData.teacherId || '',
      room: classData.room || '',
      capacity: classData.capacity || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (classId) => {
    if (confirm('Are you sure you want to delete this class?')) {
      try {
        await deleteDoc(doc(db, 'classes', classId));
        setAlert({ type: 'success', message: 'Class deleted successfully!' });
        fetchClasses();
      } catch (error) {
        console.error('Error deleting class:', error);
        setAlert({ type: 'error', message: 'Failed to delete class' });
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClass(null);
    setFormData({
      name: '',
      grade: '',
      section: '',
      teacherId: '',
      room: '',
      capacity: '',
    });
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? teacher.name : 'Not Assigned';
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
    <DashboardLayout requiredRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Classes</h1>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-xl transition-all flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              Add Class
            </button>
          </div>

          {/* Alert */}
          {alert && (
            <div className={`mb-6 p-4 rounded-lg ${alert.type === 'success' ? 'bg-green-50 border-l-4 border-green-600 text-green-800' : 'bg-red-50 border-l-4 border-red-600 text-red-800'}`}>
              <div className="flex items-center justify-between">
                <p>{alert.message}</p>
                <button onClick={() => setAlert(null)} className="text-2xl">&times;</button>
              </div>
            </div>
          )}

          {/* Classes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.length === 0 ? (
              <div className="col-span-full bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="text-6xl mb-4">📚</div>
                <p className="text-gray-500 text-lg">No classes found. Add your first class!</p>
              </div>
            ) : (
              classes.map((classData) => (
                <div key={classData.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white">
                    <h3 className="text-2xl font-bold mb-2">{classData.name}</h3>
                    <div className="flex items-center gap-2 text-blue-100">
                      <span className="text-sm">Grade {classData.grade}</span>
                      {classData.section && (
                        <>
                          <span>•</span>
                          <span className="text-sm">Section {classData.section}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">👨‍🏫</span>
                        <div>
                          <p className="text-xs text-gray-500">Teacher</p>
                          <p className="font-semibold text-gray-900">{getTeacherName(classData.teacherId)}</p>
                        </div>
                      </div>
                      
                      {classData.room && (
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">🚪</span>
                          <div>
                            <p className="text-xs text-gray-500">Room</p>
                            <p className="font-semibold text-gray-900">{classData.room}</p>
                          </div>
                        </div>
                      )}
                      
                      {classData.capacity && (
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">👥</span>
                          <div>
                            <p className="text-xs text-gray-500">Capacity</p>
                            <p className="font-semibold text-gray-900">{classData.capacity} students</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(classData)}
                        className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(classData.id)}
                        className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  {editingClass ? 'Edit Class' : 'Add New Class'}
                </h2>
                <button onClick={handleCloseModal} className="text-white text-3xl hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center">
                  &times;
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Class Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Computer Science 101"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Grade <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="grade"
                      value={formData.grade}
                      onChange={handleChange}
                      placeholder="e.g., 10"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Section
                    </label>
                    <input
                      type="text"
                      name="section"
                      value={formData.section}
                      onChange={handleChange}
                      placeholder="e.g., A"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Assign Teacher
                  </label>
                  <select
                    name="teacherId"
                    value={formData.teacherId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white"
                  >
                    <option value="">Select a teacher</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Room Number
                    </label>
                    <input
                      type="text"
                      name="room"
                      value={formData.room}
                      onChange={handleChange}
                      placeholder="e.g., 201"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Capacity
                    </label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleChange}
                      placeholder="e.g., 30"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    />
                  </div>
                </div>
                
                <div className="flex gap-4 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-xl transition-all"
                  >
                    {editingClass ? 'Update Class' : 'Add Class'}
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
    </DashboardLayout>
  );
}