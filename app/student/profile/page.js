'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardGrid } from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import { User, Mail, Phone, Hash, MapPin, Calendar, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';

export default function StudentProfilePage() {
  const { user, userData: initialUserData } = useAuth();
  const [className, setClassName] = useState('Loading...');
  const [liveUserData, setLiveUserData] = useState(null);
  
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!user?.uid) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLiveUserData(data);
        
        if (data.classId) {
          getDoc(doc(db, 'classes', data.classId)).then(classSnap => {
            setClassName(classSnap.exists() ? classSnap.data().name : 'Not Found');
          });
        }
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    setLoading(true);
    try {
      await updatePassword(user, newPassword);
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setNewPassword('');
      setShowPasswordForm(false);
    } catch (err) {
      setMessage({ type: 'error', text: 'Please logout and login again to verify your identity.' });
    } finally {
      setLoading(false);
    }
  };

  const currentData = liveUserData || initialUserData;

  const infoFields = [
    { 
      title: 'Full Name', 
      value: currentData?.name || '---', 
      icon: User, 
      color: 'from-blue-500 to-cyan-500' 
    },
    { 
      title: 'Email Address', 
      value: currentData?.email || '---', 
      icon: Mail, 
      color: 'from-purple-500 to-pink-500' 
    },
    { 
      title: 'My Class', 
      value: className, 
      icon: Calendar, 
      color: 'from-green-500 to-emerald-500' 
    },
    { 
      title: 'Roll No', 
      value: currentData?.rollNo || currentData?.rollNumber || currentData?.roll_no || 'N/A', 
      icon: Hash, 
      color: 'from-orange-500 to-red-500' 
    },
  ];

  return (
    <DashboardLayout requiredRole="student">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Student Profile</h1>
        <p className="text-gray-600 mb-8">Personal information and security settings</p>

        {message.text && (
          <Alert type={message.type} message={message.text} onClose={() => setMessage({ type: '', text: '' })} className="mb-6" />
        )}

        <CardGrid cols={4}>
          {infoFields.map((field, index) => {
            const Icon = field.icon;
            // Check if this is the Roll No card to apply special sizing
            const isRollNo = field.title === 'Roll No';

            return (
              <Card key={index} hover>
                <div className={`bg-gradient-to-r ${field.color} rounded-xl p-6 text-white h-[180px] flex flex-col justify-between shadow-lg`}>
                  <div className="flex items-start justify-between">
                    <Icon className="w-10 h-10 opacity-80 shrink-0" />
                    
                    {/* Logic: Only increase size if it's the Roll Number */}
                    <div className={`text-right font-black break-all leading-tight ml-2 ${isRollNo ? 'text-4xl drop-shadow-lg' : 'text-base opacity-90'}`}>
                      {field.value}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider opacity-80">{field.title}</h3>
                  </div>
                </div>
              </Card>
            );
          })}
        </CardGrid>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Contact Information">
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Phone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Phone</p>
                  <p className="font-bold text-gray-900">{currentData?.phone || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Address</p>
                  <p className="font-bold text-gray-900">{currentData?.address || 'Not Provided'}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Security Options">
            <div className="space-y-4">
              <button 
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-600 transition-colors">
                    <Lock className="w-5 h-5 text-blue-600 group-hover:text-white" />
                  </div>
                  <span className="font-bold text-gray-700">Change Account Password</span>
                </div>
                {showPasswordForm ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
              </button>

              {showPasswordForm && (
                <form onSubmit={handleUpdatePassword} className="p-4 bg-gray-50 rounded-xl border border-blue-100">
                  <div className="flex flex-col gap-3">
                    <label className="text-sm font-bold text-gray-600">Enter New Password</label>
                    <div className="flex gap-2">
                      <input 
                        type="password" 
                        className="flex-1 p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="Min. 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <button 
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 transition-colors shadow-md"
                      >
                        {loading ? '...' : 'Update'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}