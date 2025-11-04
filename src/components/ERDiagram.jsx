import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Database, Key } from 'lucide-react'
import { getTables, getTableStructure } from '../utils/database'

export default function ERDiagram() {
  const [tables, setTables] = useState([])
  const [relationships, setRelationships] = useState([])
  const [tablePositions, setTablePositions] = useState({})
  const containerRef = useRef(null)

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

    // Auto-layout tables in a grid
    const positions = {}
    const cols = Math.ceil(Math.sqrt(tablesWithStructure.length))
    tablesWithStructure.forEach((table, idx) => {
      const row = Math.floor(idx / cols)
      const col = idx % cols
      positions[table.name] = {
        x: col * 350 + 50,
        y: row * 300 + 50
      }
    })
    setTablePositions(positions)
  }

  const getConnectionPoints = (fromTable, toTable) => {
    const from = tablePositions[fromTable]
    const to = tablePositions[toTable]
    
    if (!from || !to) return null

    // Calculate center points
    const fromX = from.x + 140 // Half of card width (280px)
    const fromY = from.y + 100
    const toX = to.x + 140
    const toY = to.y + 100

    return { fromX, fromY, toX, toY }
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
    <div className="relative w-full h-[600px] overflow-auto bg-base-100 rounded-lg border border-base-300" ref={containerRef}>
      <div className="relative" style={{ width: '100%', minWidth: '1200px', height: '100%', minHeight: '800px' }}>
        {/* SVG for relationship lines */}
        <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#00A99D" />
            </marker>
          </defs>
          {relationships.map((rel, idx) => {
            const points = getConnectionPoints(rel.from, rel.to)
            if (!points) return null

            const { fromX, fromY, toX, toY } = points
            
            // Create curved path
            const midX = (fromX + toX) / 2
            const midY = (fromY + toY) / 2
            const dx = toX - fromX
            const dy = toY - fromY
            const offset = 50
            
            // Control point for curve
            const controlX = midX - dy * 0.2
            const controlY = midY + dx * 0.2

            return (
              <g key={idx}>
                <path
                  d={`M ${fromX} ${fromY} Q ${controlX} ${controlY} ${toX} ${toY}`}
                  stroke="#00A99D"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                  opacity="0.6"
                />
                {/* Relationship label */}
                <text
                  x={controlX}
                  y={controlY - 10}
                  fill="#00A99D"
                  fontSize="11"
                  fontFamily="monospace"
                  textAnchor="middle"
                  className="pointer-events-none"
                >
                  {rel.fromColumn}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Table cards */}
        {tables.map((table, idx) => {
          const pos = tablePositions[table.name]
          if (!pos) return null

          return (
            <motion.div
              key={table.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="absolute"
              style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                width: '280px'
              }}
            >
              <div className="card bg-gradient-to-br from-primary/5 to-primary/10 shadow-xl border-2 border-primary/30 hover:border-primary/60 transition-all hover:shadow-2xl">
                <div className="card-body p-0">
                  {/* Table Header */}
                  <div className="bg-primary text-primary-content px-4 py-3 rounded-t-lg">
                    <h3 className="font-bold text-lg text-center">{table.name}</h3>
                  </div>

                  {/* Columns */}
                  <div className="p-3">
                    <table className="table table-xs w-full">
                      <tbody>
                        {table.structure && table.structure.map((column) => (
                          <tr
                            key={column.name}
                            className={`${
                              column.pk ? 'bg-warning/20' : ''
                            } hover:bg-base-200`}
                          >
                            <td className="font-mono text-xs font-semibold flex items-center gap-1">
                              {column.pk && <Key className="w-3 h-3 text-warning" />}
                              {column.name}
                            </td>
                            <td className="text-xs text-neutral-medium-gray font-mono">
                              {column.type}
                            </td>
                            <td className="text-xs">
                              {column.pk && <span className="badge badge-warning badge-xs">PK</span>}
                              {!column.pk && column.notnull && <span className="badge badge-ghost badge-xs">N</span>}
                              {relationships.some(r => r.from === table.name && r.fromColumn === column.name) && (
                                <span className="badge badge-primary badge-xs ml-1">FK</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-base-200 p-3 rounded-lg shadow-lg border border-base-300">
        <div className="text-xs font-semibold mb-2">Legend</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <Key className="w-3 h-3 text-warning" />
            <span>Primary Key</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-primary"></div>
            <span>Foreign Key</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-ghost badge-xs">N</span>
            <span>NOT NULL</span>
          </div>
        </div>
      </div>
    </div>
  )
}
