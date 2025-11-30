const bcrypt = require('bcryptjs');

/**
 * Hashing Service for secure password storage
 * Uses bcrypt for secure password hashing with configurable salt rounds
 */
class HashingService {
  /**
   * Hash a password using bcrypt
   * @param {string} password - The password to hash
   * @param {number} saltRounds - Number of salt rounds (default: 12)
   * @returns {Promise<string>} - The hashed password
   */
  static async hashPassword(password, saltRounds = 12) {
    try {
      if (!password) {
        throw new Error('Password is required');
      }
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      console.error('Hashing error:', error);
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Verify a password against its hash
   * @param {string} password - The plain password to verify
   * @param {string} hash - The hash to compare against
   * @returns {Promise<boolean>} - Whether the password matches the hash
   */
  static async verifyPassword(password, hash) {
    try {
      if (!password || !hash) {
        return false;
      }
      return await bcrypt.compare(password, hash);
    } catch (error) {
      console.error('Verification error:', error);
      throw new Error('Failed to verify password');
    }
  }

  /**
   * Generate a secure random string for pepper/salt if needed
   * @param {number} length - Length of the random string
   * @returns {string} - Random string
   */
  static generateRandomString(length = 32) {
    const crypto = require('crypto');
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} - Validation result with isValid and errors
   */
  static validatePasswordStrength(password) {
    const errors = [];

    if (!password) {
      errors.push('Password is required');
      return { isValid: false, errors };
    }

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = { HashingService };