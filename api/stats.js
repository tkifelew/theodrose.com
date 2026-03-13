// api/stats.js — fetches Theodrose's real wank.wavu.wiki data
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate');

  const PLAYER_ID = '4QRqMQqTfm4G';
  const url = `https://wank.wavu.wiki/player/${PLAYER_ID}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Encoding': 'gzip, deflate, br',
        'User-Agent': 'Mozilla/5.0 (compatible; theodrose.com/1.0)',
      },
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'Failed to reach wank.wavu.wiki', status: response.status });
    }

    const html = await response.text();

    // ── Parse character ratings ──────────────────────────────────
    const characters = [];
    const charBlockRegex = /([A-Za-z][A-Za-z\s\-]{1,20}?)\s*\nμ\s+([\d.]+)\s*\nσ²\s+([\d.]+)\s*\n([\d,]+)\s+games/g;
    let m;
    const skip = new Set(['Leaderboard','Unqualified','Provisional','Ratings','Theodrose','All characters','America']);
    while ((m = charBlockRegex.exec(html)) !== null) {
      const name = m[1].trim();
      if (skip.has(name)) continue;
      characters.push({
        name,
        mu: parseFloat(m[2]),
        sigma2: parseFloat(m[3]),
        games: parseInt(m[4].replace(/,/g, ''), 10),
      });
    }

    // ── Parse match rows from table ──────────────────────────────
    // Row format: "13 Mar 26 3:04 | Theodrose Raven 1550 -8 | 1-3 | 1648 +7 Victor Exodus803 | h2h"
    const matches = [];
    const rowRe = /(\d{1,2}\s+\w+\s+\d{2})\s+[\d:]+\s*\|\s*Theodrose\s+(\S+(?:\s+\S+)?)\s+(\d{3,4})\s+([+\-]\d+)\s*\|\s*(\d+)-(\d+)\s*\|\s*(\d{3,4})\s+([+\-]\d+)\s+([\w][^|[]+?)\s+\[([^\]]+)\]/g;
    while ((m = rowRe.exec(html)) !== null) {
      const myScore  = parseInt(m[5], 10);
      const oppScore = parseInt(m[6], 10);
      matches.push({
        date:      m[1].trim(),
        myChar:    m[2].trim(),
        myRating:  parseInt(m[3], 10),
        myDelta:   parseInt(m[4], 10),
        myScore,
        oppScore,
        oppRating: parseInt(m[7], 10),
        oppDelta:  parseInt(m[8], 10),
        oppChar:   m[9].trim(),
        oppName:   m[10].trim(),
        won:       myScore > oppScore,
      });
      if (matches.length >= 15) break;
    }

    // ── Summary ──────────────────────────────────────────────────
    const totalGames = characters.reduce((s, c) => s + c.games, 0);
    const wins       = matches.filter(x => x.won).length;
    const losses     = matches.filter(x => !x.won).length;
    const winRate    = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : null;
    const bestRating = characters.reduce((b, c) => Math.max(b, c.mu), 0);
    const mainChar   = [...characters].sort((a, b) => b.games - a.games)[0];

    return res.status(200).json({
      playerName: 'Theodrose',
      playerId: PLAYER_ID,
      characters: characters.sort((a, b) => b.mu - a.mu),
      matches,
      summary: {
        totalGames,
        winRate,
        recentWins: wins,
        recentLosses: losses,
        bestRating: Math.round(bestRating),
        mainChar: mainChar?.name ?? 'Raven',
        mainCharGames: mainChar?.games ?? 0,
      },
    });

  } catch (err) {
    console.error('Stats error:', err);
    return res.status(500).json({ error: err.message });
  }
}