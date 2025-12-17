const nodemailer = require('nodemailer');

// Create transporter - using Gmail as example
// For production, use a proper email service like SendGrid, Mailgun, etc.
const createTransporter = () => {
    // If EMAIL credentials are not set, return null (email disabled)
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('⚠️ Email service not configured. Set EMAIL_USER and EMAIL_PASS in .env');
        return null;
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS  // Use App Password for Gmail
        }
    });
};

// Send 2FA verification code
const send2FACode = async (email, code, userName) => {
    const transporter = createTransporter();

    if (!transporter) {
        // Log code to console in development (when email not configured)
        console.log(`\n📧 [DEV MODE] 2FA Code for ${email}: ${code}\n`);
        return true;
    }

    const mailOptions = {
        from: `"VacciCare" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔐 Code de vérification VacciCare',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">💉 VacciCare</h1>
                    <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">Code de vérification</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                    <p style="color: #333; font-size: 16px;">Bonjour <strong>${userName}</strong>,</p>
                    
                    <p style="color: #666;">Voici votre code de vérification à 6 chiffres :</p>
                    
                    <div style="background: white; border: 2px dashed #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
                        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #667eea;">${code}</span>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">
                        ⏱️ Ce code expire dans <strong>10 minutes</strong>.
                    </p>
                    
                    <p style="color: #999; font-size: 12px; margin-top: 30px;">
                        Si vous n'avez pas demandé ce code, ignorez cet email.
                    </p>
                </div>
                
                <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
                    <p>© ${new Date().getFullYear()} VacciCare - Suivi de Vaccination</p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 2FA code sent to ${email}`);
        return true;
    } catch (error) {
        console.error('Email error:', error);
        // Fallback: log code to console
        console.log(`\n📧 [FALLBACK] 2FA Code for ${email}: ${code}\n`);
        return true;
    }
};

// Send 2FA enabled notification
const send2FAEnabledNotification = async (email, userName) => {
    const transporter = createTransporter();

    if (!transporter) return true;

    const mailOptions = {
        from: `"VacciCare" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔒 Authentification à deux facteurs activée',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">🔒 2FA Activé</h1>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                    <p style="color: #333; font-size: 16px;">Bonjour <strong>${userName}</strong>,</p>
                    
                    <p style="color: #666;">
                        L'authentification à deux facteurs (2FA) a été <strong>activée</strong> sur votre compte VacciCare.
                    </p>
                    
                    <p style="color: #666;">
                        Désormais, lors de chaque connexion, vous recevrez un code de vérification par email.
                    </p>
                    
                    <p style="color: #999; font-size: 12px; margin-top: 30px;">
                        Si vous n'avez pas effectué cette action, contactez immédiatement l'administrateur.
                    </p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Email error:', error);
        return false;
    }
};

// Generate 6-digit code
const generate2FACode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = {
    send2FACode,
    send2FAEnabledNotification,
    generate2FACode
};
