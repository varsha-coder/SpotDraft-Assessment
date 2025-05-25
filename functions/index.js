const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

admin.initializeApp();

exports.sendShareEmail = functions
 .https.onCall(async (request, context) => {
    const { email, pdfName, shareLink } = request.data;
    sgMail.setApiKey("SENDGRIDAPIKEY");

    const msg = {
      to: email,
      from: 'nvarshinirk@gmail.com', 
      subject: `You've been invited to view a PDF`,
      html: `<p>You have been invited to view the PDF: <b>${pdfName}</b>.</p>
             <p>Click <a href="${shareLink}">here</a> to view it.</p>`,
    };
  
    try {
      await sgMail.send(msg);
      return { success: true };

    } catch (error) {
      return { success: false, error: error.message };
    }
  });