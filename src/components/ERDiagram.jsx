import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Database, Key } from 'lucide-react'
import { getTables, getTableStructure } from '../utils/database'

export default function ERDiagram() {
  const [tables, setTables] = useState([])
  const [relationships, setRelationships] = useState([])
  const [tableRefs, setTableRefs] = useState({})
  const containerRef = useRef(null)

  useEffect(() => {
    loadSchema()
  }, [])

  useEffect(() => {
    // Force re-render after refs are set
    if (Object.keys(tableRefs).length > 0) {
      setRelationships([...relationships])
    }
  }, [tableRefs])

  const loadSchema = () => {
    const allTables = getTables()
    const tablesWithStructure = allTables.map(table => ({
      ...table,
      structure: getTableStructure(table.name)
    }))
    setTables(tablesWithStructure)

    // Extract relationships
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

  const setTableRef = (tableName, element) => {
    if (element) {
      setTableRefs(prev => ({ ...prev, [tableName]: element }))
    }
  }

  const getColumnPosition = (tableName, columnName) => {
    const tableEl = tableRefs[tableName]
    if (!tableEl || !containerRef.current) return null

    const containerRect = containerRef.current.getBoundingClientRect()
    const tableRect = tableEl.getBoundingClientRect()
    
    // Find the column row
    const rows = tableEl.querySelectorAll('tbody tr')
    let columnY = tableRect.top - containerRect.top + 60 // Start after header
    
    for (const row of rows) {
      const colName = row.querySelector('td')?.textContent?.trim()
      if (colName === columnName || colName === `🔑${columnName}`) {
        const rowRect = row.getBoundingClientRect()
        columnY = rowRect.top - containerRect.top + rowRect.height / 2
        break
      }
      columnY += row.offsetHeight
    }

    return {
      x: tableRect.left - containerRect.left + tableRect.width,
      y: columnY,
      leftX: tableRect.left - containerRect.left
    }
  }

  const drawRelationship = (rel) => {
    const fromPos = getColumnPosition(rel.from, rel.fromColumn)
    const toPos = getColumnPosition(rel.to, rel.toColumn)

    if (!fromPos || !toPos) return null

    // Determine if we connect from right or left
    const fromX = fromPos.x
    const toX = toPos.leftX
    const fromY = fromPos.y
    const toY = toPos.y

    // Create path with right angles
    const midX = (fromX + toX) / 2
    
    return (
      <g key={`${rel.from}-${rel.to}-${rel.fromColumn}`}>
        {/* Main connection line */}
        <path
          d={`M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX} ${toY}`}
          stroke="#00A99D"
          strokeWidth="2"
          fill="none"
        />
        
        {/* Arrow at target */}
        <path
          d={`M ${toX} ${toY} L ${toX + 8} ${toY - 4} L ${toX + 8} ${toY + 4} Z`}
          fill="#00A99D"
        />
        
        {/* Circle at source (FK side) */}
        <circle
          cx={fromX}
          cy={fromY}
          r="4"
          fill="#00A99D"
        />
      </g>
    )
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
    <div className="relative w-full h-[700px] overflow-auto bg-base-100 rounded-lg border border-base-300" ref={containerRef}>
      <div className="relative p-8" style={{ minWidth: '1400px', minHeight: '900px' }}>
        {/* SVG overlay for connections */}
        <svg 
          className="absolute inset-0 pointer-events-none" 
          style={{ width: '100%', height: '100%', zIndex: 1 }}
        >
          {relationships.map(rel => drawRelationship(rel))}
        </svg>

        {/* Tables */}
        <div className="relative" style={{ zIndex: 2 }}>
          <div className="grid grid-cols-2 gap-8">
            {tables.map((table, idx) => (
              <motion.div
                key={table.name}
                ref={(el) => setTableRef(table.name, el)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="card bg-base-200 shadow-xl border border-base-300 hover:shadow-2xl transition-shadow"
                style={{ width: '100%', maxWidth: '400px' }}
              >
                {/* Table Header */}
                <div className="bg-primary text-primary-content px-4 py-3 rounded-t-lg">
                  <h3 className="font-bold text-center">{table.name}</h3>
                </div>

                {/* Table Body */}
                <div className="card-body p-0">
                  <table className="table table-sm w-full">
                    <tbody>
                      {table.structure && table.structure.map((column) => {
                        const isFk = relationships.some(r => r.from === table.name && r.fromColumn === column.name)
                        
                        return (
                          <tr
                            key={column.name}
                            className={`${column.pk ? 'bg-warning/10' : ''} hover:bg-base-300`}
                          >
                            <td className="font-mono text-sm font-semibold py-2 px-3">
                              <div className="flex items-center gap-2">
                                {column.pk && <Key className="w-3 h-3 text-warning" />}
                                {column.name}
                              </div>
                            </td>
                            <td className="text-sm text-neutral-medium-gray font-mono py-2">
                              {column.type}
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex gap-1">
                                {column.pk && (
                                  <span className="badge badge-warning badge-xs">PK</span>
                                )}
                                {isFk && (
                                  <span className="badge badge-primary badge-xs">FK</span>
                                )}
                                {!column.pk && column.notnull && (
                                  <span className="badge badge-ghost badge-xs">N</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-base-200 p-4 rounded-lg shadow-xl border border-base-300" style={{ zIndex: 10 }}>
          <div className="font-semibold mb-3">Legend</div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-warning" />
              <span>Primary Key</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <div className="w-4 h-0.5 bg-primary"></div>
                <div className="w-0 h-0 border-l-4 border-l-primary border-y-4 border-y-transparent"></div>
              </div>
              <span>Foreign Key</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge badge-ghost badge-xs">N</span>
              <span>NOT NULL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
