'use client';
import { useState, useEffect } from 'react';
import { subscribeToCollection } from '../firestore';

export const useFirestore = (collectionName, conditions = []) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToCollection(
      collectionName,
      conditions,
      (docs) => {
        setDocuments(docs);
        setLoading(false);
        setError(null);
      }
    );

    return () => unsubscribe();
  }, [collectionName, JSON.stringify(conditions)]);

  return { documents, loading, error };
};
