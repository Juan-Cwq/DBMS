import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Save, History, Trash2, Download, Copy, Check, AlertCircle, CheckCircle, Network } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { initDatabase, executeQuery, getTableData } from '../utils/database'
import DatabaseSidebar from './DatabaseSidebar'
import ERDiagram from './ERDiagram'

export default function QueryRunner({ initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState(null)
  const [dbInitialized, setDbInitialized] = useState(false)
  const [executionTime, setExecutionTime] = useState(0)
  const [selectedTable, setSelectedTable] = useState(null)
  const [tableData, setTableData] = useState(null)
  
  const [savedQueries, setSavedQueries] = useState(() => {
    const saved = localStorage.getItem('schemacraft_saved_queries')
    return saved ? JSON.parse(saved) : []
  })
  const [queryHistory, setQueryHistory] = useState(() => {
    const history = localStorage.getItem('schemacraft_query_history')
    return history ? JSON.parse(history) : []
  })
  const [showHistory, setShowHistory] = useState(false)
  const [copied, setCopied] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showDiagram, setShowDiagram] = useState(false)

  useEffect(() => {
    initDatabase().then(() => {
      setDbInitialized(true)
    }).catch(err => {
      console.error('Failed to initialize database:', err)
      setError('Failed to initialize database')
    })
  }, [])

  useEffect(() => {
    if (initialQuery && initialQuery !== query) {
      setQuery(initialQuery)
    }
  }, [initialQuery])

  const handleRunQuery = async () => {
    if (!query.trim() || !dbInitialized) return

    setIsRunning(true)
    setError(null)
    setResults([])
    
    const startTime = performance.now()
    
    try {
      const queryResults = executeQuery(query)
      const endTime = performance.now()
      setExecutionTime(endTime - startTime)
      
      // Format results
      const formattedResults = queryResults.map(r => {
        if (r.result.length > 0) {
          return {
            type: 'select',
            columns: r.result[0].columns,
            rows: r.result[0].values,
            rowCount: r.result[0].values.length
          }
        } else {
          // DDL or DML statement
          const upperSQL = r.statement.toUpperCase()
          if (upperSQL.startsWith('CREATE')) {
            return { type: 'create', message: 'Table created successfully' }
          } else if (upperSQL.startsWith('INSERT')) {
            return { type: 'insert', message: 'Row(s) inserted successfully' }
          } else if (upperSQL.startsWith('UPDATE')) {
            return { type: 'update', message: 'Row(s) updated successfully' }
          } else if (upperSQL.startsWith('DELETE')) {
            return { type: 'delete', message: 'Row(s) deleted successfully' }
          } else if (upperSQL.startsWith('DROP')) {
            return { type: 'drop', message: 'Table dropped successfully' }
          } else {
            return { type: 'other', message: 'Query executed successfully' }
          }
        }
      })
      
      setResults(formattedResults)

      // Add to history
      const historyEntry = {
        id: Date.now(),
        query: query,
        timestamp: new Date().toISOString(),
        success: true
      }
      const newHistory = [historyEntry, ...queryHistory].slice(0, 50)
      setQueryHistory(newHistory)
      localStorage.setItem('schemacraft_query_history', JSON.stringify(newHistory))
      
      // Trigger sidebar refresh
      setRefreshTrigger(prev => prev + 1)
      
    } catch (err) {
      setError(err.message)
      const historyEntry = {
        id: Date.now(),
        query: query,
        timestamp: new Date().toISOString(),
        success: false,
        error: err.message
      }
      const newHistory = [historyEntry, ...queryHistory].slice(0, 50)
      setQueryHistory(newHistory)
      localStorage.setItem('schemacraft_query_history', JSON.stringify(newHistory))
    } finally {
      setIsRunning(false)
    }
  }

  const handleSaveQuery = () => {
    if (!query.trim()) return

    const name = prompt('Enter a name for this query:')
    if (!name) return

    const savedQuery = {
      id: Date.now(),
      name,
      query,
      timestamp: new Date().toISOString()
    }

    const newSaved = [savedQuery, ...savedQueries]
    setSavedQueries(newSaved)
    localStorage.setItem('schemacraft_saved_queries', JSON.stringify(newSaved))
  }

  const handleLoadQuery = (savedQuery) => {
    setQuery(savedQuery.query)
    setShowHistory(false)
  }

  const handleDeleteSaved = (id) => {
    const newSaved = savedQueries.filter(q => q.id !== id)
    setSavedQueries(newSaved)
    localStorage.setItem('schemacraft_saved_queries', JSON.stringify(newSaved))
  }

  const handleClearHistory = () => {
    if (confirm('Clear all query history?')) {
      setQueryHistory([])
      localStorage.removeItem('schemacraft_query_history')
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(query)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([query], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `query-${Date.now()}.sql`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleTableSelect = (table) => {
    setSelectedTable(table.name)
    const data = getTableData(table.name)
    setTableData(data)
    setQuery(`SELECT * FROM ${table.name} LIMIT 100;`)
  }

  const handleRefresh = () => {
    // Trigger re-render of sidebar
    setSelectedTable(null)
    setTableData(null)
  }

  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-250px)]">
      {/* Database Sidebar */}
      <div className="col-span-3 card bg-base-200 shadow-xl overflow-hidden">
        <DatabaseSidebar 
          key={refreshTrigger}
          onTableSelect={handleTableSelect}
          onRefresh={handleRefresh}
        />
      </div>

      {/* Main Content */}
      <div className="col-span-9 space-y-4">
        {/* Query Editor */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="card-title text-lg">Query Editor</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="btn btn-ghost btn-sm btn-circle"
                  title="Copy query"
                >
                  {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleDownload}
                  className="btn btn-ghost btn-sm btn-circle"
                  title="Download query"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowDiagram(!showDiagram)}
                  className="btn btn-ghost btn-sm gap-2"
                >
                  <Network className="w-4 h-4" />
                  {showDiagram ? 'Hide' : 'Show'} Diagram
                </button>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="btn btn-ghost btn-sm gap-2"
                >
                  <History className="w-4 h-4" />
                  {showHistory ? 'Hide' : 'Show'} History
                </button>
              </div>
            </div>

            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your SQL query here... (e.g., CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);)"
              className="textarea textarea-bordered h-32 font-mono text-sm resize-none"
              spellCheck={false}
            />

            <div className="flex gap-2 mt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRunQuery}
                disabled={!query.trim() || isRunning || !dbInitialized}
                className="btn btn-primary gap-2"
              >
                <Play className="w-4 h-4" />
                {isRunning ? 'Running...' : 'Run Query'}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveQuery}
                disabled={!query.trim()}
                className="btn btn-secondary gap-2"
              >
                <Save className="w-4 h-4" />
                Save Query
              </motion.button>
            </div>
          </div>
        </div>

        {/* ER Diagram */}
        <AnimatePresence>
          {showDiagram && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="card bg-base-200 shadow-xl"
            >
              <div className="card-body">
                <h3 className="card-title text-lg mb-4">Database Schema Diagram</h3>
                <ERDiagram key={refreshTrigger} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="alert alert-error"
            >
              <AlertCircle className="w-5 h-5" />
              <div>
                <div className="font-semibold">Error executing query</div>
                <div className="text-sm">{error}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Query Results */}
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="card bg-base-200 shadow-xl"
            >
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="card-title text-lg">Query Result</h3>
                  <div className="text-sm text-neutral-medium-gray">
                    Execution time: {executionTime.toFixed(2)}ms
                  </div>
                </div>

                {results.map((result, idx) => (
                  <div key={idx} className="mb-4 last:mb-0">
                    {result.type === 'select' && (
                      <div className="overflow-x-auto">
                        <table className="table table-zebra table-sm">
                          <thead>
                            <tr>
                              {result.columns.map((col) => (
                                <th key={col} className="font-mono">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {result.rows.map((row, rowIdx) => (
                              <tr key={rowIdx}>
                                {row.map((cell, cellIdx) => (
                                  <td key={cellIdx} className="font-mono text-xs">
                                    {cell === null ? <span className="text-neutral-medium-gray italic">NULL</span> : String(cell)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="text-sm text-neutral-medium-gray mt-2">
                          {result.rowCount} row(s) returned
                        </div>
                      </div>
                    )}

                    {result.type !== 'select' && (
                      <div className="alert alert-success">
                        <CheckCircle className="w-5 h-5" />
                        <div className="font-semibold">{result.message}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History Sidebar */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="card bg-base-200 shadow-xl"
            >
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Saved Queries</h3>
                  {queryHistory.length > 0 && (
                    <button
                      onClick={handleClearHistory}
                      className="btn btn-ghost btn-sm"
                    >
                      Clear History
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {savedQueries.length === 0 && queryHistory.length === 0 ? (
                    <p className="text-neutral-medium-gray text-center py-4">
                      No saved queries yet
                    </p>
                  ) : (
                    <>
                      {savedQueries.map((saved) => (
                        <div
                          key={saved.id}
                          className="card bg-base-100 hover:bg-base-300 cursor-pointer group"
                        >
                          <div className="card-body p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1" onClick={() => handleLoadQuery(saved)}>
                                <div className="font-semibold">{saved.name}</div>
                                <div className="text-xs text-neutral-medium-gray">
                                  {new Date(saved.timestamp).toLocaleString()}
                                </div>
                                <div className="text-sm font-mono mt-1 truncate">
                                  {saved.query}
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteSaved(saved.id)
                                }}
                                className="btn btn-ghost btn-xs btn-circle opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
