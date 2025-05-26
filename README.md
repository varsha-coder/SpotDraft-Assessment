# SpotDraft-Assessment
📄 PDF Management & Collaboration System
A modern web application that enables users to upload, manage, and collaborate on PDF documents. Built with React, Firebase Authentication, Firebase Storage, Firestore, and Cloud Functions to ensure a secure and seamless user experience.

🔧 Features
1. 🚀 Introduction
A web-based solution that allows users to:

Upload and organize PDF documents

Share PDFs via unique links

Collaborate through inline commenting

Access and comment on shared documents without an account

2. 🔐 User Signup & Authentication
Secure account creation via email and password

Firebase Authentication for user management

Encrypted and hashed password storage

3. 📤 File Upload
Upload and store PDF files securely via Firebase Storage

Client-side and server-side validation for PDF format

Metadata saved in Firestore for fast access and search

4. 🧭 Dashboard
Personalized dashboard for each authenticated user

View and search PDF files by name

Clickable items redirect to PDF preview and comment section

5. 🔗 File Sharing
Generate unique shareable links

Shared PDFs accessible by non-authenticated (invited) users

Read-only or comment-enabled sharing

6. ✏️ Guest Access & Commenting
Invited users can open shared PDFs without signing up

Sidebar for thread-based PDF commenting

Real-time sync using Firestore

7. 🔒 Security & Privacy
Role-based access controls to restrict unauthorized access

Firebase security rules enforce user permissions

Comments and files only visible to permitted users

8. 🎨 User Interface
Intuitive and clean UI built with React

Responsive design supporting all devices

In-app PDF preview with comment sidebar

9. 🚧 Future Enhancements
Versioning support for PDF uploads

Real-time collaborative annotations

Tag-based file categorization

PDF highlighting and drawing tools

Notifications for new comments or shares

🛠️ Tech Stack
Tech	Use Case
React	Frontend UI
Firebase Auth	User Authentication
Firestore	Storing metadata and comments
Firebase Storage	PDF file storage
Cloud Functions	Sharing logic, access control
PDF.js	PDF rendering in browser

🧪 Setup & Installation
Prerequisites
Node.js
Firebase CLI
Git

1. Clone the Repository
git clone https://github.com/varsha-coder/SpotDraft-Assessment

2. Install Dependencies
npm install
3. Firebase Setup
Create a Firebase project

Enable Authentication (Email/Password)

Set up Firestore and Firebase Storage

Configure security rules

4. Add Firebase Config
In /src/firebase/config.js:
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MSG_SENDER_ID",
  appId: "YOUR_APP_ID"
};
5. Run the App

npm start

🧑‍💻 Contributing
Contributions are welcome! Please open an issue or submit a pull request.
