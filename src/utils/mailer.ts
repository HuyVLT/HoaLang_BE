import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io', // Fallback to a dev mailer
  port: parseInt(process.env.SMTP_PORT || '2525'),
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

export const sendVerificationEmail = async (
  email: string,
  fullName: string,
  token: string,
  locale: string = 'vi'
): Promise<void> => {
  // Build dynamic verification URL pointing to the Next.js frontend verification page
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const resolvedLocale = locale === 'en' ? 'en' : 'vi';
  const verificationUrl = `${clientUrl}/${resolvedLocale}/auth/verify-account?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || '"HoaLang" <no-reply@hoalang.vn>',
    to: email,
    subject: '[HoaLang] Kích hoạt tài khoản của bạn / Activate your account',
    html: `
      <div style="font-family: 'Be Vietnam Pro', Helvetica, Arial, sans-serif; background-color: #F5F0E8; padding: 40px 20px; color: #1A1208; max-width: 600px; margin: 0 auto; border: 1px solid #D4C9B5; border-radius: 3px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 28px; font-weight: 600; color: #8B1A1A; margin: 0; font-style: italic;">HoaLang</h2>
          <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #C4952A; margin: 5px 0 0 0;">Tinh hoa Làng nghề Việt</p>
        </div>
        
        <div style="background-color: #FAF7F2; padding: 30px; border: 1px solid #D4C9B5; border-radius: 3px;">
          <p style="font-size: 16px; margin-top: 0; font-weight: 300; line-height: 1.6;">Xin chào <strong>${fullName}</strong>,</p>
          
          <p style="font-size: 14px; line-height: 1.7; color: #2E2318; font-weight: 300;">
            Cảm ơn bạn đã đăng ký tham gia vào hệ thống HoaLang - Gallery di sản và làng nghề Việt Nam. 
            Để hoàn tất quy trình kích hoạt tài khoản của bạn, vui lòng click vào nút bên dưới:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" target="_blank" style="background-color: #8B1A1A; color: #FAF7F2; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; text-decoration: none; padding: 14px 32px; border-radius: 3px; display: inline-block; transition: background-color 0.3s;">
              Kích hoạt tài khoản / Activate
            </a>
          </div>
          
          <p style="font-size: 12px; line-height: 1.6; color: #8C8070; font-style: italic;">
            * Đường link kích hoạt này có hiệu lực trong vòng <strong>15 phút</strong>. Sau thời gian này, nếu tài khoản không được kích hoạt, thông tin đăng ký sẽ tự động được gỡ bỏ khỏi hệ thống để bảo mật thông tin.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; font-size: 11px; color: #8C8070; line-height: 1.5;">
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} HoaLang Platform. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">Cổng thông tin di sản và du lịch làng nghề Việt Nam</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Mailer] Verification email sent to ${email}. MessageId: ${info.messageId}`);
  } catch (error) {
    console.error(`[Mailer] Failed to send email to ${email}:`, error);
    throw error;
  }
};
