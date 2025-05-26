import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { db } from "../../firebase/firebaseConfig";
import {
  getStorage,
  ref,
  listAll,
  getDownloadURL,
  uploadBytes,
} from "firebase/storage";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { query, where, getDocs } from "firebase/firestore";
import { sendShareEmail } from "../shareEmail/sendShareEmail";

export default function Dashboard() {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [sharePdf, setSharePdf] = useState(null);
  const [inviteeEmail, setInviteeEmail] = useState("");
  const [search, setSearch] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [files, setFiles] = useState([]);
  const [filteredPdfs, setFilteredPdfs] = useState([]);
  const [user, setUser] = useState();
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("info");
  const fileInputRef = useRef(null);
  const storage = getStorage();
  const auth = getAuth();

  // Notification helper
  function showMessage(msg, type = "info", timeout = 3000) {
    setMessage(msg);
    setMessageType(type);
    if (timeout) {
      setTimeout(() => setMessage(null), timeout);
    }
  }

  // Email validation
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (!user) return;
    async function fetchFiles() {
      setLoading(true);
      try {
        const userFiles = await getUserFiles(user.uid);
        setFiles(userFiles);
      } catch (error) {
        console.error("Error fetching files:", error);
        showMessage("Error fetching files.", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchFiles();
  }, [user, refresh]);

  useEffect(() => {
    const updatedFilteredpdf =
      search.length === 0
        ? files
        : files.filter((pdf) =>
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
      const pdfsMeta = pdfsSnapshot.docs.map((doc) => doc.data());

      const fileList = await listAll(userFilesRef);
      const filesWithUrls = await Promise.all(
        fileList.items.map(async (itemRef) => {
          const downloadURL = await getDownloadURL(itemRef);
          const meta = pdfsMeta.find((meta) => meta.name === itemRef.name);
          return {
            fileName: itemRef.name,
            filePath: itemRef.fullPath,
            url: downloadURL,
            shareId: meta ? meta.shareId : undefined,
          };
        })
      );
      return filesWithUrls;
    } catch (error) {
      console.error("Error retrieving user files:", error);
      showMessage("Error retrieving user files.", "error");
      throw error;
    }
  }

  // Handle PDF upload
  const handleUpload = async () => {
    if (!file || file.type !== "application/pdf") {
      showMessage("Please select a valid PDF file.", "error");
      return;
    }
    if (!user) {
      window.location.href = "/login"; // Redirect to login page
      return;
    }
    setLoading(true);
    try {
      const originalName = file.name;
      const nameWithoutExt = originalName.toLowerCase().endsWith(".pdf")
        ? originalName.slice(0, -4)
        : originalName;
      const storageFileName = `${nameWithoutExt}_${Date.now()}`;
      const storageRef = ref(
        storage,
        `user_files/${user.uid}/${storageFileName}`
      );
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
      if (fileInputRef.current) fileInputRef.current.value = "";
      showMessage("PDF uploaded!", "success");
      setRefresh((r) => !r);
    } catch (err) {
      console.error(err);
      showMessage("Upload failed!", "error");
    }
    setLoading(false);
  };

  // Handle logout
  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/login";
  };

  // Share PDF modal logic
  const handleShareClick = (pdf) => {
    setSharePdf(pdf);
    setInviteeEmail("");
    setShowEmailModal(true);
  };

  const handleSendEmail = async () => {
    if (!inviteeEmail) {
      showMessage("Please enter an email address.", "error");
      return;
    }
    if (!isValidEmail(inviteeEmail)) {
      showMessage("Please enter a valid email address.", "error");
      return;
    }
    const shareLink = `${window.location.origin}/shared/${sharePdf.shareId}`;
    const result = await sendShareEmail(
      inviteeEmail,
      sharePdf.fileName,
      shareLink
    );
    if (result.success) {
      showMessage(" Email sent!", "success");
    } else {
      showMessage(
        "Failed to send email: " + (result.error || "Unknown error"),
        "error"
      );
    }
    setShowEmailModal(false);
    setSharePdf(null);
  };

  // Share via link
  const handleShareLink = async (pdf) => {
    const shareLink = `${window.location.origin}/shared/${pdf.shareId}`;
    try {
      await navigator.clipboard.writeText(shareLink);
      showMessage("Share link copied to clipboard!", "success");
    } catch {
      showMessage("Failed to copy link.", "error");
    }
  };
  // filepath: c:\Users\Dell\Desktop\New folder\SpotDraft-Assessment\src\components\Dashboard\Dashboard.jsx
  if (typeof user === "undefined") {
    // Still checking auth state
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
        <span className="text-white text-xl">Checking authentication...</span>
      </div>
    );
  }
  if (user === null) {
    window.location.href = "/login";
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 p-8">
      {/* Notification message */}
      {message && (
        <div
          className={`mb-4 px-4 py-2 rounded text-center font-semibold ${
            messageType === "success"
              ? "bg-green-600 text-white"
              : messageType === "error"
              ? "bg-red-600 text-white"
              : "bg-blue-600 text-white"
          }`}
        >
          {message}
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-800 text-white p-6 rounded shadow-lg">
            <h3 className="mb-2 font-bold">Share PDF: {sharePdf?.fileName}</h3>
            <input
              type="email"
              placeholder="Invitee's email"
              value={inviteeEmail}
              onChange={(e) => setInviteeEmail(e.target.value)}
              className="border p-2 rounded w-full mb-4 bg-gray-700 text-white placeholder-gray-400"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSendEmail}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                Send
              </button>
              <button
                onClick={() => setShowEmailModal(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          {user && <p className="text-gray-300 mt-1">Hello ,{user.email}</p>}
        </div>
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
          onChange={(e) => setFile(e.target.files[0])}
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
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 p-2 rounded w-full bg-gray-700 text-white placeholder-gray-400"
        />
        <ul>
          {loading ? (
            <li className="text-gray-400">Loading PDFs...</li>
          ) : filteredPdfs.length === 0 ? (
            <li className="text-gray-400">No PDFs found.</li>
          ) : (
            filteredPdfs.map((pdf) => (
              <li
                key={pdf.filePath}
                className="flex justify-between items-center bg-gray-700 rounded p-3 mb-2 hover:bg-gray-600 transition"
              >
                <span className="text-white">{pdf.fileName}</span>
                <div className="flex gap-4">
                  {/* View PDF */}
                  <Link
                    to={`/pdf/${pdf.shareId}`}
                    className="text-blue-400 underline flex items-center"
                    title="View PDF"
                  >
                    {/* Eye Icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </Link>
                  {/* Share Via Link */}
                  <button
                    className="text-yellow-400 underline flex items-center"
                    onClick={() => handleShareLink(pdf)}
                    title="Copy shareable link to clipboard"
                    type="button"
                  >
                    {/* Share Arrow Icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 12v1a8 8 0 008 8h0a8 8 0 008-8v-1M12 16V4m0 0l-4 4m4-4l4 4"
                      />
                    </svg>
                  </button>
                  {/* Share Via Email */}
                  <button
                    className="text-green-400 underline flex items-center"
                    onClick={() => handleShareClick(pdf)}
                    title="Share this PDF via email"
                    type="button"
                  >
                    {/* Envelope Icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
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
