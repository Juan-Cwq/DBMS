# SchemaCraft AI

> Transform database ideas into reality with AI-powered schema design and SQL generation

![SchemaCraft AI](https://img.shields.io/badge/Powered%20by-Claude%203.7%20Sonnet-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🚀 Overview

SchemaCraft AI is an intelligent database management system that translates natural language into production-ready SQL code and database schemas. Built for database professionals who want to focus on strategy rather than syntax.

### Key Features

- 🎯 **Natural Language to SQL** - Describe what you need in plain English
- 🏗️ **Intelligent Schema Design** - AI-generated, normalized database structures
- ⚡ **Lightning Fast** - Generate schemas in seconds, not days
- 🎨 **Beautiful UI** - Modern, responsive interface built with React and Tailwind CSS
- 🌓 **Dark/Light Mode** - Comfortable viewing in any environment
- 📊 **Real-time Visualization** - See your schema structure instantly
- 💾 **Export Ready** - Download SQL code with one click

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library
- **Tailwind CSS** - Utility-first styling
- **DaisyUI** - Beautiful component library
- **Framer Motion** - Smooth animations
- **Lucide React** - Clean, modern icons
- **React Syntax Highlighter** - Code display with syntax highlighting

### Backend
- **Node.js + Express** - RESTful API server
- **Anthropic Claude 3.7 Sonnet** - Advanced AI model for SQL generation
- **CORS** - Cross-origin resource sharing

### Build Tools
- **Vite** - Fast build tool and dev server
- **PostCSS** - CSS processing
- **Autoprefixer** - Automatic vendor prefixing

## 📦 Installation

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Anthropic API key

### Setup

1. **Clone or navigate to the project directory**
   ```bash
   cd /Users/jcors09/Library/Mobile\ Documents/com~apple~CloudDocs/Cascade_Projects/DBMS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment variables are already configured in `.env`**
   - The Anthropic API key is already set
   - Server runs on port 3001
   - Frontend runs on port 5173

4. **Start the application**
   ```bash
   npm run dev
   ```

   This will start both the backend server and frontend development server concurrently.

5. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## 🎯 Usage

### SQL Generation

1. Click "Start Building" on the homepage
2. Select the "SQL Generator" tab
3. Describe your query in natural language:
   ```
   Show me the top 10 customers by total spending in the last quarter
   ```
4. Click "Generate" and watch the AI create optimized SQL

### Schema Design

1. Select the "Schema Designer" tab
2. Describe your database structure:
   ```
   Create a database for an e-commerce store with customers, products, and orders
   ```
3. View the visual schema representation
4. Download the generated CREATE TABLE statements

## 🏗️ Project Structure

```
DBMS/
├── server/
│   └── index.js              # Express API server with Claude integration
├── src/
│   ├── components/
│   │   ├── Header.jsx        # App header with theme toggle
│   │   ├── Hero.jsx          # Landing page hero section
│   │   ├── Dashboard.jsx     # Main workspace
│   │   ├── NaturalLanguageInput.jsx  # AI prompt input
│   │   ├── CodeTerminal.jsx  # SQL code display
│   │   ├── SchemaVisualizer.jsx      # Schema visualization
│   │   ├── StatsPanel.jsx    # Usage statistics
│   │   └── Footer.jsx        # App footer
│   ├── App.jsx               # Main app component
│   ├── main.jsx              # React entry point
│   └── index.css             # Global styles
├── index.html                # HTML template
├── package.json              # Dependencies and scripts
├── vite.config.js            # Vite configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── postcss.config.js         # PostCSS configuration
├── .env                      # Environment variables
└── README.md                 # This file
```

## 🎨 Design System

### Brand Colors

- **Primary Gradient**: `linear-gradient(135deg, #0D253F 0%, #005A7A 35%, #00A99D 70%, #F58220 100%)`
- **Primary Teal**: `#00A99D`
- **Ocean Blue**: `#005A7A`
- **Energy Orange**: `#F58220`

### Typography

- **Primary Font**: Inter (sans-serif)
- **Display Font**: DM Serif Display (serif)

## 🔌 API Endpoints

### `POST /api/generate-sql`
Generate SQL code from natural language.

**Request:**
```json
{
  "prompt": "Create a users table with email and password",
  "context": "PostgreSQL database"
}
```

**Response:**
```json
{
  "sql": "CREATE TABLE users (...)",
  "usage": {
    "input_tokens": 45,
    "output_tokens": 123
  }
}
```

### `POST /api/generate-schema`
Generate database schema structure.

**Request:**
```json
{
  "prompt": "E-commerce database with products and orders"
}
```

**Response:**
```json
{
  "schema": {
    "tables": [...],
    "relationships": [...]
  },
  "usage": {...}
}
```

### `POST /api/optimize-sql`
Optimize existing SQL queries.

**Request:**
```json
{
  "sql": "SELECT * FROM users WHERE ...",
  "context": "Performance optimization needed"
}
```

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## 🤝 Contributing

This is a proprietary project. For questions or suggestions, please contact the development team.

## 📄 License

Copyright © 2025 SchemaCraft AI. All rights reserved.

## 🙏 Acknowledgments

- **Claude 3.7 Sonnet** by Anthropic - Powering the AI intelligence
- **React Team** - Amazing UI library
- **Tailwind Labs** - Beautiful utility-first CSS
- **DaisyUI** - Elegant component system

## 📞 Support

For support, feature requests, or bug reports, please contact the development team.

---

**Built with ❤️ using Claude 3.7 Sonnet**
