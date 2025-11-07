// SQL Dialect Conversion Utilities
// Converts SQL between different database systems

export const DB_TYPES = {
  SQLITE: 'sqlite',
  MYSQL: 'mysql',
  POSTGRESQL: 'postgresql',
  SQLSERVER: 'sqlserver',
  ORACLE: 'oracle'
};

export const DB_CONFIGS = {
  [DB_TYPES.SQLITE]: {
    name: 'SQLite',
    displayName: 'SQLite',
    icon: '🗄️',
    color: '#003B57',
    description: 'Lightweight, serverless database',
    canExecute: true, // Can execute in browser
    features: ['Serverless', 'Zero configuration', 'Cross-platform', 'ACID compliant']
  },
  [DB_TYPES.MYSQL]: {
    name: 'MySQL',
    displayName: 'MySQL',
    icon: '🐬',
    color: '#00758F',
    description: 'Popular open-source relational database',
    canExecute: false,
    features: ['High performance', 'Replication', 'ACID compliant', 'Wide adoption']
  },
  [DB_TYPES.POSTGRESQL]: {
    name: 'PostgreSQL',
    displayName: 'PostgreSQL',
    icon: '🐘',
    color: '#336791',
    description: 'Advanced open-source relational database',
    canExecute: false,
    features: ['ACID compliant', 'JSON support', 'Advanced indexing', 'Extensible']
  },
  [DB_TYPES.SQLSERVER]: {
    name: 'SQL Server',
    displayName: 'SQL Server',
    icon: '🔷',
    color: '#CC2927',
    description: 'Microsoft enterprise database',
    canExecute: false,
    features: ['Enterprise features', 'Integration with .NET', 'Business intelligence', 'High availability']
  },
  [DB_TYPES.ORACLE]: {
    name: 'Oracle',
    displayName: 'Oracle Database',
    icon: '🔴',
    color: '#F80000',
    description: 'Enterprise-grade database system',
    canExecute: false,
    features: ['Enterprise scale', 'High performance', 'Advanced security', 'Multi-model']
  }
};

/**
 * Convert SQL from one dialect to another
 * Note: This is a basic converter and may not handle all edge cases
 */
export function convertSQLDialect(sql, fromDialect, toDialect) {
  if (fromDialect === toDialect) return sql;
  
  let converted = sql;
  
  // Convert to SQLite (most common target for browser execution)
  if (toDialect === DB_TYPES.SQLITE) {
    converted = converted
      // Data types (order matters - more specific first)
      .replace(/NVARCHAR\s*\(\s*\d+\s*\)/gi, 'TEXT')
      .replace(/VARCHAR2\s*\(\s*\d+\s*\)/gi, 'TEXT')
      .replace(/VARCHAR\s*\(\s*\d+\s*\)/gi, 'TEXT')
      .replace(/CHARACTER\s+VARYING\s*\(\s*\d+\s*\)/gi, 'TEXT')
      .replace(/CHAR\s*\(\s*\d+\s*\)/gi, 'TEXT')
      .replace(/DATETIME2/gi, 'TEXT')
      .replace(/DATETIME/gi, 'TEXT')
      .replace(/TIMESTAMP\s+WITHOUT\s+TIME\s+ZONE/gi, 'TEXT')
      .replace(/TIMESTAMP\s+WITH\s+TIME\s+ZONE/gi, 'TEXT')
      .replace(/TIMESTAMP/gi, 'TEXT')
      .replace(/DATE/gi, 'TEXT')
      .replace(/TIME/gi, 'TEXT')
      .replace(/NUMERIC\s*\(\s*\d+\s*,\s*\d+\s*\)/gi, 'REAL')
      .replace(/DECIMAL\s*\(\s*\d+\s*,\s*\d+\s*\)/gi, 'REAL')
      .replace(/NUMBER\s*\(\s*\d+\s*,\s*\d+\s*\)/gi, 'REAL')
      .replace(/NUMBER\s*\(\s*\d+\s*\)/gi, 'INTEGER')
      .replace(/NUMBER\b/gi, 'REAL')
      .replace(/DOUBLE\s+PRECISION/gi, 'REAL')
      .replace(/FLOAT/gi, 'REAL')
      .replace(/DOUBLE/gi, 'REAL')
      .replace(/BOOLEAN/gi, 'INTEGER')
      .replace(/BIT\b/gi, 'INTEGER')
      .replace(/SMALLINT/gi, 'INTEGER')
      .replace(/BIGINT/gi, 'INTEGER')
      .replace(/INT\b/gi, 'INTEGER')
      
      // Auto-increment (order matters)
      .replace(/BIGSERIAL/gi, 'INTEGER')
      .replace(/SERIAL/gi, 'INTEGER')
      .replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT')
      .replace(/IDENTITY\s*\(\s*\d+\s*,\s*\d+\s*\)/gi, 'AUTOINCREMENT')
      .replace(/GENERATED\s+(?:ALWAYS|BY\s+DEFAULT)\s+AS\s+IDENTITY(?:\s*\([^)]*\))?/gi, 'AUTOINCREMENT')
      
      // Boolean values
      .replace(/\bTRUE\b/gi, '1')
      .replace(/\bFALSE\b/gi, '0')
      
      // Timestamps and functions
      .replace(/CURRENT_TIMESTAMP/gi, "(datetime('now'))")
      .replace(/GETDATE\(\)/gi, "(datetime('now'))")
      .replace(/SYSTIMESTAMP/gi, "(datetime('now'))")
      .replace(/NOW\(\)/gi, "(datetime('now'))")
      
      // PostgreSQL-specific: Remove ON UPDATE CASCADE/RESTRICT from column definitions
      .replace(/ON\s+UPDATE\s+(?:CASCADE|RESTRICT|SET\s+NULL|SET\s+DEFAULT|NO\s+ACTION)/gi, '')
      
      // Remove backticks and square brackets
      .replace(/`/g, '')
      .replace(/\[/g, '')
      .replace(/\]/g, '')
      
      // Add IF NOT EXISTS
      .replace(/CREATE\s+TABLE\s+(?!IF\s+NOT\s+EXISTS\s+)(\w+)/gi, 'CREATE TABLE IF NOT EXISTS $1')
      .replace(/CREATE\s+INDEX\s+(?!IF\s+NOT\s+EXISTS\s+)(\w+)/gi, 'CREATE INDEX IF NOT EXISTS $1')
      
      // Remove PostgreSQL-specific syntax
      .replace(/::[\w\[\]]+/g, '') // Remove type casts like ::integer
      .replace(/CONSTRAINT\s+(\w+)\s+/gi, '') // Simplify constraint names for SQLite
      
      // Clean up multiple spaces
      .replace(/\s+/g, ' ');
  }
  
  return converted;
}

/**
 * Get the appropriate SQL executor based on database type
 */
export function canExecuteInBrowser(dbType) {
  return DB_CONFIGS[dbType]?.canExecute || false;
}

/**
 * Get database configuration
 */
export function getDBConfig(dbType) {
  return DB_CONFIGS[dbType] || DB_CONFIGS[DB_TYPES.SQLITE];
}

/**
 * Get all available database types
 */
export function getAllDBTypes() {
  return Object.keys(DB_CONFIGS).map(key => ({
    value: key,
    ...DB_CONFIGS[key]
  }));
}
