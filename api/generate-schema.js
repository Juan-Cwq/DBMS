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
