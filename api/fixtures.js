export default async function handler(req, res) {
  const { team, search, action, league, id } = req.query;
  let url;

  if (action === 'search') {
    url = `https://v3.football.api-sports.io/teams?search=${search}`;
  } else if (action === 'live') {
    url = `https://v3.football.api-sports.io/fixtures?live=all`;
  } else if (action === 'today') {
    const today = new Date().toISOString().split('T')[0];
    url = `https://v3.football.api-sports.io/fixtures?date=${today}`;
  } else if (action === 'standings') {
    url = `https://v3.football.api-sports.io/standings?league=${league}&season=2025`;
  } else if (action === 'upcoming') {
    url = `https://v3.football.api-sports.io/fixtures?league=${league}&next=10`;
  } else if (action === 'nextmatches') {
    url = `https://v3.football.api-sports.io/fixtures?team=${team}&next=5`;
  } else if (action === 'match') {
    url = `https://v3.football.api-sports.io/fixtures?id=${id}`;
  } else if (action === 'statistics') {
    url = `https://v3.football.api-sports.io/fixtures/statistics?fixture=${id}`;
  } else if (action === 'lineups') {
    url = `https://v3.football.api-sports.io/fixtures/lineups?fixture=${id}`;
  } else if (action === 'players') {
    url = `https://v3.football.api-sports.io/fixtures/players?fixture=${id}`;
  } else if (action === 'events') {
    url = `https://v3.football.api-sports.io/fixtures/events?fixture=${id}`;
  } else {
    url = `https://v3.football.api-sports.io/fixtures?team=${team}&last=10`;
  }

  const response = await fetch(url, {
    headers: { 'x-apisports-key': process.env.API_KEY }
  });

  const data = await response.json();
  res.status(200).json(data);
}
