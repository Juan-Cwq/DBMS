# SchemaCraft AI - Quick Start Guide

## 🎉 Your Application is Ready!

The SchemaCraft AI application has been successfully built and is currently running.

## 🌐 Access Points

- **Frontend Application**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/health

## ⚠️ Important Note

The Anthropic API key provided has insufficient credits. To use the AI features, you'll need to:

1. Visit https://console.anthropic.com/
2. Add credits to your account
3. Or replace the API key in `.env` with one that has available credits

## 🚀 How to Use

### 1. Open the Application
Navigate to http://localhost:5173 in your browser

### 2. Get Started
Click the "Start Building" button on the homepage

### 3. Generate SQL
- Select the "SQL Generator" tab
- Enter a natural language description like:
  ```
  Show me the top 10 customers by total spending in the last quarter
  ```
- Click "Generate"
- Copy or download the generated SQL

### 4. Design Schemas
- Select the "Schema Designer" tab
- Describe your database structure:
  ```
  Create a database for an e-commerce store with customers, products, and orders
  ```
- View the visual schema representation
- Download the CREATE TABLE statements

## 🛠️ Development Commands

### Start the Application
```bash
npm run dev
```
This runs both the backend server (port 3001) and frontend (port 5173)

### Start Backend Only
```bash
npm run server
```

### Start Frontend Only
```bash
npm run client
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 📁 Project Structure

```
DBMS/
├── server/              # Express backend with Claude integration
├── src/
│   ├── components/      # React components
│   ├── App.jsx         # Main app
│   └── main.jsx        # Entry point
├── package.json        # Dependencies
├── .env               # Environment variables (API key)
└── README.md          # Full documentation
```

## 🎨 Features Implemented

✅ **Beautiful Landing Page**
- Hero section with brand gradient
- Feature highlights
- Smooth animations with Framer Motion

✅ **Natural Language Input**
- Clean textarea interface
- Example prompts
- Character counter
- Loading states

✅ **Code Terminal**
- Syntax-highlighted SQL display
- Copy to clipboard
- Download functionality
- Dark/light theme support

✅ **Schema Visualizer**
- Interactive table display
- Column details with types
- Primary/Foreign key indicators
- Relationship mapping

✅ **Stats Dashboard**
- Query counter
- Token usage tracking
- Time saved calculator

✅ **Theme Toggle**
- Light/Dark mode
- Smooth transitions
- System preference detection

✅ **Responsive Design**
- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly controls

## 🔧 API Endpoints

### Generate SQL
```bash
POST /api/generate-sql
Content-Type: application/json

{
  "prompt": "Your natural language description",
  "context": "Optional context"
}
```

### Generate Schema
```bash
POST /api/generate-schema
Content-Type: application/json

{
  "prompt": "Your database description"
}
```

### Optimize SQL
```bash
POST /api/optimize-sql
Content-Type: application/json

{
  "sql": "Your SQL query",
  "context": "Optional context"
}
```

## 🎯 Next Steps

1. **Add Credits to Anthropic Account**
   - Visit https://console.anthropic.com/settings/plans
   - Purchase credits or upgrade plan

2. **Test the Application**
   - Try generating SQL queries
   - Design database schemas
   - Test the optimization feature

3. **Customize**
   - Modify colors in `tailwind.config.js`
   - Add new components in `src/components/`
   - Extend API endpoints in `server/index.js`

4. **Deploy**
   - Build production version: `npm run build`
   - Deploy frontend to Vercel/Netlify
   - Deploy backend to Railway/Render

## 💡 Tips

- Use specific, detailed prompts for better results
- Include database type (PostgreSQL, MySQL, etc.) in context
- Review generated SQL before using in production
- Save frequently used schemas for reference

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill processes on ports 3001 and 5173
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### Dependencies Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### API Not Responding
- Check if backend is running on port 3001
- Verify .env file has correct API key
- Check Anthropic API status

## 📞 Support

For issues or questions:
- Check the main README.md
- Review API documentation
- Test with curl commands
- Check browser console for errors

---

**Enjoy building with SchemaCraft AI! 🚀**
