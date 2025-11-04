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

    const systemPrompt = `You are an expert SQLite database architect. Your role is to:
1. Translate natural language descriptions into production-ready SQLite SQL code
2. Design optimal database schemas with proper normalization
3. Create efficient queries with appropriate indexes and constraints
4. Follow best practices for database design (ACID compliance, referential integrity, etc.)

CRITICAL SQLite-specific requirements:
- Use TEXT instead of VARCHAR (SQLite doesn't have VARCHAR)
- Use TEXT for dates/times (SQLite stores dates as TEXT, INTEGER, or REAL)
- Use INTEGER PRIMARY KEY for auto-incrementing IDs
- Use AUTOINCREMENT (not AUTO_INCREMENT)
- When using foreign keys, create referenced tables FIRST
- Use REAL for floating-point numbers
- Use BLOB for binary data

Data type mapping:
- VARCHAR(n) → TEXT
- CHAR(n) → TEXT
- DATETIME → TEXT
- TIMESTAMP → TEXT
- DECIMAL(m,n) → REAL
- FLOAT → REAL
- DOUBLE → REAL

When generating SQL:
- Use clear, readable formatting
- Include comments explaining complex logic
- Create tables in dependency order (parent tables before child tables with foreign keys)
- Use appropriate SQLite data types
- Consider performance and scalability
- Test that the SQL will work in SQLite

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
