import * as crypto from 'crypto';
import { config } from 'dotenv';
config();

const algorithm = 'aes-256-cbc';
const key = crypto
  .createHash('sha256')
  .update(process.env.SECRET_KEY as string)
  .digest(); // 32 bytes
const iv = Buffer.alloc(16, 0); // 16 bytes IV (bạn có thể random nếu muốn an toàn hơn)

export function encrypt(text: string): string {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  return cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
}

export function decrypt(encrypted: string): string {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
}
