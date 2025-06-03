require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3200;

// Middleware
app.use(cors());
app.use(express.json());

// Simple in-memory cache
const cache = {
  professors: { data: null, timestamp: 0 },
  itcourses: { data: null, timestamp: 0 },
  file_link: { data: null, timestamp: 0 },
  events: { data: null, timestamp: 0 }
};

// Cache validity duration (5 minutes)
const CACHE_TTL = 300000;

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Supabase proxy server is running',
    supabaseConnected: !!supabaseUrl && !!supabaseKey
  });
});

// Debug endpoint to list all tables
app.get('/api/debug/tables', async (req, res) => {
  try {
    console.log('Fetching available tables from Supabase');
    
    // Query for listing tables in PostgreSQL
    const { data, error } = await supabase
      .rpc('list_tables');
    
    if (error) {
      console.error('Error fetching tables:', error);
      throw error;
    }
    
    console.log('Tables data:', data);
    res.json(data || []);
  } catch (error) {
    console.error('Error in /api/debug/tables:', error);
    
    // Try alternative method if RPC fails
    try {
      console.log('Trying alternative method to list tables');
      const { data, error } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public');
        
      if (error) throw error;
      console.log('Tables found via pg_tables:', data);
      res.json(data || []);
    } catch (alt_error) {
      console.error('Alternative method also failed:', alt_error);
      res.status(500).json({ 
        error: error.message,
        alternative_error: alt_error.message 
      });
    }
  }
});

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      logError(error, '/api/auth/login');
      return res.status(401).json({ error: error.message });
    }
    
    return res.status(200).json({ session: data.session });
  } catch (error) {
    logError(error, '/api/auth/login');
    return res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

// Generic API endpoints for table operations
app.get('/api/:table', async (req, res) => {
  const { table } = req.params;
  const { sort, order, search, limit, offset } = req.query;
  
  // Validate table name to prevent SQL injection
  if (!isValidTableName(table)) {
    return res.status(400).json({ error: 'Invalid table name' });
  }
  
  try {
    // Check cache first
    if (cache[table] && cache[table].timestamp > Date.now() - CACHE_TTL) {
      console.log(`Serving ${table} from cache`);
      return res.json(cache[table].data);
    }
    
    console.log(`Fetching ${table} from Supabase`);
    
    // Start building the query
    let query = supabase.from(table).select('*');
    
    // Apply search if provided
    if (search) {
      // This is a simplified example. In a real app, you'd need to
      // customize this based on the table schema
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    // Apply sorting if provided
    if (sort && isValidColumnName(sort)) {
      const sortOrder = order === 'desc' ? 'desc' : 'asc';
      query = query.order(sort, { ascending: sortOrder === 'asc' });
    }
    
    // Apply pagination if provided
    if (limit && !isNaN(parseInt(limit))) {
      query = query.limit(parseInt(limit));
      
      if (offset && !isNaN(parseInt(offset))) {
        query = query.offset(parseInt(offset));
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      logError(error, `/api/${table}`);
      throw error;
    }
    
    // Update cache
    cache[table] = {
      data,
      timestamp: Date.now()
    };
    
    res.json(data);
  } catch (error) {
    logError(error, `/api/${table}`);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/:table/:id', async (req, res) => {
  const { table, id } = req.params;
  
  // Validate table name to prevent SQL injection
  if (!isValidTableName(table)) {
    return res.status(400).json({ error: 'Invalid table name' });
  }
  
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      logError(error, `/api/${table}/${id}`);
      throw error;
    }
    
    if (!data) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    res.json(data);
  } catch (error) {
    logError(error, `/api/${table}/${id}`);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/:table', async (req, res) => {
  const { table } = req.params;
  const data = req.body;
  
  // Validate table name to prevent SQL injection
  if (!isValidTableName(table)) {
    return res.status(400).json({ error: 'Invalid table name' });
  }
  
  // Basic validation
  if (!data || Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'No data provided' });
  }
  
  try {
    const { data: result, error } = await supabase
      .from(table)
      .insert([data])
      .select();
    
    if (error) {
      logError(error, `/api/${table} [POST]`);
      throw error;
    }
    
    // Invalidate cache
    if (cache[table]) {
      cache[table].timestamp = 0;
    }
    
    res.status(201).json(result[0]);
  } catch (error) {
    logError(error, `/api/${table} [POST]`);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/:table/:id', async (req, res) => {
  const { table, id } = req.params;
  const data = req.body;
  
  // Validate table name to prevent SQL injection
  if (!isValidTableName(table)) {
    return res.status(400).json({ error: 'Invalid table name' });
  }
  
  // Basic validation
  if (!data || Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'No data provided' });
  }
  
  try {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select();
    
    if (error) {
      logError(error, `/api/${table}/${id} [PUT]`);
      throw error;
    }
    
    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    // Invalidate cache
    if (cache[table]) {
      cache[table].timestamp = 0;
    }
    
    res.json(result[0]);
  } catch (error) {
    logError(error, `/api/${table}/${id} [PUT]`);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/:table/:id', async (req, res) => {
  const { table, id } = req.params;
  
  // Validate table name to prevent SQL injection
  if (!isValidTableName(table)) {
    return res.status(400).json({ error: 'Invalid table name' });
  }
  
  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    
    if (error) {
      logError(error, `/api/${table}/${id} [DELETE]`);
      throw error;
    }
    
    // Invalidate cache
    if (cache[table]) {
      cache[table].timestamp = 0;
    }
    
    res.status(204).end();
  } catch (error) {
    logError(error, `/api/${table}/${id} [DELETE]`);
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function isValidTableName(table) {
  // Only allow alphanumeric characters and underscores
  // This helps prevent SQL injection
  const validTables = ['professors', 'itcourses', 'file_link', 'events'];
  return validTables.includes(table);
}

function isValidColumnName(column) {
  // Only allow alphanumeric characters and underscores
  // This helps prevent SQL injection
  return /^[a-zA-Z0-9_]+$/.test(column);
}

function logError(error, endpoint) {
  console.error(`Error in ${endpoint}:`, error);
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Supabase URL: ${supabaseUrl ? 'Configured' : 'Missing'}`);
  console.log(`Supabase Key: ${supabaseKey ? 'Configured' : 'Missing'}`);
});