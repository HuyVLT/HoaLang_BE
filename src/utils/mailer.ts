import sgMail from '@sendgrid/mail';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('[Mailer] WARNING: SENDGRID_API_KEY is not defined in environment variables.');
}

const getSenderInfo = () => {
  const fromEnv = process.env.SENDGRID_FROM || process.env.SMTP_FROM || 'no-reply@hoalang.site';
  // Check if format is "Name" <email@domain> or Name <email@domain>
  const match = fromEnv.match(/^"([^"]+)"\s*<([^>]+)>/) || fromEnv.match(/^([^<]+)<([^>]+)>/);
  if (match) {
    return {
      name: match[1].trim(),
      email: match[2].trim(),
    };
  }
  return {
    email: fromEnv.trim(),
  };
};

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

  const sender = getSenderInfo();
  const mailOptions = {
    to: email,
    from: sender,
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
    const response = await sgMail.send(mailOptions);
    console.log(`[Mailer] Verification email sent to ${email} via SendGrid. Response status: ${response[0].statusCode}`);
  } catch (error) {
    console.error(`[Mailer] Failed to send email to ${email} via SendGrid:`, error);
    throw error;
  }
};

export const sendResetPasswordEmail = async (
  email: string,
  fullName: string,
  token: string,
  locale: string = 'vi'
): Promise<void> => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const resolvedLocale = locale === 'en' ? 'en' : 'vi';
  const resetUrl = `${clientUrl}/${resolvedLocale}/auth/reset-password?token=${token}`;

  const sender = getSenderInfo();
  const mailOptions = {
    to: email,
    from: sender,
    subject: resolvedLocale === 'en' ? '[HoaLang] Reset your password' : '[HoaLang] Khôi phục mật khẩu của bạn',
    html: `
      <div style="font-family: 'Be Vietnam Pro', Helvetica, Arial, sans-serif; background-color: #F5F0E8; padding: 40px 20px; color: #1A1208; max-width: 600px; margin: 0 auto; border: 1px solid #D4C9B5; border-radius: 3px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 28px; font-weight: 600; color: #8B1A1A; margin: 0; font-style: italic;">HoaLang</h2>
          <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #C4952A; margin: 5px 0 0 0;">Tinh hoa Làng nghề Việt</p>
        </div>
        
        <div style="background-color: #FAF7F2; padding: 30px; border: 1px solid #D4C9B5; border-radius: 3px;">
          <p style="font-size: 16px; margin-top: 0; font-weight: 300; line-height: 1.6;">
            ${resolvedLocale === 'en' ? `Hello <strong>${fullName}</strong>,` : `Xin chào <strong>${fullName}</strong>,`}
          </p>
          
          <p style="font-size: 14px; line-height: 1.7; color: #2E2318; font-weight: 300;">
            ${resolvedLocale === 'en' 
              ? 'You are receiving this email because you requested a password reset for your account on HoaLang platform.'
              : 'Bạn nhận được email này vì bạn đã gửi yêu cầu khôi phục mật khẩu cho tài khoản trên nền tảng HoaLang.'}
            <br />
            ${resolvedLocale === 'en'
              ? 'To proceed with setting a new password, please click the button below:'
              : 'Để tiếp tục đặt lại mật khẩu mới, vui lòng click vào nút bên dưới:'}
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" target="_blank" style="background-color: #8B1A1A; color: #FAF7F2; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; text-decoration: none; padding: 14px 32px; border-radius: 3px; display: inline-block; transition: background-color 0.3s;">
              ${resolvedLocale === 'en' ? 'Reset Password' : 'Đặt lại mật khẩu'}
            </a>
          </div>
          
          <p style="font-size: 12px; line-height: 1.6; color: #8C8070; font-style: italic;">
            ${resolvedLocale === 'en'
              ? '* This reset link is valid for <strong>15 minutes</strong>. If you did not request this reset, please ignore this email.'
              : '* Đường link đặt lại mật khẩu này có hiệu lực trong vòng <strong>15 phút</strong>. Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email.'}
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
    const response = await sgMail.send(mailOptions);
    console.log(`[Mailer] Reset password email sent to ${email} via SendGrid. Response status: ${response[0].statusCode}`);
  } catch (error) {
    console.error(`[Mailer] Failed to send reset email to ${email} via SendGrid:`, error);
    throw error;
  }
};

export const sendTenantApprovalEmail = async (
  email: string,
  fullName: string,
  password: string,
  tenantName: string,
  slug: string,
  locale: string = 'vi'
): Promise<void> => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const resolvedLocale = locale === 'en' ? 'en' : 'vi';
  const tenantUrl = `http://${slug}.localhost:3000/${resolvedLocale}`;
  const loginUrl = `${clientUrl}/${resolvedLocale}/auth/login?email=${encodeURIComponent(email)}`;

  const sender = getSenderInfo();
  const mailOptions = {
    to: email,
    from: sender,
    subject: resolvedLocale === 'en' 
      ? `[HoaLang] Welcome to the Platform - ${tenantName} Approved!` 
      : `[HoaLang] Chúc mừng! Không gian di sản ${tenantName} đã được phê duyệt`,
    html: `
      <div style="font-family: 'Be Vietnam Pro', Helvetica, Arial, sans-serif; background-color: #F5F0E8; padding: 40px 20px; color: #1A1208; max-width: 600px; margin: 0 auto; border: 1px solid #D4C9B5; border-radius: 3px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 28px; font-weight: 600; color: #8B1A1A; margin: 0; font-style: italic;">HoaLang</h2>
          <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #C4952A; margin: 5px 0 0 0;">Tinh hoa Làng nghề Việt</p>
        </div>
        
        <div style="background-color: #FAF7F2; padding: 30px; border: 1px solid #D4C9B5; border-radius: 3px;">
          <p style="font-size: 16px; margin-top: 0; font-weight: 300; line-height: 1.6;">
            ${resolvedLocale === 'en' ? `Hello <strong>${fullName}</strong>,` : `Xin chào <strong>${fullName}</strong>,`}
          </p>
          
          <p style="font-size: 14px; line-height: 1.7; color: #2E2318; font-weight: 300;">
            ${resolvedLocale === 'en'
              ? `We are delighted to inform you that your request to register the craft village <strong>${tenantName}</strong> on the HoaLang platform has been approved by the Super Admin!`
              : `Chúng tôi rất vui mừng thông báo rằng yêu cầu đăng ký không gian di sản làng nghề <strong>${tenantName}</strong> của bạn đã được Super Admin phê duyệt thành công!`}
          </p>
          
          <div style="background-color: #F5F0E8; padding: 20px; border: 1px solid #D4C9B5; border-radius: 3px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 18px; color: #8B1A1A; font-style: ${resolvedLocale === 'en' ? 'italic' : 'normal'}; font-weight: ${resolvedLocale === 'en' ? 'normal' : '600'};">
              ${resolvedLocale === 'en' ? 'Your Access Credentials' : 'Thông tin đăng nhập của bạn'}
            </h4>
            <p style="font-size: 13px; margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="font-size: 13px; margin: 5px 0;"><strong>${resolvedLocale === 'en' ? 'Password:' : 'Mật khẩu:'}</strong> <code style="background-color: #FAF7F2; padding: 2px 6px; border: 1px solid #D4C9B5; border-radius: 3px; font-weight: bold; color: #8B1A1A;">${password}</code></p>
            <p style="font-size: 13px; margin: 5px 0;"><strong>Subdomain:</strong> <a href="${tenantUrl}" target="_blank" style="color: #7A5C2E; text-decoration: underline;">${slug}.hoalang.site</a></p>
          </div>
          
          <p style="font-size: 14px; line-height: 1.7; color: #2E2318; font-weight: 300;">
            ${resolvedLocale === 'en'
              ? 'Please log in to your dashboard to customize your website, upload products, and manage workshops.'
              : 'Vui lòng đăng nhập vào trang quản trị để bắt đầu tùy biến giao diện website, đăng tải sản phẩm, và quản lý các lịch đặt workshop trải nghiệm của làng nghề.'}
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" target="_blank" style="background-color: #8B1A1A; color: #FAF7F2; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; text-decoration: none; padding: 14px 32px; border-radius: 3px; display: inline-block; transition: background-color 0.3s;">
              ${resolvedLocale === 'en' ? 'Log In Now' : 'Đăng nhập ngay'}
            </a>
          </div>
          
          <p style="font-size: 12px; line-height: 1.6; color: #8C8070; font-style: italic;">
            ${resolvedLocale === 'en'
              ? '* For security reasons, please change your password immediately after logging in for the first time.'
              : '* Để bảo mật thông tin, vui lòng thay đổi mật khẩu của bạn ngay sau khi đăng nhập lần đầu tiên.'}
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
    const response = await sgMail.send(mailOptions);
    console.log(`[Mailer] Tenant approval email sent to ${email} via SendGrid. Response status: ${response[0].statusCode}`);
  } catch (error) {
    console.error(`[Mailer] Failed to send tenant approval email to ${email} via SendGrid:`, error);
  }
};

/**
 * Sends a confirmation email immediately after an onboarding request is successfully submitted.
 * Informs the applicant that their request has been received and is pending review.
 */
export const sendOnboardingSubmissionEmail = async (
  email: string,
  artisanName: string,
  villageName: string,
  slug: string,
  locale: string = 'vi'
): Promise<void> => {
  const resolvedLocale = locale === 'en' ? 'en' : 'vi';

  const sender = getSenderInfo();
  const mailOptions = {
    to: email,
    from: sender,
    subject: resolvedLocale === 'en'
      ? `[HoaLang] Your registration for ${villageName} has been received`
      : `[HoaLang] Hồ sơ đăng ký ${villageName} đã được tiếp nhận`,
    html: `
      <div style="font-family: 'Be Vietnam Pro', Helvetica, Arial, sans-serif; background-color: #F5F0E8; padding: 40px 20px; color: #1A1208; max-width: 600px; margin: 0 auto; border: 1px solid #D4C9B5; border-radius: 3px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 28px; font-weight: 600; color: #8B1A1A; margin: 0; font-style: italic;">HoaLang</h2>
          <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #C4952A; margin: 5px 0 0 0;">Tinh hoa Làng nghề Việt</p>
        </div>
        
        <div style="background-color: #FAF7F2; padding: 30px; border: 1px solid #D4C9B5; border-radius: 3px;">
          <p style="font-size: 16px; margin-top: 0; font-weight: 300; line-height: 1.6;">
            ${resolvedLocale === 'en' ? `Hello <strong>${artisanName}</strong>,` : `Xin chào <strong>${artisanName}</strong>,`}
          </p>
          
          <p style="font-size: 14px; line-height: 1.7; color: #2E2318; font-weight: 300;">
            ${resolvedLocale === 'en'
              ? `Thank you for submitting your registration to join the HoaLang platform. Your application for the craft village <strong>${villageName}</strong> (${slug}.hoalang.site) has been successfully received and is now awaiting review by our administrators.`
              : `Cảm ơn bạn đã gửi hồ sơ đăng ký tham gia nền tảng HoaLang. Đơn đăng ký không gian di sản làng nghề <strong>${villageName}</strong> (${slug}.hoalang.site) đã được tiếp nhận thành công và đang chờ ban quản trị hệ thống xem xét phê duyệt.`}
          </p>
          
          <div style="background-color: #F5F0E8; padding: 20px; border: 1px solid #D4C9B5; border-radius: 3px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 18px; color: #8B1A1A; font-style: ${resolvedLocale === 'en' ? 'italic' : 'normal'}; font-weight: ${resolvedLocale === 'en' ? 'normal' : '600'};">
              ${resolvedLocale === 'en' ? 'Application Summary' : 'Tóm tắt hồ sơ'}
            </h4>
            <p style="font-size: 13px; margin: 5px 0;"><strong>${resolvedLocale === 'en' ? 'Village Name:' : 'Tên Làng nghề:'}</strong> ${villageName}</p>
            <p style="font-size: 13px; margin: 5px 0;"><strong>${resolvedLocale === 'en' ? 'Subdomain:' : 'Tên miền phụ:'}</strong> ${slug}.hoalang.site</p>
            <p style="font-size: 13px; margin: 5px 0;"><strong>${resolvedLocale === 'en' ? 'Artisan:' : 'Nghệ nhân đại diện:'}</strong> ${artisanName}</p>
            <p style="font-size: 13px; margin: 5px 0;"><strong>${resolvedLocale === 'en' ? 'Status:' : 'Trạng thái:'}</strong> <span style="color: #C4952A; font-weight: 600;">⏳ ${resolvedLocale === 'en' ? 'Pending Review' : 'Đang chờ duyệt'}</span></p>
          </div>
          
          <p style="font-size: 14px; line-height: 1.7; color: #2E2318; font-weight: 300;">
            ${resolvedLocale === 'en'
              ? 'We will notify you via email once your application has been reviewed. This process typically takes 1-2 business days.'
              : 'Chúng tôi sẽ thông báo cho bạn qua email ngay khi hồ sơ được xem xét. Quy trình duyệt hồ sơ thường diễn ra trong vòng 1-2 ngày làm việc.'}
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
    const response = await sgMail.send(mailOptions);
    console.log(`[Mailer] Onboarding submission email sent to ${email} via SendGrid. Response status: ${response[0].statusCode}`);
  } catch (error) {
    console.error(`[Mailer] Failed to send onboarding submission email to ${email} via SendGrid:`, error);
  }
};

