// api/stats.js
// Vercel Serverless Function — proxies wank.wavu.wiki for Theodrose's stats

const PLAYER_ID = '4QRqMQqTfm4G';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=60');

  try {
    const url = `https://wank.wavu.wiki/player/${PLAYER_ID}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; theodrose.com)',
        'Accept': 'text/html',
        'Accept-Encoding': 'gzip',
      },
    });

    if (!response.ok) throw new Error(`wank.wavu.wiki returned ${response.status}`);

    const html = await response.text();

    // Parse character blocks: "Raven\nμ 1542\nσ² 61\n944 games"
    const characters = [];
    const skipNames = new Set(['Leaderboard','Unqualified','Provisional','Ratings','Theodrose','All characters','America','steam']);
    const charRe = /([A-Za-z][A-Za-z\s]{1,18}?)\s*\nμ\s+([\d.]+)\s*\nσ²\s+([\d.]+)\s*\n([\d,]+)\s+games/g;
    let m;
    while ((m = charRe.exec(html)) !== null) {
      const name = m[1].trim();
      if (skipNames.has(name)) continue;
      characters.push({ name, mu: Math.round(parseFloat(m[2])), sigma2: parseFloat(m[3]), games: parseInt(m[4].replace(/,/g,''),10) });
    }

    // Parse match rows
    const matches = [];
    const rowRe = /(\d{1,2} \w+ \d{2}) [\d:]+\s*\|\s*Theodrose (\S+) (\d{3,4}) ([+\-]\d+)\s*\|\s*(\d+)-(\d+)\s*\|\s*\d{3,4} [+\-]\d+ ([\w][\w\s\-'!.+\/|*?]*?)\s*\[([^\]]+)\]/g;
    while ((m = rowRe.exec(html)) !== null && matches.length < 12) {
      const myScore = parseInt(m[5],10), oppScore = parseInt(m[6],10);
      matches.push({ date:m[1], myChar:m[2].trim(), myRating:parseInt(m[3],10), myDelta:parseInt(m[4],10), myScore, oppScore, oppChar:m[7].trim(), oppName:m[8].trim(), won:myScore>oppScore });
    }

    const totalGames = characters.reduce((s,c)=>s+c.games,0);
    const wins = matches.filter(x=>x.won).length;
    const losses = matches.filter(x=>!x.won).length;
    const bestRating = characters.reduce((b,c)=>Math.max(b,c.mu),0);
    const mainChar = [...characters].sort((a,b)=>b.games-a.games)[0];

    return res.status(200).json({
      ok:true, playerName:'Theodrose', playerId:PLAYER_ID,
      characters: characters.sort((a,b)=>b.mu-a.mu),
      matches,
      summary:{ totalGames, recentWins:wins, recentLosses:losses, bestRating, mainChar:mainChar?.name??'Raven', mainCharGames:mainChar?.games??0 },
    });
  } catch(err) {
    console.error('[stats]',err.message);
    return res.status(500).json({ ok:false, error:err.message });
  }
}