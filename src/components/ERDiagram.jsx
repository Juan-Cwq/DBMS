import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Database, Table, Key, Link } from 'lucide-react'
import { getTables, getTableStructure } from '../utils/database'

export default function ERDiagram() {
  const [tables, setTables] = useState([])
  const [relationships, setRelationships] = useState([])

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

    // Extract relationships from foreign keys
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

  if (tables.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-medium-gray">
        <div className="text-center">
          <Database className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No tables to visualize</p>
          <p className="text-sm mt-2">Create tables to see the ER diagram</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-base-100 rounded-lg overflow-auto">
      <div className="flex flex-wrap gap-6 min-w-max">
        {tables.map((table, idx) => (
          <motion.div
            key={table.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="card bg-base-200 shadow-xl border-2 border-primary/20 hover:border-primary/50 transition-colors"
            style={{ minWidth: '280px' }}
          >
            <div className="card-body p-4">
              {/* Table Header */}
              <div className="flex items-center gap-2 pb-3 border-b border-base-300">
                <Table className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg">{table.name}</h3>
              </div>

              {/* Columns */}
              <div className="space-y-2 mt-3">
                {table.structure && table.structure.map((column) => (
                  <div
                    key={column.name}
                    className={`flex items-center gap-2 p-2 rounded ${
                      column.pk ? 'bg-warning/10 border border-warning/30' : 'bg-base-300/50'
                    }`}
                  >
                    {column.pk && <Key className="w-3 h-3 text-warning" />}
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm font-semibold truncate">
                        {column.name}
                      </div>
                      <div className="text-xs text-neutral-medium-gray">
                        {column.type}
                        {column.notnull && !column.pk && ' • NOT NULL'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Foreign Keys */}
              {relationships.filter(r => r.from === table.name).length > 0 && (
                <div className="mt-3 pt-3 border-t border-base-300">
                  <div className="flex items-center gap-1 text-xs text-neutral-medium-gray mb-2">
                    <Link className="w-3 h-3" />
                    <span>Foreign Keys</span>
                  </div>
                  {relationships
                    .filter(r => r.from === table.name)
                    .map((rel, idx) => (
                      <div key={idx} className="text-xs font-mono bg-base-300/50 p-2 rounded mb-1">
                        {rel.fromColumn} → {rel.to}.{rel.toColumn}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Relationships Summary */}
      {relationships.length > 0 && (
        <div className="mt-6 p-4 bg-base-200 rounded-lg">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Link className="w-4 h-4" />
            Relationships ({relationships.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {relationships.map((rel, idx) => (
              <div key={idx} className="badge badge-outline gap-2 p-3">
                <span className="font-mono text-xs">
                  {rel.from} → {rel.to}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
