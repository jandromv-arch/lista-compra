/**
 * Cloudflare Worker: lee un ticket de supermercado con Google Gemini
 * y devuelve JSON estructurado. La clave de Gemini va como variable
 * de entorno GEMINI_KEY (secreta), NUNCA en la app pública.
 *
 * Despliegue (dashboard de Cloudflare):
 *  1) Workers & Pages → Create → Worker → nombre "ticket" → Deploy.
 *  2) Edit code → pega TODO este archivo → Deploy.
 *  3) Settings → Variables and Secrets → Add → GEMINI_KEY = tu clave → Deploy.
 *  4) Copia la URL (https://ticket.TUUSUARIO.workers.dev) y pégala en la app.
 */
export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return new Response('POST only', { status: 405, headers: cors });
    try {
      const { image } = await request.json();
      if (!image) return json({ error: 'no image' }, 400, cors);
      const b64 = String(image).replace(/^data:image\/\w+;base64,/, '');
      const prompt = [
        'Eres un lector de tickets de supermercado en español.',
        'Devuelve SOLO JSON válido con esta forma exacta:',
        '{"tienda":string,"fecha":"YYYY-MM-DD","total":number,"items":[{"nombre":string,"cantidad":number,"precio":number}]}',
        '- nombre: en minúsculas y legible; corrige abreviaturas obvias (p.ej. "TOMATE RAMA"→"tomate").',
        '- precio: precio total de esa línea en euros, con punto decimal.',
        '- cantidad: número de unidades o peso si aparece; si no, 1.',
        '- Ignora líneas que no sean productos (descuentos, totales, IVA, tarjeta).',
        '- Si un dato no se ve, pon null. No añadas texto fuera del JSON.'
      ].join('\n');
      const body = {
        contents: [{ parts: [ { text: prompt }, { inline_data: { mime_type: 'image/jpeg', data: b64 } } ] }],
        generationConfig: { temperature: 0, responseMimeType: 'application/json' }
      };
      const r = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + env.GEMINI_KEY,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      );
      const j = await r.json();
      const txt = (((j.candidates || [])[0] || {}).content || {}).parts;
      const out = (txt && txt[0] && txt[0].text) ? txt[0].text : '{}';
      return new Response(out, { headers: { ...cors, 'Content-Type': 'application/json' } });
    } catch (e) {
      return json({ error: String(e) }, 500, cors);
    }
  }
};
function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}
