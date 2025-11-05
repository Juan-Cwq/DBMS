import { useCallback, useEffect, useState } from 'react'
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Database, Key, Maximize2, Download, X } from 'lucide-react'
import { getTables, getTableStructure } from '../utils/database'

// Custom Table Node Component
const TableNode = ({ data }) => {
  return (
    <div className="bg-white rounded-lg shadow-xl border-2 border-gray-300" style={{ minWidth: '280px' }}>
      {/* Connection handles */}
      <Handle type="target" position={Position.Left} style={{ background: '#3b82f6', width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: '#3b82f6', width: 10, height: 10 }} />
      <Handle type="target" position={Position.Top} style={{ background: '#3b82f6', width: 10, height: 10 }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#3b82f6', width: 10, height: 10 }} />
      
      <div className="bg-blue-500 text-white px-4 py-3 rounded-t-lg">
        <h3 className="font-bold text-center">{data.label}</h3>
      </div>
      <div className="p-0">
        <table className="w-full text-sm">
          <tbody>
            {data.columns.map((column, idx) => (
              <tr 
                key={idx}
                className={`${column.pk ? 'bg-yellow-50' : ''} border-b border-gray-200 hover:bg-gray-50`}
              >
                <td className="px-3 py-2 font-mono font-semibold">
                  <div className="flex items-center gap-2">
                    {column.pk && <Key className="w-3 h-3 text-yellow-600" />}
                    {column.name}
                  </div>
                </td>
                <td className="px-2 py-2 text-gray-600 font-mono text-xs">
                  {column.type}
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">
                  {column.pk && <span className="badge badge-warning badge-xs">PK</span>}
                  {column.fk && <span className="badge badge-primary badge-xs ml-1">FK</span>}
                  {!column.pk && column.notnull && <span className="text-gray-400">N</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

    // Create nodes
    const newNodes = tablesWithStructure.map((table, index) => {
      const col = index % 3
      const row = Math.floor(index / 3)
      
      // Mark FK columns
      const columns = table.structure.map(col => ({
        ...col,
        fk: relationships.some(r => r.from === table.name && r.fromColumn === col.name)
      }))

      return {
        id: table.name,
        type: 'tableNode',
        position: { x: col * 350, y: row * 400 },
        data: { 
          label: table.name,
          columns: columns
        },
      }
    })

    // Create edges with proper crow's foot notation
    const newEdges = relationships.map((rel, idx) => ({
      id: `e${idx}`,
      source: rel.from,
      target: rel.to,
      type: 'step',
      animated: false,
      style: { 
        stroke: '#6b7280', 
        strokeWidth: 2,
        strokeDasharray: '8,4',
      },
      markerStart: 'url(#crowsfoot-many)',
      markerEnd: 'url(#crowsfoot-one)',
    }))

    setNodes(newNodes)
    setEdges(newEdges)
  }

  const handleDownload = () => {
    // Export as text
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
          <p className="text-sm mt-2">Create tables to see the ER diagram</p>
        </div>
      </div>
    )
  }

  const DiagramContent = () => (
    <div className={`${isFullscreen ? 'w-full h-full' : 'w-full h-[700px]'} bg-white rounded-lg border border-base-300`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
        connectionLineStyle={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5,5' }}
      >
        {/* Custom SVG markers for crow's foot notation */}
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            {/* Many side - crow's foot */}
            <marker
              id="crowsfoot-many"
              markerWidth="16"
              markerHeight="16"
              refX="8"
              refY="8"
              orient="auto"
            >
              <line x1="8" y1="3" x2="8" y2="13" stroke="#6b7280" strokeWidth="1.5" />
              <line x1="0" y1="3" x2="8" y2="8" stroke="#6b7280" strokeWidth="1.5" />
              <line x1="0" y1="13" x2="8" y2="8" stroke="#6b7280" strokeWidth="1.5" />
            </marker>
            {/* One side - single line */}
            <marker
              id="crowsfoot-one"
              markerWidth="16"
              markerHeight="16"
              refX="8"
              refY="8"
              orient="auto"
            >
              <line x1="8" y1="3" x2="8" y2="13" stroke="#6b7280" strokeWidth="1.5" />
              <line x1="5" y1="3" x2="5" y2="13" stroke="#6b7280" strokeWidth="1.5" />
            </marker>
          </defs>
        </svg>
        
        <Background color="#e5e7eb" gap={16} />
        <Controls />
        <MiniMap 
          nodeColor="#3b82f6"
          maskColor="rgba(0, 0, 0, 0.1)"
          style={{ backgroundColor: '#f3f4f6' }}
        />
      </ReactFlow>
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
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
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
          <div className="flex-1">
            <DiagramContent />
          </div>
        </div>
      )}
    </>
  )
}
