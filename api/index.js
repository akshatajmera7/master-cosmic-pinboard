  // Vercel Serverless Function - Root Handler / Proxy to Sync Handler
  import syncHandler from './sync.js';

  export default async function handler(req, res) {
    return syncHandler(req, res);
  }
