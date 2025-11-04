import { motion } from 'framer-motion'
import { Sparkles, Zap, Shield, Clock } from 'lucide-react'

export default function Hero({ onGetStarted }) {
  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Generate schemas in seconds, not days',
    },
    {
      icon: Shield,
      title: 'Production Ready',
      description: 'Optimized, secure, and reliable SQL',
    },
    {
      icon: Clock,
      title: 'Save Time',
      description: 'Focus on strategy, not syntax',
    },
  ]

  return (
    <div className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-brand-gradient opacity-5" />
      
      <div className="container mx-auto px-4 py-20 relative">
        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Powered by Claude 3.7 Sonnet</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6">
            Transform Ideas Into
            <span className="block text-gradient">Database Reality</span>
          </h1>

          <p className="text-xl text-neutral-medium-gray mb-8 max-w-2xl mx-auto">
            Stop fighting with SQL syntax. Describe what you need in plain English, 
            and watch as AI crafts perfect database schemas and queries in seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onGetStarted}
              className="btn btn-primary btn-lg text-white"
            >
              Start Building
              <Sparkles className="w-5 h-5 ml-2" />
            </motion.button>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="card bg-base-200 shadow-xl hover:shadow-2xl"
            >
              <div className="card-body items-center text-center">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="card-title text-lg">{feature.title}</h3>
                <p className="text-neutral-medium-gray">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-16"
        >
          <p className="text-sm text-neutral-medium-gray mb-4">
            Trusted by database professionals worldwide
          </p>
          <div className="flex justify-center gap-8 opacity-50">
            <div className="text-2xl font-bold">10K+</div>
            <div className="text-2xl font-bold">Schemas</div>
            <div className="text-2xl font-bold">Generated</div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
