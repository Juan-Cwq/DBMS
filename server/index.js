import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SchemaCraft AI server is running' });
});

// Generate SQL from natural language
app.post('/api/generate-sql', async (req, res) => {
  try {
    const { prompt, context } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const systemPrompt = `You are **SchemaCraft AI**, an expert Senior Database Architect specializing in SQLite. Your mission is to transform natural language requests into complete, production-ready database solutions.

CRITICAL OUTPUT REQUIREMENTS:
1. Return ONLY code - NO explanations, NO markdown wrappers, NO conversational text
2. Generate THREE distinct parts separated by "---" (three hyphens on a new line)
3. Use SQL comments (--) for documentation within the code
4. DO NOT wrap code in markdown code blocks (\`\`\`sql or \`\`\`dbml)
5. DO NOT include phrases like "Here's the SQL" or "This creates..."

CORE DESIGN PRINCIPLES:
1. Analyze the request to identify all entities, attributes, relationships, and business rules
2. Design in at least Third Normal Form (3NF) for data integrity
3. Use snake_case for ALL table and column names
4. Create parent tables BEFORE child tables
5. Add appropriate indexes for foreign keys and frequently queried columns

---

PART 1: DBML for ERD (Visual Diagram)

Objective: Generate clean DBML code for dbdiagram.io visualization.

Syntax Rules:
- Use "Table" keyword to define tables
- Define columns with only "name type" (e.g., "id int", "email varchar")
- DO NOT use constraints like [pk], [increment], [unique] in this section
- Only use [not null] on foreign key columns where required
- Define relationships using "Ref: table1.column1 > table2.column2"

Example:
Table users {
  id int
  username varchar
  email varchar
}

Table posts {
  id int
  title varchar
  user_id int [not null]
}

Ref: posts.user_id > users.id

---

PART 2: SQL DDL (Logical Schema)

Objective: Generate complete SQLite CREATE TABLE statements.

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

Example:
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT,
  user_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);

---

PART 3: SQL DML (Sample Data)

Objective: Generate INSERT statements with realistic sample data.

Rules:
- Generate 3-5 rows for each table
- Data must be consistent with all constraints
- Ensure foreign keys reference valid parent records
- Make data diverse and realistic

Example:
INSERT INTO users (username, email) VALUES
('john_doe', 'john@example.com'),
('jane_smith', 'jane@example.com'),
('bob_wilson', 'bob@example.com');

INSERT INTO posts (title, body, user_id) VALUES
('My First Post', 'This is my first blog post.', 1),
('SQL Tips', 'Here are some SQL best practices.', 2),
('Database Design', 'Let us talk about normalization.', 2);

${context ? `\n\nCURRENT DATABASE CONTEXT:\n${context}\n\nUse this context to understand existing tables and relationships when generating new schema elements.` : ''}`;

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

    let response = message.content[0].text;
    
    // Clean up the response - remove markdown code blocks if present
    response = response.replace(/```sql\n?/g, '').replace(/```dbml\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse the three-part response
    const parts = response.split('---').map(part => part.trim())

    res.json({
      sql: response, // Full response with all three parts
      dbml: parts[0] || '',
      ddl: parts[1] || '',
      dml: parts[2] || '',
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
      },
    });
  } catch (error) {
    console.error('Error generating SQL:', error);
    res.status(500).json({
      error: 'Failed to generate SQL',
      message: error.message,
    });
  }
});

