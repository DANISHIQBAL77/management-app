'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardGrid } from '@/components/ui/Card';
import { Award, BookOpen, TrendingUp, Star, FileText } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useFirestore } from '@/lib/hooks/useFirestore';

export default function StudentMarksPage() {
  const { user, userData } = useAuth();
  
  // Fetch marks for this specific student
  const { documents: marksRecords, loading } = useFirestore('marks', [
    { field: 'studentId', operator: '==', value: user?.uid || '' }
  ]);

  // Calculations for Overview Cards
  const totalSubjects = marksRecords.length;
  const totalObtained = marksRecords.reduce((acc, curr) => acc + Number(curr.obtainedMarks || 0), 0);
  const totalPossible = marksRecords.reduce((acc, curr) => acc + Number(curr.totalMarks || 0), 0);
  const percentage = totalPossible > 0 ? Math.round((totalObtained / totalPossible) * 100) : 0;

  const stats = [
    { 
      title: 'Overall Percentage', 
      value: `${percentage}%`, 
      icon: TrendingUp, 
      color: 'from-blue-600 to-indigo-600',
      isLarge: true 
    },
    { 
      title: 'Subjects', 
      value: totalSubjects, 
      icon: BookOpen, 
      color: 'from-purple-500 to-pink-500' 
    },
    { 
      title: 'Total Marks', 
      value: `${totalObtained}/${totalPossible}`, 
      icon: Award, 
      color: 'from-green-500 to-emerald-500' 
    },
  ];

  return (
    <DashboardLayout requiredRole="student">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Academic Result</h1>
        <p className="text-gray-600 mb-8">View your performance across all subjects</p>

        {/* Stats Cards - Gradient Style */}
        <CardGrid cols={3}>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} hover>
                <div className={`bg-gradient-to-r ${stat.color} rounded-xl p-6 text-white h-[140px] flex flex-col justify-between shadow-lg`}>
                  <div className="flex items-start justify-between">
                    <Icon className="w-10 h-10 opacity-80" />
                    <div className={`text-right font-black leading-tight ${stat.isLarge ? 'text-4xl' : 'text-3xl'}`}>
                      {stat.value}
                    </div>
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider opacity-90">{stat.title}</h3>
                </div>
              </Card>
            );
          })}
        </CardGrid>

        {/* Marks Details List */}
        <div className="mt-10 space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="text-blue-600" /> Subject-wise Breakdown
          </h2>
          
          {loading ? (
            <p className="text-gray-500 italic">Loading results...</p>
          ) : marksRecords.length === 0 ? (
            <Card>
              <p className="text-center py-8 text-gray-500 italic">No results have been published yet.</p>
            </Card>
          ) : (
            marksRecords.map((record) => {
              const subjectPercentage = (record.obtainedMarks / record.totalMarks) * 100;
              
              return (
                <div key={record.id} className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm flex items-center justify-between hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Star className="text-blue-600 w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg uppercase">{record.subjectName}</p>
                      <p className="text-sm text-gray-500">Exam: {record.examTitle || 'Final Term'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Obtained</p>
                      <p className="text-xl font-black text-gray-900">{record.obtainedMarks}<span className="text-sm text-gray-400 font-normal"> / {record.totalMarks}</span></p>
                    </div>
                    
                    <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center font-black text-sm ${
                      subjectPercentage >= 80 ? 'border-green-500 text-green-600' :
                      subjectPercentage >= 50 ? 'border-blue-500 text-blue-600' : 'border-red-500 text-red-600'
                    }`}>
                      {Math.round(subjectPercentage)}%
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}