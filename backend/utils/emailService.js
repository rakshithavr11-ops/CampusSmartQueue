
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendPasswordResetEmail = async (email, resetUrl) => {
  await transporter.sendMail({
    from: `"Campus Smart Queue" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset Your Campus Smart Queue Password",
    text: `You requested a password reset.

Click this link to reset your password:
${resetUrl}

This link expires in 15 minutes.

If you did not request this, please ignore this email.`,
    html: `
      <h2>Campus Smart Queue</h2>
      <p>You requested a password reset.</p>
      <p>
        <a href="${resetUrl}">Reset My Password</a>
      </p>
      <p>This link expires in 15 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  });
};
