const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendClaimMail(to, donationTitle, ngoName) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Your donation has been claimed!',
    text: `Hello, your donation "${donationTitle}" has been claimed by ${ngoName}. Please be ready for pickup.`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (err) {
    console.error('Error sending email:', err);
  }
}

module.exports = { sendClaimMail };
