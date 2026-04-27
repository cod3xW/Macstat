export default async function handler(req, res) {
  const { team } = req.query;
  
  const response = await fetch(
    `https://api.football-data.org/v4/teams/${team}/matches?limit=10&status=FINISHED`,
    {
      headers: {
        'X-Auth-Token': process.env.API_KEY
      }
    }
  );
  
  const data = await response.json();
  res.status(200).json(data);
}
