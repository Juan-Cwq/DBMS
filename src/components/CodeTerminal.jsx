import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, Download, Code2, Loader2 } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'

export default function CodeTerminal({ code, language = 'sql', isLoading }) {
  const [copied, setCopied] = useState(false)
  const [theme, setTheme] = useState('dark')

  const handleCopy = async () => {
    if (code) {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    if (code) {
      const blob = new Blob([code], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `schema.${language}`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="card bg-base-200 shadow-xl h-full">
      <div className="card-body p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Generated Code</h3>
          </div>
          
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleCopy}
              className="btn btn-ghost btn-sm btn-circle"
              disabled={!code || isLoading}
              title="Copy to clipboard"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Check className="w-4 h-4 text-success" />
                  </motion.div>
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </AnimatePresence>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDownload}
              className="btn btn-ghost btn-sm btn-circle"
              disabled={!code || isLoading}
              title="Download"
            >
              <Download className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Code display */}
        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-64 gap-4"
              >
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-neutral-medium-gray">Generating your code...</p>
              </motion.div>
            ) : code ? (
              <motion.div
                key="code"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <SyntaxHighlighter
                  language={language}
                  style={theme === 'dark' ? vscDarkPlus : vs}
                  customStyle={{
                    margin: 0,
                    padding: '1.5rem',
                    background: 'transparent',
                    fontSize: '0.875rem',
                  }}
                  showLineNumbers
                >
                  {code}
                </SyntaxHighlighter>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-64 gap-4 text-neutral-medium-gray"
              >
                <Code2 className="w-12 h-12 opacity-50" />
                <p>Your generated code will appear here</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
