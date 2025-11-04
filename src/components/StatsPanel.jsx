import { motion } from 'framer-motion'
import { TrendingUp, Zap, Clock } from 'lucide-react'

export default function StatsPanel({ stats }) {
  const statItems = [
    {
      icon: Zap,
      label: 'Queries Generated',
      value: stats.totalQueries,
      color: 'text-primary',
    },
    {
      icon: TrendingUp,
      label: 'Tokens Used',
      value: stats.tokensUsed.toLocaleString(),
      color: 'text-secondary',
    },
    {
      icon: Clock,
      label: 'Time Saved',
      value: `${stats.timeSaved} min`,
      color: 'text-accent',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {statItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="stats shadow bg-base-200"
        >
          <div className="stat">
            <div className="stat-figure">
              <item.icon className={`w-8 h-8 ${item.color}`} />
            </div>
            <div className="stat-title">{item.label}</div>
            <div className="stat-value text-2xl">{item.value}</div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
