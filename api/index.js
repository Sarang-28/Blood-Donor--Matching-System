import app from '../backend/src/app.js';

// Vercel Serverless Function entrypoint wrapping our Express application
export default function handler(req, res) {
  return app(req, res);
}
