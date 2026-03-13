// api/stats.js — Vercel serverless proxy for wank.wavu.wiki
// Searches for player by name, returns their stats as JSON

export default async function handler(req, res) {
  // Allow CORS from your own domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate'); // cache 5 min

  const { player = 'Theodrose' } = req.query;

  try {
    // Step 1: Search for the player to get their internal ID
    const searchUrl = `https://wank.wavu.wiki/search?q=${encodeURIComponent(player)}&_format=json`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        'Accept-Encoding': 'gzip, deflate, br',
        'User-Agent': 'theodrose.com/1.0',
      },
    });

    if (!searchRes.ok) {
      return res.status(502).json({ error: 'Failed to reach wank.wavu.wiki', status: searchRes.status });
    }

    const searchData = await searchRes.json();

    // The search returns an array of player objects
    if (!searchData || searchData.length === 0) {
      return res.status(404).json({ error: 'Player not found', player });
    }

    // Find the closest name match (case-insensitive)
    const match = searchData.find(
      (p) => p.name?.toLowerCase() === player.toLowerCase()
    ) || searchData[0];

    if (!match?.id) {
      return res.status(404).json({ error: 'No player ID found', raw: searchData });
    }

    // Step 2: Fetch the player's full profile
    const profileUrl = `https://wank.wavu.wiki/player/${match.id}?_format=json`;
    const profileRes = await fetch(profileUrl, {
      headers: {
        'Accept-Encoding': 'gzip, deflate, br',
        'User-Agent': 'theodrose.com/1.0',
      },
    });

    if (!profileRes.ok) {
      return res.status(502).json({ error: 'Failed to fetch player profile', status: profileRes.status });
    }

    const profileData = await profileRes.json();

    // Return merged data
    return res.status(200).json({
      id: match.id,
      name: match.name || player,
      profile: profileData,
    });

  } catch (err) {
    console.error('Stats proxy error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
