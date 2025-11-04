import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Database, Code, Sparkles, FileText, Play } from 'lucide-react'
import NaturalLanguageInput from './NaturalLanguageInput'
import SchemaVisualizer from './SchemaVisualizer'
import CodeTerminal from './CodeTerminal'
import StatsPanel from './StatsPanel'
import QueryRunner from './QueryRunner'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('sql')
  const [generatedSQL, setGeneratedSQL] = useState('')
  const [schemaData, setSchemaData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState({
    totalQueries: 0,
    tokensUsed: 0,
    timeSaved: 0,
  })

  const tabs = [
    { id: 'sql', label: 'SQL Generator', icon: Code },
    { id: 'schema', label: 'Schema Designer', icon: Database },
    { id: 'runner', label: 'Query Runner', icon: Play },
  ]

  const handleGenerateSQL = async (prompt) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/generate-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      const data = await response.json()
      
      if (data.sql) {
        setGeneratedSQL(data.sql)
        setStats(prev => ({
          totalQueries: prev.totalQueries + 1,
          tokensUsed: prev.tokensUsed + (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
          timeSaved: prev.timeSaved + 15, // Estimate 15 minutes saved per query
        }))
      }
    } catch (error) {
      console.error('Error generating SQL:', error)
      setGeneratedSQL(`-- Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateSchema = async (prompt) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/generate-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      const data = await response.json()
      
      if (data.schema) {
        setSchemaData(data.schema)
        
        // Also generate the SQL for the schema
        const sqlResponse = await fetch('/api/generate-sql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            prompt: `Generate CREATE TABLE statements for this schema: ${JSON.stringify(data.schema)}` 
          }),
        })
        
        const sqlData = await sqlResponse.json()
        if (sqlData.sql) {
          setGeneratedSQL(sqlData.sql)
        }

        setStats(prev => ({
          totalQueries: prev.totalQueries + 1,
          tokensUsed: prev.tokensUsed + (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
          timeSaved: prev.timeSaved + 30, // Estimate 30 minutes saved per schema
        }))
      }
    } catch (error) {
      console.error('Error generating schema:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (prompt) => {
    if (activeTab === 'sql') {
      handleGenerateSQL(prompt)
    } else {
      handleGenerateSchema(prompt)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Stats Panel */}
      <StatsPanel stats={stats} />

      {/* Tab selector */}
      <div className="tabs tabs-boxed bg-base-200 p-1 mt-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab gap-2 ${activeTab === tab.id ? 'tab-active' : ''}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Query Runner Tab */}
      {activeTab === 'runner' ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <QueryRunner initialQuery={generatedSQL} />
        </motion.div>
      ) : (
        /* Main workspace for SQL Generator and Schema Designer */
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          {/* Left panel - Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Natural Language Input */}
            <NaturalLanguageInput
              onSubmit={handleSubmit}
              isLoading={isLoading}
              placeholder={
                activeTab === 'sql'
                  ? 'Describe the query you need... e.g., "Show me the top 10 customers by total spending in the last quarter"'
                  : 'Describe your database structure... e.g., "Create a database for an e-commerce store with customers, products, and orders"'
              }
            />

            {/* Schema Visualizer (only for schema tab) */}
            {activeTab === 'schema' && schemaData && (
              <SchemaVisualizer schema={schemaData} />
            )}
          </motion.div>

          {/* Right panel - Output */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <CodeTerminal
              code={generatedSQL}
              language="sql"
              isLoading={isLoading}
            />
          </motion.div>
        </div>
      )}
    </div>
  )
}