// Generate schema visualization data
app.post('/api/generate-schema', async (req, res) => {
  try {
    const { prompt, context } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const systemPrompt = `You are a database schema architect. Generate a JSON representation of a database schema based on the user's description.

Return ONLY valid JSON in this exact format:
{
  "tables": [
    {
      "id": "table_name",
      "name": "TableName",
      "columns": [
        {
          "name": "column_name",
          "type": "VARCHAR(255)",
          "nullable": false,
          "primaryKey": true,
          "foreignKey": null
        }
      ]
    }
  ],
  "relationships": [
    {
      "from": "table1",
      "to": "table2",
      "type": "one-to-many",
      "fromColumn": "id",
      "toColumn": "table1_id"
    }
  ]
}

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

    const responseText = message.content[0].text;
    
    // Extract JSON from response (in case Claude adds explanation)
    let schemaData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      schemaData = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
    } catch (parseError) {
      schemaData = JSON.parse(responseText);
    }

    res.json({
      schema: schemaData,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
      },
    });
  } catch (error) {
    console.error('Error generating schema:', error);
    res.status(500).json({
      error: 'Failed to generate schema',
      message: error.message,
    });
  }
});

// Optimize existing SQL query
app.post('/api/optimize-sql', async (req, res) => {
  try {
    const { sql, context } = req.body;

    if (!sql) {
      return res.status(400).json({ error: 'SQL code is required' });
    }

    const systemPrompt = `You are an expert SQL optimization specialist. Analyze the provided SQL query and:
1. Identify performance bottlenecks
2. Suggest optimizations (indexes, query restructuring, etc.)
3. Provide the optimized version
4. Explain the improvements

Format your response as:
## Original Issues
[List of issues]

## Optimized SQL
\`\`\`sql
[optimized code]
\`\`\`

## Improvements
[Explanation of changes and expected performance gains]

${context ? `Additional context: ${context}` : ''}`;

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `Optimize this SQL query:\n\n${sql}`,
        },
      ],
      system: systemPrompt,
    });

    const optimization = message.content[0].text;

    res.json({
      optimization,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
      },
    });
  } catch (error) {
    console.error('Error optimizing SQL:', error);
    res.status(500).json({
      error: 'Failed to optimize SQL',
      message: error.message,
    });
  }
});

// PostgreSQL connection endpoint
const connections = new Map();

app.post('/api/execute-postgres', async (req, res) => {
  try {
    const { action, connectionConfig, query, connectionId, tableName, schemaName = 'public' } = req.body;

    // Test connection
    if (action === 'test') {
      const { host, port, database, user, password, ssl } = connectionConfig;
      
      const pool = new Pool({
        host,
        port: port || 5432,
        database,
        user,
        password,
        ssl: ssl ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 5000,
      });

      try {
        const client = await pool.connect();
        await client.query('SELECT version()');
        client.release();
        await pool.end();
        
        return res.status(200).json({ 
          success: true, 
          message: 'Connection successful' 
        });
      } catch (error) {
        await pool.end();
        throw error;
      }
    }

    // Connect and store connection
    if (action === 'connect') {
      const { host, port, database, user, password, ssl } = connectionConfig;
      
      const pool = new Pool({
        host,
        port: port || 5432,
        database,
        user,
        password,
        ssl: ssl ? { rejectUnauthorized: false } : false,
        max: 10,
        idleTimeoutMillis: 30000,
      });

      // Test the connection
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();

      // Generate connection ID
      const id = `pg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      connections.set(id, pool);

      return res.status(200).json({ 
        success: true, 
        connectionId: id,
        message: 'Connected to PostgreSQL' 
      });
    }

    // Execute query
    if (action === 'execute') {
      if (!connectionId) {
        return res.status(400).json({ error: 'Connection ID required' });
      }

      const pool = connections.get(connectionId);
      if (!pool) {
        return res.status(404).json({ error: 'Connection not found. Please reconnect.' });
      }

      const startTime = Date.now();
      const result = await pool.query(query);
      const executionTime = Date.now() - startTime;

      return res.status(200).json({
        success: true,
        rows: result.rows,
        rowCount: result.rowCount,
        fields: result.fields?.map(f => ({
          name: f.name,
          dataTypeID: f.dataTypeID
        })),
        executionTime,
        command: result.command
      });
    }

    // Disconnect
    if (action === 'disconnect') {
      if (!connectionId) {
        return res.status(400).json({ error: 'Connection ID required' });
      }

      const pool = connections.get(connectionId);
      if (pool) {
        await pool.end();
        connections.delete(connectionId);
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Disconnected' 
      });
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (error) {
    console.error('PostgreSQL error:', error);
    return res.status(500).json({
      error: 'Database error',
      message: error.message,
      code: error.code
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 SchemaCraft AI server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
});
