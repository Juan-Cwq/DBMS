import { Database, Github, Twitter } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-base-200 border-t border-base-300 mt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <span className="font-semibold">SchemaCraft AI</span>
          </div>
          
          <p className="text-sm text-neutral-medium-gray">
            © 2025 SchemaCraft AI. Built with Claude 3.7 Sonnet.
          </p>
          
          <div className="flex gap-4">
            <a href="#" className="btn btn-ghost btn-sm btn-circle">
              <Github className="w-4 h-4" />
            </a>
            <a href="#" className="btn btn-ghost btn-sm btn-circle">
              <Twitter className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
