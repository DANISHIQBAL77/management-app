import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';

// Generic CRUD operations
export const createDocument = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { id: docRef.id, error: null };
  } catch (error) {
    return { id: null, error: error.message };
  }
};

export const updateDocument = async (collectionName, docId, data) => {
  try {
    await updateDoc(doc(db, collectionName, docId), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

export const deleteDocument = async (collectionName, docId) => {
  try {
    await deleteDoc(doc(db, collectionName, docId));
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

export const getDocument = async (collectionName, docId) => {
  try {
    const docSnap = await getDoc(doc(db, collectionName, docId));
    if (docSnap.exists()) {
      return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
    }
    return { data: null, error: 'Document not found' };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

export const getDocuments = async (collectionName, conditions = []) => {
  try {
    let q = collection(db, collectionName);
    
    if (conditions.length > 0) {
      const queryConstraints = conditions.map(({ field, operator, value }) => 
        where(field, operator, value)
      );
      q = query(q, ...queryConstraints);
    }
    
    const querySnapshot = await getDocs(q);
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { data: documents, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

// Attendance specific functions
export const markAttendance = async (classId, date, studentId, status) => {
  try {
    const attendanceRef = doc(db, 'attendance', `${classId}_${date}_${studentId}`);
    await setDoc(attendanceRef, {
      classId,
      date,
      studentId,
      status, // 'present', 'absent', 'late'
      markedAt: new Date().toISOString(),
    });
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

export const getAttendanceByDate = async (classId, date) => {
  try {
    const q = query(
      collection(db, 'attendance'),
      where('classId', '==', classId),
      where('date', '==', date)
    );
    const querySnapshot = await getDocs(q);
    const attendance = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { data: attendance, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

export const getStudentAttendance = async (studentId) => {
  try {
    const q = query(
      collection(db, 'attendance'),
      where('studentId', '==', studentId),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const attendance = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { data: attendance, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

// Real-time listener
export const subscribeToCollection = (collectionName, conditions, callback) => {
  let q = collection(db, collectionName);
  
  if (conditions && conditions.length > 0) {
    const queryConstraints = conditions.map(({ field, operator, value }) => 
      where(field, operator, value)
    );
    q = query(q, ...queryConstraints);
  }
  
  return onSnapshot(q, (querySnapshot) => {
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(documents);
  });
};
