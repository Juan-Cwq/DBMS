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

CRITICAL SQLite SYNTAX:
1. Use TEXT for strings (NOT VARCHAR/CHAR)
2. Use TEXT for dates/times (NOT DATETIME/TIMESTAMP)
3. Use REAL for decimals (NOT DECIMAL/FLOAT)
4. Use INTEGER for numbers/booleans
5. Use INTEGER PRIMARY KEY AUTOINCREMENT for IDs
6. ALWAYS use IF NOT EXISTS
7. Include created_at and updated_at on every table
8. Use ON DELETE CASCADE or ON DELETE RESTRICT appropriately
9. Add CHECK constraints for enums and booleans

Constraints:
- Explicitly define PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK
- Add created_at TEXT DEFAULT (datetime('now'))
- Add updated_at TEXT DEFAULT (datetime('now'))
- Create INDEX statements for all foreign keys

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
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8192,
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
    
    return res.status(200).json({
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
    return res.status(500).json({
      error: 'Failed to generate SQL',
      message: error.message,
    });
  }
}
