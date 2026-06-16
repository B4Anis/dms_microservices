import Papa from 'papaparse';
import { userService } from './userService';

export const importService = {
  // Parse CSV file asynchronously using PapaParse
  parseCSV(file) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        transform: (value) => value.trim(),
        complete: (results) => {
          if (results.errors && results.errors.length > 0) {
            console.warn('CSV parsing generated warnings:', results.errors);
          }
          resolve({
            data: results.data,
            headers: results.meta.fields,
          });
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  },

  // Validate a single row based on mapped fields
  validateUserRow(row, existingEmails) {
    const errors = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Required fields check
    if (!row.firstName) errors.push('First name is required');
    if (!row.lastName) errors.push('Last name is required');
    
    // Email checks
    if (!row.email) {
      errors.push('Email is required');
    } else if (!emailRegex.test(row.email)) {
      errors.push('Invalid email format');
    } else if (existingEmails.has(row.email.toLowerCase())) {
      errors.push('Email already exists in system or earlier in CSV');
    }

    // Role check
    if (row.role && !['admin', 'user'].includes(row.role.toLowerCase())) {
      errors.push("Role must be 'admin' or 'user'");
    }

    // Status check
    if (row.status && !['active', 'suspended'].includes(row.status.toLowerCase())) {
      errors.push("Status must be 'active' or 'suspended'");
    }

    return {
      isValid: errors.length === 0,
      errors: errors.join('; ')
    };
  },

  // Validate all mapped rows
  async validateAllRows(mappedData) {
    // Fetch existing users to check for duplicate emails globally
    let existingUsers = [];
    try {
      existingUsers = await userService.getUsers();
    } catch (e) {
      console.error('Failed to fetch existing users for validation');
    }
    
    const existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));
    
    const validatedRows = mappedData.map((row, index) => {
      const validation = this.validateUserRow(row, existingEmails);
      
      // Add email to tracking set to catch duplicates WITHIN the CSV file itself
      if (row.email && validation.isValid) {
        existingEmails.add(row.email.toLowerCase());
      }
      
      return {
        _index: index + 1,
        ...row,
        _isValid: validation.isValid,
        _errors: validation.errors
      };
    });

    return validatedRows;
  },

  // Process the import batch
  async importUsers(validRows, onProgress) {
    const results = {
      success: 0,
      failed: [],
    };

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        // Construct the user payload, defaulting missing optional fields
        const userData = {
          id: Math.random().toString(36).substring(2, 9),
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          role: (row.role || 'user').toLowerCase(),
          status: (row.status || 'active').toLowerCase(),
          password: 'Password123!', // Default password for imported users
          departments: row.departmentId ? [row.departmentId] : []
        };

        await userService.createUser(userData);
        results.success++;
      } catch (error) {
        results.failed.push({
          row: row._index,
          email: row.email,
          reason: error.message || 'Server error'
        });
      }
      
      // Report progress (simulate slightly slower batching for UI to keep up)
      if (onProgress) {
        onProgress({ current: i + 1, total: validRows.length });
        await new Promise(resolve => setTimeout(resolve, 100)); 
      }
    }

    return results;
  },

  // Generate CSV Blob for failed rows
  generateErrorReport(failedRows) {
    if (!failedRows || !failedRows.length) return;

    const csvContent = [
      'Row,Email,Error Reason',
      ...failedRows.map(f => `${f.row},${f.email},"${f.reason.replace(/"/g, '""')}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `import-errors-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
