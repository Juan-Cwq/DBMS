// Database storage utilities for saving and loading database schemas

const STORAGE_KEY = 'schemacraft_saved_databases'

export function getSavedDatabases() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch (error) {
    console.error('Error loading saved databases:', error)
    return []
  }
}

export function saveDatabase(database) {
  try {
    const databases = getSavedDatabases()
    const existingIndex = databases.findIndex(db => db.id === database.id)
    
    if (existingIndex >= 0) {
      // Update existing database
      databases[existingIndex] = {
        ...database,
        updatedAt: new Date().toISOString()
      }
    } else {
      // Add new database
      databases.push({
        ...database,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(databases))
    return true
  } catch (error) {
    console.error('Error saving database:', error)
    return false
  }
}

export function deleteDatabase(id) {
  try {
    const databases = getSavedDatabases()
    const filtered = databases.filter(db => db.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('Error deleting database:', error)
    return false
  }
}

export function getDatabaseById(id) {
  const databases = getSavedDatabases()
  return databases.find(db => db.id === id)
}

export function exportDatabase(database) {
  const dataStr = JSON.stringify(database, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${database.name || 'database'}-${Date.now()}.json`
  link.click()
  URL.revokeObjectURL(url)
}

export function importDatabase(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const database = JSON.parse(e.target.result)
        resolve(database)
      } catch (error) {
        reject(new Error('Invalid database file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

// Get current database schema as context for AI
export function getCurrentDatabaseContext(tables) {
  if (!tables || tables.length === 0) {
    return 'No tables currently exist in the database.'
  }
  
  let context = 'Current database schema:\n\n'
  
  tables.forEach(table => {
    context += `Table: ${table.name}\n`
    context += `Columns:\n`
    
    table.structure.forEach(col => {
      const constraints = []
      if (col.pk) constraints.push('PRIMARY KEY')
      if (col.notnull) constraints.push('NOT NULL')
      if (col.unique) constraints.push('UNIQUE')
      
      context += `  - ${col.name} ${col.type}${constraints.length > 0 ? ' (' + constraints.join(', ') + ')' : ''}\n`
    })
    
    // Extract foreign keys
    const fkMatches = table.sql.matchAll(/FOREIGN KEY \((\w+)\) REFERENCES (\w+)\((\w+)\)/gi)
    for (const match of fkMatches) {
      context += `  - FOREIGN KEY (${match[1]}) REFERENCES ${match[2]}(${match[3]})\n`
    }
    
    context += '\n'
  })
  
  return context
}
