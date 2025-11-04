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
