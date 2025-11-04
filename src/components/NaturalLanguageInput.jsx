import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Sparkles, Loader2 } from 'lucide-react'

export default function NaturalLanguageInput({ onSubmit, isLoading, placeholder }) {
  const [input, setInput] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onSubmit(input)
    }
  }

  const examples = [
    'Create a user authentication system with roles and permissions',
    'Design an inventory management database',
    'Build a blog platform with posts, comments, and tags',
  ]

  const handleExampleClick = (example) => {
    setInput(example)
  }

  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="card-title text-lg">Natural Language Input</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder}
              className="textarea textarea-bordered h-32 focus:textarea-primary resize-none"
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-neutral-medium-gray">
              {input.length} characters
            </span>
            
            <motion.button
              type="submit"
              disabled={!input.trim() || isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-primary gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Generate
                  <Send className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </div>
        </form>

        {/* Example prompts */}
        <div className="divider text-xs">Quick Examples</div>
        <div className="flex flex-wrap gap-2">
          {examples.map((example, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              onClick={() => handleExampleClick(example)}
              className="badge badge-outline badge-lg cursor-pointer hover:badge-primary"
              disabled={isLoading}
            >
              {example}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}
