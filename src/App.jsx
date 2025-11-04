import { useState } from 'react'
import { motion } from 'framer-motion'
import Header from './components/Header'
import Hero from './components/Hero'
import Dashboard from './components/Dashboard'
import Footer from './components/Footer'

function App() {
  const [showDashboard, setShowDashboard] = useState(false)

  return (
    <div className="min-h-screen bg-base-100" data-theme="light">
      <Header />
      
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
