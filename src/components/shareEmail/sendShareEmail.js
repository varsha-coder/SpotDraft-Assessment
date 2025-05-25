import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../../firebase/firebaseConfig"; 

const functions = getFunctions(app);

export async function sendShareEmail(email, pdfName, shareLink) {
  const sendEmail = httpsCallable(functions, "sendShareEmail");
  try {
    const result = await sendEmail({ email, pdfName, shareLink });
    return result.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}