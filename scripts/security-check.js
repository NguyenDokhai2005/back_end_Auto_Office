#!/usr/bin/env node

/**
 * Security Check Script
 * Scans for potential security issues in the codebase
 */

const fs = require('fs');
const path = require('path');

// Patterns to detect potential secrets
const SECRET_PATTERNS = [
  {
    name: 'API Key',
    pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"][a-zA-Z0-9_-]{20,}['"]/gi,
    severity: 'HIGH'
  },
  {
    name: 'JWT Secret',
    pattern: /(?:jwt[_-]?secret|jwtSecret)\s*[:=]\s*['"][a-zA-Z0-9_-]{20,}['"]/gi,
    severity: 'HIGH'
  },
  {
    name: 'Database URL',
    pattern: /(?:database[_-]?url|databaseUrl)\s*[:=]\s*['"](?:postgres|mysql|mongodb):\/\/[^'"]+['"]/gi,
    severity: 'MEDIUM'
  },
  {
    name: 'Private Key',
    pattern: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/gi,
    severity: 'CRITICAL'
  },
  {
    name: 'AWS Access Key',
    pattern: /AKIA[0-9A-Z]{16}/gi,
    severity: 'HIGH'
  },
  {
    name: 'Generic Secret',
    pattern: /(?:secret|password|passwd|pwd)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
    severity: 'MEDIUM'
  }
];

// Files to exclude from scanning
const EXCLUDED_FILES = [
  '.env.example',
  '.env.production',
  'security-check.js',
  'package-lock.json',
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build'
];

// File extensions to scan
const SCAN_EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx', '.json', '.env', '.md'];

class SecurityScanner {
  constructor() {
    this.issues = [];
    this.scannedFiles = 0;
  }

  /**
   * Check if file should be scanned
   */
  shouldScanFile(filePath) {
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath);
    
    // Skip excluded files
    if (EXCLUDED_FILES.some(excluded => filePath.includes(excluded))) {
      return false;
    }

    // Only scan specific extensions
    return SCAN_EXTENSIONS.includes(ext) || fileName.startsWith('.env');
  }

  /**
   * Scan a single file for secrets
   */
  scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      SECRET_PATTERNS.forEach(({ name, pattern, severity }) => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          
          this.issues.push({
            type: 'SECRET',
            severity,
            file: filePath,
            line: lineNumber,
            description: `Potential ${name} found`,
            match: match[0].substring(0, 50) + '...'
          });
        }
      });

      this.scannedFiles++;
    } catch (error) {
      console.warn(`Warning: Could not scan ${filePath}: ${error.message}`);
    }
  }

  /**
   * Recursively scan directory
   */
  scanDirectory(dirPath) {
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          this.scanDirectory(fullPath);
        } else if (stat.isFile() && this.shouldScanFile(fullPath)) {
          this.scanFile(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not scan directory ${dirPath}: ${error.message}`);
    }
  }

  /**
   * Check environment variables
   */
  checkEnvironmentVariables() {
    const envFiles = ['.env', '.env.local', '.env.production'];
    
    envFiles.forEach(envFile => {
      const envPath = path.join(process.cwd(), envFile);
      if (fs.existsSync(envPath)) {
        try {
          const content = fs.readFileSync(envPath, 'utf8');
          const lines = content.split('\n');
          
          lines.forEach((line, index) => {
            const trimmed = line.trim();
            
            // Check for empty values
            if (trimmed.includes('=') && !trimmed.startsWith('#')) {
              const [key, value] = trimmed.split('=', 2);
              
              if (!value || value.trim() === '' || value.includes('your-') || value.includes('replace-')) {
                this.issues.push({
                  type: 'CONFIG',
                  severity: 'LOW',
                  file: envPath,
                  line: index + 1,
                  description: `Environment variable ${key} appears to have placeholder value`,
                  match: trimmed
                });
              }
            }
          });
        } catch (error) {
          console.warn(`Warning: Could not check ${envFile}: ${error.message}`);
        }
      }
    });
  }

  /**
   * Check for common security misconfigurations
   */
  checkSecurityConfig() {
    // Check Next.js config
    const nextConfigPath = path.join(process.cwd(), 'next.config.mjs');
    if (fs.existsSync(nextConfigPath)) {
      try {
        const content = fs.readFileSync(nextConfigPath, 'utf8');
        
        if (!content.includes('poweredByHeader: false')) {
          this.issues.push({
            type: 'CONFIG',
            severity: 'LOW',
            file: nextConfigPath,
            line: 0,
            description: 'X-Powered-By header not disabled',
            match: 'poweredByHeader setting missing'
          });
        }

        if (!content.includes('reactStrictMode: true')) {
          this.issues.push({
            type: 'CONFIG',
            severity: 'LOW',
            file: nextConfigPath,
            line: 0,
            description: 'React strict mode not enabled',
            match: 'reactStrictMode setting missing'
          });
        }
      } catch (error) {
        console.warn(`Warning: Could not check next.config.mjs: ${error.message}`);
      }
    }

    // Check package.json for security
    const packagePath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packagePath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        // Check for audit script
        if (!packageJson.scripts || !packageJson.scripts.audit) {
          this.issues.push({
            type: 'CONFIG',
            severity: 'LOW',
            file: packagePath,
            line: 0,
            description: 'No npm audit script defined',
            match: 'scripts.audit missing'
          });
        }
      } catch (error) {
        console.warn(`Warning: Could not check package.json: ${error.message}`);
      }
    }
  }

  /**
   * Run complete security scan
   */
  scan() {
    console.log('🔍 Starting security scan...\n');
    
    // Scan source code
    this.scanDirectory(process.cwd());
    
    // Check environment variables
    this.checkEnvironmentVariables();
    
    // Check security configuration
    this.checkSecurityConfig();
    
    this.generateReport();
  }

  /**
   * Generate security report
   */
  generateReport() {
    console.log(`📊 Security Scan Results`);
    console.log(`Files scanned: ${this.scannedFiles}`);
    console.log(`Issues found: ${this.issues.length}\n`);

    if (this.issues.length === 0) {
      console.log('✅ No security issues found!');
      return;
    }

    // Group issues by severity
    const groupedIssues = this.issues.reduce((acc, issue) => {
      if (!acc[issue.severity]) acc[issue.severity] = [];
      acc[issue.severity].push(issue);
      return acc;
    }, {});

    // Display issues by severity
    ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].forEach(severity => {
      if (groupedIssues[severity]) {
        console.log(`\n🚨 ${severity} SEVERITY (${groupedIssues[severity].length} issues):`);
        console.log('─'.repeat(50));
        
        groupedIssues[severity].forEach((issue, index) => {
          console.log(`${index + 1}. ${issue.description}`);
          console.log(`   File: ${issue.file}:${issue.line}`);
          console.log(`   Type: ${issue.type}`);
          if (issue.match) {
            console.log(`   Match: ${issue.match}`);
          }
          console.log('');
        });
      }
    });

    // Exit with error code if critical or high severity issues found
    const criticalCount = (groupedIssues.CRITICAL || []).length;
    const highCount = (groupedIssues.HIGH || []).length;
    
    if (criticalCount > 0 || highCount > 0) {
      console.log(`❌ Found ${criticalCount} critical and ${highCount} high severity issues.`);
      console.log('Please fix these issues before deploying to production.');
      process.exit(1);
    } else {
      console.log('✅ No critical or high severity issues found.');
    }
  }
}

// Run the scanner
if (require.main === module) {
  const scanner = new SecurityScanner();
  scanner.scan();
}

module.exports = SecurityScanner;