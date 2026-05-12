import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pat = process.env.VITE_AIRTABLE_PAT || process.env.AIRTABLE_PAT;
  const baseId = process.env.VITE_AIRTABLE_BASE_ID || process.env.AIRTABLE_BASE_ID;

  if (!pat || !baseId) {
    return res.status(500).json({ error: "Airtable configuration missing on server. Please add AIRTABLE_PAT and AIRTABLE_BASE_ID to Vercel environment variables." });
  }

  // Extract the path after /api/airtable/
  // The request usually comes as /api/airtable/TableName/id
  // We need to strip /api/airtable/
  const fullPath = req.url || '';
  const subPath = fullPath.replace(/^\/api\/airtable\//, '').split('?')[0];
  const query = fullPath.includes('?') ? '?' + fullPath.split('?')[1] : '';
  
  const url = `https://api.airtable.com/v0/${baseId}/${subPath}${query}`;

  console.log(`[Vercel Proxy] ${req.method} ${subPath}`);

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        "Authorization": `Bearer ${pat}`,
        "Content-Type": "application/json",
      },
      body: ["POST", "PATCH", "PUT"].includes(req.method || '') ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    console.error("Airtable Proxy Error:", error);
    res.status(500).json({ error: error.message });
  }
}
