const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Trigger when new assignment is created
exports.onAssignmentCreated = functions.firestore
  .document('assignments/{assignmentId}')
  .onCreate(async (snap, context) => {
    const assignment = snap.data();
    const classId = assignment.classId;
    
    // Get all students in the class
    const studentsSnapshot = await admin.firestore()
      .collection('users')
      .where('role', '==', 'student')
      .where('classId', '==', classId)
      .get();
    
    // Create notification for each student
    const batch = admin.firestore().batch();
    
    studentsSnapshot.forEach(doc => {
      const notificationRef = admin.firestore().collection('notifications').doc();
      batch.set(notificationRef, {
        userId: doc.id,
        type: 'assignment',
        title: 'New Assignment',
        message: `New assignment "${assignment.title}" has been posted`,
        assignmentId: context.params.assignmentId,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    
    await batch.commit();
    console.log(`Created notifications for ${studentsSnapshot.size} students`);
  });

// Trigger when marks are published
exports.onMarksPublished = functions.firestore
  .document('submissions/{submissionId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Check if marks were just added
    if (!before.marks && after.marks) {
      const notificationRef = admin.firestore().collection('notifications').doc();
      await notificationRef.set({
        userId: after.studentId,
        type: 'marks',
        title: 'Marks Published',
        message: `You scored ${after.marks}/${after.totalMarks} in "${after.assignmentTitle}"`,
        submissionId: context.params.submissionId,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      console.log(`Created marks notification for student ${after.studentId}`);
    }
  });
