import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const RIOT_API_KEY = process.env.RIOT_API_KEY;

app.get("/rank/:region/:username", async (req, res) => {
  const { region, username } = req.params;
  const headers = { "X-Riot-Token": RIOT_API_KEY };

  try {
    // 1) Obtener datos del invocador (Summoner) por nombre
    const summonerRes = await fetch(
      `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(username)}`,
      { headers }
    );
    if (!summonerRes.ok) {
      if (summonerRes.status === 404) return res.status(404).json({ error: "Summoner not found" });
      throw new Error(`Error fetching summoner: ${summonerRes.status}`);
    }
    const summoner = await summonerRes.json();

    // 2) Obtener datos de rango TFT por summoner id
    const rankRes = await fetch(
      `https://${region}.api.riotgames.com/tft/league/v1/entries/by-summoner/${summoner.id}`,
      { headers }
    );
    if (!rankRes.ok) {
      if (rankRes.status === 404) return res.status(404).json({ error: "Rank not found" });
      throw new Error(`Error fetching rank: ${rankRes.status}`);
    }
    const entries = await rankRes.json();

    // Buscar la cola TFT clasificatoria
    const tftRank = entries.find(e => e.queueType === "RANKED_TFT");
    if (!tftRank) return res.status(404).json({ error: "No TFT rank found" });

    res.json({
      summoner: summoner.name,
      tier: tftRank.tier,
      rank: tftRank.rank,
      lp: tftRank.leaguePoints
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
