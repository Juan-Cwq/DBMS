import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Database, Key, Maximize2, Download, X } from 'lucide-react'
import { getTables, getTableStructure } from '../utils/database'
import html2canvas from 'html2canvas'

export default function ERDiagram() {
  const [tables, setTables] = useState([])
  const [relationships, setRelationships] = useState([])
  const [tableRefs, setTableRefs] = useState({})
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef(null)
  const diagramRef = useRef(null)

  useEffect(() => {
    loadSchema()
  }, [])

  useEffect(() => {
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
    
    const rows = tableEl.querySelectorAll('tbody tr')
    let columnY = tableRect.top - containerRect.top + 60
    
    for (const row of rows) {
      const colName = row.querySelector('td')?.textContent?.trim().replace('🔑', '')
      if (colName === columnName) {
        const rowRect = row.getBoundingClientRect()
        columnY = rowRect.top - containerRect.top + rowRect.height / 2
        break
      }
    }

    return {
      rightX: tableRect.left - containerRect.left + tableRect.width,
      leftX: tableRect.left - containerRect.left,
      y: columnY
    }
  }

  const drawCrowsFoot = (x, y, direction, type = 'many') => {
    const size = 10
    const elements = []

    if (direction === 'left') {
      // Perpendicular line (one side)
      elements.push(
        <line
          key="perp"
          x1={x + 5}
          y1={y - size}
          x2={x + 5}
          y2={y + size}
          stroke="#00A99D"
          strokeWidth="2"
        />
      )
      
      // Crow's foot (many side)
      if (type === 'many') {
        elements.push(
          <line key="crow1" x1={x} y1={y - size} x2={x + 10} y2={y} stroke="#00A99D" strokeWidth="2" />,
          <line key="crow2" x1={x} y1={y + size} x2={x + 10} y2={y} stroke="#00A99D" strokeWidth="2" />
        )
      }
    } else {
      // Perpendicular line (one side)
      elements.push(
        <line
          key="perp"
          x1={x - 5}
          y1={y - size}
          x2={x - 5}
          y2={y + size}
          stroke="#00A99D"
          strokeWidth="2"
        />
      )
      
      // Crow's foot (many side)
      if (type === 'many') {
        elements.push(
          <line key="crow1" x1={x} y1={y - size} x2={x - 10} y2={y} stroke="#00A99D" strokeWidth="2" />,
          <line key="crow2" x1={x} y1={y + size} x2={x - 10} y2={y} stroke="#00A99D" strokeWidth="2" />
        )
      }
    }

    return elements
  }

  const drawRelationship = (rel) => {
    const fromPos = getColumnPosition(rel.from, rel.fromColumn)
    const toPos = getColumnPosition(rel.to, rel.toColumn)

    if (!fromPos || !toPos) return null

    const fromX = fromPos.rightX
    const toX = toPos.leftX
    const fromY = fromPos.y
    const toY = toPos.y

    const midX = (fromX + toX) / 2
    
    return (
      <g key={`${rel.from}-${rel.to}-${rel.fromColumn}`}>
        {/* Main path */}
        <path
          d={`M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX} ${toY}`}
          stroke="#00A99D"
          strokeWidth="2"
          fill="none"
        />
        
        {/* Crow's foot at FK side (many) */}
        {drawCrowsFoot(fromX, fromY, 'right', 'many')}
        
        {/* One indicator at PK side */}
        {drawCrowsFoot(toX, toY, 'left', 'one')}
      </g>
    )
  }

  const handleDownload = async () => {
    if (!diagramRef.current) return
    
    try {
      const canvas = await html2canvas(diagramRef.current, {
        backgroundColor: '#ffffff',
        scale: 2
      })
      
      const link = document.createElement('a')
      link.download = `database-diagram-${Date.now()}.png`
      link.href = canvas.toDataURL()
      link.click()
    } catch (error) {
      console.error('Error downloading diagram:', error)
    }
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

  const DiagramContent = () => (
    <div 
      ref={diagramRef}
      className={`relative ${isFullscreen ? 'w-full h-full' : 'w-full h-[700px]'} overflow-auto bg-white rounded-lg border border-base-300`}
      style={{ containerRef }}
    >
      <div className="relative p-8" style={{ minWidth: '1400px', minHeight: '900px' }}>
        <svg 
          className="absolute inset-0 pointer-events-none" 
          style={{ width: '100%', height: '100%', zIndex: 1 }}
        >
          {relationships.map(rel => drawRelationship(rel))}
        </svg>

        <div className="relative" style={{ zIndex: 2 }}>
          <div className="grid grid-cols-2 gap-8">
            {tables.map((table, idx) => (
              <motion.div
                key={table.name}
                ref={(el) => setTableRef(table.name, el)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="card bg-white shadow-xl border-2 border-gray-300 hover:shadow-2xl transition-shadow"
                style={{ width: '100%', maxWidth: '400px' }}
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
              </motion.div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-xl border-2 border-gray-300" style={{ zIndex: 10 }}>
          <div className="font-semibold mb-3 text-gray-800">Cardinality</div>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-center gap-3">
              <svg width="40" height="20">
                <line x1="0" y1="10" x2="30" y2="10" stroke="#00A99D" strokeWidth="2" />
                <line x1="30" y1="5" x2="30" y2="15" stroke="#00A99D" strokeWidth="2" />
              </svg>
              <span>One</span>
            </div>
            <div className="flex items-center gap-3">
              <svg width="40" height="20">
                <line x1="0" y1="10" x2="30" y2="10" stroke="#00A99D" strokeWidth="2" />
                <line x1="30" y1="5" x2="40" y2="10" stroke="#00A99D" strokeWidth="2" />
                <line x1="30" y1="15" x2="40" y2="10" stroke="#00A99D" strokeWidth="2" />
              </svg>
              <span>Many</span>
            </div>
          </div>
        </div>
      </div>
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
          Download PNG
        </button>
      </div>

      {!isFullscreen && <DiagramContent />}

      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex flex-col"
          >
            <div className="flex justify-between items-center p-4 bg-base-200">
              <h2 className="text-xl font-bold">Database Schema Diagram</h2>
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
      </AnimatePresence>
    </>
  )
}
