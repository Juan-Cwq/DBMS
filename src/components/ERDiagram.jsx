import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Database, Key, Maximize2, Download, X } from 'lucide-react'
import { getTables, getTableStructure } from '../utils/database'

export default function ERDiagram() {
  const [tables, setTables] = useState([])
  const [relationships, setRelationships] = useState([])
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    loadSchema()
  }, [])

  const loadSchema = () => {
    const allTables = getTables()
    const tablesWithStructure = allTables.map(table => ({
      ...table,
      structure: getTableStructure(table.name)
    }))
    setTables(tablesWithStructure)

    const rels = []
    tablesWithStructure.forEach(table => {
      const fkMatches = table.sql.matchAll(/FOREIGN KEY \((\w+)\) REFERENCES (\w+)\((\w+)\)/gi)
      for (const match of fkMatches) {
        rels.push({
          from: table.name,
          to: match[2],
          fromColumn: match[1],
          toColumn: match[3]
        })
      }
    })
    setRelationships(rels)
  }

  const handleDownload = () => {
    // Simple text export for now
    let content = '# Database Schema\n\n'
    tables.forEach(table => {
      content += `## ${table.name}\n`
      table.structure.forEach(col => {
        content += `- ${col.name}: ${col.type}${col.pk ? ' (PK)' : ''}${col.notnull ? ' NOT NULL' : ''}\n`
      })
      content += '\n'
    })
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `database-schema-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (tables.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-medium-gray">
        <div className="text-center">
          <Database className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No tables to visualize</p>
          <p className="text-sm mt-2">Create tables to see the schema</p>
        </div>
      </div>
    )
  }

  const DiagramContent = () => (
    <div className={`${isFullscreen ? 'w-full h-full' : 'w-full'} overflow-auto bg-white rounded-lg border border-base-300 p-8`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables.map((table, idx) => (
          <motion.div
            key={table.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="card bg-white shadow-xl border-2 border-gray-300 hover:shadow-2xl transition-shadow"
          >
            <div className="bg-blue-500 text-white px-4 py-3 rounded-t-lg">
              <h3 className="font-bold text-center">{table.name}</h3>
            </div>

            <div className="card-body p-0">
              <table className="table table-sm w-full">
                <tbody>
                  {table.structure && table.structure.map((column) => {
                    const isFk = relationships.some(r => r.from === table.name && r.fromColumn === column.name)
                    
                    return (
                      <tr
                        key={column.name}
                        className={`${column.pk ? 'bg-yellow-50' : ''} hover:bg-gray-50 border-b border-gray-200`}
                      >
                        <td className="font-mono text-sm font-semibold py-2 px-3">
                          <div className="flex items-center gap-2">
                            {column.pk && <Key className="w-3 h-3 text-yellow-600" />}
                            {column.name}
                          </div>
                        </td>
                        <td className="text-sm text-gray-600 font-mono py-2">
                          {column.type}
                        </td>
                        <td className="py-2 px-3 text-xs text-gray-500">
                          {column.pk && 'PK'}
                          {isFk && ' FK'}
                          {!column.pk && column.notnull && ' N'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Show relationships for this table */}
            {relationships.filter(r => r.from === table.name).length > 0 && (
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                <div className="text-xs font-semibold text-gray-600 mb-1">Foreign Keys:</div>
                {relationships.filter(r => r.from === table.name).map((rel, idx) => (
                  <div key={idx} className="text-xs text-gray-500 font-mono">
                    {rel.fromColumn} → {rel.to}.{rel.toColumn}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Relationships Summary */}
      {relationships.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-300">
          <h4 className="font-semibold mb-3 text-gray-800">Relationships ({relationships.length})</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {relationships.map((rel, idx) => (
              <div key={idx} className="text-sm font-mono bg-white p-2 rounded border border-gray-200">
                <span className="text-blue-600">{rel.from}</span>
                <span className="text-gray-400"> → </span>
                <span className="text-green-600">{rel.to}</span>
                <div className="text-xs text-gray-500 mt-1">
                  {rel.fromColumn} → {rel.toColumn}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setIsFullscreen(true)}
          className="btn btn-primary btn-sm gap-2"
        >
          <Maximize2 className="w-4 h-4" />
          Fullscreen
        </button>
        <button
          onClick={handleDownload}
          className="btn btn-secondary btn-sm gap-2"
        >
          <Download className="w-4 h-4" />
          Download Schema
        </button>
      </div>

      {!isFullscreen && <DiagramContent />}

      {isFullscreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 z-50 flex flex-col"
        >
          <div className="flex justify-between items-center p-4 bg-base-200">
            <h2 className="text-xl font-bold">Database Schema</h2>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="btn btn-secondary btn-sm gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={() => setIsFullscreen(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <DiagramContent />
          </div>
        </motion.div>
      )}
    </>
  )
}
