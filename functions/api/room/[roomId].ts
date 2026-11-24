// functions/api/room/[roomId].ts
// WebSocket route forwarding requests directly into Cloudflare Durable Object instance

interface Env {
  MATCH_ROOM?: any;
}

export const onRequestGet = async (context: {
  request: Request;
  params: { roomId: string };
  env: Env;
}) => {
  const { request, params, env } = context;
  const roomId = params.roomId || 'default_room';

  if (!env.MATCH_ROOM) {
    // Fallback response when Durable Objects are not bound in local dev without DO emulator
    return new Response(
      JSON.stringify({
        error: 'MATCH_ROOM Durable Object is not bound. Configure MATCH_ROOM binding in wrangler.jsonc or Cloudflare Pages settings.',
        roomId,
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Get or create unique Durable Object ID by room name
  const id = env.MATCH_ROOM.idFromName(roomId);
  const roomObj = env.MATCH_ROOM.get(id);

  // Forward the WebSocket upgrade request to the Durable Object
  return roomObj.fetch(request);
};
