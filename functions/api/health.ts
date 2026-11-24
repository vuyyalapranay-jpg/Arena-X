// functions/api/health.ts
// Cloudflare Edge Health & Diagnostic API

interface Env {
  DB?: any;
  MATCH_ROOM?: any;
}

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  const responsePayload = {
    status: 'ONLINE',
    game: 'ARENA X',
    version: '0.1.0',
    platform: 'Cloudflare Ecosystem (Free Tier)',
    edge: {
      colo: (request as any).cf?.colo || 'LOCAL_DEV',
      country: (request as any).cf?.country || 'GLOBAL',
      protocol: request.headers.get('x-forwarded-proto') || 'https',
    },
    services: {
      pages: 'HEALTHY',
      workers: 'HEALTHY',
      d1_database: env.DB ? 'BOUND' : 'STANDALONE_FALLBACK',
      durable_objects: env.MATCH_ROOM ? 'BOUND' : 'STANDALONE_FALLBACK',
    },
    timestamp: Date.now(),
  };

  return new Response(JSON.stringify(responsePayload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
