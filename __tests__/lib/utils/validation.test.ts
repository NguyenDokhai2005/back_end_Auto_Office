import {
  validateRequired,
  validateEmail,
  validatePassword,
} from '@/lib/utils/errors';
import { ValidationError } from '@/types';

describe('Validation Utilities', () => {
  describe('validateRequired', () => {
    it('should pass when all required fields are present', () => {
      const fields = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        active: true,
      };
      const requiredFields = ['name', 'email'];

      expect(() => {
        validateRequired(fields, requiredFields);
      }).not.toThrow();
    });

    it('should throw ValidationError when required field is missing', () => {
      const fields = {
        name: 'John Doe',
      };
      const requiredFields = ['name', 'email'];

      expect(() => {
        validateRequired(fields, requiredFields);
      }).toThrow(ValidationError);
      
      expect(() => {
        validateRequired(fields, requiredFields);
      }).toThrow('Missing required fields: email');
    });

    it('should throw ValidationError when multiple required fields are missing', () => {
      const fields = {
        name: 'John Doe',
      };
      const requiredFields = ['name', 'email', 'password', 'age'];

      expect(() => {
        validateRequired(fields, requiredFields);
      }).toThrow('Missing required fields: email, password, age');
    });

    it('should treat empty string as missing', () => {
      const fields = {
        name: '',
        email: 'john@example.com',
      };
      const requiredFields = ['name', 'email'];

      expect(() => {
        validateRequired(fields, requiredFields);
      }).toThrow('Missing required fields: name');
    });

    it('should treat null as missing', () => {
      const fields = {
        name: null,
        email: 'john@example.com',
      };
      const requiredFields = ['name', 'email'];

      expect(() => {
        validateRequired(fields, requiredFields);
      }).toThrow('Missing required fields: name');
    });

    it('should treat undefined as missing', () => {
      const fields = {
        email: 'john@example.com',
      };
      const requiredFields = ['name', 'email'];

      expect(() => {
        validateRequired(fields, requiredFields);
      }).toThrow('Missing required fields: name');
    });

    it('should accept zero as valid value', () => {
      const fields = {
        count: 0,
        name: 'Test',
      };
      const requiredFields = ['count', 'name'];

      expect(() => {
        validateRequired(fields, requiredFields);
      }).not.toThrow();
    });

    it('should accept false as valid value', () => {
      const fields = {
        active: false,
        name: 'Test',
      };
      const requiredFields = ['active', 'name'];

      expect(() => {
        validateRequired(fields, requiredFields);
      }).not.toThrow();
    });
  });

  describe('validateEmail', () => {
    it('should pass validation for valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
        'a@b.co',
        'very.long.email.address@very.long.domain.name.com',
      ];

      validEmails.forEach(email => {
        expect(() => {
          validateEmail(email);
        }).not.toThrow();
      });
    });

    it('should throw ValidationError for invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        'user@',
        '@domain.com',
        'user@@domain.com',
        'user@domain',
        'user @domain.com',
        'user@domain .com',
        '',
        'user@',
        '@',
        'user',
        'user@domain@com',
      ];

      invalidEmails.forEach(email => {
        expect(() => {
          validateEmail(email);
        }).toThrow(ValidationError);
        
        expect(() => {
          validateEmail(email);
        }).toThrow('Invalid email format');
      });
    });
  });

  describe('validatePassword', () => {
    it('should pass validation for valid passwords', () => {
      const validPasswords = [
        '123456',
        'password',
        'mySecureP@ssw0rd!',
        'simple123',
        'a'.repeat(100), // Very long password
      ];

      validPasswords.forEach(password => {
        expect(() => {
          validatePassword(password);
        }).not.toThrow();
      });
    });

    it('should throw ValidationError for passwords that are too short', () => {
      const shortPasswords = [
        '',
        '1',
        '12',
        '123',
        '1234',
        '12345',
      ];

      shortPasswords.forEach(password => {
        expect(() => {
          validatePassword(password);
        }).toThrow(ValidationError);
        
        expect(() => {
          validatePassword(password);
        }).toThrow('Password must be at least 6 characters');
      });
    });

    it('should handle special characters and unicode', () => {
      const specialPasswords = [
        'pässwörd',
        'пароль123',
        '密码123456',
        'p@$$w0rd!',
        'test\npassword',
      ];

      specialPasswords.forEach(password => {
        expect(() => {
          validatePassword(password);
        }).not.toThrow();
      });
    });
  });
});