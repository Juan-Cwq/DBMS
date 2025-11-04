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

  const { url } = req;

  // Health check
  if (url === '/api/health') {
    return res.status(200).json({ status: 'ok', message: 'SchemaCraft AI server is running' });
  }

  // Generate SQL
  if (url === '/api/generate-sql' && req.method === 'POST') {
    try {
      const { prompt, context } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const systemPrompt = `You are an expert database architect and SQL developer. Your role is to:
1. Translate natural language descriptions into production-ready SQL code
2. Design optimal database schemas with proper normalization
3. Create efficient queries with appropriate indexes and constraints
4. Follow best practices for database design (ACID compliance, referential integrity, etc.)

When generating SQL:
- Use clear, readable formatting
- Include comments explaining complex logic
- Suggest appropriate data types and constraints
- Consider performance and scalability
- Follow standard SQL conventions

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

  // Generate schema
  if (url === '/api/generate-schema' && req.method === 'POST') {
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
      
      let schemaData;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        schemaData = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
      } catch (parseError) {
        schemaData = JSON.parse(responseText);
      }

      return res.status(200).json({
        schema: schemaData,
        usage: {
          input_tokens: message.usage.input_tokens,
          output_tokens: message.usage.output_tokens,
        },
      });
    } catch (error) {
      console.error('Error generating schema:', error);
      return res.status(500).json({
        error: 'Failed to generate schema',
        message: error.message,
      });
    }
  }

  // Optimize SQL
  if (url === '/api/optimize-sql' && req.method === 'POST') {
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

      return res.status(200).json({
        optimization,
        usage: {
          input_tokens: message.usage.input_tokens,
          output_tokens: message.usage.output_tokens,
        },
      });
    } catch (error) {
      console.error('Error optimizing SQL:', error);
      return res.status(500).json({
        error: 'Failed to optimize SQL',
        message: error.message,
      });
    }
  }

  return res.status(404).json({ error: 'Not found' });
}
