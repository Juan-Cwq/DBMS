import { Pool } from 'pg';

// Store active connections (in production, use Redis or similar)
const connections = new Map();

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
    const { action, connectionConfig, query, connectionId } = req.body;

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

    // Get tables
    if (action === 'getTables') {
      if (!connectionId) {
        return res.status(400).json({ error: 'Connection ID required' });
      }

      const pool = connections.get(connectionId);
      if (!pool) {
        return res.status(404).json({ error: 'Connection not found. Please reconnect.' });
      }

      const result = await pool.query(`
        SELECT 
          table_name,
          table_schema
        FROM information_schema.tables
        WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
        ORDER BY table_schema, table_name
      `);

      return res.status(200).json({
        success: true,
        tables: result.rows
      });
    }

    // Get table structure
    if (action === 'getTableStructure') {
      const { tableName, schemaName = 'public' } = req.body;
      
      if (!connectionId) {
        return res.status(400).json({ error: 'Connection ID required' });
      }

      const pool = connections.get(connectionId);
      if (!pool) {
        return res.status(404).json({ error: 'Connection not found. Please reconnect.' });
      }

      const result = await pool.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns
        WHERE table_name = $1 AND table_schema = $2
        ORDER BY ordinal_position
      `, [tableName, schemaName]);

      return res.status(200).json({
        success: true,
        columns: result.rows
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
}
