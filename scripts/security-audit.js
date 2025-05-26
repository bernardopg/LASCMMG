#!/usr/bin/env node

/**
 * Advanced Security Audit Script for LASCMMG
 * Performs comprehensive security scanning including:
 * - Secret detection
 * - Dependency vulnerabilities
 * - Code security patterns
 * - Configuration validation
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

// Security patterns to detect
const SECURITY_PATTERNS = {
  HIGH_RISK: [
    {
      name: 'Hardcoded Password',
      pattern: /(password|pwd|pass)\s*[:=]\s*['"][^'"]{8,}/gi,
      severity: 'HIGH',
    },
    {
      name: 'API Key',
      pattern: /(api[_-]?key|apikey)\s*[:=]\s*['"][^'"]{16,}/gi,
      severity: 'HIGH',
    },
    {
      name: 'JWT Secret',
      pattern: /(jwt[_-]?secret|jwtsecret)\s*[:=]\s*['"][^'"]{16,}/gi,
      severity: 'HIGH',
    },
    {
      name: 'Database URL',
      pattern: /(mongodb|mysql|postgres|redis):\/\/[^\s'"]+/g,
      severity: 'HIGH',
    },
    {
      name: 'Private Key',
      pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g,
      severity: 'CRITICAL',
    },
  ],
  MEDIUM_RISK: [
    {
      name: 'Hardcoded Token',
      pattern: /(token|auth)\s*[:=]\s*['"][^'"]{16,}/gi,
      severity: 'MEDIUM',
    },
    {
      name: 'Base64 Secrets (potential)',
      pattern: /['"][A-Za-z0-9+/]{32,}={0,2}['"]/g,
      severity: 'MEDIUM',
    },
    {
      name: 'Console.log with sensitive data',
      pattern: /console\.log\([^)]*(?:password|token|secret|key)[^)]*\)/gi,
      severity: 'MEDIUM',
    },
  ],
  LOW_RISK: [
    {
      name: 'TODO Security',
      pattern: /todo.*(?:security|auth|password|token)/gi,
      severity: 'LOW',
    },
    {
      name: 'FIXME Security',
      pattern: /fixme.*(?:security|auth|password|token)/gi,
      severity: 'LOW',
    },
  ],
};

// File extensions to scan
const SCAN_EXTENSIONS = [
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.json',
  '.env',
  '.yaml',
  '.yml',
  '.config.js',
];

// Files to exclude from scanning
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.cache',
  'coverage',
  '*.min.js',
  '*.log',
];

class SecurityAuditor {
  constructor() {
    this.results = {
      secrets: [],
      vulnerabilities: [],
      patterns: [],
      recommendations: [],
      score: 0,
    };
    this.scannedFiles = 0;
    this.startTime = Date.now();
  }

  /**
   * Main audit function
   */
  async runFullAudit() {
    console.log('🔍 Iniciando auditoria de segurança avançada...\n');

    try {
      // 1. Scan for secrets and patterns
      await this.scanForSecrets('.');

      // 2. Check npm vulnerabilities
      await this.checkNpmVulnerabilities();

      // 3. Validate security configurations
      await this.validateSecurityConfigurations();

      // 4. Check file permissions
      await this.checkFilePermissions();

      // 5. Generate security score
      this.calculateSecurityScore();

      // 6. Generate report
      this.generateReport();
    } catch (error) {
      console.error('❌ Erro durante auditoria:', error.message);
      process.exit(1);
    }
  }

  /**
   * Recursively scan directories for secrets
   */
  async scanForSecrets(directory) {
    console.log(`📁 Escaneando diretório: ${directory}`);

    const files = await this.getFilesToScan(directory);

    for (const file of files) {
      await this.scanFile(file);
    }
  }

  /**
   * Get list of files to scan
   */
  async getFilesToScan(directory) {
    const files = [];

    const scanDirectory = (dir) => {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        // Skip excluded patterns
        if (this.shouldExclude(fullPath)) {
          continue;
        }

        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (stat.isFile() && this.shouldScanFile(fullPath)) {
          files.push(fullPath);
        }
      }
    };

    scanDirectory(directory);
    return files;
  }

  /**
   * Check if file should be excluded
   */
  shouldExclude(filePath) {
    return EXCLUDE_PATTERNS.some(
      (pattern) => filePath.includes(pattern) || path.basename(filePath).includes(pattern)
    );
  }

  /**
   * Check if file should be scanned
   */
  shouldScanFile(filePath) {
    const ext = path.extname(filePath);
    return SCAN_EXTENSIONS.includes(ext) || path.basename(filePath).startsWith('.env');
  }

  /**
   * Scan individual file for security issues
   */
  async scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      this.scannedFiles++;

      // Check all security patterns
      for (const riskLevel of Object.keys(SECURITY_PATTERNS)) {
        for (const pattern of SECURITY_PATTERNS[riskLevel]) {
          const matches = content.match(pattern.pattern);

          if (matches) {
            for (const match of matches) {
              this.results.patterns.push({
                file: filePath,
                pattern: pattern.name,
                severity: pattern.severity,
                match: this.sanitizeMatch(match),
                line: this.getLineNumber(content, match),
              });
            }
          }
        }
      }

      // Check for specific security issues
      this.checkSpecificSecurityIssues(filePath, content);
    } catch (error) {
      console.warn(`⚠️  Erro ao escanear ${filePath}: ${error.message}`);
    }
  }

  /**
   * Sanitize sensitive matches for reporting
   */
  sanitizeMatch(match) {
    // Don't expose actual secrets in reports
    if (match.length > 20) {
      return match.substring(0, 10) + '***' + match.substring(match.length - 5);
    }
    return match.substring(0, 5) + '***';
  }

  /**
   * Get line number for a match
   */
  getLineNumber(content, match) {
    const index = content.indexOf(match);
    if (index === -1) return 0;

    return content.substring(0, index).split('\n').length;
  }

  /**
   * Check for specific security issues
   */
  checkSpecificSecurityIssues(filePath, content) {
    // Check for eval usage
    if (content.includes('eval(') && !filePath.includes('test')) {
      this.results.patterns.push({
        file: filePath,
        pattern: 'Dangerous eval() usage',
        severity: 'HIGH',
        match: 'eval(...)',
        line: this.getLineNumber(content, 'eval('),
      });
    }

    // Check for innerHTML without sanitization
    if (
      content.includes('.innerHTML') &&
      !content.includes('xss-clean') &&
      !content.includes('DOMPurify')
    ) {
      this.results.patterns.push({
        file: filePath,
        pattern: 'Potential XSS via innerHTML',
        severity: 'MEDIUM',
        match: '.innerHTML',
        line: this.getLineNumber(content, '.innerHTML'),
      });
    }

    // Check for SQL query patterns
    const sqlPattern = /(select|insert|update|delete).*from\s+\w+/gi;
    const sqlMatches = content.match(sqlPattern);
    if (sqlMatches && !content.includes('prepared') && !content.includes('parameterized')) {
      this.results.patterns.push({
        file: filePath,
        pattern: 'Potential SQL injection risk',
        severity: 'HIGH',
        match: this.sanitizeMatch(sqlMatches[0]),
        line: this.getLineNumber(content, sqlMatches[0]),
      });
    }
  }

  /**
   * Check npm vulnerabilities
   */
  async checkNpmVulnerabilities() {
    console.log('🔐 Verificando vulnerabilidades de dependências...');

    try {
      // Check root dependencies
      const rootAudit = await execAsync('npm audit --json').catch((e) => e);
      if (rootAudit.stdout) {
        this.parseNpmAudit(JSON.parse(rootAudit.stdout), 'root');
      }

      // Check frontend dependencies
      const frontendAudit = await execAsync('cd frontend-react && npm audit --json').catch(
        (e) => e
      );
      if (frontendAudit.stdout) {
        this.parseNpmAudit(JSON.parse(frontendAudit.stdout), 'frontend');
      }
    } catch (error) {
      console.warn('⚠️  Erro ao verificar vulnerabilidades npm:', error.message);
    }
  }

  /**
   * Parse npm audit results
   */
  parseNpmAudit(auditData, context) {
    if (auditData.vulnerabilities) {
      for (const [packageName, vulnerability] of Object.entries(auditData.vulnerabilities)) {
        this.results.vulnerabilities.push({
          package: packageName,
          severity: vulnerability.severity,
          context: context,
          title: vulnerability.via[0]?.title || 'Unknown vulnerability',
          range: vulnerability.range,
        });
      }
    }
  }

  /**
   * Validate security configurations
   */
  async validateSecurityConfigurations() {
    console.log('⚙️  Validando configurações de segurança...');

    // Check if .env files exist but not in git
    this.checkEnvironmentFiles();

    // Check server security headers
    this.checkSecurityHeaders();

    // Check HTTPS configuration
    this.checkHttpsConfiguration();
  }

  /**
   * Check environment files
   */
  checkEnvironmentFiles() {
    const envFiles = ['.env', 'backend/.env', 'frontend-react/.env'];

    for (const envFile of envFiles) {
      if (fs.existsSync(envFile)) {
        this.results.recommendations.push({
          type: 'Environment',
          severity: 'MEDIUM',
          message: `Arquivo ${envFile} encontrado - certifique-se de que está no .gitignore`,
        });
      }
    }
  }

  /**
   * Check security headers configuration
   */
  checkSecurityHeaders() {
    const serverFile = 'backend/server.js';
    if (fs.existsSync(serverFile)) {
      const content = fs.readFileSync(serverFile, 'utf8');

      const securityHeaders = [
        'helmet',
        'X-Frame-Options',
        'Content-Security-Policy',
        'X-Content-Type-Options',
      ];

      for (const header of securityHeaders) {
        if (!content.includes(header)) {
          this.results.recommendations.push({
            type: 'Security Headers',
            severity: 'MEDIUM',
            message: `Header de segurança ${header} não encontrado em ${serverFile}`,
          });
        }
      }
    }
  }

  /**
   * Check HTTPS configuration
   */
  checkHttpsConfiguration() {
    // This would check for HTTPS setup in production
    this.results.recommendations.push({
      type: 'HTTPS',
      severity: 'HIGH',
      message: 'Certifique-se de que HTTPS está configurado para produção',
    });
  }

  /**
   * Check file permissions
   */
  async checkFilePermissions() {
    console.log('📋 Verificando permissões de arquivos...');

    const sensitiveFiles = ['.env', 'backend/.env', 'scripts/generate-keys.js'];

    for (const file of sensitiveFiles) {
      if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        const permissions = (stats.mode & parseInt('777', 8)).toString(8);

        if (permissions !== '600' && permissions !== '644') {
          this.results.recommendations.push({
            type: 'File Permissions',
            severity: 'MEDIUM',
            message: `Arquivo ${file} tem permissões ${permissions} - considere usar 600 ou 644`,
          });
        }
      }
    }
  }

  /**
   * Calculate security score
   */
  calculateSecurityScore() {
    let score = 100;

    // Deduct points for issues
    for (const pattern of this.results.patterns) {
      switch (pattern.severity) {
        case 'CRITICAL':
          score -= 25;
          break;
        case 'HIGH':
          score -= 15;
          break;
        case 'MEDIUM':
          score -= 10;
          break;
        case 'LOW':
          score -= 5;
          break;
      }
    }

    for (const vuln of this.results.vulnerabilities) {
      switch (vuln.severity) {
        case 'critical':
          score -= 20;
          break;
        case 'high':
          score -= 15;
          break;
        case 'moderate':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    }

    for (const rec of this.results.recommendations) {
      switch (rec.severity) {
        case 'HIGH':
          score -= 10;
          break;
        case 'MEDIUM':
          score -= 5;
          break;
        case 'LOW':
          score -= 2;
          break;
      }
    }

    this.results.score = Math.max(0, score);
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('🛡️  RELATÓRIO DE AUDITORIA DE SEGURANÇA');
    console.log('='.repeat(60));

    console.log(`📊 Score de Segurança: ${this.results.score}/100`);
    console.log(`📁 Arquivos escaneados: ${this.scannedFiles}`);
    console.log(`⏱️  Tempo de execução: ${duration}s`);
    console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);

    // Security patterns found
    if (this.results.patterns.length > 0) {
      console.log('\n🔍 PADRÕES DE SEGURANÇA ENCONTRADOS:');
      const groupedPatterns = this.groupBy(this.results.patterns, 'severity');

      for (const [severity, patterns] of Object.entries(groupedPatterns)) {
        console.log(`\n${this.getSeverityIcon(severity)} ${severity} (${patterns.length}):`);
        for (const pattern of patterns) {
          console.log(`  📄 ${pattern.file}:${pattern.line} - ${pattern.pattern}`);
        }
      }
    } else {
      console.log('\n✅ Nenhum padrão de segurança suspeito encontrado!');
    }

    // Vulnerabilities
    if (this.results.vulnerabilities.length > 0) {
      console.log('\n🚨 VULNERABILIDADES DE DEPENDÊNCIAS:');
      const groupedVulns = this.groupBy(this.results.vulnerabilities, 'severity');

      for (const [severity, vulns] of Object.entries(groupedVulns)) {
        console.log(
          `\n${this.getSeverityIcon(severity)} ${severity.toUpperCase()} (${vulns.length}):`
        );
        for (const vuln of vulns) {
          console.log(`  📦 ${vuln.package} (${vuln.context}) - ${vuln.title}`);
        }
      }
    } else {
      console.log('\n✅ Nenhuma vulnerabilidade de dependência encontrada!');
    }

    // Recommendations
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 RECOMENDAÇÕES:');
      for (const rec of this.results.recommendations) {
        console.log(`  ${this.getSeverityIcon(rec.severity)} ${rec.message}`);
      }
    }

    // Save detailed report
    this.saveDetailedReport();

    console.log('\n' + '='.repeat(60));
    console.log('📋 Relatório detalhado salvo em: security-audit-report.json');
    console.log('='.repeat(60));
  }

  /**
   * Get severity icon
   */
  getSeverityIcon(severity) {
    const icons = {
      CRITICAL: '🔴',
      HIGH: '🟠',
      MEDIUM: '🟡',
      LOW: '🔵',
      critical: '🔴',
      high: '🟠',
      moderate: '🟡',
      low: '🔵',
    };
    return icons[severity] || '⚪';
  }

  /**
   * Group array by property
   */
  groupBy(array, property) {
    return array.reduce((groups, item) => {
      const key = item[property];
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {});
  }

  /**
   * Save detailed report to file
   */
  saveDetailedReport() {
    const report = {
      metadata: {
        timestamp: new Date().toISOString(),
        duration: ((Date.now() - this.startTime) / 1000).toFixed(2),
        filesScanned: this.scannedFiles,
        score: this.results.score,
      },
      summary: {
        patterns: this.results.patterns.length,
        vulnerabilities: this.results.vulnerabilities.length,
        recommendations: this.results.recommendations.length,
      },
      details: this.results,
    };

    fs.writeFileSync('security-audit-report.json', JSON.stringify(report, null, 2));
  }
}

// Run audit if called directly
if (require.main === module) {
  const auditor = new SecurityAuditor();
  auditor.runFullAudit().catch(console.error);
}

module.exports = SecurityAuditor;
