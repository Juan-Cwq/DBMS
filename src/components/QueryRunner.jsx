import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Save, History, Trash2, Download, Copy, Check } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

export default function QueryRunner({ initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery)
  const [result, setResult] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
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

  const simulateQueryExecution = (sql) => {
    // Simulate different query types
    const upperSQL = sql.trim().toUpperCase()
    
    if (upperSQL.startsWith('SELECT')) {
      // Simulate SELECT results
      return {
        type: 'select',
        columns: ['id', 'name', 'email', 'created_at'],
        rows: [
          { id: 1, name: 'John Doe', email: 'john@example.com', created_at: '2024-01-15 10:30:00' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', created_at: '2024-01-16 14:20:00' },
          { id: 3, name: 'Bob Johnson', email: 'bob@example.com', created_at: '2024-01-17 09:15:00' },
        ],
        rowCount: 3,
        executionTime: Math.random() * 100 + 10
      }
    } else if (upperSQL.startsWith('CREATE')) {
      return {
        type: 'create',
        message: 'Table created successfully',
        executionTime: Math.random() * 50 + 5
      }
    } else if (upperSQL.startsWith('INSERT')) {
      return {
        type: 'insert',
        message: 'Row(s) inserted successfully',
        affectedRows: Math.floor(Math.random() * 5) + 1,
        executionTime: Math.random() * 30 + 5
      }
    } else if (upperSQL.startsWith('UPDATE')) {
      return {
        type: 'update',
        message: 'Row(s) updated successfully',
        affectedRows: Math.floor(Math.random() * 10) + 1,
        executionTime: Math.random() * 40 + 5
      }
    } else if (upperSQL.startsWith('DELETE')) {
      return {
        type: 'delete',
        message: 'Row(s) deleted successfully',
        affectedRows: Math.floor(Math.random() * 5) + 1,
        executionTime: Math.random() * 35 + 5
      }
    } else {
      return {
        type: 'other',
        message: 'Query executed successfully',
        executionTime: Math.random() * 20 + 5
      }
    }
  }

  const handleRunQuery = () => {
    if (!query.trim()) return

    setIsRunning(true)
    
    // Simulate execution delay
    setTimeout(() => {
      const result = simulateQueryExecution(query)
      setResult(result)
      setIsRunning(false)

      // Add to history
      const historyEntry = {
        id: Date.now(),
        query: query,
        timestamp: new Date().toISOString(),
        result: result
      }
      const newHistory = [historyEntry, ...queryHistory].slice(0, 50) // Keep last 50
      setQueryHistory(newHistory)
      localStorage.setItem('schemacraft_query_history', JSON.stringify(newHistory))
    }, 500)
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

  return (
    <div className="space-y-4">
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
                onClick={() => setShowHistory(!showHistory)}
                className="btn btn-ghost btn-sm gap-2"
              >
                <History className="w-4 h-4" />
                History
              </button>
            </div>
          </div>

          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your SQL query here..."
            className="textarea textarea-bordered h-48 font-mono text-sm resize-none"
            spellCheck={false}
          />

          <div className="flex gap-2 mt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRunQuery}
              disabled={!query.trim() || isRunning}
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

      {/* Query Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card bg-base-200 shadow-xl"
          >
            <div className="card-body">
              <h3 className="card-title text-lg">Query Result</h3>

              {result.type === 'select' && (
                <div className="overflow-x-auto">
                  <table className="table table-zebra table-sm">
                    <thead>
                      <tr>
                        {result.columns.map((col) => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row, idx) => (
                        <tr key={idx}>
                          {result.columns.map((col) => (
                            <td key={col}>{row[col]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="text-sm text-neutral-medium-gray mt-2">
                    {result.rowCount} row(s) returned in {result.executionTime.toFixed(2)}ms
                  </div>
                </div>
              )}

              {result.type !== 'select' && (
                <div className="alert alert-success">
                  <div>
                    <div className="font-semibold">{result.message}</div>
                    {result.affectedRows && (
                      <div className="text-sm">Affected rows: {result.affectedRows}</div>
                    )}
                    <div className="text-sm">Execution time: {result.executionTime.toFixed(2)}ms</div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History/Saved Queries Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="card bg-base-200 shadow-xl"
          >
            <div className="card-body">
              <div className="tabs tabs-boxed mb-4">
                <a className="tab tab-active">Saved Queries</a>
                <a className="tab">History</a>
              </div>

              {/* Saved Queries */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {savedQueries.length === 0 ? (
                  <p className="text-neutral-medium-gray text-center py-4">
                    No saved queries yet
                  </p>
                ) : (
                  savedQueries.map((saved) => (
                    <div
                      key={saved.id}
                      className="card bg-base-100 hover:bg-base-300 cursor-pointer"
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
                            className="btn btn-ghost btn-xs btn-circle"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {queryHistory.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="btn btn-ghost btn-sm mt-4"
                >
                  Clear History
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
