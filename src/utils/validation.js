import { ValidationError } from './errors.js';

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @throws {ValidationError} If email format is invalid
 */
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new ValidationError('Invalid email format');
    }
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @throws {ValidationError} If password doesn't meet requirements
 */
export const validatePassword = (password) => {
    if (password.length < 8) {
        throw new ValidationError('Password must be at least 8 characters long');
    }
    
    // Check for at least one number
    if (!/\d/.test(password)) {
        throw new ValidationError('Password must contain at least one number');
    }
    
    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
        throw new ValidationError('Password must contain at least one uppercase letter');
    }
};

/**
 * Validate date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @throws {ValidationError} If dates are invalid
 */
export const validateDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new ValidationError('Invalid date format');
    }

    if (start < new Date()) {
        throw new ValidationError('Start date must be in the future');
    }

    if (start >= end) {
        throw new ValidationError('End date must be after start date');
    }
};

/**
 * Validate required fields
 * @param {Object} data - Data object to validate
 * @param {string[]} fields - Required field names
 * @throws {ValidationError} If any required field is missing
 */
export const validateRequired = (data, fields) => {
    const missing = fields.filter(field => !data[field]);
    if (missing.length > 0) {
        throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
    }
};

/**
 * Validate numeric value range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {string} fieldName - Name of the field being validated
 * @throws {ValidationError} If value is outside allowed range
 */
export const validateNumericRange = (value, min, max, fieldName) => {
    if (typeof value !== 'number' || isNaN(value)) {
        throw new ValidationError(`${fieldName} must be a number`);
    }
    
    if (value < min || value > max) {
        throw new ValidationError(`${fieldName} must be between ${min} and ${max}`);
    }
}; 