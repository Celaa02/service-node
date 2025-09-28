import nodemailer from 'nodemailer';

let transporter;
let isEthereal = false;

/**
 * Inicializa el transporter. Si no hay SMTP_* en env, usa Ethereal (modo pruebas).
 */
export async function mailer() {
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  ) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('📨 Mailer listo en modo SMTP real:', process.env.SMTP_HOST);
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    isEthereal = true;
    console.log('📨 Mailer listo en modo Ethereal (solo pruebas).');
  }
}

/**
 * Envía un email
 * @param {Object} opts
 * @param {string} opts.to
 * @param {string} opts.subject
 * @param {string} opts.html
 */
export async function sendMail({ to, subject, html }) {
  if (!transporter) await mailer();

  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM || 'Plurall <no-reply@plurall.com>',
    to,
    subject,
    html,
  });

  if (isEthereal) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('🔗 Preview URL (Ethereal):', previewUrl);
    return { ...info, previewUrl };
  }

  return info;
}
