export default async function handler(req, res) {
  const { team } = req.query;
  
  const response = await fetch(
    `https://v3.football.api-sports.io/fixtures?team=${team}&last=10`,
    {
      headers: {
        'x-apisports-key': process.env.API_KEY
      }
    }
  );
  
  const data = await response.json();
  res.status(200).json(data);
}
