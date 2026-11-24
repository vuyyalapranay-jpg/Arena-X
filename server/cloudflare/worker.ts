// server/cloudflare/worker.ts
// Unified Cloudflare Worker with Workers Static Assets, D1 Database, and Durable Objects WebSocket Rooms

import { MatchRoomDO } from './MatchRoomDO';

export { MatchRoomDO };

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  DB: any;
  MATCH_ROOM: any;
  ENVIRONMENT?: string;
  GAME_TITLE?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // 1. API ROUTES
    if (url.pathname === '/api/health') {
      return new Response(
        JSON.stringify(
          {
            status: 'ONLINE',
            game: 'ARENA X',
            version: '0.1.0',
            runtime: 'Cloudflare Workers (Unified Platform)',
            edge: {
              colo: (request as any).cf?.colo || 'GLOBAL',
              country: (request as any).cf?.country || 'GLOBAL',
              protocol: request.headers.get('x-forwarded-proto') || 'https',
            },
            services: {
              workers: 'HEALTHY',
              static_assets: env.ASSETS ? 'BOUND' : 'FALLBACK',
              d1_database: env.DB ? 'BOUND' : 'OFFLINE',
              durable_objects: env.MATCH_ROOM ? 'BOUND' : 'OFFLINE',
            },
            timestamp: Date.now(),
          },
          null,
          2
        ),
        {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    if (url.pathname === '/api/leaderboard') {
      try {
        if (env.DB) {
          const { results } = await env.DB.prepare(
            'SELECT id, username, display_name, level, rank_tier, elo_rating, matches_played, matches_won FROM players ORDER BY elo_rating DESC LIMIT 20'
          ).all();

          if (results && results.length > 0) {
            return new Response(JSON.stringify({ success: true, leaderboard: results }), {
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=60, s-maxage=120',
                'Access-Control-Allow-Origin': '*',
              },
            });
          }
        }
      } catch (err: any) {
        console.error('Leaderboard query error:', err);
      }

      const defaultLeaderboard = [
        { id: '1', username: 'blade_ronin', display_name: 'Master Ronin', level: 15, rank_tier: 'DIAMOND', elo_rating: 1740, matches_played: 65, matches_won: 52 },
        { id: '2', username: 'iron_titan', display_name: 'Titan Colossus', level: 14, rank_tier: 'DIAMOND', elo_rating: 1690, matches_played: 58, matches_won: 44 },
        { id: '3', username: 'shadow_striker', display_name: 'Shadow Assassin', level: 12, rank_tier: 'PLATINUM', elo_rating: 1580, matches_played: 48, matches_won: 36 },
        { id: '4', username: 'kai_master', display_name: 'Kai Protagonist', level: 10, rank_tier: 'GOLD', elo_rating: 1420, matches_played: 32, matches_won: 24 },
        { id: '5', username: 'cryo_queen', display_name: 'Frost Vanguard', level: 9, rank_tier: 'SILVER', elo_rating: 1310, matches_played: 22, matches_won: 14 },
      ];

      return new Response(JSON.stringify({ success: true, leaderboard: defaultLeaderboard }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60, s-maxage=120',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (url.pathname === '/api/profile') {
      const userId = url.searchParams.get('id') || 'player_default';
      try {
        if (env.DB) {
          const result = await env.DB.prepare(
            'SELECT * FROM players WHERE id = ? OR username = ? LIMIT 1'
          ).bind(userId, userId).first();

          if (result) {
            return new Response(JSON.stringify({ success: true, profile: result }), {
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
          }
        }
      } catch (err: any) {
        console.error('Profile fetch error:', err);
      }

      const fallback = {
        id: userId,
        username: 'Arena_Warrior',
        display_name: 'Kai Protagonist',
        level: 1,
        xp: 0,
        rank_tier: 'BRONZE',
        elo_rating: 1000,
        ax_coins: 500,
        matches_played: 0,
        matches_won: 0,
        created_at: Date.now(),
        last_active: Date.now(),
      };

      return new Response(JSON.stringify({ success: true, profile: fallback }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (url.pathname === '/api/rooms') {
      const sampleRooms = [
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

      return new Response(JSON.stringify(sampleRooms), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // WebSocket 1v1 Match Room upgrade
    if (url.pathname.startsWith('/api/room/')) {
      const roomId = url.pathname.replace('/api/room/', '') || 'default_room';
      if (!env.MATCH_ROOM) {
        return new Response(
          JSON.stringify({ error: 'MATCH_ROOM Durable Object is not configured.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      }
      const doId = env.MATCH_ROOM.idFromName(roomId);
      const roomStub = env.MATCH_ROOM.get(doId);
      return roomStub.fetch(request);
    }

    // 2. STATIC ASSETS (Frontend Vite/Phaser 3 Game Client)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('ARENA X Cloudflare Worker is active. Build and deploy static assets to view the game.', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  },
};
