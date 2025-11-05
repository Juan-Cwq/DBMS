import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Header from './components/Header'
import Hero from './components/Hero'
import Dashboard from './components/Dashboard'
import Footer from './components/Footer'

function App() {
  const [showDashboard, setShowDashboard] = useState(false)
  const [theme, setTheme] = useState(() => {
    // Load theme from localStorage or default to light
    return localStorage.getItem('theme') || 'light'
  })

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <div className="min-h-screen bg-base-100">
      <Header theme={theme} setTheme={setTheme} />
      
      <main>
        {!showDashboard ? (
          <Hero onGetStarted={() => setShowDashboard(true)} />
        ) : (
          <Dashboard />
        )}
      </main>
      
      <Footer />
    </div>
  )
}

export default App
