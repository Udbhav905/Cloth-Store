// utils/emailService.js
import { sendEmail } from "./sendEmail.js";

// Send password reset email
export const sendPasswordResetEmail = async (email, resetToken, userName) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px; text-align: center;">
        <h1 style="color: #d4af37; margin: 0;">LUXURIA</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border-radius: 10px; margin-top: -20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #1a1a1a;">Hello ${userName},</h2>
        
        <p style="color: #555; line-height: 1.6; font-size: 16px;">
          We received a request to reset your password for your LUXURIA account.
          Click the button below to create a new password:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background: linear-gradient(135deg, #d4af37 0%, #b8941e 100%);
                    color: #1a1a1a;
                    padding: 12px 30px;
                    text-decoration: none;
                    border-radius: 5px;
                    font-weight: bold;
                    display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #555; line-height: 1.6; font-size: 16px;">
          Or copy and paste this link into your browser:
          <br>
          <a href="${resetUrl}" style="color: #d4af37; word-break: break-all;">${resetUrl}</a>
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="color: #888; font-size: 14px;">
          This link will expire in 1 hour. If you didn't request this, please ignore this email.
          <br><br>
          For security reasons, never share this link with anyone.
        </p>
        
        <p style="color: #555; font-size: 14px; margin-top: 20px;">
          Best regards,<br>
          <strong style="color: #d4af37;">LUXURIA Team</strong>
        </p>
      </div>
    </div>
  `;

  const textContent = `
    Hello ${userName},
    
    We received a request to reset your password for your LUXURIA account.
    
    Click this link to reset your password: ${resetUrl}
    
    This link will expire in 1 hour. If you didn't request this, please ignore this email.
    
    Best regards,
    LUXURIA Team
  `;

  await sendEmail({
    email: email,
    subject: "Reset Your LUXURIA Password",
    message: textContent,
    html: htmlContent
  });
};

// Send password changed confirmation
export const sendPasswordChangedConfirmation = async (email, userName) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px; text-align: center;">
        <h1 style="color: #d4af37; margin: 0;">LUXURIA</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border-radius: 10px; margin-top: -20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #1a1a1a;">Hello ${userName},</h2>
        
        <p style="color: #555; line-height: 1.6; font-size: 16px;">
          Your LUXURIA account password has been successfully changed.
        </p>
        
        <p style="color: #555; line-height: 1.6; font-size: 16px;">
          If you did not make this change, please contact our support team immediately.
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="color: #555; font-size: 14px; margin-top: 20px;">
          Best regards,<br>
          <strong style="color: #d4af37;">LUXURIA Team</strong>
        </p>
      </div>
    </div>
  `;

  const textContent = `
    Hello ${userName},
    
    Your LUXURIA account password has been successfully changed.
    
    If you did not make this change, please contact our support team immediately.
    
    Best regards,
    LUXURIA Team
  `;

  await sendEmail({
    email: email,
    subject: "Your Password Has Been Changed",
    message: textContent,
    html: htmlContent
  });
};