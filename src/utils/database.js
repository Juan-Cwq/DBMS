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
    const results = [];
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (!statement.trim()) continue;
      
      const result = db.exec(statement);
      results.push({
        statement: statement.trim(),
        result: result,
        success: true
      });
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
