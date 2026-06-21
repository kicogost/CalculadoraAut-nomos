import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Serverless endpoint: extract structured invoice/receipt fields from an uploaded
 * PDF using Claude. The ANTHROPIC_API_KEY env var is required and stays
 * server-side — it is never exposed to the browser.
 *
 * Default model is claude-haiku-4-5 (cost-effective for document extraction);
 * override with EXTRACT_MODEL (e.g. claude-sonnet-4-6 or claude-opus-4-8 for
 * harder documents).
 */

const EXTRACT_TOOL = {
  name: 'record_document',
  description:
    'Record the structured fields extracted from a Spanish invoice (factura) or receipt (ticket/recibo).',
  input_schema: {
    type: 'object' as const,
    properties: {
      kind: {
        type: 'string',
        enum: ['income', 'expense'],
        description:
          'expense if this is a bill/receipt the autónomo received (a purchase); income if it is an invoice the autónomo issued to a client.',
      },
      date: { type: 'string', description: 'Issue date in YYYY-MM-DD, or empty string if unknown.' },
      counterparty: { type: 'string', description: 'Supplier name (expense) or client name (income).' },
      description: { type: 'string', description: 'Short description of the goods/services.' },
      baseAmount: { type: ['number', 'null'], description: 'Taxable base in EUR, pre-IVA.' },
      ivaRate: { type: ['number', 'null'], description: 'IVA rate as a percentage (0,4,10,21).' },
      ivaAmount: { type: ['number', 'null'], description: 'IVA amount in EUR.' },
      totalAmount: { type: ['number', 'null'], description: 'Total in EUR incl. IVA.' },
      retencionRate: { type: ['number', 'null'], description: 'IRPF retención rate as a percentage (0,7,15).' },
      currency: { type: 'string', description: 'ISO currency code, e.g. EUR.' },
      confidence: { type: 'number', description: 'Your confidence 0..1 in the extraction.' },
    },
    required: ['kind', 'date', 'counterparty', 'description', 'totalAmount', 'currency', 'confidence'],
  },
};

const PROMPT = `Extract the fields of this Spanish invoice or receipt. If a value is not present, use null (numbers) or an empty string. Amounts are in euros. Determine "kind": expense for a bill/receipt the self-employed person paid, income for an invoice they issued. Always respond by calling the record_document tool.`;

/** Max raw PDF size (bytes). Kept under Vercel's ~4.5 MB body limit after base64. */
const MAX_PDF_BYTES = 3 * 1024 * 1024;

/**
 * Only allow requests that originate from our own site (defence-in-depth against
 * casual abuse of this public endpoint — combine with a rate limit + an Anthropic
 * spend cap). Same-origin browser requests carry an Origin header matching the
 * deployment host; *.vercel.app preview deploys and an optional ALLOWED_ORIGIN
 * env var are also accepted. Requests with no Origin (e.g. curl) are rejected.
 */
function isAllowedOrigin(req: VercelRequest): boolean {
  const origin = req.headers.origin;
  const allowed = process.env.ALLOWED_ORIGIN;
  if (allowed && origin === allowed) return true;
  if (!origin) return false;
  try {
    const o = new URL(origin);
    if (o.host === req.headers.host) return true;
    if (o.hostname.endsWith('.vercel.app')) return true;
  } catch {
    return false;
  }
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!isAllowedOrigin(req)) {
    res.status(403).json({ error: 'Origen no permitido.' });
    return;
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada en el servidor.' });
    return;
  }

  const { fileBase64, mediaType } = (req.body ?? {}) as {
    fileBase64?: string;
    mediaType?: string;
  };
  if (!fileBase64) {
    res.status(400).json({ error: 'Falta el archivo (fileBase64).' });
    return;
  }
  if (mediaType !== 'application/pdf') {
    res.status(400).json({ error: 'Solo se admiten archivos PDF.' });
    return;
  }
  // base64 length × 3/4 ≈ raw byte size.
  const approxBytes = Math.floor((fileBase64.length * 3) / 4);
  if (approxBytes > MAX_PDF_BYTES) {
    res.status(413).json({ error: `El PDF supera el límite de ${MAX_PDF_BYTES / 1024 / 1024} MB.` });
    return;
  }

  const media = {
    type: 'document' as const,
    source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: fileBase64 },
  };

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: process.env.EXTRACT_MODEL || 'claude-haiku-4-5',
      max_tokens: 1024,
      tools: [EXTRACT_TOOL],
      tool_choice: { type: 'tool', name: 'record_document' },
      messages: [{ role: 'user', content: [media, { type: 'text', text: PROMPT }] }],
    });

    const block = message.content.find((b) => b.type === 'tool_use');
    if (!block || block.type !== 'tool_use') {
      res.status(502).json({ error: 'El modelo no devolvió datos estructurados.' });
      return;
    }
    res.status(200).json({ fields: block.input });
  } catch (e) {
    const err = e as { status?: number; message?: string };
    res.status(err.status ?? 500).json({ error: err.message ?? 'Error al extraer.' });
  }
}
