// DBML to SQLite parser
// Converts Database Markup Language to SQLite CREATE TABLE statements

export function parseDBML(dbmlCode) {
  const lines = dbmlCode.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('//'))
  
  const tables = []
  const relationships = []
  let currentTable = null
  let inTableBlock = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Parse Table definition
    if (line.startsWith('Table ')) {
      const tableName = line.match(/Table\s+(\w+)/)?.[1]
      if (tableName) {
        currentTable = {
          name: tableName,
          columns: []
        }
        inTableBlock = true
      }
    }
    // End of table block
    else if (line === '}' && inTableBlock) {
      if (currentTable) {
        tables.push(currentTable)
        currentTable = null
      }
      inTableBlock = false
    }
    // Parse columns inside table
    else if (inTableBlock && currentTable) {
      const columnMatch = line.match(/^(\w+)\s+(int|varchar|text|decimal|real|integer|datetime|timestamp|boolean|bool)(\s+\[([^\]]+)\])?/)
      if (columnMatch) {
        const [, name, type, , constraints] = columnMatch
        
        // Auto-detect primary keys by common naming patterns
        const isPrimaryKey = name.toLowerCase().endsWith('id') && 
                            currentTable.columns.length === 0 && 
                            !constraints
        
        const column = {
          name,
          type: mapDBMLTypeToSQLite(type),
          constraints: isPrimaryKey ? ['PRIMARY KEY'] : parseConstraints(constraints)
        }
        currentTable.columns.push(column)
      }
    }
    // Parse relationships
    else if (line.startsWith('Ref:')) {
      const refMatch = line.match(/Ref:\s*(\w+)\.(\w+)\s*([><-]+)\s*(\w+)\.(\w+)/)
      if (refMatch) {
        const [, table1, col1, relation, table2, col2] = refMatch
        relationships.push({
          fromTable: table1,
          fromColumn: col1,
          toTable: table2,
          toColumn: col2,
          type: relation
        })
      }
    }
  }
  
  return { tables, relationships }
}

function mapDBMLTypeToSQLite(dbmlType) {
  const typeMap = {
    'int': 'INTEGER',
    'integer': 'INTEGER',
    'varchar': 'TEXT',
    'text': 'TEXT',
    'decimal': 'REAL',
    'real': 'REAL',
    'datetime': 'TEXT',
    'timestamp': 'TEXT',
    'boolean': 'INTEGER',
    'bool': 'INTEGER'
  }
  return typeMap[dbmlType.toLowerCase()] || 'TEXT'
}

function parseConstraints(constraintStr) {
  if (!constraintStr) return []
  
  const constraints = []
  const lower = constraintStr.toLowerCase()
  
  if (lower.includes('pk') || lower.includes('primary key')) {
    constraints.push('PRIMARY KEY')
  }
  if (lower.includes('not null')) {
    constraints.push('NOT NULL')
  }
  if (lower.includes('unique')) {
    constraints.push('UNIQUE')
  }
  if (lower.includes('increment') || lower.includes('autoincrement')) {
    constraints.push('AUTOINCREMENT')
  }
  
  // Extract default values
  const defaultMatch = constraintStr.match(/default:\s*['"]?([^'",\]]+)['"]?/i)
  if (defaultMatch) {
    constraints.push(`DEFAULT ${defaultMatch[1]}`)
  }
  
  return constraints
}

export function dbmlToSQL(dbmlCode) {
  const { tables, relationships } = parseDBML(dbmlCode)
  const sqlStatements = []
  
  // Generate CREATE TABLE statements
  for (const table of tables) {
    let sql = `CREATE TABLE IF NOT EXISTS ${table.name} (\n`
    
    // Add columns
    const columnDefs = table.columns.map(col => {
      let def = `  ${col.name} ${col.type}`
      
      // Add constraints
      if (col.constraints.length > 0) {
        def += ' ' + col.constraints.join(' ')
      }
      
      return def
    })
    
    sql += columnDefs.join(',\n')
    sql += '\n);'
    
    sqlStatements.push(sql)
  }
  
  // Add foreign key constraints as separate ALTER TABLE statements (or inline if preferred)
  // Note: SQLite requires foreign keys to be defined during table creation
  // So we need to regenerate tables with foreign keys
  
  // Regenerate tables with foreign keys
  const tablesWithFK = []
  for (const table of tables) {
    const tableFKs = relationships.filter(rel => rel.fromTable === table.name)
    
    if (tableFKs.length > 0) {
      let sql = `CREATE TABLE IF NOT EXISTS ${table.name} (\n`
      
      // Add columns
      const columnDefs = table.columns.map(col => {
        let def = `  ${col.name} ${col.type}`
        if (col.constraints.length > 0) {
          def += ' ' + col.constraints.join(' ')
        }
        return def
      })
      
      // Add foreign keys
      const fkDefs = tableFKs.map(fk => 
        `  FOREIGN KEY (${fk.fromColumn}) REFERENCES ${fk.toTable}(${fk.toColumn})`
      )
      
      sql += [...columnDefs, ...fkDefs].join(',\n')
      sql += '\n);'
      
      tablesWithFK.push({ name: table.name, sql })
    }
  }
  
  // Replace tables that have foreign keys
  const finalStatements = sqlStatements.map(stmt => {
    const tableName = stmt.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1]
    const withFK = tablesWithFK.find(t => t.name === tableName)
    return withFK ? withFK.sql : stmt
  })
  
  // Don't add timestamps automatically - let user define their own schema
  return finalStatements.join('\n\n')
}

// Check if input is DBML
export function isDBML(code) {
  const trimmed = code.trim()
  return trimmed.includes('Table ') && 
         (trimmed.includes('Ref:') || trimmed.match(/Table\s+\w+\s*{/))
}
