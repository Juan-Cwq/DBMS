import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, FolderOpen, Trash2, Download, Upload, Database, Calendar, Edit2, Check, X } from 'lucide-react'
import { getSavedDatabases, saveDatabase, deleteDatabase, exportDatabase, importDatabase } from '../utils/databaseStorage'
import { getTables, executeQuery } from '../utils/database'

export default function DatabaseManager({ onLoadDatabase, currentDatabaseId, setCurrentDatabaseId }) {
  const [savedDatabases, setSavedDatabases] = useState([])
  const [showManager, setShowManager] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [newDatabaseName, setNewDatabaseName] = useState('')
  const [newDatabaseDescription, setNewDatabaseDescription] = useState('')

  useEffect(() => {
    loadSavedDatabases()
  }, [])

  const loadSavedDatabases = () => {
    setSavedDatabases(getSavedDatabases())
  }

  const handleSaveCurrentDatabase = async () => {
    const tables = getTables()
    
    if (tables.length === 0) {
      alert('No tables to save. Create some tables first.')
      return
    }

    // Get all table SQL
    const schema = tables.map(table => table.sql).join(';\n\n') + ';'

    const database = {
      id: currentDatabaseId || `db_${Date.now()}`,
      name: newDatabaseName || `Database ${Date.now()}`,
      description: newDatabaseDescription || '',
      schema: schema,
      tables: tables.map(table => ({
        name: table.name,
        sql: table.sql
      })),
      tableCount: tables.length
    }

    const success = saveDatabase(database)
    
    if (success) {
      setCurrentDatabaseId(database.id)
      loadSavedDatabases()
      setSaveDialogOpen(false)
      setNewDatabaseName('')
      setNewDatabaseDescription('')
      alert('Database saved successfully!')
    } else {
      alert('Failed to save database')
    }
  }

  const handleLoadDatabase = async (database) => {
    if (confirm(`Load "${database.name}"? This will replace your current database.`)) {
      try {
        // Clear current database
        const tables = getTables()
        for (const table of tables) {
          await executeQuery(`DROP TABLE IF EXISTS ${table.name}`)
        }

        // Execute the saved schema
        await executeQuery(database.schema)
        
        setCurrentDatabaseId(database.id)
        setShowManager(false)
        
        if (onLoadDatabase) {
          onLoadDatabase(database)
        }
        
        alert('Database loaded successfully!')
      } catch (error) {
        console.error('Error loading database:', error)
        alert('Failed to load database: ' + error.message)
      }
    }
  }

  const handleDeleteDatabase = (id) => {
    const db = savedDatabases.find(d => d.id === id)
    if (confirm(`Delete "${db.name}"? This cannot be undone.`)) {
      deleteDatabase(id)
      if (currentDatabaseId === id) {
        setCurrentDatabaseId(null)
      }
      loadSavedDatabases()
    }
  }

  const handleExportDatabase = (database) => {
    exportDatabase(database)
  }

  const handleImportDatabase = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      const database = await importDatabase(file)
      database.id = `db_${Date.now()}` // Generate new ID
      saveDatabase(database)
      loadSavedDatabases()
      alert('Database imported successfully!')
    } catch (error) {
      alert('Failed to import database: ' + error.message)
    }
    
    event.target.value = '' // Reset file input
  }

  const startEditing = (db) => {
    setEditingId(db.id)
    setEditingName(db.name)
  }

  const saveEdit = (id) => {
    const db = savedDatabases.find(d => d.id === id)
    if (db) {
      saveDatabase({ ...db, name: editingName })
      loadSavedDatabases()
    }
    setEditingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      {/* Toolbar Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setSaveDialogOpen(true)}
          className="btn btn-primary btn-sm gap-2"
          title="Save Current Database"
        >
          <Save className="w-4 h-4" />
          Save Database
        </button>
        <button
          onClick={() => setShowManager(true)}
          className="btn btn-secondary btn-sm gap-2"
          title="Manage Saved Databases"
        >
          <FolderOpen className="w-4 h-4" />
          Load Database
        </button>
      </div>

      {/* Save Dialog */}
      <AnimatePresence>
        {saveDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSaveDialogOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-base-100 rounded-lg shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">Save Database</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="label">
                    <span className="label-text">Database Name *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="My E-Commerce Database"
                    className="input input-bordered w-full"
                    value={newDatabaseName}
                    onChange={(e) => setNewDatabaseName(e.target.value)}
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="label">
                    <span className="label-text">Description (optional)</span>
                  </label>
                  <textarea
                    placeholder="A brief description of this database..."
                    className="textarea textarea-bordered w-full"
                    rows="3"
                    value={newDatabaseDescription}
                    onChange={(e) => setNewDatabaseDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleSaveCurrentDatabase}
                  className="btn btn-primary flex-1"
                  disabled={!newDatabaseName.trim()}
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={() => setSaveDialogOpen(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Database Manager Modal */}
      <AnimatePresence>
        {showManager && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowManager(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-base-100 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-base-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold">Saved Databases</h3>
                  <div className="flex gap-2">
                    <label className="btn btn-sm btn-secondary gap-2 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      Import
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportDatabase}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={() => setShowManager(false)}
                      className="btn btn-sm btn-circle btn-ghost"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {savedDatabases.length === 0 ? (
                  <div className="text-center py-12 text-neutral-medium-gray">
                    <Database className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No saved databases</p>
                    <p className="text-sm mt-2">Save your current database to get started</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {savedDatabases.map((db) => (
                      <motion.div
                        key={db.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`card bg-base-200 shadow-lg hover:shadow-xl transition-shadow ${
                          currentDatabaseId === db.id ? 'ring-2 ring-primary' : ''
                        }`}
                      >
                        <div className="card-body">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              {editingId === db.id ? (
                                <div className="flex gap-2 items-center">
                                  <input
                                    type="text"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    className="input input-sm input-bordered flex-1"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => saveEdit(db.id)}
                                    className="btn btn-sm btn-circle btn-success"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="btn btn-sm btn-circle btn-ghost"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <h4 className="card-title text-lg">{db.name}</h4>
                                  <button
                                    onClick={() => startEditing(db)}
                                    className="btn btn-xs btn-ghost btn-circle"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  {currentDatabaseId === db.id && (
                                    <span className="badge badge-primary badge-sm">Current</span>
                                  )}
                                </div>
                              )}
                              
                              {db.description && (
                                <p className="text-sm text-neutral-medium-gray mt-1">
                                  {db.description}
                                </p>
                              )}
                              
                              <div className="flex gap-4 mt-2 text-xs text-neutral-medium-gray">
                                <span className="flex items-center gap-1">
                                  <Database className="w-3 h-3" />
                                  {db.tableCount} {db.tableCount === 1 ? 'table' : 'tables'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(db.updatedAt || db.createdAt)}
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleLoadDatabase(db)}
                                className="btn btn-sm btn-primary gap-2"
                              >
                                <FolderOpen className="w-4 h-4" />
                                Load
                              </button>
                              <button
                                onClick={() => handleExportDatabase(db)}
                                className="btn btn-sm btn-secondary gap-2"
                                title="Export as JSON"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteDatabase(db.id)}
                                className="btn btn-sm btn-error gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
