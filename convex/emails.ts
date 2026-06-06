import { internalAction } from "./_generated/server";
import { v } from "convex/values";

const BRAND = "#c8a96e"; // dorado NOSTERRA
const DARK = "#0f0f0d";

function layout(title: string, bodyHtml: string) {
  return `<!doctype html><html><body style="margin:0;background:#f5f0e8;font-family:Helvetica,Arial,sans-serif;color:#2a2a26">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px">
    <div style="background:${DARK};border-radius:16px 16px 0 0;padding:28px 28px 22px;text-align:center">
      <div style="font-size:26px;letter-spacing:6px;color:#f5f0e8;font-weight:300">NOSTERRA</div>
      <div style="font-size:10px;letter-spacing:5px;color:${BRAND};text-transform:uppercase;margin-top:2px">Mezcal</div>
    </div>
    <div style="background:#fff;border:1px solid #e8e0d0;border-top:none;border-radius:0 0 16px 16px;padding:32px 28px">
      <h1 style="font-size:22px;margin:0 0 16px;color:${DARK};font-weight:600">${title}</h1>
      ${bodyHtml}
      <hr style="border:none;border-top:1px solid #eee;margin:28px 0 16px" />
      <p style="font-size:12px;color:#9a9486;margin:0;line-height:1.6">
        Casa Jiménez Elixirs &amp; Spirits · Santiago Matatlán, Oaxaca, México<br/>
        El abuso en el consumo de este producto es nocivo para la salud.
      </p>
    </div>
  </div></body></html>`;
}

function pendingEmail(name: string) {
  const first = name.split(" ")[0] || "embajador";
  return {
    subject: "Recibimos tu solicitud · Embajador NOSTERRA",
    html: layout(
      `¡Hola, ${first}!`,
      `<p style="font-size:15px;line-height:1.7;color:#3a3a34;margin:0 0 14px">
        Gracias por querer ser <strong>Embajador de NOSTERRA</strong>. Recibimos tu solicitud
        y nuestro equipo la está revisando.
      </p>
      <p style="font-size:15px;line-height:1.7;color:#3a3a34;margin:0 0 14px">
        En cuanto sea aprobada, te enviaremos un correo de confirmación y tu cuenta quedará
        <strong>lista para vender</strong>. Normalmente respondemos en poco tiempo.
      </p>
      <p style="font-size:14px;line-height:1.7;color:#6a6458;margin:0">
        Mientras tanto, guarda el <strong>PIN</strong> que recibiste al registrarte: lo
        necesitarás para entrar a tu panel de embajador.
      </p>`
    ),
  };
}

function approvedEmail(name: string, code: string) {
  const first = name.split(" ")[0] || "embajador";
  return {
    subject: "¡Tu cuenta de Embajador está aprobada! · NOSTERRA",
    html: layout(
      `¡Felicidades, ${first}!`,
      `<p style="font-size:15px;line-height:1.7;color:#3a3a34;margin:0 0 14px">
        Tu cuenta de <strong>Embajador de NOSTERRA</strong> ha sido <strong>aprobada</strong> y
        ya está lista para vender. 🎉
      </p>
      <div style="text-align:center;margin:22px 0">
        <div style="font-size:11px;letter-spacing:2px;color:#9a9486;text-transform:uppercase">Tu código de embajador</div>
        <div style="display:inline-block;margin-top:8px;padding:12px 26px;border:1px solid ${BRAND};border-radius:10px;font-size:24px;letter-spacing:6px;color:${DARK};font-weight:700">${code}</div>
      </div>
      <p style="font-size:15px;line-height:1.7;color:#3a3a34;margin:0 0 14px">
        Compártelo con tus clientes: ellos reciben un descuento al comprar y tú ganas comisión
        por cada venta. Entra a tu panel con tu correo y PIN para ver tus comisiones y redimirlas.
      </p>
      <div style="text-align:center;margin:24px 0 6px">
        <a href="https://www.nosterramezcal.com/embajadores" style="display:inline-block;background:${BRAND};color:${DARK};text-decoration:none;padding:13px 30px;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:1px">Ir a mi panel</a>
      </div>`
    ),
  };
}

export const sendAmbassadorEmail = internalAction({
  args: {
    to: v.string(),
    name: v.string(),
    type: v.union(v.literal("pending"), v.literal("approved")),
    code: v.optional(v.string()),
  },
  handler: async (_ctx, { to, name, type, code }) => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM || "NOSTERRA <onboarding@resend.dev>";
    if (!apiKey) {
      console.warn("RESEND_API_KEY no configurada — se omite el envío de correo.");
      return { ok: false, skipped: true };
    }

    const tpl = type === "pending" ? pendingEmail(name) : approvedEmail(name, code ?? "");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject: tpl.subject, html: tpl.html }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("Error al enviar correo:", res.status, detail);
      return { ok: false, error: detail };
    }
    return { ok: true };
  },
});
