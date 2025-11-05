import { useCallback, useEffect, useState } from 'react'
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Database, Maximize2, Download, X, FileText, Image } from 'lucide-react'
import { getTables, getTableStructure } from '../utils/database'
import html2canvas from 'html2canvas'

// Custom Table Node - dbdiagram.io style
const TableNode = ({ data }) => {
  return (
    <div 
      className="bg-white rounded-md shadow-lg border border-gray-300"
      style={{ 
        minWidth: '220px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* Connection handles */}
      <Handle type="target" position={Position.Left} style={{ background: '#94a3b8', width: 8, height: 8, border: 'none' }} />
      <Handle type="source" position={Position.Right} style={{ background: '#94a3b8', width: 8, height: 8, border: 'none' }} />
      <Handle type="target" position={Position.Top} style={{ background: '#94a3b8', width: 8, height: 8, border: 'none' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#94a3b8', width: 8, height: 8, border: 'none' }} />
      
      {/* Table Header - dbdiagram.io blue gradient */}
      <div 
        className="px-3 py-2 rounded-t-md text-white font-semibold text-sm"
        style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        {data.label}
      </div>
      
      {/* Table Body */}
      <div className="bg-white rounded-b-md">
        {data.columns.map((column, idx) => (
          <div 
            key={idx}
            className={`px-3 py-1.5 text-xs border-b border-gray-100 last:border-b-0 ${
              column.pk ? 'bg-amber-50' : 'hover:bg-gray-50'
            }`}
            style={{ fontFamily: 'Monaco, "Courier New", monospace' }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Column icon */}
                {column.pk ? (
                  <span className="text-amber-500 font-bold text-xs">🔑</span>
                ) : column.fk ? (
                  <span className="text-blue-500 text-xs">◆</span>
                ) : (
                  <span className="text-gray-400 text-xs">◇</span>
                )}
                
                {/* Column name */}
                <span className={`font-medium truncate ${column.pk ? 'text-amber-700' : 'text-gray-700'}`}>
                  {column.name}
                </span>
              </div>
              
              {/* Column type */}
              <span className="text-gray-500 text-xs uppercase font-mono">
                {column.type.replace('INTEGER', 'INT').replace('TEXT', 'VARCHAR').substring(0, 12)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const nodeTypes = {
  tableNode: TableNode,
}

export default function ERDiagram() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [tables, setTables] = useState([])

  useEffect(() => {
    loadSchema()
  }, [])

  const loadSchema = () => {
    const allTables = getTables()
    if (allTables.length === 0) return

    const tablesWithStructure = allTables.map(table => ({
      ...table,
      structure: getTableStructure(table.name)
    }))
    setTables(tablesWithStructure)

    // Extract relationships
    const relationships = []
    tablesWithStructure.forEach(table => {
      const fkMatches = table.sql.matchAll(/FOREIGN KEY \((\w+)\) REFERENCES (\w+)\((\w+)\)/gi)
      for (const match of fkMatches) {
        relationships.push({
          from: table.name,
          to: match[2],
          fromColumn: match[1],
          toColumn: match[3]
        })
      }
    })

    // Create nodes with better layout
    const newNodes = tablesWithStructure.map((table, index) => {
      const col = index % 3
      const row = Math.floor(index / 3)
      
      const columns = table.structure.map(col => ({
        ...col,
        fk: relationships.some(r => r.from === table.name && r.fromColumn === col.name)
      }))

      return {
        id: table.name,
        type: 'tableNode',
        position: { x: col * 280 + 50, y: row * 350 + 50 },
        data: { 
          label: table.name,
          columns: columns
        },
      }
    })

    // Create edges with dbdiagram.io style
    const newEdges = relationships.map((rel, idx) => ({
      id: `e${idx}`,
      source: rel.from,
      target: rel.to,
      type: 'smoothstep',
      animated: false,
      style: { 
        stroke: '#94a3b8',
        strokeWidth: 2,
        strokeDasharray: '5,5',
      },
      markerStart: 'url(#crowsfoot-many)',
      markerEnd: 'url(#crowsfoot-one)',
    }))

    setNodes(newNodes)
    setEdges(newEdges)
  }

  const handleDownloadPNG = async () => {
    const diagramElement = document.querySelector('.react-flow')
    if (!diagramElement) return
    
    try {
      const canvas = await html2canvas(diagramElement, {
        backgroundColor: '#f8fafc',
        scale: 2,
        logging: false,
      })
      
      const link = document.createElement('a')
      link.download = `database-diagram-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Error downloading diagram:', error)
    }
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
    <div 
      className={`${isFullscreen ? 'w-full h-full' : 'w-full h-[700px]'} rounded-lg border border-gray-200 overflow-hidden`}
      style={{ background: '#f8fafc' }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag={true}
        panOnScroll={false}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        connectionLineStyle={{ stroke: '#94a3b8', strokeWidth: 2, strokeDasharray: '5,5' }}
      >
        {/* Custom SVG markers for crow's foot notation */}
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            {/* Many side - crow's foot */}
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
            {/* One side */}
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
        </svg>
        
        <Background 
          color="#cbd5e1" 
          gap={20} 
          size={1}
          style={{ backgroundColor: '#f8fafc' }}
        />
        <Controls 
          showInteractive={false}
          style={{
            button: {
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              color: '#475569',
            }
          }}
        />
        <MiniMap 
          nodeColor="#667eea"
          maskColor="rgba(0, 0, 0, 0.05)"
          style={{ 
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '4px'
          }}
        />
      </ReactFlow>
    </div>
  )

  return (
    <>
      {/* Toolbar - dbdiagram.io style */}
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
          {tables.length} {tables.length === 1 ? 'table' : 'tables'} • {edges.length} {edges.length === 1 ? 'relationship' : 'relationships'}
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
