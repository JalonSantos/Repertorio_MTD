import axios from "axios";
import cheerio from "cheerio";

export default async function handler(req, res) {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: "Missing query" });
  }

  try {
    const searchRes = await axios.get(
      `https://genius.com/api/search/multi?per_page=5&q=${encodeURIComponent(q)}`
    );

    const hits = searchRes.data.response.sections[0].hits;

    if (!hits.length) {
      return res.json({ lyrics: null });
    }

    const songUrl = hits[0].result.url;

    const page = await axios.get(songUrl);
    const $ = cheerio.load(page.data);

    let lyrics = "";

    $('[data-lyrics-container="true"]').each((i, el) => {
      lyrics += $(el).text() + "\n\n";
    });

    lyrics = lyrics.trim();

    return res.json({ lyrics });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar letra" });
  }
}
