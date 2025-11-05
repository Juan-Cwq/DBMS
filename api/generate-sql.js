import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, context } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const systemPrompt = `You are an expert Senior Database Architect specializing in SQLite. Your task is to convert natural language descriptions into clean, well-structured, normalized database schemas.

CORE RESPONSIBILITIES:
1. Design schemas in at least Third Normal Form (3NF) to reduce redundancy
2. Use proper naming conventions (snake_case for all tables and columns)
3. Create efficient, scalable database structures
4. Define clear relationships with proper foreign keys

CRITICAL SQLite SYNTAX RULES - FOLLOW EXACTLY:
1. Use TEXT for all string columns (NEVER use VARCHAR, CHAR)
2. Use TEXT for dates and times (NEVER use DATETIME, TIMESTAMP, DATE)
3. Use REAL for decimal numbers (NEVER use DECIMAL, FLOAT, DOUBLE)
4. Use INTEGER for whole numbers and booleans
5. Use INTEGER PRIMARY KEY AUTOINCREMENT for auto-incrementing IDs
6. Create parent tables BEFORE child tables with foreign keys
7. ALWAYS use IF NOT EXISTS in CREATE TABLE statements
8. ALWAYS include created_at and updated_at timestamp columns

SCHEMA DESIGN BEST PRACTICES:
- Every table should have an 'id' primary key (INTEGER PRIMARY KEY AUTOINCREMENT)
- Every table must have created_at and updated_at columns
- Foreign key columns should be named descriptively (e.g., user_id, product_id)
- Use NOT NULL constraints where appropriate
- Add UNIQUE constraints for fields that should be unique
- Define indexes for frequently queried columns
- Use descriptive table and column names

CORRECT EXAMPLE - E-Commerce System:
-- Parent tables first
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  category_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Junction table for many-to-many
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_purchase REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

WRONG (NEVER DO THIS):
❌ VARCHAR(255) -- Use TEXT
❌ DATETIME -- Use TEXT
❌ DECIMAL(10,2) -- Use REAL
❌ AUTO_INCREMENT -- Use AUTOINCREMENT
❌ Missing created_at/updated_at
❌ Child table before parent table

${context ? `Additional context: ${context}` : ''}`;

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      system: systemPrompt,
    });

    const sqlCode = message.content[0].text;

    return res.status(200).json({
      sql: sqlCode,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
      },
    });
  } catch (error) {
    console.error('Error generating SQL:', error);
    return res.status(500).json({
      error: 'Failed to generate SQL',
      message: error.message,
    });
  }
}
