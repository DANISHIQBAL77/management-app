'use client';
import { useState, useEffect, useRef } from 'react';
import { LogOut, Bell, User, X } from 'lucide-react';
import { signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy, limit } from 'firebase/firestore';

export default function Navbar({ user, userData }) {
  const router = useRouter();
  
  // --- Notification Logic (Exact same as Teacher Page) ---
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notificationRef = useRef(null);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Real-time Notification Listener
  useEffect(() => {
    if (user?.uid) {
      const q = query(
        collection(db, 'notifications'),
        where('recipientId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNotifications(notifs);
      });

      return () => unsubscribe();
    }
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { status: 'read' });
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  // --- End Notification Logic ---

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };
  
  return (
    <nav className="bg-white shadow-lg border-b-4 border-blue-600 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-bold text-xl">
              🎓 Smart School
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Notification Button & Popup Area */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-all active:scale-95"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popup Menu */}
              {showNotifs && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Notifications</h3>
                    <button onClick={() => setShowNotifs(false)}>
                      <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 text-sm">No notifications yet</div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          onClick={() => markAsRead(notif.id)}
                          className={`p-4 border-b cursor-pointer transition-colors ${notif.status === 'unread' ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}`}
                        >
                          <div className="flex justify-between gap-2">
                            <p className={`text-sm ${notif.status === 'unread' ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                              {notif.title || 'New Update'}
                            </p>
                            {notif.status === 'unread' && <div className="w-2 h-2 bg-blue-600 rounded-full mt-1 shrink-0" />}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3 px-4 py-2 bg-gray-100 rounded-lg">
              <User className="w-5 h-5 text-gray-600" />
              <div className="text-sm">
                <div className="font-semibold text-gray-900">{userData?.name}</div>
                <div className="text-gray-500 text-xs capitalize">{userData?.role}</div>
              </div>
            </div>
            
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-semibold">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}