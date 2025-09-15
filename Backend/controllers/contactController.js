import asyncHandler from 'express-async-handler';
import nodemailer from 'nodemailer';

const submitContactForm = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    res.status(400);
    throw new Error('Name, email, and message are required.');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Setup the email data
  const mailOptions = {
    from: `"${name}" <${process.env.EMAIL_USER}>`, 
    to: process.env.EMAIL_RECIPIENT,              
    replyTo: email,                               
    subject: `New Contact Form Submission: ${subject || 'No Subject'}`,
    html: `
      <h2>New Message from Karigar Mart Contact Form</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
      <p><strong>Subject:</strong> ${subject || 'N/A'}</p>
      <hr>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `,
  };

  // Send the email
  await transporter.sendMail(mailOptions);
  
  res.status(200).json({ message: 'Message sent successfully!' });
});

export { submitContactForm };