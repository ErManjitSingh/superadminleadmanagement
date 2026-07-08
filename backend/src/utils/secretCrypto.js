const crypto = require('crypto');

const ALGO = 'aes-256-gcm';
const PREFIX = 'enc:v1:';

function getKey() {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'leadmang-dev-encryption-key';
  return crypto.createHash('sha256').update(String(secret)).digest();
}

function encrypt(plain) {
  if (!plain) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decrypt(value) {
  if (!value) return '';
  const str = String(value);
  if (!str.startsWith(PREFIX)) return str;
  const buf = Buffer.from(str.slice(PREFIX.length), 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

function isEncrypted(value) {
  return String(value || '').startsWith(PREFIX);
}

module.exports = { encrypt, decrypt, isEncrypted };
