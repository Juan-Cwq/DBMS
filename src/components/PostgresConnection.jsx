import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Database, CheckCircle, XCircle, Loader2, Eye, EyeOff, Server } from 'lucide-react'
import { API_ENDPOINTS } from '../config/api'

export default function PostgresConnection({ onConnectionChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionId, setConnectionId] = useState(null)
  const [isTesting, setIsTesting] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [testResult, setTestResult] = useState(null)
  
  const [config, setConfig] = useState({
    host: 'localhost',
    port: '5432',
    database: '',
    user: '',
    password: '',
    ssl: false
  })

  const handleInputChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }))
    setTestResult(null)
  }

  const testConnection = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      const response = await fetch(API_ENDPOINTS.executePostgres, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          connectionConfig: config
        })
      })

      const data = await response.json()

      if (data.success) {
        setTestResult({ success: true, message: 'Connection successful!' })
      } else {
        setTestResult({ success: false, message: data.message || 'Connection failed' })
      }
    } catch (error) {
      setTestResult({ success: false, message: error.message })
    } finally {
      setIsTesting(false)
    }
  }

  const connect = async () => {
    setIsConnecting(true)
    setTestResult(null)

    try {
      const response = await fetch(API_ENDPOINTS.executePostgres, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'connect',
          connectionConfig: config
        })
      })

      const data = await response.json()

      if (data.success) {
        setIsConnected(true)
        setConnectionId(data.connectionId)
        setIsOpen(false)
        setTestResult({ success: true, message: 'Connected to PostgreSQL!' })
        
        if (onConnectionChange) {
          onConnectionChange({
            connected: true,
            connectionId: data.connectionId,
            config
          })
        }
      } else {
        setTestResult({ success: false, message: data.message || 'Connection failed' })
      }
    } catch (error) {
      setTestResult({ success: false, message: error.message })
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = async () => {
    if (!connectionId) return

    try {
      await fetch(API_ENDPOINTS.executePostgres, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'disconnect',
          connectionId
        })
      })

      setIsConnected(false)
      setConnectionId(null)
      
      if (onConnectionChange) {
        onConnectionChange({ connected: false, connectionId: null })
      }
    } catch (error) {
      console.error('Disconnect error:', error)
    }
  }

  return (
    <>
      {/* Connection Status Button */}
      <div className="flex items-center gap-2">
        {isConnected ? (
          <div className="flex items-center gap-2">
            <div className="badge badge-success gap-1">
              <CheckCircle className="w-3 h-3" />
              PostgreSQL Connected
            </div>
            <button
              onClick={disconnect}
              className="btn btn-error btn-xs"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsOpen(true)}
            className="btn btn-outline btn-sm gap-2"
          >
            <Server className="w-4 h-4" />
            Connect to PostgreSQL
          </button>
        )}
      </div>

      {/* Connection Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-base-100 rounded-lg shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Database className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">PostgreSQL Connection</h2>
                  <p className="text-sm text-neutral-medium-gray">Connect to your PostgreSQL database</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Host */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Host</span>
                  </label>
                  <input
                    type="text"
                    value={config.host}
                    onChange={(e) => handleInputChange('host', e.target.value)}
                    placeholder="localhost or IP address"
                    className="input input-bordered"
                  />
                </div>

                {/* Port */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Port</span>
                  </label>
                  <input
                    type="text"
                    value={config.port}
                    onChange={(e) => handleInputChange('port', e.target.value)}
                    placeholder="5432"
                    className="input input-bordered"
                  />
                </div>

                {/* Database */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Database</span>
                  </label>
                  <input
                    type="text"
                    value={config.database}
                    onChange={(e) => handleInputChange('database', e.target.value)}
                    placeholder="database name"
                    className="input input-bordered"
                  />
                </div>

                {/* User */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">User</span>
                  </label>
                  <input
                    type="text"
                    value={config.user}
                    onChange={(e) => handleInputChange('user', e.target.value)}
                    placeholder="postgres"
                    className="input input-bordered"
                  />
                </div>

                {/* Password */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Password</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={config.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="••••••••"
                      className="input input-bordered w-full pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-medium-gray hover:text-base-content"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* SSL */}
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      checked={config.ssl}
                      onChange={(e) => handleInputChange('ssl', e.target.checked)}
                      className="checkbox checkbox-primary"
                    />
                    <span className="label-text">Use SSL</span>
                  </label>
                </div>

                {/* Test Result */}
                {testResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`alert ${testResult.success ? 'alert-success' : 'alert-error'}`}
                  >
                    {testResult.success ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                    <span className="text-sm">{testResult.message}</span>
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={testConnection}
                    disabled={isTesting || !config.database || !config.user}
                    className="btn btn-outline flex-1"
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      'Test Connection'
                    )}
                  </button>
                  <button
                    onClick={connect}
                    disabled={isConnecting || !config.database || !config.user}
                    className="btn btn-primary flex-1"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Connect'
                    )}
                  </button>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="btn btn-ghost btn-sm w-full"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
