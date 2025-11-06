// API configuration
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost'

export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:3001'
  : '/api' // Use Vercel serverless functions in production

export const API_ENDPOINTS = {
  generateSQL: `${API_BASE_URL}/api/generate-sql`,
  generateSchema: `${API_BASE_URL}/api/generate-schema`,
  optimizeSQL: `${API_BASE_URL}/api/optimize-sql`,
}
