import { useEffect, useState, useRef } from 'react'
import { Database, Maximize2, Download, X, FileText, Image, ZoomIn, ZoomOut, Maximize } from 'lucide-react'
import { getTables, getTableStructure } from '../utils/database'

const TABLE_WIDTH = 220
const TABLE_HEADER_HEIGHT = 40
const TABLE_FIELD_HEIGHT = 32
const GRID_SIZE = 20

// Calculate smart path between two points (DrawDB-inspired)
function calcPath(r, tableWidth = TABLE_WIDTH) {
  if (!r) return ""
  
  const x1 = r.startTable.x
  const y1 = r.startTable.y + r.startFieldIndex * TABLE_FIELD_HEIGHT + TABLE_HEADER_HEIGHT + TABLE_FIELD_HEIGHT / 2
  const x2 = r.endTable.x
  const y2 = r.endTable.y + r.endFieldIndex * TABLE_FIELD_HEIGHT + TABLE_HEADER_HEIGHT + TABLE_FIELD_HEIGHT / 2
  
  const radius = 10
  const midX = (x2 + x1 + tableWidth) / 2
  const endX = x2 + tableWidth < x1 ? x2 + tableWidth : x2
  
  // Simple straight line for close fields
  if (Math.abs(y1 - y2) <= 5) {
    if (x1 + tableWidth <= x2) return `M ${x1 + tableWidth} ${y1} L ${x2} ${y2}`
    else if (x2 + tableWidth < x1) return `M ${x1} ${y1} L ${x2 + tableWidth} ${y2}`
  }
  
  // Smart routing with curves
  if (y1 <= y2) {
    if (x1 + tableWidth <= x2) {
      return `M ${x1 + tableWidth} ${y1} L ${midX - radius} ${y1} Q ${midX} ${y1} ${midX} ${y1 + radius} L ${midX} ${y2 - radius} Q ${midX} ${y2} ${midX + radius} ${y2} L ${endX} ${y2}`
    } else {
      return `M ${x1} ${y1} L ${midX + radius} ${y1} Q ${midX} ${y1} ${midX} ${y1 + radius} L ${midX} ${y2 - radius} Q ${midX} ${y2} ${midX - radius} ${y2} L ${endX} ${y2}`
    }
  } else {
    if (x1 + tableWidth <= x2) {
      return `M ${x1 + tableWidth} ${y1} L ${midX - radius} ${y1} Q ${midX} ${y1} ${midX} ${y1 - radius} L ${midX} ${y2 + radius} Q ${midX} ${y2} ${midX + radius} ${y2} L ${endX} ${y2}`
    } else {
      return `M ${x1} ${y1} L ${midX + radius} ${y1} Q ${midX} ${y1} ${midX} ${y1 - radius} L ${midX} ${y2 + radius} Q ${midX} ${y2} ${midX - radius} ${y2} L ${endX} ${y2}`
    }
  }
}

