export default {
  async fetch(request) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Use POST', { status: 405, headers: corsHeaders });
    }

    try {
      const { prompt, width = 512, height = 512 } = await request.json();
      const image = await env.AI.run(
        '@cf/stabilityai/stable-diffusion-xl-base-1.0',
        {
          prompt: `${prompt}, anime, high quality, vibrant, detailed`,
          width: Math.min(width, 1024),
          height: Math.min(height, 1024),
          steps: 25,
          guidance_scale: 7.5
        }
      );
      return new Response(image, {
        headers: { ...corsHeaders, 'Content-Type': 'image/png' }
      });
    } catch (err) {
      return new Response('Error: ' + err.message, { status: 500, headers: corsHeaders });
    }
  }
};
