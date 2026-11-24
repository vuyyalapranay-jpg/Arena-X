// functions/api/rooms.ts
// Cloudflare Edge Room Discovery & Listing API

interface Env {
  MATCH_ROOM?: any;
}

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  // Returns public waiting rooms
  const rooms = [
    {
      id: 'room_quick_1',
      code: 'AX1001',
      name: 'Championship Qualifier',
      hostName: 'Blade_Ronin',
      visibility: 'PUBLIC',
      hasPassword: false,
      status: 'WAITING',
      playerCount: 1,
      maxPlayers: 2,
      stage: 'ANCIENT_TEMPLE',
      createdAt: Date.now() - 45000,
    },
    {
      id: 'room_quick_2',
      code: 'AX1002',
      name: 'Cyberpunk Rooftop 1v1',
      hostName: 'Kai_Protagonist',
      visibility: 'PUBLIC',
      hasPassword: false,
      status: 'WAITING',
      playerCount: 1,
      maxPlayers: 2,
      stage: 'NEON_CITY_ROOFTOP',
      createdAt: Date.now() - 20000,
    },
  ];

  return new Response(JSON.stringify(rooms), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
