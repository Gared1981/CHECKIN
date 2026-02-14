import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ConfirmacionData {
  vendedor: string;
  ruta: string;
  email: string;
  tipo: 'entrada' | 'salida';
  hora: string;
  lugar: string;
  notas: string;
  latitud?: number | null;
  longitud?: number | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const data: ConfirmacionData = await req.json();

    const tipoTexto = data.tipo === 'entrada' ? 'Check-In' : 'Check-Out';
    const tipoEmoji = data.tipo === 'entrada' ? '🟢' : '🔵';

    const emailHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, ${data.tipo === 'entrada' ? '#4CAF50' : '#2196F3'} 0%, ${data.tipo === 'entrada' ? '#45a049' : '#1976D2'} 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
            .success-box { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 15px 0; border-radius: 4px; }
            .info-table { width: 100%; border-collapse: collapse; margin: 15px 0; background: white; }
            .info-table td { padding: 10px; border-bottom: 1px solid #eee; }
            .info-table td:first-child { font-weight: bold; width: 40%; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${tipoEmoji} ${tipoTexto} Registrado Exitosamente</h1>
            </div>
            <div class="content">
              <div class="success-box">
                <strong>Tu ${tipoTexto.toLowerCase()} ha sido registrado correctamente en el sistema</strong>
              </div>

              <table class="info-table">
                <tr>
                  <td>Vendedor:</td>
                  <td>${data.vendedor}</td>
                </tr>
                <tr>
                  <td>Ruta:</td>
                  <td>${data.ruta}</td>
                </tr>
                <tr>
                  <td>Hora de ${tipoTexto}:</td>
                  <td><strong>${data.hora}</strong></td>
                </tr>
                <tr>
                  <td>Lugar de Hospedaje:</td>
                  <td>${data.lugar}</td>
                </tr>
                ${data.notas ? `
                <tr>
                  <td>Notas:</td>
                  <td>${data.notas}</td>
                </tr>
                ` : ''}
                ${data.latitud && data.longitud ? `
                <tr>
                  <td>Ubicación GPS:</td>
                  <td>${data.latitud.toFixed(6)}, ${data.longitud.toFixed(6)}</td>
                </tr>
                ` : ''}
              </table>

              <p style="margin-top: 20px; padding: 15px; background: white; border-radius: 4px;">
                ${data.tipo === 'entrada'
                  ? '<strong>Gracias por registrar tu entrada.</strong> Recuerda hacer check-out al finalizar tu jornada.'
                  : '<strong>Gracias por registrar tu salida.</strong> Que tengas un excelente día.'}
              </p>

              <div class="footer">
                <p>Sistema de Check-In Terrapesca</p>
                <p>Este es un correo automático de confirmación</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailText = `
${tipoTexto.toUpperCase()} REGISTRADO EXITOSAMENTE

Tu ${tipoTexto.toLowerCase()} ha sido registrado correctamente en el sistema

Vendedor: ${data.vendedor}
Ruta: ${data.ruta}
Hora de ${tipoTexto}: ${data.hora}
Lugar de Hospedaje: ${data.lugar}
${data.notas ? `Notas: ${data.notas}` : ''}
${data.latitud && data.longitud ? `Ubicación GPS: ${data.latitud.toFixed(6)}, ${data.longitud.toFixed(6)}` : ''}

${data.tipo === 'entrada'
  ? 'Gracias por registrar tu entrada. Recuerda hacer check-out al finalizar tu jornada.'
  : 'Gracias por registrar tu salida. Que tengas un excelente día.'}

---
Sistema de Check-In Terrapesca
Este es un correo automático de confirmación
    `;

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!RESEND_API_KEY) {
      console.log('RESEND_API_KEY no configurada, registro guardado sin confirmación por correo');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Registro guardado (confirmación por correo deshabilitada)'
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Terrapesca Check-In <notificaciones@terrapesca.com>',
        to: [data.email],
        cc: ['earmenta@terrapesca.com', 'administracion@terrapesca.com'],
        subject: `${tipoEmoji} ${tipoTexto} Confirmado - ${data.vendedor}`,
        html: emailHTML,
        text: emailText,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error('Error al enviar correo:', errorData);
      throw new Error(`Error al enviar correo: ${emailResponse.statusText}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Confirmación enviada correctamente'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error en confirmar-registro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
