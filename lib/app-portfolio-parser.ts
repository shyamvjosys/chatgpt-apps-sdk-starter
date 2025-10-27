import fs from 'fs';
import path from 'path';

export interface AppPortfolioRecord {
  app: string;
  identifier: string;
  id: string;
  accountStatus: string;
  monthlyExpense: number;
  roles: string[];
  additionalInformation: string;
  firstName: string;
  lastName: string;
  userStatus: string;
  email: string;
  userId: string;
  userCategory: string;
  departments: string[];
  jobTitle: string;
  role: string;
}

/**
 * Parse the josys-app-portfolio.csv file
 * This file contains service-level details with account identifiers, roles, and costs
 */
export function parseAppPortfolioCSV(): AppPortfolioRecord[] {
  const csvPath = path.join(process.cwd(), 'data', 'josys-app-portfolio.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.warn('App portfolio CSV not found:', csvPath);
    return [];
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');
  
  if (lines.length === 0) return [];

  const headers = lines[0].split(',');
  const records: AppPortfolioRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV with proper handling of quoted fields
    const values = parseCSVLine(line);
    
    if (values.length < headers.length) continue;

    const record: AppPortfolioRecord = {
      app: values[0] || '',
      identifier: values[1] || '',
      id: values[2] || '',
      accountStatus: values[3] || '',
      monthlyExpense: parseFloat(values[4]) || 0,
      roles: values[5] ? values[5].split('|').filter(r => r.trim()) : [],
      additionalInformation: values[6] || '',
      firstName: values[7] || '',
      lastName: values[8] || '',
      userStatus: values[9] || '',
      email: values[10] || '',
      userId: values[11] || '',
      userCategory: values[12] || '',
      departments: values[13] ? values[13].split('|').filter(d => d.trim()) : [],
      jobTitle: values[14] || '',
      role: values[15] || '',
    };

    records.push(record);
  }

  return records;
}

/**
 * Parse a CSV line handling quoted fields properly
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Get all unique apps from portfolio
 */
export function getAllApps(): string[] {
  const records = parseAppPortfolioCSV();
  const apps = new Set(records.map(r => r.app));
  return Array.from(apps).sort();
}

/**
 * Get all unique departments
 */
export function getAllDepartments(): string[] {
  const records = parseAppPortfolioCSV();
  const departments = new Set<string>();
  
  records.forEach(r => {
    r.departments.forEach(d => departments.add(d));
  });
  
  return Array.from(departments).filter(d => d).sort();
}

/**
 * Get all unique job titles
 */
export function getAllJobTitles(): string[] {
  const records = parseAppPortfolioCSV();
  const titles = new Set(records.map(r => r.jobTitle).filter(t => t));
  return Array.from(titles).sort();
}

/**
 * Get all records for a specific user
 */
export function getPortfolioByEmail(email: string): AppPortfolioRecord[] {
  const records = parseAppPortfolioCSV();
  return records.filter(r => r.email.toLowerCase() === email.toLowerCase());
}

/**
 * Get all records for a specific service/app
 */
export function getPortfolioByApp(appName: string): AppPortfolioRecord[] {
  const records = parseAppPortfolioCSV();
  const lowerApp = appName.toLowerCase();
  return records.filter(r => r.app.toLowerCase().includes(lowerApp));
}

/**
 * Get all records for a specific department
 */
export function getPortfolioByDepartment(department: string): AppPortfolioRecord[] {
  const records = parseAppPortfolioCSV();
  const lowerDept = department.toLowerCase();
  return records.filter(r => 
    r.departments.some(d => d.toLowerCase().includes(lowerDept))
  );
}

/**
 * Get all records for a specific job title
 */
export function getPortfolioByJobTitle(jobTitle: string): AppPortfolioRecord[] {
  const records = parseAppPortfolioCSV();
  const lowerTitle = jobTitle.toLowerCase();
  return records.filter(r => r.jobTitle.toLowerCase().includes(lowerTitle));
}

/**
 * Get all contractor records
 */
export function getContractorRecords(): AppPortfolioRecord[] {
  const records = parseAppPortfolioCSV();
  return records.filter(r => 
    r.userCategory.toLowerCase().includes('contractor') ||
    r.userId.startsWith('C')
  );
}