/**
 * Sends an email when a tenant onboarding request is rejected by Super Admin.
 * Includes rejection reason and encourages re-application.
 */
export const sendTenantRejectionEmail = async (
  email: string,
  artisanName: string,
  villageName: string,
  reason: string,
  locale: string = 'vi'
): Promise<void> => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const resolvedLocale = locale === 'en' ? 'en' : 'vi';
  const onboardingUrl = `${clientUrl}/${resolvedLocale}/onboarding`;

  const sender = getSenderInfo();
  const mailOptions = {
    to: email,
    from: sender,
    subject: resolvedLocale === 'en'
      ? `[HoaLang] Update on your registration for ${villageName}`
      : `[HoaLang] Cập nhật về hồ sơ đăng ký ${villageName}`,
    html: `
      <div style="font-family: 'Be Vietnam Pro', Helvetica, Arial, sans-serif; background-color: #F5F0E8; padding: 40px 20px; color: #1A1208; max-width: 600px; margin: 0 auto; border: 1px solid #D4C9B5; border-radius: 3px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 28px; font-weight: 600; color: #8B1A1A; margin: 0; font-style: italic;">HoaLang</h2>
          <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #C4952A; margin: 5px 0 0 0;">Tinh hoa Làng nghề Việt</p>
        </div>
        
        <div style="background-color: #FAF7F2; padding: 30px; border: 1px solid #D4C9B5; border-radius: 3px;">
          <p style="font-size: 16px; margin-top: 0; font-weight: 300; line-height: 1.6;">
            ${resolvedLocale === 'en' ? `Hello <strong>${artisanName}</strong>,` : `Xin chào <strong>${artisanName}</strong>,`}
          </p>
          
          <p style="font-size: 14px; line-height: 1.7; color: #2E2318; font-weight: 300;">
            ${resolvedLocale === 'en'
              ? `We have carefully reviewed your registration for the craft village <strong>${villageName}</strong>. Unfortunately, we are unable to approve your application at this time.`
              : `Chúng tôi đã xem xét kỹ lưỡng hồ sơ đăng ký không gian di sản làng nghề <strong>${villageName}</strong> của bạn. Rất tiếc, chúng tôi chưa thể phê duyệt đơn đăng ký tại thời điểm này.`}
          </p>
          
          <div style="background-color: #F5F0E8; padding: 20px; border-left: 3px solid #8B1A1A; border-radius: 0 3px 3px 0; margin: 20px 0;">
            <h4 style="margin: 0 0 8px 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 16px; color: #8B1A1A; font-style: ${resolvedLocale === 'en' ? 'italic' : 'normal'}; font-weight: ${resolvedLocale === 'en' ? 'normal' : '600'};">
              ${resolvedLocale === 'en' ? 'Reason' : 'Lý do'}
            </h4>
            <p style="font-size: 14px; margin: 0; line-height: 1.6; color: #2E2318; font-weight: 400;">
              ${reason}
            </p>
          </div>
          
          <p style="font-size: 14px; line-height: 1.7; color: #2E2318; font-weight: 300;">
            ${resolvedLocale === 'en'
              ? 'We encourage you to review the reason above, update your information accordingly, and submit a new application. Our team is always ready to assist you on the journey of preserving Vietnamese craft heritage.'
              : 'Chúng tôi khuyến khích bạn xem lại lý do nêu trên, bổ sung hoặc chỉnh sửa thông tin phù hợp, và gửi lại đơn đăng ký mới. Đội ngũ HoaLang luôn sẵn sàng đồng hành cùng bạn trên hành trình gìn giữ tinh hoa nghề truyền thống Việt.'}
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${onboardingUrl}" target="_blank" style="background-color: #8B1A1A; color: #FAF7F2; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; text-decoration: none; padding: 14px 32px; border-radius: 3px; display: inline-block; transition: background-color 0.3s;">
              ${resolvedLocale === 'en' ? 'Submit New Application' : 'Gửi đơn đăng ký mới'}
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; font-size: 11px; color: #8C8070; line-height: 1.5;">
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} HoaLang Platform. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">Cổng thông tin di sản và du lịch làng nghề Việt Nam</p>
        </div>
      </div>
    `,
  };

  try {
    const response = await sgMail.send(mailOptions);
    console.log(`[Mailer] Tenant rejection email sent to ${email} via SendGrid. Response status: ${response[0].statusCode}`);
  } catch (error) {
    console.error(`[Mailer] Failed to send tenant rejection email to ${email} via SendGrid:`, error);
  }
};

