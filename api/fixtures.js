export default async function handler(req, res) {
  const { team, season } = req.query;
  
  const response = await fetch(
    `https://v3.football.api-sports.io/fixtures?team=${team}&season=${season || 2024}`,
    {
      headers: {
        'x-apisports-key': process.env.API_KEY
      }
    }
  );
  
  const data = await response.json();
  res.status(200).json(data);
}
