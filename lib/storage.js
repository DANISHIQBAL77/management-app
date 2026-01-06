import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export const uploadFile = async (file, path) => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return { url: downloadURL, error: null };
  } catch (error) {
    return { url: null, error: error.message };
  }
};

export const deleteFile = async (path) => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

export const uploadAssignment = async (file, assignmentId, uploaderId) => {
  const timestamp = Date.now();
  const fileName = `${uploaderId}_${timestamp}_${file.name}`;
  const path = `assignments/${assignmentId}/${fileName}`;
  return uploadFile(file, path);
};

export const uploadSubmission = async (file, assignmentId, studentId) => {
  const timestamp = Date.now();
  const fileName = `${studentId}_${timestamp}_${file.name}`;
  const path = `submissions/${assignmentId}/${fileName}`;
  return uploadFile(file, path);
};
