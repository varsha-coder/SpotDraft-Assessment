import { useEffect, useState, useRef } from "react";
import { db } from "../../firebase/firebaseConfig";
import { getStorage, ref, listAll, getDownloadURL, uploadBytes } from "firebase/storage";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';
import { query, where, getDocs } from "firebase/firestore";
import { sendShareEmail } from '../shareEmail/sendShareEmail'
export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [files, setFiles] = useState([]);
  const [filteredPdfs, setFilteredPdfs] = useState([]);
  const [user, setUser] = useState(null);
  const fileInputRef = useRef(null);
  const storage = getStorage();
  const auth = getAuth();

  // Wait for auth state before fetching files
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, [auth]);

  // Fetch files when user or refresh changes
  useEffect(() => {
    if (!user) return;
    async function fetchFiles() {
      setLoading(true);
      try {
        const userFiles = await getUserFiles(user.uid);
        setFiles(userFiles);
      } catch (error) {
        console.error("Error fetching files:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchFiles();
  }, [user, refresh]);

  // Filter PDFs by search
  useEffect(() => {
    const updatedFilteredpdf = search.length === 0
      ? files
      : files.filter(pdf =>
          pdf.fileName.toLowerCase().includes(search.toLowerCase())
        );
    setFilteredPdfs(updatedFilteredpdf);
  }, [search, files]);

  async function getUserFiles(userId) {
        const userFilesRef = ref(storage, `user_files/${userId}/`);
    try {
      const pdfsQuery = query(
  collection(db, "pdfs"),
  where("userId", "==", userId)
);
const pdfsSnapshot = await getDocs(pdfsQuery);
const pdfsMeta = pdfsSnapshot.docs.map(doc => doc.data());

      const fileList = await listAll(userFilesRef);
      const filesWithUrls = await Promise.all(
        fileList.items.map(async (itemRef) => {
          const downloadURL = await getDownloadURL(itemRef);
           const meta = pdfsMeta.find(meta =>
      meta.name === itemRef.name
    );
          return {
            fileName: itemRef.name,
            filePath: itemRef.fullPath,
            url: downloadURL,
            shareId: meta ? meta.shareId : undefined, // <-- include shareId
          };
        })
      );
      return filesWithUrls;
    } catch (error) {
      console.error("Error retrieving user files:", error);
      throw error;
    }
  }

  // Handle PDF upload
  const handleUpload = async () => {
    if (!file || file.type !== "application/pdf") {
      alert("Please select a valid PDF file.");
      return;
    }
    if (!user) {
      alert("You must be logged in to upload.");
      return;
    }
    setLoading(true);
    try {
      const originalName = file.name;
      const nameWithoutExt = originalName.toLowerCase().endsWith('.pdf')
        ? originalName.slice(0, -4)
        : originalName;
        const storageFileName= `${nameWithoutExt}_${Date.now()}`;
      const storageRef = ref(storage, `user_files/${user.uid}/${storageFileName}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      const shareId = uuidv4();
      await addDoc(collection(db, "pdfs"), {
        name: storageFileName,
        url,
        uploadedAt: new Date(),
        user: user.email,
        userId: user.uid,
        shareId,

      });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = ""; // 2. Clear the file input
      alert("PDF uploaded!");
      setRefresh(r => !r);
    } catch (err) {
      console.error(err);
      alert("Upload failed!");
    }
    setLoading(false);
  };

  // Handle logout
  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg max-w-2xl mx-auto mb-8">
        <h2 className="text-xl text-white mb-4">Upload PDF</h2>
        <input
          type="file"
          accept="application/pdf"
          onChange={e => setFile(e.target.files[0])}
          ref={fileInputRef}
          className="mb-4 block w-full text-white"
        />
        <button
          onClick={handleUpload}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg max-w-2xl mx-auto">
        <h2 className="text-xl text-white mb-4">Your PDFs</h2>
        <input
          type="text"
          placeholder="Search PDFs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-4 p-2 rounded w-full bg-gray-700 text-white placeholder-gray-400"
        />
        <ul>
  {loading ? (
    <li className="text-gray-400">Loading PDFs...</li>
  ) : filteredPdfs.length === 0 ? (
    <li className="text-gray-400">No PDFs found.</li>
  ) : (
    filteredPdfs.map(pdf => (
      <li
        key={pdf.filePath}
        className="flex justify-between items-center bg-gray-700 rounded p-3 mb-2 hover:bg-gray-600 transition"
      >
        <span className="text-white">{pdf.fileName}</span>
        <div className="flex gap-2">
          <a
            href={pdf.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline"
          >
            View
          </a>
          <button
            className="text-green-400 underline"
            onClick={async () => {
              // Prompt for invitee email
              const inviteeEmail = prompt("Enter the invitee's email address:");
              if (!inviteeEmail) return;

              // Generate share link
              const shareLink = `${window.location.origin}/shared/${pdf.shareId}`;

              // Call the backend function to send the email
              const result = await sendShareEmail(
                inviteeEmail,
                pdf.fileName,
                shareLink
              );

              if (result.success) {
                alert("Share email sent!");
              } else {
                alert("Failed to send email: " + (result.error || "Unknown error"));
              }
            }}
          >
            Share
          </button>
        </div>
      </li>
    ))
  )}
</ul>
       
      </div>
    </div>
  );
}