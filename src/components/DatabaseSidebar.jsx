import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Database, 
  Table, 
  ChevronRight, 
  ChevronDown, 
  Trash2, 
  RefreshCw,
  Download,
  Plus,
  Eye
} from 'lucide-react'
import { getTables, getTableStructure, dropTable, exportDatabaseSQL } from '../utils/database'

export default function DatabaseSidebar({ onTableSelect, onRefresh, mysqlConnection = null }) {
  const [tables, setTables] = useState([])
  const [expandedTables, setExpandedTables] = useState(new Set())
  const [selectedTable, setSelectedTable] = useState(null)
  const [tableStructures, setTableStructures] = useState({})
  const [mysqlTables, setMysqlTables] = useState([])

  useEffect(() => {
    loadTables()
  }, [])

  useEffect(() => {
    if (mysqlConnection?.connected && mysqlConnection.dbType === 'mysql') {
      loadMySQLTables()
    } else {
      setMysqlTables([])
    }
  }, [mysqlConnection])
  
  // Auto-expand all tables when they're loaded
  useEffect(() => {
    if (tables.length > 0) {
      const allTableNames = new Set(tables.map(t => t.name))
      setExpandedTables(allTableNames)
      
      // Load structures for all tables
      const structures = {}
      for (const table of tables) {
        structures[table.name] = getTableStructure(table.name)
      }
      setTableStructures(structures)
    }
  }, [tables])

  const loadTables = () => {
    const allTables = getTables()
    setTables(allTables)
    
    // Load structures for expanded tables
    const structures = {}
    for (const table of allTables) {
      if (expandedTables.has(table.name)) {
        structures[table.name] = getTableStructure(table.name)
      }
    }
    setTableStructures(structures)
  }

  const loadMySQLTables = async () => {
    if (!mysqlConnection?.connected || mysqlConnection.dbType !== 'mysql') return

    try {
      const endpoint = `${window.location.origin}/api/execute-mysql`
      
      // Get table names
      const tablesResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getTables',
          connectionId: mysqlConnection.connectionId
        })
      })
      
      const tablesData = await tablesResponse.json()
      if (!tablesData.success) return

      // Get structure for each table
      const tablesWithStructure = await Promise.all(
        tablesData.tables.map(async (tableName) => {
          const structResponse = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'getTableStructure',
              connectionId: mysqlConnection.connectionId,
              tableName
            })
          })
          
          const structData = await structResponse.json()
          return {
            name: tableName,
            structure: structData.columns || [],
            foreignKeys: structData.foreignKeys || []
          }
        })
      )

      setMysqlTables(tablesWithStructure)
      
      // Auto-expand MySQL tables
      const mysqlTableNames = new Set(tablesWithStructure.map(t => t.name))
      setExpandedTables(prev => new Set([...prev, ...mysqlTableNames]))
    } catch (error) {
      console.error('Error fetching MySQL tables:', error)
    }
  }

  const toggleTable = (tableName) => {
    const newExpanded = new Set(expandedTables)
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName)
    } else {
      newExpanded.add(tableName)
      if (!tableStructures[tableName]) {
        setTableStructures({
          ...tableStructures,
          [tableName]: getTableStructure(tableName)
        })
      }
    }
    setExpandedTables(newExpanded)
  }

  const handleTableClick = (table) => {
    setSelectedTable(table.name)
    if (onTableSelect) {
      onTableSelect(`SELECT * FROM ${table.name}`)
    }
  }

  const handleViewTableData = async (tableName, e) => {
    e.stopPropagation()
    
    if (mysqlConnection?.connected && mysqlConnection.dbType === 'mysql') {
      // For MySQL, use the connection to fetch data
      try {
        const endpoint = `${window.location.origin}/api/execute-mysql`
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'execute',
            connectionId: mysqlConnection.connectionId,
            query: `SELECT * FROM ${tableName} LIMIT 100`
          })
        })
        
        const data = await response.json()
        if (data.success && onTableSelect) {
          // Trigger the query runner to show results
          onTableSelect(`SELECT * FROM ${tableName} LIMIT 100`)
        }
      } catch (error) {
        console.error('Error fetching table data:', error)
      }
    } else {
      // For SQLite, use the existing method
      if (onTableSelect) {
        onTableSelect(`SELECT * FROM ${tableName}`)
      }
    }
  }

  const handleDropTable = (tableName, e) => {
    e.stopPropagation()
    if (confirm(`Are you sure you want to drop table "${tableName}"?`)) {
      dropTable(tableName)
      loadTables()
      if (onRefresh) onRefresh()
    }
  }

  const handleRefresh = () => {
    loadTables()
    if (onRefresh) onRefresh()
  }

  const handleExport = () => {
    const sql = exportDatabaseSQL()
    const blob = new Blob([sql], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `database-export-${Date.now()}.sql`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full flex flex-col bg-base-200">
      {/* Header */}
      <div className="p-4 border-b border-base-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Database</h3>
          </div>
          <div className="flex gap-1">
            <button
              onClick={handleRefresh}
              className="btn btn-ghost btn-xs btn-circle"
              title="Refresh"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
            <button
              onClick={handleExport}
              className="btn btn-ghost btn-xs btn-circle"
              title="Export Database"
              disabled={tables.length === 0}
            >
              <Download className="w-3 h-3" />
            </button>
          </div>
        </div>
        
        <div className="stats stats-vertical shadow-sm bg-base-100 w-full">
          <div className="stat py-2 px-3">
            <div className="stat-title text-xs">
              {mysqlConnection?.connected && mysqlConnection.dbType === 'mysql' ? 'MySQL Tables' : 'SQLite Tables'}
            </div>
            <div className="stat-value text-2xl text-primary">
              {mysqlConnection?.connected && mysqlConnection.dbType === 'mysql' ? mysqlTables.length : tables.length}
            </div>
          </div>
        </div>
      </div>

      {/* Tables List */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* Show MySQL tables if connected, otherwise SQLite tables */}
        {(() => {
          const currentTables = mysqlConnection?.connected && mysqlConnection.dbType === 'mysql' ? mysqlTables : tables
          const isMySQL = mysqlConnection?.connected && mysqlConnection.dbType === 'mysql'
          
          if (currentTables.length === 0) {
            return (
              <div className="text-center py-8 text-neutral-medium-gray">
                <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tables yet</p>
                <p className="text-xs mt-1">
                  {isMySQL ? 'Connect to MySQL and create tables' : 'Create tables using SQL'}
                </p>
              </div>
            )
          }
          
          return (
            <div className="space-y-1">
              {currentTables.map((table) => (
              <div key={table.name} className="space-y-1">
                {/* Table Row */}
                <div
                  className={`group flex items-center justify-between p-2 rounded cursor-pointer hover:bg-base-300 ${
                    selectedTable === table.name ? 'bg-primary/10' : ''
                  }`}
                  onClick={() => handleTableClick(table)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleTable(table.name)
                      }}
                      className="btn btn-ghost btn-xs btn-circle"
                    >
                      {expandedTables.has(table.name) ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </button>
                    <Table className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm font-mono truncate">{table.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => handleViewTableData(table.name, e)}
                      className="btn btn-ghost btn-xs btn-circle opacity-0 group-hover:opacity-100"
                      title="View table data"
                    >
                      <Eye className="w-3 h-3 text-info" />
                    </button>
                    <button
                      onClick={(e) => handleDropTable(table.name, e)}
                      className="btn btn-ghost btn-xs btn-circle opacity-0 group-hover:opacity-100"
                      title="Drop table"
                    >
                      <Trash2 className="w-3 h-3 text-error" />
                    </button>
                  </div>
                </div>

                {/* Table Columns (when expanded) */}
                <AnimatePresence>
                  {expandedTables.has(table.name) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="ml-8 space-y-1 overflow-hidden"
                    >
                      {(() => {
                        // Handle both MySQL and SQLite table structures
                        const columns = isMySQL ? table.structure : (tableStructures[table.name] || [])
                        return columns.map((column) => (
                          <div
                            key={column.name}
                            className="flex items-center gap-2 p-1 text-xs font-mono"
                          >
                            <div className={`w-1 h-1 rounded-full ${
                              (column.pk || column.key === 'PRI') ? 'bg-warning' : 'bg-base-content/30'
                            }`} />
                            <span className="text-neutral-medium-gray">{column.name}</span>
                            <span className="text-primary text-[10px]">{column.type}</span>
                            {(column.pk || column.key === 'PRI') && (
                              <span className="badge badge-warning badge-xs">PK</span>
                            )}
                            {((column.notnull && !column.pk) || (!column.nullable && column.key !== 'PRI')) && (
                              <span className="badge badge-ghost badge-xs">NOT NULL</span>
                            )}
                            {table.foreignKeys?.some(fk => fk.column === column.name) && (
                              <span className="badge badge-info badge-xs">FK</span>
                            )}
                          </div>
                        ))
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
          )
        })()}
      </div>
    </div>
  )
}
