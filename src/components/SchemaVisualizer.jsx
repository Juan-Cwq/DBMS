import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Database, Table, Key, Link as LinkIcon } from 'lucide-react'

export default function SchemaVisualizer({ schema }) {
  const [selectedTable, setSelectedTable] = useState(null)

  if (!schema || !schema.tables) {
    return (
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-primary" />
            <h3 className="card-title text-lg">Schema Visualization</h3>
          </div>
          <p className="text-neutral-medium-gray text-center py-8">
            Generate a schema to see the visualization
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-primary" />
          <h3 className="card-title text-lg">Schema Visualization</h3>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {schema.tables.map((table, index) => (
            <motion.div
              key={table.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="collapse collapse-arrow bg-base-100"
            >
              <input
                type="radio"
                name="schema-accordion"
                checked={selectedTable === table.id}
                onChange={() => setSelectedTable(table.id)}
              />
              <div className="collapse-title font-medium flex items-center gap-2">
                <Table className="w-4 h-4 text-primary" />
                {table.name}
                <span className="badge badge-sm badge-ghost">
                  {table.columns?.length || 0} columns
                </span>
              </div>
              <div className="collapse-content">
                <div className="space-y-2 pt-2">
                  {table.columns?.map((column) => (
                    <div
                      key={column.name}
                      className="flex items-center justify-between p-2 bg-base-200 rounded"
                    >
                      <div className="flex items-center gap-2">
                        {column.primaryKey && (
                          <Key className="w-3 h-3 text-warning" title="Primary Key" />
                        )}
                        {column.foreignKey && (
                          <LinkIcon className="w-3 h-3 text-info" title="Foreign Key" />
                        )}
                        <span className="font-mono text-sm">{column.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-medium-gray">
                          {column.type}
                        </span>
                        {!column.nullable && (
                          <span className="badge badge-xs badge-error">NOT NULL</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Relationships */}
        {schema.relationships && schema.relationships.length > 0 && (
          <div className="mt-4 pt-4 border-t border-base-300">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Relationships
            </h4>
            <div className="space-y-2">
              {schema.relationships.map((rel, index) => (
                <div
                  key={index}
                  className="text-sm p-2 bg-base-100 rounded flex items-center gap-2"
                >
                  <span className="font-mono">{rel.from}</span>
                  <span className="text-neutral-medium-gray">→</span>
                  <span className="font-mono">{rel.to}</span>
                  <span className="badge badge-xs badge-outline">{rel.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