// Table component
function TableSVG({ table, onDragStart, isDragging }) {
  const height = TABLE_HEADER_HEIGHT + table.fields.length * TABLE_FIELD_HEIGHT
  
  return (
    <g
      transform={`translate(${table.x}, ${table.y})`}
      className="cursor-move"
      onPointerDown={(e) => onDragStart(e, table.id)}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {/* Table shadow */}
      <rect
        x="2"
        y="2"
        width={TABLE_WIDTH}
        height={height}
        rx="8"
        fill="rgba(0,0,0,0.1)"
      />
      
      {/* Table background */}
      <rect
        width={TABLE_WIDTH}
        height={height}
        rx="8"
        fill="white"
        stroke="#d1d5db"
        strokeWidth="2"
      />
      
      {/* Table header with gradient */}
      <defs>
        <linearGradient id={`grad-${table.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#667eea', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#764ba2', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <rect
        width={TABLE_WIDTH}
        height={TABLE_HEADER_HEIGHT}
        rx="8"
        fill={`url(#grad-${table.id})`}
      />
      <rect
        y={TABLE_HEADER_HEIGHT - 8}
        width={TABLE_WIDTH}
        height="8"
        fill={`url(#grad-${table.id})`}
      />
      
      {/* Table name */}
      <text
        x={TABLE_WIDTH / 2}
        y={TABLE_HEADER_HEIGHT / 2 + 5}
        textAnchor="middle"
        fill="white"
        fontSize="14"
        fontWeight="600"
      >
        {table.name}
      </text>
      
      {/* Fields */}
      {table.fields.map((field, idx) => (
        <g key={field.id} transform={`translate(0, ${TABLE_HEADER_HEIGHT + idx * TABLE_FIELD_HEIGHT})`}>
          {/* Field background */}
          <rect
            width={TABLE_WIDTH}
            height={TABLE_FIELD_HEIGHT}
            fill={field.pk ? '#fef3c7' : 'white'}
            className="hover:fill-gray-50"
          />
          
          {/* Field separator */}
          {idx > 0 && (
            <line
              x1="0"
              y1="0"
              x2={TABLE_WIDTH}
              y2="0"
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          )}
          
          {/* Field icon */}
          <text x="12" y={TABLE_FIELD_HEIGHT / 2 + 4} fontSize="12">
            {field.pk ? '🔑' : field.fk ? '◆' : '◇'}
          </text>
          
          {/* Field name */}
          <text
            x="32"
            y={TABLE_FIELD_HEIGHT / 2 + 5}
            fontSize="12"
            fontWeight={field.pk ? '600' : '500'}
            fill={field.pk ? '#92400e' : '#374151'}
            fontFamily="Monaco, monospace"
          >
            {field.name}
          </text>
          
          {/* Field type */}
          <text
            x={TABLE_WIDTH - 12}
            y={TABLE_FIELD_HEIGHT / 2 + 5}
            textAnchor="end"
            fontSize="10"
            fill="#6b7280"
            fontFamily="Monaco, monospace"
          >
            {field.type.replace('INTEGER', 'INT').replace('TEXT', 'VARCHAR').substring(0, 12)}
          </text>
        </g>
      ))}
    </g>
  )
}

// Relationship component
function RelationshipSVG({ relationship, tables }) {
  const startTable = tables.find(t => t.id === relationship.startTableId)
  const endTable = tables.find(t => t.id === relationship.endTableId)
  
  if (!startTable || !endTable) return null
  
  const startFieldIndex = startTable.fields.findIndex(f => f.id === relationship.startFieldId)
  const endFieldIndex = endTable.fields.findIndex(f => f.id === relationship.endFieldId)
  
  const pathData = calcPath({
    startTable: { x: startTable.x, y: startTable.y },
    endTable: { x: endTable.x, y: endTable.y },
    startFieldIndex,
    endFieldIndex
  })
  
  return (
    <g className="relationship">
      {/* Invisible wider path for easier hovering */}
      <path
        d={pathData}
        fill="none"
        stroke="transparent"
        strokeWidth="12"
        className="cursor-pointer"
      />
      
      {/* Visible relationship line */}
      <path
        d={pathData}
        fill="none"
        stroke="#94a3b8"
        strokeWidth="2"
        strokeDasharray="5,5"
        className="hover:stroke-blue-500 cursor-pointer"
        markerStart="url(#crowsfoot-many)"
        markerEnd="url(#crowsfoot-one)"
      />
    </g>
  )
}

export default function ERDiagramSVG() {
  const [tables, setTables] = useState([])
  const [relationships, setRelationships] = useState([])
  const [transform, setTransform] = useState({ x: 0, y: 0, zoom: 1 })
  const [dragging, setDragging] = useState({ id: null, offsetX: 0, offsetY: 0 })
  const [panning, setPanning] = useState({ active: false, startX: 0, startY: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const svgRef = useRef(null)
  
  useEffect(() => {
    loadSchema()
  }, [])
  
  const loadSchema = () => {
    const allTables = getTables()
    if (allTables.length === 0) return
    
    const tablesWithStructure = allTables.map((table, index) => {
      const structure = getTableStructure(table.name)
      const col = index % 3
      const row = Math.floor(index / 3)
      
      return {
        id: table.name,
        name: table.name,
        x: col * 280 + 50,
        y: row * 350 + 50,
        sql: table.sql,
        fields: structure.map(field => ({
          id: field.name,
          name: field.name,
          type: field.type,
          pk: field.pk === 1,
          fk: false
        }))
      }
    })
    
    // Extract relationships
    const rels = []
    tablesWithStructure.forEach(table => {
      const fkMatches = table.sql.matchAll(/FOREIGN KEY \((\w+)\) REFERENCES (\w+)\((\w+)\)/gi)
      for (const match of fkMatches) {
        const startFieldId = match[1]
        const endTableId = match[2]
        const endFieldId = match[3]
        
        // Mark FK fields
        const field = table.fields.find(f => f.name === startFieldId)
        if (field) field.fk = true
        
        rels.push({
          id: `${table.id}-${startFieldId}-${endTableId}-${endFieldId}`,
          startTableId: table.id,
          startFieldId,
          endTableId,
          endFieldId
        })
      }
    })
    
    setTables(tablesWithStructure)
    setRelationships(rels)
  }
  
  const handlePointerDown = (e, tableId) => {
    if (e.button !== 0) return
    e.stopPropagation()
    
    const table = tables.find(t => t.id === tableId)
    const svg = svgRef.current
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse())
    
    setDragging({
      id: tableId,
      offsetX: svgP.x / transform.zoom - table.x,
      offsetY: svgP.y / transform.zoom - table.y
    })
  }
  
  const handlePointerMove = (e) => {
    if (dragging.id) {
      const svg = svgRef.current
      const pt = svg.createSVGPoint()
      pt.x = e.clientX
      pt.y = e.clientY
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse())
      
      setTables(prev => prev.map(t => 
        t.id === dragging.id 
          ? { ...t, x: svgP.x / transform.zoom - dragging.offsetX, y: svgP.y / transform.zoom - dragging.offsetY }
          : t
      ))
    } else if (panning.active) {
      const dx = e.clientX - panning.startX
      const dy = e.clientY - panning.startY
      setTransform(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy
      }))
      setPanning({ ...panning, startX: e.clientX, startY: e.clientY })
    }
  }
  
  const handlePointerUp = () => {
    setDragging({ id: null, offsetX: 0, offsetY: 0 })
    setPanning({ active: false, startX: 0, startY: 0 })
  }
  
  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setTransform(prev => ({
      ...prev,
      zoom: Math.max(0.1, Math.min(2, prev.zoom * delta))
    }))
  }
  
  const handlePanStart = (e) => {
    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.target === svgRef.current)) {
      setPanning({ active: true, startX: e.clientX, startY: e.clientY })
    }
  }
  
  const handleDownloadPNG = async () => {
    const svg = svgRef.current
    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      canvas.width = svg.clientWidth * 2
      canvas.height = svg.clientHeight * 2
      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      const link = document.createElement('a')
      link.download = `database-diagram-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)))
  }
  
  const handleDownloadSQL = () => {
    let content = '-- Database Schema\n-- Generated by SchemaCraft AI\n\n'
    tables.forEach(table => {
      content += `${table.sql};\n\n`
    })
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `schema-${Date.now()}.sql`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  const zoomIn = () => setTransform(prev => ({ ...prev, zoom: Math.min(2, prev.zoom * 1.2) }))
  const zoomOut = () => setTransform(prev => ({ ...prev, zoom: Math.max(0.1, prev.zoom / 1.2) }))
  const resetView = () => setTransform({ x: 0, y: 0, zoom: 1 })
  
  if (tables.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-medium-gray">
        <div className="text-center">
          <Database className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No tables to visualize</p>
          <p className="text-sm mt-2">Create tables to see the ER diagram</p>
        </div>
      </div>
    )
  }
  
  const DiagramContent = () => (
    <div className={`${isFullscreen ? 'w-full h-full' : 'w-full h-[700px]'} rounded-lg border border-gray-200 overflow-hidden relative`}>
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ background: '#f8fafc' }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerDown={handlePanStart}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      >
        <defs>
          {/* Grid pattern */}
          <pattern
            id="grid"
            width={GRID_SIZE}
            height={GRID_SIZE}
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1" fill="#cbd5e1" opacity="0.5" />
          </pattern>
          
          {/* Crow's foot markers */}
          <marker
            id="crowsfoot-many"
            markerWidth="20"
            markerHeight="20"
            refX="0"
            refY="10"
            orient="auto"
          >
            <line x1="0" y1="4" x2="10" y2="10" stroke="#94a3b8" strokeWidth="2" />
            <line x1="0" y1="10" x2="10" y2="10" stroke="#94a3b8" strokeWidth="2" />
            <line x1="0" y1="16" x2="10" y2="10" stroke="#94a3b8" strokeWidth="2" />
          </marker>
          <marker
            id="crowsfoot-one"
            markerWidth="20"
            markerHeight="20"
            refX="10"
            refY="10"
            orient="auto"
          >
            <line x1="10" y1="4" x2="10" y2="16" stroke="#94a3b8" strokeWidth="2" />
          </marker>
        </defs>
        
        {/* Grid background */}
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.zoom})`}>
          {/* Relationships (drawn first, behind tables) */}
          {relationships.map(rel => (
            <RelationshipSVG key={rel.id} relationship={rel} tables={tables} />
          ))}
          
          {/* Tables */}
          {tables.map(table => (
            <TableSVG
              key={table.id}
              table={table}
              onDragStart={handlePointerDown}
              isDragging={dragging.id === table.id}
            />
          ))}
        </g>
      </svg>
      
      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
        <button onClick={zoomIn} className="btn btn-sm btn-circle" title="Zoom In">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={zoomOut} className="btn btn-sm btn-circle" title="Zoom Out">
          <ZoomOut className="w-4 h-4" />
        </button>
        <button onClick={resetView} className="btn btn-sm btn-circle" title="Reset View">
          <Maximize className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
  
  return (
    <>
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setIsFullscreen(true)}
            className="btn btn-sm gap-2 bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
          >
            <Maximize2 className="w-4 h-4" />
            Fullscreen
          </button>
          <button
            onClick={handleDownloadPNG}
            className="btn btn-sm gap-2 bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
          >
            <Image className="w-4 h-4" />
            Export PNG
          </button>
          <button
            onClick={handleDownloadSQL}
            className="btn btn-sm gap-2 bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
          >
            <FileText className="w-4 h-4" />
            Export SQL
          </button>
        </div>
        
        <div className="text-xs text-gray-500 ml-auto">
          {tables.length} {tables.length === 1 ? 'table' : 'tables'} • {relationships.length} {relationships.length === 1 ? 'relationship' : 'relationships'}
        </div>
      </div>

      {!isFullscreen && <DiagramContent />}

      {isFullscreen && (
        <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
          <div className="flex justify-between items-center px-6 py-3 bg-white border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Database Schema Diagram</h2>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadPNG}
                className="btn btn-sm gap-2 bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
              >
                <Image className="w-4 h-4" />
                PNG
              </button>
              <button
                onClick={handleDownloadSQL}
                className="btn btn-sm gap-2 bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
              >
                <FileText className="w-4 h-4" />
                SQL
              </button>
              <button
                onClick={() => setIsFullscreen(false)}
                className="btn btn-sm btn-circle bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1">
            <DiagramContent />
          </div>
        </div>
      )}
    </>
  )
}
