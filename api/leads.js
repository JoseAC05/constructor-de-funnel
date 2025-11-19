// /api/leads.js
export default async function handler(req, res) {
  // Habilitar CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      const leadData = req.body;
      
      console.log('✅ Lead recibido:', leadData);

      // Aquí puedes:
      // 1. Guardar en una BD (MongoDB Atlas gratis, Supabase, etc)
      // 2. Enviar email
      // 3. Guardar en un archivo JSON
      // 4. Integrar con Zapier/Make.com

      return res.status(201).json({
        success: true,
        leadId: Date.now(),
        message: 'Lead recibido exitosamente'
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message
      });
    }
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      message: 'API funcionando correctamente'
    });
  }

  res.status(405).json({ error: 'Método no permitido' });
}
