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
    // Paso 1: Obtener datos del invocador
    const summonerRes = await fetch(
      `https://${region}.api.riotgames.com/tft/summoner/v1/summoners/by-name/${encodeURIComponent(username)}`,
      { headers }
    );
    if (!summonerRes.ok) throw new Error("Summoner not found");

    const summoner = await summonerRes.json();

    // Paso 2: Obtener datos de clasificatoria TFT
    const rankRes = await fetch(
      `https://${region}.api.riotgames.com/tft/league/v1/entries/by-summoner/${summoner.id}`,
      { headers }
    );
    if (!rankRes.ok) throw new Error("Rank not found");

    const entries = await rankRes.json();
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
    res.status(500).json({ error: "Internal error or player not found" });
  }
});

app.listen(PORT, () => {
  console.log(`🟢 API listening on http://localhost:${PORT}`);
});
