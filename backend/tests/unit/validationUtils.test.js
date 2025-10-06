import { describe, expect, it } from 'vitest';
import { validatePassword, validateUsername } from '../../lib/utils/validationUtils.js';

describe('validationUtils', () => {
  describe('validatePassword', () => {
    it('should accept valid strong password', () => {
      const result = validatePassword('SecurePass123!');
      expect(result).toBe(true);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = validatePassword('Short1!');
      expect(result).toBe(false);
    });

    it('should reject password without uppercase letter', () => {
      const result = validatePassword('securepass123!');
      expect(result).toBe(false);
    });

    it('should reject password without lowercase letter', () => {
      const result = validatePassword('SECUREPASS123!');
      expect(result).toBe(false);
    });

    it('should reject password without number', () => {
      const result = validatePassword('SecurePass!');
      expect(result).toBe(false);
    });

    it('should reject password without special character', () => {
      const result = validatePassword('SecurePass123');
      expect(result).toBe(false);
    });

    it('should handle null or undefined password', () => {
      expect(validatePassword(null)).toBe(false);
      expect(validatePassword(undefined)).toBe(false);
      expect(validatePassword('')).toBe(false);
    });
  });

  describe('validateUsername', () => {
    it('should accept valid alphanumeric usernames', () => {
      const validUsernames = ['user123', 'testUser', 'Player01', 'abc123def'];

      validUsernames.forEach((username) => {
        expect(validateUsername(username)).toBe(true);
      });
    });

    it('should reject invalid usernames', () => {
      const invalidUsernames = [
        'ab', // Too short (< 3 characters)
        'a'.repeat(31), // Too long (> 30 characters)
        'user@test', // Contains special character
        'user name', // Contains space
        'user-name', // Contains hyphen
        '', // Empty string
      ];

      invalidUsernames.forEach((username) => {
        expect(validateUsername(username)).toBe(false);
      });
    });

    it('should handle null or undefined', () => {
      expect(validateUsername(null)).toBe(false);
      expect(validateUsername(undefined)).toBe(false);
    });
  });
});
