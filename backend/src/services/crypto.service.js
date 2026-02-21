const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.STORAGE_ENCRYPTION_KEY || '6bdf5678901234567890123456789012', 'utf8');

// Ensure key is 32 bytes
if (key.length !== 32) {
    throw new Error('STORAGE_ENCRYPTION_KEY must be exactly 32 bytes (char) long');
}

/**
 * Encrypts a buffer
 * @param {Buffer} buffer 
 * @returns {Buffer} Encrypted buffer with IV prepended
 */
exports.encrypt = (buffer) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    // Prepend IV for the decryption process
    return Buffer.concat([iv, encrypted]);
};

/**
 * Decrypts a buffer
 * @param {Buffer} buffer Buffer with IV prepended
 * @returns {Buffer} Decrypted buffer
 */
exports.decrypt = (buffer) => {
    const iv = buffer.slice(0, 16);
    const encryptedData = buffer.slice(16);
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    return decrypted;
};
