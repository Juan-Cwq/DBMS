import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Force cache bust - v2
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
    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set');
      return res.status(500).json({ 
        error: 'API key not configured',
        message: 'ANTHROPIC_API_KEY environment variable is missing'
      });
    }

    const { prompt, context, dbType = 'sqlite' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Validate database type
    const validDbTypes = ['sqlite', 'mysql', 'postgresql', 'sqlserver', 'oracle'];
    const normalizedDbType = dbType.toLowerCase();
    if (!validDbTypes.includes(normalizedDbType)) {
      return res.status(400).json({ 
        error: 'Invalid database type',
        message: `Database type must be one of: ${validDbTypes.join(', ')}`
      });
    }

    // Database-specific syntax configurations
    const dbConfigs = {
      sqlite: {
        name: 'SQLite',
        stringType: 'TEXT',
        dateType: 'TEXT',
        decimalType: 'REAL',
        intType: 'INTEGER',
        boolType: 'INTEGER',
        autoIncrement: 'INTEGER PRIMARY KEY AUTOINCREMENT',
        ifNotExists: 'IF NOT EXISTS',
        currentTimestamp: "(datetime('now'))",
        boolTrue: '1',
        boolFalse: '0',
        timestampExample: "'2024-01-01 12:00:00'",
        features: ['Use TEXT for dates/times', 'Use REAL for decimals', 'Use INTEGER for booleans (0/1)', 'AUTOINCREMENT for auto-incrementing IDs']
      },
      mysql: {
        name: 'MySQL',
        stringType: 'VARCHAR',
        dateType: 'DATETIME',
        decimalType: 'DECIMAL',
        intType: 'INT',
        boolType: 'BOOLEAN',
        autoIncrement: 'INT AUTO_INCREMENT PRIMARY KEY',
        ifNotExists: 'IF NOT EXISTS',
        currentTimestamp: 'CURRENT_TIMESTAMP',
        boolTrue: 'TRUE',
        boolFalse: 'FALSE',
        timestampExample: "'2024-01-01 12:00:00'",
        features: ['Use VARCHAR for strings', 'Use DATETIME for timestamps', 'Use DECIMAL for precise decimals', 'AUTO_INCREMENT for auto-incrementing IDs', 'ENGINE=InnoDB for tables']
      },
      postgresql: {
        name: 'PostgreSQL',
        stringType: 'VARCHAR',
        dateType: 'TIMESTAMP',
        decimalType: 'NUMERIC',
        intType: 'INTEGER',
        boolType: 'BOOLEAN',
        autoIncrement: 'SERIAL PRIMARY KEY',
        ifNotExists: 'IF NOT EXISTS',
        currentTimestamp: 'CURRENT_TIMESTAMP',
        boolTrue: 'TRUE',
        boolFalse: 'FALSE',
        timestampExample: "'2024-01-01 12:00:00'",
        features: ['Use VARCHAR for strings', 'Use TIMESTAMP for date/time', 'Use NUMERIC for precise decimals', 'Use SERIAL for auto-incrementing IDs', 'Support for advanced features like JSONB, arrays']
      },
      sqlserver: {
        name: 'SQL Server',
        stringType: 'NVARCHAR',
        dateType: 'DATETIME2',
        decimalType: 'DECIMAL',
        intType: 'INT',
        boolType: 'BIT',
        autoIncrement: 'INT IDENTITY(1,1) PRIMARY KEY',
        ifNotExists: '', // SQL Server uses different syntax
        currentTimestamp: 'GETDATE()',
        boolTrue: '1',
        boolFalse: '0',
        timestampExample: "'2024-01-01 12:00:00'",
        features: ['Use NVARCHAR for Unicode strings', 'Use DATETIME2 for timestamps', 'Use BIT for booleans', 'IDENTITY for auto-incrementing IDs', 'Use square brackets [table_name] for identifiers']
      },
      oracle: {
        name: 'Oracle',
        stringType: 'VARCHAR2',
        dateType: 'TIMESTAMP',
        decimalType: 'NUMBER',
        intType: 'NUMBER',
        boolType: 'NUMBER(1)',
        autoIncrement: 'NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY',
        ifNotExists: '', // Oracle 23c+ supports IF NOT EXISTS
        currentTimestamp: 'SYSTIMESTAMP',
        boolTrue: '1',
        boolFalse: '0',
        timestampExample: "TO_TIMESTAMP('2024-01-01 12:00:00', 'YYYY-MM-DD HH24:MI:SS')",
        features: ['Use VARCHAR2 for strings', 'Use TIMESTAMP for date/time', 'Use NUMBER for numeric values', 'Use GENERATED ALWAYS AS IDENTITY for auto-incrementing IDs', 'Sequence-based auto-increment']
      }
    };

    const config = dbConfigs[normalizedDbType];

    const systemPrompt = `You are **SchemaCraft AI**, an expert Senior Database Architect specializing in ${config.name}. Your mission is to transform natural language requests into complete, production-ready database solutions.

TARGET DATABASE: ${config.name}

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

Objective: Generate complete ${config.name} CREATE TABLE statements.

CRITICAL ${config.name.toUpperCase()} SYNTAX:
${config.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}
${config.ifNotExists ? `- ALWAYS use ${config.ifNotExists}` : ''}
- Include created_at and updated_at on every table
- Use ON DELETE CASCADE or ON DELETE RESTRICT appropriately
- Add CHECK constraints for enums and validation

Data Types:
- Strings: ${config.stringType}(length)
- Dates/Times: ${config.dateType}
- Decimals: ${config.decimalType}(precision, scale)
- Integers: ${config.intType}
- Booleans: ${config.boolType}
- Auto-increment IDs: ${config.autoIncrement}

Constraints:
- Explicitly define PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK
- Add created_at ${config.dateType} DEFAULT ${config.currentTimestamp}
- Add updated_at ${config.dateType} DEFAULT ${config.currentTimestamp}
- Create INDEX statements for all foreign keys

Example:
CREATE TABLE ${config.ifNotExists} users (
  id ${config.autoIncrement},
  username ${config.stringType}(50) UNIQUE NOT NULL,
  email ${config.stringType}(100) UNIQUE NOT NULL,
  created_at ${config.dateType} DEFAULT ${config.currentTimestamp},
  updated_at ${config.dateType} DEFAULT ${config.currentTimestamp}
);

CREATE TABLE ${config.ifNotExists} posts (
  id ${config.autoIncrement},
  title ${config.stringType}(200) NOT NULL,
  body TEXT,
  user_id ${config.intType} NOT NULL,
  created_at ${config.dateType} DEFAULT ${config.currentTimestamp},
  updated_at ${config.dateType} DEFAULT ${config.currentTimestamp},
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX ${config.ifNotExists} idx_posts_user_id ON posts(user_id);

---

PART 3: SQL DML (Sample Data)

Objective: Generate INSERT statements with realistic sample data.

Rules:
- Generate 3-5 rows for each table
- Data must be consistent with all constraints
- Ensure foreign keys reference valid parent records
- Make data diverse and realistic
- Use ${config.name}-specific syntax for booleans (${config.boolTrue}/${config.boolFalse}) and timestamps

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

    console.log('Calling Anthropic API with prompt length:', prompt.length);
    console.log('API Key present:', !!process.env.ANTHROPIC_API_KEY);
    console.log('API Key starts with:', process.env.ANTHROPIC_API_KEY?.substring(0, 15));
    
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307', // Using Claude 3 Haiku (known working model)
      max_tokens: 4096, // Haiku max is 4096
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      system: systemPrompt,
    });
    
    console.log('Anthropic API response received');

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
      dbType: normalizedDbType,
      dbName: config.name,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
      },
    });
  } catch (error) {
    console.error('Error generating SQL:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return res.status(500).json({
      error: 'Failed to generate SQL',
      message: error.message,
      details: error.name
    });
  }
}
