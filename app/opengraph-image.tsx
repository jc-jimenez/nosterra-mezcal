import { ImageResponse } from "next/og";

export const alt = "NOSTERRA Mezcal · Joven Cristalino de Santiago Matatlán, Oaxaca";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Carga Cormorant Garamond para mantener la tipografía de marca en la tarjeta social.
async function loadFont(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500",
      { headers: { "User-Agent": "Mozilla/5.0" } }
    ).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function Image() {
  const font = await loadFont();
  const fontFamily = font ? "Cormorant Garamond" : "serif";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0F0F0D",
          backgroundImage:
            "radial-gradient(circle at 50% 38%, rgba(200,169,110,0.18), transparent 60%)",
          color: "#F5F0E8",
          fontFamily,
        }}
      >
        <div
          style={{
            fontSize: 26,
            letterSpacing: 14,
            color: "#C8A96E",
            fontFamily: "sans-serif",
            textTransform: "uppercase",
          }}
        >
          Mezcal Artesanal
        </div>

        <div
          style={{
            fontSize: 150,
            letterSpacing: 12,
            marginTop: 8,
            color: "#F5F0E8",
            display: "flex",
          }}
        >
          NOSTERRA
        </div>

        {/* Divisor dorado con diamante */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 6 }}>
          <div style={{ width: 90, height: 1, backgroundColor: "#C8A96E" }} />
          <div style={{ color: "#C8A96E", fontSize: 22 }}>◆</div>
          <div style={{ width: 90, height: 1, backgroundColor: "#C8A96E" }} />
        </div>

        <div
          style={{
            fontSize: 40,
            fontStyle: "italic",
            marginTop: 28,
            color: "rgba(245,240,232,0.9)",
            maxWidth: 820,
            textAlign: "center",
            display: "flex",
          }}
        >
          La distancia puede separar caminos… pero nunca nuestras raíces.
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 48,
            fontSize: 24,
            letterSpacing: 6,
            color: "rgba(200,169,110,0.85)",
            fontFamily: "sans-serif",
            textTransform: "uppercase",
          }}
        >
          Santiago Matatlán · Oaxaca · México
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font
        ? [{ name: "Cormorant Garamond", data: font, style: "normal", weight: 500 }]
        : [],
    }
  );
}
