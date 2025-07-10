import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const RIOT_API_KEY = process.env.RIOT_API_KEY;

if (!RIOT_API_KEY) {
  console.error("❌ RIOT_API_KEY no definida");
  process.exit(1);
}

app.get("/rank/hyperroll/:puuid", async (req, res) => {
  const { puuid } = req.params;

  try {
    const url = `https://la1.api.riotgames.com/tft/league/v1/by-puuid/${puuid}`;
    const response = await fetch(url, {
      headers: { "X-Riot-Token": RIOT_API_KEY }
    });

    if (!response.ok) {
      if (response.status === 404) return res.status(404).json({ error: "PUUID no encontrado" });
      if (response.status === 401 || response.status === 403) return res.status(response.status).json({ error: "Error de autorización con API Key" });
      return res.status(response.status).json({ error: "Error al consultar Riot API" });
    }

    const leagues = await response.json();

    const hyperRoll = leagues.find(l => l.queueType === "RANKED_TFT_TURBO");

    if (!hyperRoll) return res.json({ message: "No tiene rango Hyper Roll" });

    return res.json({
      tier: hyperRoll.ratedTier,
      rating: hyperRoll.ratedRating,
      wins: hyperRoll.wins,
      losses: hyperRoll.losses
    });

  } catch (error) {
    console.error("Error en API:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
