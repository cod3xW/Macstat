export default async function handler(req, res) {
  const { team, search, action } = req.query;

  let url;
  if (action === 'search') {
    url = `https://v3.football.api-sports.io/teams?search=${search}`;
  } else {
    url = `https://v3.football.api-sports.io/fixtures?team=${team}&last=10`;
  }

  const response = await fetch(url, {
    headers: { 'x-apisports-key': process.env.API_KEY }
  });

  const data = await response.json();
  res.status(200).json(data);
}
