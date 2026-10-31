// Shared helpers for the API routes (files starting with "_" are not exposed as routes)

function checkAccess(req, res) {
  const required = process.env.ACCESS_CODE;
  if (required && req.headers['x-access-code'] !== required) {
    res.status(401).json({ error: 'Access code required or incorrect.' });
    return false;
  }
  if (!process.env.GROQ_API_KEY) {
    res.status(500).json({ error: 'GROQ_API_KEY is not set on the server. Add it in Vercel → Settings → Environment Variables, then redeploy.' });
    return false;
  }
  return true;
}

async function readBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body, 'binary');
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}

module.exports = { checkAccess, readBody };
