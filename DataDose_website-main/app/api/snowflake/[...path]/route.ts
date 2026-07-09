/**
 * Next.js App Router — Snowflake Microservice Proxy
 * ==================================================
 * Route: /api/snowflake/[...path]
 *
 * Securely proxies ALL requests to /api/snowflake/* from the Next.js
 * frontend to the separate Snowflake microservice deployed on Railway/Render.
 *
 * Why a proxy instead of calling the microservice directly from the browser?
 *   1. Security: SNOWFLAKE_MICROSERVICE_URL is a server-only env var — never
 *      exposed to the client bundle.
 *   2. Auth: Can add JWT / session checks here before forwarding.
 *   3. CORS: The browser only talks to the Next.js origin; the microservice
 *      only needs to trust Vercel's edge IP range, not every browser.
 *
 * Required env var (server-side only — do NOT prefix with NEXT_PUBLIC_):
 *   SNOWFLAKE_MICROSERVICE_URL=https://your-service.railway.app
 *
 * Examples of routes handled:
 *   GET /api/snowflake/prescription-trends
 *       → GET https://your-service.railway.app/api/snowflake/prescription-trends
 *   GET /api/snowflake/weekly-trends
 *       → GET https://your-service.railway.app/api/snowflake/weekly-trends
 *   GET /api/snowflake/health
 *       → GET https://your-service.railway.app/health
 */

import { NextRequest, NextResponse } from 'next/server';

// Read once at cold-start — server-only, never sent to the browser
const SNOWFLAKE_MS_URL = (
  process.env.SNOWFLAKE_MICROSERVICE_URL ?? ''
).replace(/\/$/, ''); // strip trailing slash

/**
 * Generic proxy handler — works for GET, POST, and any future methods.
 */
async function proxyToSnowflake(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  if (!SNOWFLAKE_MS_URL) {
    return NextResponse.json(
      {
        error: 'SNOWFLAKE_MICROSERVICE_NOT_CONFIGURED',
        message:
          'Set the SNOWFLAKE_MICROSERVICE_URL environment variable in your ' +
          'Vercel project settings to enable Snowflake analytics.',
      },
      { status: 503 }
    );
  }

  // Build the target URL: /api/snowflake/prescription-trends → /api/snowflake/prescription-trends
  const { path } = await params;
  const targetPath = `/api/snowflake/${path.join('/')}`;
  const targetUrl  = `${SNOWFLAKE_MS_URL}${targetPath}`;

  // Forward the original request's query string (e.g., ?from=2024-01-01)
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  const fullUrl = qs ? `${targetUrl}?${qs}` : targetUrl;

  // Forward the request body for POST/PUT methods
  let body: string | undefined;
  const method = request.method.toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    try {
      body = await request.text();
    } catch {
      body = undefined;
    }
  }

  try {
    const upstream = await fetch(fullUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        // Forward the real client IP so the microservice can log it
        'X-Forwarded-For':
          request.headers.get('x-forwarded-for') ?? 'unknown',
        // Optionally pass a shared secret so the microservice can reject
        // requests that didn't come through this proxy:
        // 'X-Internal-Token': process.env.SNOWFLAKE_INTERNAL_TOKEN ?? '',
      },
      ...(body !== undefined && { body }),
      // Abort if the microservice takes longer than 30 s
      signal: AbortSignal.timeout(30_000),
    });

    const contentType = upstream.headers.get('content-type') ?? '';
    const data = contentType.includes('application/json')
      ? await upstream.json()
      : await upstream.text();

    // Mirror the microservice's HTTP status code back to the client
    if (!upstream.ok) {
      console.error(
        `[snowflake-proxy] Upstream error ${upstream.status} for ${fullUrl}:`,
        data
      );
      return NextResponse.json(
        {
          error: 'SNOWFLAKE_UPSTREAM_ERROR',
          status: upstream.status,
          detail: data,
        },
        { status: upstream.status }
      );
    }

    return NextResponse.json(data, { status: upstream.status });

  } catch (err: any) {
    const isTimeout = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    console.error('[snowflake-proxy] Fetch failed:', err?.message ?? err);

    return NextResponse.json(
      {
        error: isTimeout ? 'SNOWFLAKE_TIMEOUT' : 'SNOWFLAKE_UNREACHABLE',
        message: isTimeout
          ? 'The Snowflake microservice did not respond within 30 seconds.'
          : `Could not reach the Snowflake microservice at ${SNOWFLAKE_MS_URL}.`,
      },
      { status: 503 }
    );
  }
}

// Export named handlers so Next.js App Router wires them correctly
export const GET  = proxyToSnowflake;
export const POST = proxyToSnowflake;
