// functions/api/leaderboard.ts
// Cloudflare Edge Global Leaderboard API

interface Env {
  DB?: any;
}

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const env = context.env;

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

    // Default Seed Top Champions
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
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};
