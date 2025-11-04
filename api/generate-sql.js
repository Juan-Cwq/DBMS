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

    const systemPrompt = `You are an expert SQLite database architect. Generate ONLY valid SQLite SQL code.

CRITICAL RULES - FOLLOW EXACTLY:
1. Use TEXT for all string columns (NEVER use VARCHAR, CHAR, or any other string type)
2. Use TEXT for dates and times (NEVER use DATETIME, TIMESTAMP, or DATE)
3. Use REAL for decimal numbers (NEVER use DECIMAL, FLOAT, or DOUBLE)
4. Use INTEGER for whole numbers and booleans
5. Use INTEGER PRIMARY KEY AUTOINCREMENT for auto-incrementing IDs
6. Create parent tables BEFORE child tables with foreign keys
7. ALWAYS use IF NOT EXISTS in CREATE TABLE statements

CORRECT SQLite Examples:

Example 1 - Simple table:
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

Example 2 - Tables with relationships (parent first):
-- Parent table first
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

-- Child table second
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category_id INTEGER NOT NULL,
  price REAL NOT NULL,
  stock INTEGER DEFAULT 0,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

Example 3 - Many-to-many relationship:
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS enrollments (
  student_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  enrolled_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (student_id, course_id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

WRONG (DO NOT DO THIS):
❌ CREATE TABLE users (name VARCHAR(255)) -- NO VARCHAR!
❌ CREATE TABLE orders (created_at DATETIME) -- NO DATETIME!
❌ CREATE TABLE products (price DECIMAL(10,2)) -- NO DECIMAL!
❌ CREATE TABLE items (id INT AUTO_INCREMENT) -- NO AUTO_INCREMENT!

CORRECT (DO THIS):
✅ CREATE TABLE IF NOT EXISTS users (name TEXT)
✅ CREATE TABLE IF NOT EXISTS orders (created_at TEXT)
✅ CREATE TABLE IF NOT EXISTS products (price REAL)
✅ CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT)

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
