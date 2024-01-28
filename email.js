const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) Create a transport
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      ciphers: 'SSLv3',
    },
  });

  const mailOptions = {
    from: 'Natours',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  await transporter.sendMail(mailOptions);
};
module.exports = sendEmail;
