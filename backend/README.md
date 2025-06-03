# Supabase Proxy Backend

This is a Node.js backend server that acts as a proxy for Supabase operations, keeping your API keys secure.

## Setup

1. Create a `.env` file based on the `.env.example` template
2. Add your Supabase URL and anon key to the `.env` file
3. Install dependencies: `npm install`
4. Start the server: `npm start` or `npm run dev` for development with auto-reload

## API Endpoints

The server provides endpoints that mirror Supabase operations but keep your API keys secure on the server side.

- GET `/api/:table` - Get all records from a table
- GET `/api/:table/:id` - Get a specific record by ID
- POST `/api/:table` - Create a new record
- PUT `/api/:table/:id` - Update a record
- DELETE `/api/:table/:id` - Delete a record

## Security

This server implements several security best practices:

- Environment variables for sensitive information
- CORS protection
- Request validation
- Error handling

See the main SECURITY_GUIDE.md for additional security measures you can implement.