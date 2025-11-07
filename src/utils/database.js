import initSqlJs from 'sql.js';

let SQL = null;
let db = null;

// Initialize SQL.js
export async function initDatabase() {
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    });
  }
  
  // Try to load existing database from localStorage
  const savedDb = localStorage.getItem('schemacraft_database');
  if (savedDb) {
    const uint8Array = new Uint8Array(JSON.parse(savedDb));
    db = new SQL.Database(uint8Array);
  } else {
    db = new SQL.Database();
  }
  
  return db;
}

// Save database to localStorage
export function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Array.from(data);
    localStorage.setItem('schemacraft_database', JSON.stringify(buffer));
  }
}

// Execute SQL query
export function executeQuery(sql) {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    // Enable foreign keys
    db.exec('PRAGMA foreign_keys = ON;');
    
    const results = [];
    
    // Clean and normalize SQL for SQLite
    let normalizedSQL = sql
      // Data type conversions (order matters!)
      .replace(/VARCHAR\s*\(\s*\d+\s*\)/gi, 'TEXT') // VARCHAR -> TEXT
      .replace(/CHAR\s*\(\s*\d+\s*\)/gi, 'TEXT') // CHAR -> TEXT
      .replace(/DATETIME/gi, 'TEXT') // DATETIME -> TEXT
      .replace(/TIMESTAMP/gi, 'TEXT') // TIMESTAMP -> TEXT
      .replace(/DECIMAL\s*\(\s*\d+\s*,\s*\d+\s*\)/gi, 'REAL') // DECIMAL -> REAL
      .replace(/FLOAT/gi, 'REAL') // FLOAT -> REAL
      .replace(/DOUBLE/gi, 'REAL') // DOUBLE -> REAL
      .replace(/BOOLEAN/gi, 'INTEGER') // BOOLEAN -> INTEGER
      .replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT') // MySQL -> SQLite
      .replace(/INT\b/gi, 'INTEGER') // INT -> INTEGER (important for PRIMARY KEY)
      
      // Boolean values
      .replace(/\bTRUE\b/gi, '1') // TRUE -> 1
      .replace(/\bFALSE\b/gi, '0') // FALSE -> 0
      
      // Add IF NOT EXISTS to CREATE TABLE statements
      .replace(/CREATE\s+TABLE\s+(?!IF\s+NOT\s+EXISTS\s+)(\w+)/gi, 'CREATE TABLE IF NOT EXISTS $1')
      
      // Add IF NOT EXISTS to CREATE INDEX statements
      .replace(/CREATE\s+INDEX\s+(?!IF\s+NOT\s+EXISTS\s+)(\w+)/gi, 'CREATE INDEX IF NOT EXISTS $1')
      
      // Remove backticks (MySQL style)
      .replace(/`/g, '')
      
      // Fix CURRENT_TIMESTAMP
      .replace(/DEFAULT\s+CURRENT_TIMESTAMP/gi, "DEFAULT (datetime('now'))")
      
      // Fix timestamp literals in INSERT statements (convert to SQLite format)
      .replace(/'(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})'/g, "'$1 $2'"); // Already correct format, just ensure consistency
    
    const statements = normalizedSQL.split(';').filter(s => s.trim());
    
    // Start a transaction for better atomicity
    db.exec('BEGIN TRANSACTION;');
    
    try {
      for (const statement of statements) {
        if (!statement.trim()) continue;
        
        try {
          const result = db.exec(statement.trim());
          results.push({
            statement: statement.trim(),
            result: result,
            success: true
          });
        } catch (stmtError) {
          // Provide helpful error messages
          if (stmtError.message.includes('foreign key')) {
            throw new Error(`Foreign key constraint failed. Make sure referenced tables exist first. ${stmtError.message}`);
          } else if (stmtError.message.includes('already exists')) {
            throw new Error(`Table already exists. Use DROP TABLE first or modify the CREATE statement. ${stmtError.message}`);
          } else if (stmtError.message.includes('syntax error')) {
            throw new Error(`SQL syntax error. Check your query syntax for SQLite compatibility. ${stmtError.message}`);
          } else if (stmtError.message.includes('no such column')) {
            throw new Error(`Column not found: ${stmtError.message}. This usually means the table schema doesn't match your INSERT statement. Try clearing the database first.`);
          }
          throw stmtError;
        }
      }
      
      // Commit the transaction
      db.exec('COMMIT;');
    } catch (error) {
      // Rollback on error
      db.exec('ROLLBACK;');
      throw error;
    }
    
    // Save after each execution
    saveDatabase();
    
    return results;
  } catch (error) {
    throw new Error(error.message);
  }
}

// Get all tables in the database
export function getTables() {
  if (!db) return [];
  
  try {
    const result = db.exec(`
      SELECT name, sql 
      FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    
    if (result.length === 0) return [];
    
    return result[0].values.map(row => ({
      name: row[0],
      sql: row[1]
    }));
  } catch (error) {
    console.error('Error getting tables:', error);
    return [];
  }
}

// Get table structure
export function getTableStructure(tableName) {
  if (!db) return null;
  
  try {
    const result = db.exec(`PRAGMA table_info(${tableName})`);
    if (result.length === 0) return null;
    
    return result[0].values.map(row => ({
      cid: row[0],
      name: row[1],
      type: row[2],
      notnull: row[3],
      dflt_value: row[4],
      pk: row[5]
    }));
  } catch (error) {
    console.error('Error getting table structure:', error);
    return null;
  }
}

// Get table data
export function getTableData(tableName, limit = 100) {
  if (!db) return null;
  
  try {
    const result = db.exec(`SELECT * FROM ${tableName} LIMIT ${limit}`);
    if (result.length === 0) return { columns: [], rows: [] };
    
    return {
      columns: result[0].columns,
      rows: result[0].values
    };
  } catch (error) {
    console.error('Error getting table data:', error);
    return null;
  }
}

// Drop table
export function dropTable(tableName) {
  if (!db) return false;
  
  try {
    db.exec(`DROP TABLE IF EXISTS ${tableName}`);
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Error dropping table:', error);
    return false;
  }
}

// Clear entire database
export function clearDatabase() {
  if (SQL) {
    db = new SQL.Database();
    localStorage.removeItem('schemacraft_database');
    return true;
  }
  return false;
}

// Export database as SQL
export function exportDatabaseSQL() {
  if (!db) return '';
  
  try {
    const tables = getTables();
    let sql = '-- SchemaCraft AI Database Export\n\n';
    
    for (const table of tables) {
      sql += `${table.sql};\n\n`;
      
      const data = getTableData(table.name, 10000);
      if (data && data.rows.length > 0) {
        for (const row of data.rows) {
          const values = row.map(v => {
            if (v === null) return 'NULL';
            if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
            return v;
          }).join(', ');
          sql += `INSERT INTO ${table.name} VALUES (${values});\n`;
        }
        sql += '\n';
      }
    }
    
    return sql;
  } catch (error) {
    console.error('Error exporting database:', error);
    return '';
  }
}

export { db };
