/**
 * Data Validator
 *
 * Core logic: Check incoming data against a boomerang schema
 * Returns real-time feedback on what's missing or malformed
 *
 * This is THE KEY VALUE of Data Boomerang:
 * Users know instantly if their data is acceptable
 */

class DataValidator {
  /**
   * Validate a row of data against a schema
   *
   * @param {Object} row - Single row of data
   * @param {Object} schema - Boomerang schema with required fields and rules
   * @returns {Object} { isValid: bool, errors: [], warnings: [] }
   */
  validateRow(row, schema) {
    const errors = [];
    const warnings = [];
    const validatedRow = { ...row };

    // Check each required field
    for (const field of schema.requiredFields) {
      if (!row[field.name]) {
        errors.push({
          field: field.name,
          message: `Missing required field: '${field.name}'`,
          severity: 'error',
        });
        continue;
      }

      // Type validation
      const fieldValue = row[field.name];
      const validationResult = this.validateFieldType(
        fieldValue,
        field.type,
        field.name,
        field.rules || {}
      );

      if (!validationResult.isValid) {
        errors.push({
          field: field.name,
          message: validationResult.message,
          severity: 'error',
        });
      }

      if (validationResult.warnings?.length) {
        warnings.push(...validationResult.warnings);
      }

      // Apply any transformations
      if (validationResult.transformed !== undefined) {
        validatedRow[field.name] = validationResult.transformed;
      }
    }

    // Check for unknown fields (bonus: warn about unexpected columns)
    const knownFields = schema.requiredFields.map((f) => f.name);
    for (const key of Object.keys(row)) {
      if (!knownFields.includes(key)) {
        warnings.push({
          field: key,
          message: `Unknown field: '${key}' (not in schema)`,
          severity: 'warning',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validatedRow,
    };
  }

  /**
   * Validate a batch of rows and collect feedback
   *
   * @param {Array} rows - Array of data rows
   * @param {Object} schema - Boomerang schema
   * @returns {Object} Summary of validation results
   */
  validateBatch(rows, schema) {
    const results = [];
    const summary = {
      total: rows.length,
      valid: 0,
      invalid: 0,
      warnings: 0,
      errors: {},
      sampleErrors: [],
    };

    rows.forEach((row, index) => {
      const validation = this.validateRow(row, schema);
      results.push({
        rowIndex: index + 2, // +2 because row 0 is header, display 1-indexed
        ...validation,
      });

      if (validation.isValid) {
        summary.valid += 1;
      } else {
        summary.invalid += 1;
        // Track which fields have the most errors
        validation.errors.forEach((err) => {
          summary.errors[err.field] = (summary.errors[err.field] || 0) + 1;
          if (summary.sampleErrors.length < 5) {
            summary.sampleErrors.push({
              rowIndex: index + 2,
              ...err,
            });
          }
        });
      }

      summary.warnings += validation.warnings.length;
    });

    return {
      results,
      summary,
    };
  }

  /**
   * Validate a single field's type and format
   *
   * @param {*} value - Field value
   * @param {string} type - Field type (string, number, date, email)
   * @param {string} fieldName - Field name (for messages)
   * @param {Object} rules - Validation rules (min, max, pattern, etc.)
   * @returns {Object} { isValid: bool, message: string, transformed?: * }
   */
  validateFieldType(value, type, fieldName, rules = {}) {
    const errors = [];
    let transformed = value;

    // Trim whitespace
    if (typeof value === 'string') {
      transformed = value.trim();
    }

    switch (type) {
      case 'string':
        if (typeof transformed !== 'string' && transformed !== '') {
          errors.push(`'${fieldName}' must be text`);
        }
        if (rules.minLength && transformed.length < rules.minLength) {
          errors.push(`'${fieldName}' must be at least ${rules.minLength} characters`);
        }
        if (rules.maxLength && transformed.length > rules.maxLength) {
          errors.push(`'${fieldName}' must be at most ${rules.maxLength} characters`);
        }
        if (rules.pattern) {
          const regex = new RegExp(rules.pattern);
          if (!regex.test(transformed)) {
            errors.push(`'${fieldName}' format is invalid (pattern: ${rules.pattern})`);
          }
        }
        break;

      case 'number':
        const num = Number(transformed);
        if (isNaN(num)) {
          errors.push(`'${fieldName}' must be a number, got '${transformed}'`);
        } else {
          transformed = num;
          if (rules.min !== undefined && num < rules.min) {
            errors.push(`'${fieldName}' must be at least ${rules.min}`);
          }
          if (rules.max !== undefined && num > rules.max) {
            errors.push(`'${fieldName}' must be at most ${rules.max}`);
          }
        }
        break;

      case 'date':
        const date = new Date(transformed);
        if (isNaN(date.getTime())) {
          errors.push(`'${fieldName}' must be a valid date, got '${transformed}'`);
        } else {
          transformed = date.toISOString().split('T')[0]; // Normalize to YYYY-MM-DD
          if (rules.minDate && date < new Date(rules.minDate)) {
            errors.push(`'${fieldName}' must be on or after ${rules.minDate}`);
          }
          if (rules.maxDate && date > new Date(rules.maxDate)) {
            errors.push(`'${fieldName}' must be on or before ${rules.maxDate}`);
          }
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(transformed)) {
          errors.push(`'${fieldName}' must be a valid email`);
        }
        break;

      case 'integer':
        const int = parseInt(transformed, 10);
        if (isNaN(int) || String(int) !== String(transformed).trim()) {
          errors.push(`'${fieldName}' must be a whole number`);
        } else {
          transformed = int;
        }
        break;

      default:
        // Unknown type, just check if it exists
        break;
    }

    return {
      isValid: errors.length === 0,
      message: errors.join('; ') || 'Valid',
      warnings: rules.optional ? [] : [],
      transformed,
    };
  }
}

export default new DataValidator();
