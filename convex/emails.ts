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

function orderConfirmationEmail(
  customerName: string,
  orderNumber: string,
  items: { name: string; qty: number; price: number }[],
  subtotal: number,
  shipping: number,
  discount: number,
  total: number,
  address: { calle: string; numero: string; colonia: string; cp: string; ciudad: string; estado: string }
) {
  const first = customerName.split(" ")[0] || "cliente";
  const itemsHtml = items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 0;color:#3a3a34;font-size:14px">${i.name}</td>
          <td style="padding:8px 0;color:#3a3a34;font-size:14px;text-align:center">×${i.qty}</td>
          <td style="padding:8px 0;color:#3a3a34;font-size:14px;text-align:right">$${(i.price * i.qty).toLocaleString("es-MX")}</td>
        </tr>`
    )
    .join("");

  return {
    subject: `Pedido confirmado ${orderNumber} · NOSTERRA Mezcal`,
    html: layout(
      `¡Gracias por tu pedido, ${first}!`,
      `<p style="font-size:15px;line-height:1.7;color:#3a3a34;margin:0 0 20px">
        Tu pago fue aprobado y tu pedido <strong>${orderNumber}</strong> está confirmado.
        Nuestro equipo lo preparará y te notificaremos cuando sea enviado.
      </p>

      <div style="background:#f9f7f4;border-radius:10px;padding:18px 20px;margin-bottom:20px">
        <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#9a9486;margin:0 0 12px">Resumen de tu pedido</p>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="border-bottom:1px solid #e8e0d0">
              <th style="padding:6px 0;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#9a9486;text-align:left;font-weight:400">Producto</th>
              <th style="padding:6px 0;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#9a9486;text-align:center;font-weight:400">Cant.</th>
              <th style="padding:6px 0;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#9a9486;text-align:right;font-weight:400">Total</th>
            </tr>
          </thead>
          <tbody style="border-bottom:1px solid #e8e0d0">${itemsHtml}</tbody>
        </table>
        <table style="width:100%;margin-top:12px">
          <tr><td style="font-size:13px;color:#6a6458;padding:3px 0">Subtotal</td><td style="font-size:13px;color:#6a6458;text-align:right">$${subtotal.toLocaleString("es-MX")}</td></tr>
          <tr><td style="font-size:13px;color:#6a6458;padding:3px 0">Envío</td><td style="font-size:13px;color:#6a6458;text-align:right">${shipping === 0 ? "Gratis" : "$" + shipping.toLocaleString("es-MX")}</td></tr>
          ${discount > 0 ? `<tr><td style="font-size:13px;color:#2d7a2d;padding:3px 0">Descuento</td><td style="font-size:13px;color:#2d7a2d;text-align:right">-$${discount.toLocaleString("es-MX")}</td></tr>` : ""}
          <tr style="border-top:1px solid #e8e0d0">
            <td style="font-size:16px;font-weight:700;color:${DARK};padding:8px 0 0">Total pagado</td>
            <td style="font-size:16px;font-weight:700;color:${DARK};text-align:right;padding:8px 0 0">$${total.toLocaleString("es-MX")} MXN</td>
          </tr>
        </table>
      </div>

      <div style="background:#f9f7f4;border-radius:10px;padding:18px 20px;margin-bottom:20px">
        <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#9a9486;margin:0 0 8px">Dirección de entrega</p>
        <p style="font-size:14px;color:#3a3a34;margin:0;line-height:1.7">
          ${address.calle} ${address.numero}, ${address.colonia}<br/>
          C.P. ${address.cp}, ${address.ciudad}, ${address.estado}
        </p>
      </div>

      <p style="font-size:14px;line-height:1.7;color:#6a6458;margin:0 0 6px">
        El tiempo estimado de entrega es de <strong>3 a 5 días hábiles</strong>.
        Si tienes alguna duda escríbenos a
        <a href="mailto:hola@nosterramezcal.com" style="color:${BRAND}">hola@nosterramezcal.com</a>
        o a nuestro WhatsApp.
      </p>

      <div style="text-align:center;margin:24px 0 6px">
        <a href="https://www.nosterramezcal.com" style="display:inline-block;background:${BRAND};color:${DARK};text-decoration:none;padding:13px 30px;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:1px">Visitar la tienda</a>
      </div>`
    ),
  };
}

export const sendOrderConfirmation = internalAction({
  args: {
    to: v.string(),
    customerName: v.string(),
    orderNumber: v.string(),
    items: v.array(v.object({ name: v.string(), qty: v.number(), price: v.number() })),
    subtotal: v.number(),
    shipping: v.number(),
    discount: v.number(),
    total: v.number(),
    address: v.object({
      calle: v.string(), numero: v.string(), colonia: v.string(),
      cp: v.string(), ciudad: v.string(), estado: v.string(),
    }),
  },
  handler: async (_ctx, { to, customerName, orderNumber, items, subtotal, shipping, discount, total, address }) => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM || "NOSTERRA <onboarding@resend.dev>";
    if (!apiKey) {
      console.warn("RESEND_API_KEY no configurada — se omite el correo de confirmación.");
      return { ok: false, skipped: true };
    }
    const tpl = orderConfirmationEmail(customerName, orderNumber, items, subtotal, shipping, discount, total, address);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject: tpl.subject, html: tpl.html }),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error("Error al enviar correo de confirmación:", res.status, detail);
      return { ok: false, error: detail };
    }
    return { ok: true };
  },
});

// Aviso al dueño/operador cuando entra un pedido pagado
export const sendOwnerNewOrder = internalAction({
  args: {
    to: v.string(),
    orderNumber: v.string(),
    customerName: v.string(),
    customerEmail: v.string(),
    customerPhone: v.optional(v.string()),
    items: v.array(v.object({ name: v.string(), qty: v.number(), price: v.number() })),
    total: v.number(),
    couponCode: v.optional(v.string()),
    ambassadorCode: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
    isManual: v.optional(v.boolean()),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM || "NOSTERRA <onboarding@resend.dev>";
    const to = args.to;
    if (!apiKey || !to) {
      console.warn("RESEND_API_KEY o correo destino no configurado — se omite el aviso de pedido.");
      return { ok: false, skipped: true };
    }

    const itemsHtml = args.items
      .map((i) => `<tr><td style="padding:6px 0;font-size:14px;color:#3a3a34">${i.name} ×${i.qty}</td><td style="padding:6px 0;font-size:14px;color:#3a3a34;text-align:right">$${(i.price * i.qty).toLocaleString("es-MX")}</td></tr>`)
      .join("");

    const html = layout(`🛎️ Nuevo pedido: ${args.orderNumber}`, `
      <p style="font-size:15px;line-height:1.7;color:#3a3a34;margin:0 0 16px">
        Entró un pedido${args.isManual ? " (capturado manualmente)" : " pagado"} por <strong>$${args.total.toLocaleString("es-MX")} MXN</strong>.
      </p>
      <div style="background:#f9f7f4;border-radius:10px;padding:16px 18px;margin-bottom:16px">
        <p style="margin:0 0 4px;font-size:14px;color:#3a3a34"><strong>Cliente:</strong> ${args.customerName}</p>
        <p style="margin:0 0 4px;font-size:14px;color:#3a3a34"><strong>Correo:</strong> ${args.customerEmail}</p>
        ${args.customerPhone ? `<p style="margin:0 0 4px;font-size:14px;color:#3a3a34"><strong>Tel:</strong> ${args.customerPhone}</p>` : ""}
        <p style="margin:0 0 4px;font-size:14px;color:#3a3a34"><strong>Envío a:</strong> ${args.city}, ${args.state}</p>
        ${args.couponCode ? `<p style="margin:0 0 4px;font-size:14px;color:#3a3a34"><strong>Cupón:</strong> ${args.couponCode}</p>` : ""}
        ${args.ambassadorCode ? `<p style="margin:0;font-size:14px;color:#3a3a34"><strong>Embajador:</strong> ${args.ambassadorCode}</p>` : ""}
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:8px">${itemsHtml}</table>
      <div style="text-align:center;margin:22px 0 6px">
        <a href="https://www.nosterramezcal.com/admin/crm" style="display:inline-block;background:${BRAND};color:${DARK};text-decoration:none;padding:13px 30px;border-radius:8px;font-size:14px;font-weight:600">Ver en el CRM</a>
      </div>`);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject: `🛎️ Nuevo pedido ${args.orderNumber} · $${args.total.toLocaleString("es-MX")}`, html }),
    });
    return res.ok ? { ok: true } : { ok: false };
  },
});

// Aviso al dueño/operador cuando entra una solicitud de embajador
export const sendOwnerNewAmbassador = internalAction({
  args: { to: v.string(), name: v.string(), email: v.string(), whatsapp: v.optional(v.string()), code: v.string() },
  handler: async (_ctx, { to, name, email, whatsapp, code }) => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM || "NOSTERRA <onboarding@resend.dev>";
    if (!apiKey || !to) { console.warn("Falta config para aviso de embajador"); return { ok: false }; }

    const html = layout("🏅 Nueva solicitud de embajador", `
      <p style="font-size:15px;line-height:1.7;color:#3a3a34;margin:0 0 16px">
        <strong>${name}</strong> quiere ser embajador de NOSTERRA.
      </p>
      <div style="background:#f9f7f4;border-radius:10px;padding:16px 18px;margin-bottom:16px">
        <p style="margin:0 0 4px;font-size:14px;color:#3a3a34"><strong>Correo:</strong> ${email}</p>
        ${whatsapp ? `<p style="margin:0 0 4px;font-size:14px;color:#3a3a34"><strong>WhatsApp:</strong> ${whatsapp}</p>` : ""}
        <p style="margin:0;font-size:14px;color:#3a3a34"><strong>Código sugerido:</strong> ${code}</p>
      </div>
      <p style="font-size:14px;color:#6a6458;margin:0 0 14px">Apruébala o recházala desde el panel de administración.</p>
      <div style="text-align:center;margin:22px 0 6px">
        <a href="https://www.nosterramezcal.com/admin" style="display:inline-block;background:${BRAND};color:${DARK};text-decoration:none;padding:13px 30px;border-radius:8px;font-size:14px;font-weight:600">Revisar solicitud</a>
      </div>`);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject: `🏅 Nueva solicitud de embajador: ${name}`, html }),
    });
    return res.ok ? { ok: true } : { ok: false };
  },
});

// Correo de campaña/motivación a embajadores
export const sendCampaignEmail = internalAction({
  args: { to: v.string(), name: v.string(), subject: v.string(), body: v.string() },
  handler: async (_ctx, { to, name, subject, body }) => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM || "NOSTERRA <onboarding@resend.dev>";
    if (!apiKey) { console.warn("RESEND_API_KEY no configurada"); return { ok: false }; }

    const first = name.split(" ")[0] || "embajador";
    // Convierte saltos de línea en párrafos y soporta {nombre}
    const personalized = body.replace(/\{nombre\}/gi, first);
    const paragraphs = personalized
      .split(/\n{2,}/)
      .map((p) => `<p style="font-size:15px;line-height:1.7;color:#3a3a34;margin:0 0 14px">${p.replace(/\n/g, "<br/>")}</p>`)
      .join("");

    const html = layout(`¡Hola, ${first}!`, `
      ${paragraphs}
      <div style="text-align:center;margin:26px 0 6px">
        <a href="https://www.nosterramezcal.com/embajadores" style="display:inline-block;background:${BRAND};color:${DARK};text-decoration:none;padding:13px 30px;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:1px">Ir a mi panel de embajador</a>
      </div>`);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    return res.ok ? { ok: true } : { ok: false };
  },
});

export const sendOrderStatusEmail = internalAction({
  args: {
    to: v.string(),
    customerName: v.string(),
    orderNumber: v.string(),
    type: v.union(v.literal("confirmado"), v.literal("enviado"), v.literal("cerrado")),
    trackingNumber: v.optional(v.string()),
    carrier: v.optional(v.string()),
  },
  handler: async (_ctx, { to, customerName, orderNumber, type, trackingNumber, carrier }) => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM || "NOSTERRA <onboarding@resend.dev>";
    if (!apiKey) { console.warn("RESEND_API_KEY no configurada"); return { ok: false }; }

    const first = customerName.split(" ")[0] || "cliente";

    const templates = {
      confirmado: {
        subject: `Tu pedido ${orderNumber} está confirmado · NOSTERRA`,
        html: layout("¡Tu pedido está confirmado!", `
          <p style="font-size:15px;line-height:1.7;color:#3a3a34;margin:0 0 14px">
            Hola <strong>${first}</strong>, confirmamos que recibimos tu pedido <strong>${orderNumber}</strong>
            y ya estamos preparándolo con todo el cuidado que merece.
          </p>
          <p style="font-size:14px;color:#6a6458;margin:0 0 14px">
            En cuanto lo enviemos te avisamos con el número de guía para que puedas rastrear tu paquete.
          </p>
          <div style="text-align:center;margin:24px 0">
            <a href="https://www.nosterramezcal.com" style="display:inline-block;background:${BRAND};color:${DARK};text-decoration:none;padding:13px 30px;border-radius:8px;font-size:14px;font-weight:600">Ver tienda</a>
          </div>`),
      },
      enviado: {
        subject: `Tu pedido ${orderNumber} va en camino · NOSTERRA`,
        html: layout("¡Tu pedido está en camino! 🚚", `
          <p style="font-size:15px;line-height:1.7;color:#3a3a34;margin:0 0 14px">
            Hola <strong>${first}</strong>, tu pedido <strong>${orderNumber}</strong> ya fue enviado.
          </p>
          <div style="background:#f9f7f4;border-radius:10px;padding:18px 20px;margin:16px 0">
            <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#9a9486;margin:0 0 8px">Datos de rastreo</p>
            <p style="font-size:15px;color:#3a3a34;margin:0"><strong>Paquetería:</strong> ${carrier || "Por confirmar"}</p>
            <p style="font-size:15px;color:#3a3a34;margin:6px 0 0"><strong>Número de guía:</strong> <span style="font-family:monospace;font-size:16px">${trackingNumber}</span></p>
          </div>
          <p style="font-size:14px;color:#6a6458;margin:0">
            El tiempo estimado de entrega es de <strong>3 a 5 días hábiles</strong>.
            Puedes rastrear tu paquete en el sitio web de ${carrier || "la paquetería"}.
          </p>`),
      },
      cerrado: {
        subject: `Pedido ${orderNumber} completado · NOSTERRA`,
        html: layout("¡Gracias por tu compra!", `
          <p style="font-size:15px;line-height:1.7;color:#3a3a34;margin:0 0 14px">
            Hola <strong>${first}</strong>, tu pedido <strong>${orderNumber}</strong> ha sido entregado y cerrado.
            Esperamos que disfrutes tu NOSTERRA Mezcal al máximo. 🥃
          </p>
          <p style="font-size:15px;line-height:1.7;color:#3a3a34;margin:0 0 14px">
            Si tienes cualquier comentario o algo no estuvo bien, escríbenos a
            <a href="mailto:hola@nosterramezcal.com" style="color:${BRAND}">hola@nosterramezcal.com</a>.
            Tu opinión nos ayuda a mejorar.
          </p>
          <div style="text-align:center;margin:24px 0">
            <a href="https://www.nosterramezcal.com" style="display:inline-block;background:${BRAND};color:${DARK};text-decoration:none;padding:13px 30px;border-radius:8px;font-size:14px;font-weight:600">Volver a la tienda</a>
          </div>`),
      },
    };

    const tpl = templates[type];
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject: tpl.subject, html: tpl.html }),
    });
    return res.ok ? { ok: true } : { ok: false };
  },
});

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
