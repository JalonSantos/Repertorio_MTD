export default async function handler(req, res) {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: "Parâmetro 'q' é obrigatório" });
  }

  try {
    const response = await fetch(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(q.split(" - ")[0])}/${encodeURIComponent(q.split(" - ")[1] || "")}`
    );

    if (!response.ok) {
      return res.status(404).json({ error: "Letra não encontrada" });
    }

    const data = await response.json();

    res.status(200).json({ lyrics: data.lyrics });
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar letra" });
  }
}
