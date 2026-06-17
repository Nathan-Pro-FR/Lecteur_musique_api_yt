export async function handler(event, context) {
  // Récupération de la clé stockée en sécurité sur Netlify
  const API_KEY = process.env.YOUTUBE_API_KEY; 
  const PLAYLIST_ID = "PLe6uecFqdHnYTuMyPeyfZMbat1_R0V1Kz";
  
  // Requête à l'API YouTube pour récupérer jusqu'à 50 vidéos
  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${PLAYLIST_ID}&key=${API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Erreur de l'API YouTube");
    
    const data = await response.json();

    // Tri des données pour n'envoyer que l'essentiel au front-end
    const tracks = data.items.map(item => ({
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url
    }));

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" // Évite les soucis de CORS en local
      },
      body: JSON.stringify(tracks),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
