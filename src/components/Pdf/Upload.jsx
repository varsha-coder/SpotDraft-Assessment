import React, { useState } from 'react';
import { storage, db, auth } from '../../firebase/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';

export default function Upload() {
  const [pdfFile, setPdfFile] = useState(null);

  const handleUpload = async () => {
    if (!pdfFile || pdfFile.type !== "application/pdf") return alert("Upload a valid PDF");

    const storageRef = ref(storage, `pdfs/${Date.now()}_${pdfFile.name}`);
    await uploadBytes(storageRef, pdfFile);
    const url = await getDownloadURL(storageRef);

    await addDoc(collection(db, "pdfs"), {
      name: pdfFile.name,
      url,
      createdBy: auth.currentUser.uid,
      createdAt: new Date(),
    });

    alert('PDF Uploaded!');
  };

  return (
    <div>
      <input type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
}
