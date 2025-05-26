import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../../firebase/firebaseConfig";
import { collection, query, where, getDocs, addDoc, orderBy, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default function SharedPdf() {
  const { shareId } = useParams();
  const [pdf, setPdf] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);

  const auth = getAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch PDF by shareId
  useEffect(() => {
    async function fetchPdf() {
      const q = query(collection(db, "pdfs"), where("shareId", "==", shareId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setPdf({ ...snap.docs[0].data(), id: snap.docs[0].id });
      }
      setLoading(false);
    }
    fetchPdf();
  }, [shareId]);

  // Fetch comments for this PDF
  useEffect(() => {
    if (!pdf) return;
    async function fetchComments() {
      const q = query(
        collection(db, "pdfs", pdf.id, "comments"),
        orderBy("createdAt", "asc")
      );
      const snap = await getDocs(q);
      setComments(snap.docs.map(doc => doc.data()));
    }
    fetchComments();
  }, [pdf]);

  // Add a comment
  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    const user = auth.currentUser;
    await addDoc(collection(db, "pdfs", pdf.id, "comments"), {
      text: comment,
      createdAt: serverTimestamp(),
      email: user ? user.email : "Anonymous",
    });
    setComment("");
    // Refresh comments
    const q = query(
      collection(db, "pdfs", pdf.id, "comments"),
      orderBy("createdAt", "asc")
    );
    const snap = await getDocs(q);
    setComments(snap.docs.map(doc => doc.data()));
  };

  if (loading) return <div className="text-white p-8">Loading PDF...</div>;
  if (!pdf) return <div className="text-red-400 p-8">PDF not found or link invalid.</div>;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
      <div className="flex-1 flex flex-col items-center justify-center p-4 h-screen">
        <div className="flex items-center gap-2 mb-4">
          {location.pathname.startsWith("/pdf/") && (
            <button
              onClick={() => navigate("/dashboard")}
              className="text-white hover:text-blue-400"
              title="Back to Dashboard"
            >
              {/* Left Arrow Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h2 className="text-2xl text-white">{pdf.name}</h2>
        </div>
        <div className="w-full h-full flex-1 flex justify-center items-center">
          <iframe
            src={pdf.url}
            title={pdf.name}
            className="w-full h-[80vh] md:h-[90vh] bg-white rounded"
            style={{ minHeight: "400px" }}
          />
        </div>
      </div>
      <div className="w-full md:w-96 bg-gray-900 p-4 flex flex-col">
        <h3 className="text-lg text-white mb-2">Comments</h3>
        <div className="flex-1 overflow-y-auto mb-2">
          {comments.length === 0 && (
            <div className="text-gray-400">No comments yet.</div>
          )}
          {comments.map((c, i) => (
            <div key={i} className="bg-gray-800 text-white rounded p-2 mb-2">
              <div className="text-xs text-blue-300 mb-1">
                {c.email || "Anonymous"}
              </div>
              {c.text}
            </div>
          ))}
        </div>
        <form onSubmit={handleComment} className="flex gap-2">
          <input
            type="text"
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 p-2 rounded bg-gray-700 text-white placeholder-gray-400"
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded"
          >
            Post
          </button>
        </form>
      </div>
    </div>
  );
}