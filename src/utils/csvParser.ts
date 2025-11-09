/**
 * CSV parsing utilities for prospect import
 * Handles complex CSV parsing with quotes, commas, and proper escaping
 */

export interface ParsedProspect {
  name?: string;
  email?: string;
  company?: string;
  title?: string;
  website?: string;
  phoneNumber?: string;
  industry?: string;
  location?: string;
  linkedinProfile?: string;
  notes?: string;
  tags?: string[];
  source?: string;
  isOptedOut?: boolean;
  status?: string;
}

/**
 * Helper function to parse a single CSV line, handling quotes and commas within fields
 */
export const parseCSVLine = (line: string): string[] => {
  if (!line || typeof line !== 'string') {
    return [];
  }

  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Escaped quote within quotes
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add the last field
  result.push(current.trim());

  return result;
};

/**
 * Main CSV parser function that converts CSV text to array of prospect objects
 */
export const parseCSV = (csvContent: string): ParsedProspect[] => {
  if (!csvContent || typeof csvContent !== 'string') {
    return [];
  }

  const lines = csvContent.split('\n').filter(line => line && line.trim());
  if (lines.length < 2) return [];

  // Parse header line
  const headers = parseCSVLine(lines[0]);
  if (headers.length === 0) return [];

  const records: ParsedProspect[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i] || !lines[i].trim()) continue;

    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const record: ParsedProspect = {};
      headers.forEach((header, index) => {
        if (!header) return;

        const normalizedHeader = header.toLowerCase().trim();
        const value = values[index] ? values[index].trim() : '';

        // Map CSV headers to prospect fields
        if (normalizedHeader === 'name' || normalizedHeader === 'fullname') {
          record.name = value;
        } else if (normalizedHeader === 'email') {
          record.email = value;
        } else if (normalizedHeader === 'company') {
          record.company = value;
        } else if (normalizedHeader === 'title' || normalizedHeader === 'jobtitle') {
          record.title = value;
        } else if (normalizedHeader === 'website') {
          record.website = value;
        } else if (normalizedHeader === 'phone' || normalizedHeader === 'phonenumber' || normalizedHeader === 'phone number') {
          record.phoneNumber = value;
        } else if (normalizedHeader === 'industry') {
          record.industry = value;
        } else if (normalizedHeader === 'location') {
          record.location = value;
        } else if (normalizedHeader === 'linkedin' || normalizedHeader === 'linkedinprofile' || normalizedHeader === 'linkedin profile') {
          record.linkedinProfile = value;
        } else if (normalizedHeader === 'notes') {
          record.notes = value;
        } else if (normalizedHeader === 'tags') {
          record.tags = value ? value.split(',').map(tag => tag.trim()).filter(Boolean) : [];
        } else if (normalizedHeader === 'source') {
          record.source = value;
        } else if (normalizedHeader === 'status') {
          record.status = value;
        } else if (normalizedHeader === 'isoptedout' || normalizedHeader === 'optedout') {
          record.isOptedOut = value.toLowerCase() === 'true' || value.toLowerCase() === 'yes';
        }

        // Support for capital variations as well
        else if (normalizedHeader === 'name' || header === 'Name') {
          record.name = value;
        } else if (normalizedHeader === 'email' || header === 'Email') {
          record.email = value;
        } else if (normalizedHeader === 'company' || header === 'Company') {
          record.company = value;
        } else if (header === 'Title' || header === 'Job Title') {
          record.title = value;
        } else if (header === 'Website') {
          record.website = value;
        } else if (header === 'Phone Number' || header === 'Phone') {
          record.phoneNumber = value;
        } else if (header === 'Industry') {
          record.industry = value;
        } else if (header === 'Location') {
          record.location = value;
        } else if (header === 'LinkedIn Profile' || header === 'LinkedIn') {
          record.linkedinProfile = value;
        } else if (header === 'Notes') {
          record.notes = value;
        } else if (header === 'Tags') {
          record.tags = value ? value.split(',').map(tag => tag.trim()).filter(Boolean) : [];
        } else if (header === 'Source') {
          record.source = value;
        } else if (header === 'Status') {
          record.status = value;
        } else if (header === 'isOptedOut' || header === 'optedOut') {
          record.isOptedOut = value.toLowerCase() === 'true' || value.toLowerCase() === 'yes';
        }
      });
      records.push(record);
    }
  }

  return records;
};

/**
 * Validates a parsed prospect record
 */
export const validateProspect = (prospect: ParsedProspect): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!prospect || typeof prospect !== 'object') {
    errors.push('Invalid prospect data');
    return { isValid: false, errors };
  }

  if (!prospect.name || typeof prospect.name !== 'string' || prospect.name.trim() === '') {
    errors.push('Name is required');
  }

  if (!prospect.email || typeof prospect.email !== 'string' || prospect.email.trim() === '') {
    errors.push('Email is required');
  } else {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(prospect.email.trim())) {
      errors.push('Invalid email format');
    }
  }

  if (!prospect.company || typeof prospect.company !== 'string' || prospect.company.trim() === '') {
    errors.push('Company is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Filters and validates prospects, returning valid and invalid ones separately
 */
export const validateProspects = (prospects: ParsedProspect[]): {
  valid: ParsedProspect[];
  invalid: { prospect: ParsedProspect; errors: string[] }[];
} => {
  const valid: ParsedProspect[] = [];
  const invalid: { prospect: ParsedProspect; errors: string[] }[] = [];

  prospects.forEach((prospect, index) => {
    const validation = validateProspect(prospect);
    if (validation.isValid) {
      valid.push(prospect);
    } else {
      invalid.push({
        prospect,
        errors: validation.errors
      });
    }
  });

  return { valid, invalid };
};

/**
 * Default CSV template headers
 */
export const CSV_TEMPLATE_HEADERS = [
  'Name',
  'Email',
  'Company',
  'Title',
  'Website',
  'Industry',
  'LinkedIn Profile',
  'Phone Number',
  'Location',
  'Notes',
  'Tags',
  'Source'
];

/**
 * Generate CSV template string
 */
export const generateCSVTemplate = (): string => {
  return CSV_TEMPLATE_HEADERS.join(',') + '\n';
};