/**
 * Quick SMTP send test — does not touch the CRM database.
 * Usage: node deploy/test-smtp-send.mjs [recipient@email.com]
 */
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const to = process.argv[2] || process.env.SMTP_USER;
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_NAME } = process.env;

if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
  console.error('Missing SMTP_* in backend/.env');
  process.exit(1);
}

const port = Number(SMTP_PORT || 465);
const transport = nodemailer.createTransport({
  host: SMTP_HOST,
  port,
  secure: port === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

console.log(`Verifying SMTP ${SMTP_HOST}:${port} as ${SMTP_USER}...`);
await transport.verify();
console.log('SMTP verify OK');

const info = await transport.sendMail({
  from: `"${SMTP_FROM_NAME || 'UNO Trips'}" <${SMTP_USER}>`,
  to,
  subject: `UNO Trips CRM — SMTP test ${new Date().toISOString()}`,
  text: 'This is a test email from travel-crm SMTP check.',
  html: '<p>This is a <strong>test email</strong> from travel-crm SMTP check.</p>',
});

console.log('Send OK');
console.log('Message ID:', info.messageId);
console.log('To:', to);
console.log('Response:', info.response);
