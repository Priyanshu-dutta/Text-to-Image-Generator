export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt } = request.body || {};
  if (!prompt) {
    return response.status(400).json({ error: 'No prompt provided' });
  }

  try {
    const hfResponse = await fetch(
      "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0",
      {
        headers: {
          "Authorization": `Bearer ${process.env.VITE_HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ inputs: prompt.trim() }),
      }
    );

    if (!hfResponse.ok) {
      // Forward the error from Hugging Face if possible
      let errorMessage = 'Hugging Face API returned an error';
      try {
        const hfError = await hfResponse.json();
        errorMessage = hfError.error || errorMessage;
      } catch (e) {
        errorMessage = await hfResponse.text() || errorMessage;
      }
      return response.status(hfResponse.status).json({ error: errorMessage });
    }

    // Convert the image response to a Buffer and pipe to client
    const arrayBuffer = await hfResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    response.setHeader('Content-Type', 'image/jpeg');
    return response.status(200).send(buffer);
  } catch (err) {
    console.error("Server error:", err);
    return response.status(500).json({ error: "Failed to generate image on the server. Please try again later." });
  }
}
