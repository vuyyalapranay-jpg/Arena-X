// functions/api/profile.ts
// Cloudflare Edge Player Profile & Progression API

interface Env {
  DB?: any;
}

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const url = new URL(context.request.url);
  const userId = url.searchParams.get('id') || 'player_default';
  const env = context.env;

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

    // Graceful fallback profile for guest players
    const fallbackProfile = {
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

    return new Response(JSON.stringify({ success: true, profile: fallbackProfile }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const env = context.env;
  try {
    const body: any = await context.request.json();
    const { id, xpEarned = 0, coinsEarned = 0, won = false } = body;

    if (env.DB && id) {
      await env.DB.prepare(`
        UPDATE players 
        SET xp = xp + ?, ax_coins = ax_coins + ?, 
            matches_played = matches_played + 1,
            matches_won = matches_won + ?,
            last_active = ?
        WHERE id = ?
      `).bind(xpEarned, coinsEarned, won ? 1 : 0, Date.now(), id).run();

      return new Response(JSON.stringify({ success: true, message: 'Profile updated' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(JSON.stringify({ success: true, simulated: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};
