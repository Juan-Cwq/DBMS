import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Loader2, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import { getTables, getTableStructure } from '../utils/database'
import { getCurrentDatabaseContext } from '../utils/databaseStorage'

export default function AIChatSidebar({ onSQLGenerated, isCollapsed, setIsCollapsed }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m your database assistant. I can help you:\n\n• Generate SQL schemas\n• Modify existing tables\n• Add relationships\n• Optimize queries\n\nWhat would you like to build?'
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      // Get current database context
      const tables = getTables()
      const tablesWithStructure = tables.map(table => ({
        ...table,
        structure: getTableStructure(table.name)
      }))
      const context = getCurrentDatabaseContext(tablesWithStructure)

      // Call AI API
      const response = await fetch('/api/generate-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: userMessage,
          context
        }),
      })

      const data = await response.json()
      
      if (data.sql) {
        // Add assistant response
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'I\'ve generated the SQL for you. Click "Use This SQL" to add it to your query editor.',
          sql: data.sql
        }])
        
        // Notify parent component
        if (onSQLGenerated) {
          onSQLGenerated(data.sql)
        }
      } else {
        throw new Error('No SQL generated')
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '❌ Sorry, I encountered an error. Please try again.',
        error: true
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleUseSql = (sql) => {
    if (onSQLGenerated) {
      onSQLGenerated(sql)
    }
  }

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? '48px' : '320px' }}
      className="relative h-full bg-base-200 border-l border-base-300 flex flex-col"
    >
      {/* Collapse/Expand Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -left-3 top-4 z-10 btn btn-circle btn-xs bg-base-100 border-base-300 hover:bg-base-200"
      >
        {isCollapsed ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>

      {isCollapsed ? (
        // Collapsed state - just icon
        <div className="flex flex-col items-center justify-center h-full">
          <button
            onClick={() => setIsCollapsed(false)}
            className="btn btn-ghost btn-circle"
            title="Open AI Assistant"
          >
            <Sparkles className="w-5 h-5 text-primary" />
          </button>
        </div>
      ) : (
        // Expanded state - full chat
        <>
          {/* Header */}
          <div className="p-4 border-b border-base-300 bg-gradient-to-r from-primary/10 to-secondary/10">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bot className="w-6 h-6 text-primary" />
                <Sparkles className="w-3 h-3 text-secondary absolute -top-1 -right-1" />
              </div>
              <div>
                <h3 className="font-bold text-sm">AI Assistant</h3>
                <p className="text-xs text-neutral-medium-gray">Database Expert</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="avatar placeholder">
                      <div className="bg-primary text-primary-content rounded-full w-8 h-8 flex items-center justify-center">
                        <Bot className="w-4 h-4" />
                      </div>
                    </div>
                  )}
                  
                  <div className={`flex flex-col gap-1 max-w-[80%]`}>
                    <div
                      className={`rounded-lg p-3 text-sm ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-content'
                          : message.error
                          ? 'bg-error/10 text-error'
                          : 'bg-base-100 text-base-content'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                    
                    {message.sql && (
                      <div className="bg-base-100 rounded-lg p-2 border border-base-300">
                        <pre className="text-xs overflow-x-auto font-mono text-neutral-medium-gray max-h-32 overflow-y-auto">
                          {message.sql.substring(0, 200)}...
                        </pre>
                        <button
                          onClick={() => handleUseSql(message.sql)}
                          className="btn btn-primary btn-xs mt-2 w-full"
                        >
                          Use This SQL
                        </button>
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="avatar placeholder">
                      <div className="bg-secondary text-secondary-content rounded-full w-8 h-8 flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-2 justify-start"
              >
                <div className="avatar placeholder">
                  <div className="bg-primary text-primary-content rounded-full w-8 h-8 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                </div>
                <div className="bg-base-100 rounded-lg p-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-neutral-medium-gray">Thinking...</span>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-base-300 bg-base-100">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="textarea textarea-bordered flex-1 resize-none text-sm h-12"
                rows="1"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="btn btn-primary btn-square"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-neutral-medium-gray mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </>
      )}
    </motion.div>
  )
}
