import app from '../backend/src/app.js';

// Vercel Serverless Function entrypoint wrapping our Express application
export default async function handler(req, res) {
  try {
    return await app(req, res);
  } catch (error) {
    console.error('Serverless Execution Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
