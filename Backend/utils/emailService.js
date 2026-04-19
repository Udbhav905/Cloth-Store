import { sendEmail } from "./sendEmail.js";

export const sendPasswordResetEmail = async (email, resetToken, userName) => {
  const baseUrl = process.env.FRONTEND_URL.endsWith('/') 
    ? process.env.FRONTEND_URL.slice(0, -1) 
    : process.env.FRONTEND_URL;
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

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

export const sendOrderConfirmationEmail = async (email, order) => {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <div style="font-weight: bold; color: #1a1a1a;">${item.productName}</div>
        <div style="font-size: 12px; color: #888;">Size: ${item.variant.size} | Color: ${item.variant.color}</div>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toLocaleString()}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price * item.quantity).toLocaleString()}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: #d4af37; margin: 0; font-size: 28px; letter-spacing: 4px;">LUXURIA</h1>
        <p style="color: #ffffff; margin-top: 10px; font-size: 14px; opacity: 0.8;">ORDER CONFIRMED</p>
      </div>

      <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px;">
          <div>
            <p style="margin: 0; color: #888; font-size: 12px; text-transform: uppercase;">Order Number</p>
            <p style="margin: 5px 0 0 0; font-weight: bold; color: #1a1a1a;">#${order.orderNumber}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; color: #888; font-size: 12px; text-transform: uppercase;">Date</p>
            <p style="margin: 5px 0 0 0; font-weight: bold; color: #1a1a1a;">${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        <h3 style="color: #1a1a1a; margin-bottom: 15px; font-size: 16px;">Shipping Address</h3>
        <div style="background-color: #fcfcfc; border: 1px solid #f0f0f0; padding: 15px; border-radius: 5px; margin-bottom: 30px; color: #555; font-size: 14px; line-height: 1.6;">
          <strong>${order.shippingAddress.name}</strong><br>
          ${order.shippingAddress.address1}${order.shippingAddress.address2 ? ', ' + order.shippingAddress.address2 : ''}<br>
          ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}<br>
          Phone: ${order.shippingAddress.phone}
        </div>

        <h3 style="color: #1a1a1a; margin-bottom: 15px; font-size: 16px;">Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px;">
          <thead>
            <tr style="background-color: #f8f8f8;">
              <th style="padding: 12px; text-align: left; color: #1a1a1a; border-bottom: 2px solid #ddd;">Item</th>
              <th style="padding: 12px; text-align: center; color: #1a1a1a; border-bottom: 2px solid #ddd;">Qty</th>
              <th style="padding: 12px; text-align: right; color: #1a1a1a; border-bottom: 2px solid #ddd;">Price</th>
              <th style="padding: 12px; text-align: right; color: #1a1a1a; border-bottom: 2px solid #ddd;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="margin-left: auto; max-width: 250px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #555;">
            <span>Subtotal:</span>
            <span>₹${order.subtotal.toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #555;">
            <span>Tax (18%):</span>
            <span>₹${(order.tax || 0).toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #555;">
            <span>Shipping:</span>
            <span>${order.shippingCharge === 0 ? 'FREE' : '₹' + order.shippingCharge.toLocaleString()}</span>
          </div>
          ${order.discount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #e74c3c;">
              <span>Discount:</span>
              <span>-₹${order.discount.toLocaleString()}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 2px solid #1a1a1a; color: #1a1a1a; font-weight: bold; font-size: 18px;">
            <span>Total:</span>
            <span style="color: #d4af37;">₹${order.totalAmount.toLocaleString()}</span>
          </div>
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
          <p style="color: #888; font-size: 12px;">Payment Method: <strong>${order.paymentMethod.toUpperCase()}</strong></p>
          <p style="color: #555; font-size: 14px; margin-top: 20px;">
            Thank you for choosing LUXURIA. We are preparing your order for shipment.
          </p>
          <a href="${process.env.FRONTEND_URL}/my-orders" style="display: inline-block; margin-top: 20px; padding: 12px 25px; background-color: #1a1a1a; color: #d4af37; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 14px;">Track My Order</a>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #bbb; font-size: 11px;">
        &copy; ${new Date().getFullYear()} LUXURIA Clothing Store. All rights reserved.
      </div>
    </div>
  `;

  await sendEmail({
    email: email,
    subject: `Order Confirmed - #${order.orderNumber} | LUXURIA`,
    message: `Your order #${order.orderNumber} has been confirmed. Total amount: ₹${order.totalAmount.toLocaleString()}`,
    html: htmlContent
  });
};

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