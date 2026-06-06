import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell, H2, P, UL } from "@/components/layout/LegalShell";

export const metadata: Metadata = {
  title: "Términos del Programa de Embajadores · NOSTERRA Mezcal",
  description: "Términos y condiciones del Programa de Embajadores de NOSTERRA Mezcal.",
};

export default function TerminosEmbajadoresPage() {
  return (
    <LegalShell title="Términos del Programa de Embajadores" updated="junio de 2026">
      <P>
        El Programa de Embajadores de <strong>NOSTERRA</strong> (Casa Jiménez Elixirs &amp; Spirits)
        permite a personas mayores de edad recomendar nuestros productos a cambio de una comisión. Al
        registrarte o ser dado de alta como embajador, aceptas estos términos.
      </P>

      <H2>1. Requisitos</H2>
      <UL items={[
        "Ser mayor de 18 años.",
        "Proporcionar datos verídicos (nombre, correo y WhatsApp como mínimo).",
        "Para cobrar comisiones en efectivo: proporcionar datos fiscales y bancarios válidos (RFC, CLABE y titular).",
      ]} />

      <H2>2. Alta y código personal</H2>
      <P>
        Al aprobarse tu solicitud recibirás un código personal y un PIN de acceso. Eres responsable
        del uso y resguardo de tu PIN. El código es personal e intransferible.
      </P>

      <H2>3. Comisiones y niveles</H2>
      <UL items={[
        "Ganas una comisión por cada venta pagada que se realice usando tu código.",
        "Existen tres niveles (Normal, Plata y Oro) con distinto porcentaje de comisión.",
        "El ascenso de nivel es automático al alcanzar los umbrales de ventas vigentes, los cuales NOSTERRA puede ajustar.",
        "La comisión se calcula sobre el subtotal del pedido (sin envío) y se acredita únicamente cuando el pago es confirmado.",
        "Si un pedido es cancelado o reembolsado, la comisión correspondiente no se genera o se descuenta.",
      ]} />

      <H2>4. Descuento a tus referidos</H2>
      <P>
        Quien compre usando tu código recibe el descuento vigente para clientes. Los descuentos no
        son acumulables con otras promociones salvo que se indique.
      </P>

      <H2>5. Pago de comisiones</H2>
      <UL items={[
        "Normal: el canje de comisiones es únicamente en producto (cupón de descuento).",
        "Plata: puede canjear hasta el 50% en efectivo (transferencia) y el resto en cupón.",
        "Oro: puede canjear su comisión en efectivo y/o cupón, según prefiera.",
        "Los pagos en efectivo se realizan por transferencia a la cuenta CLABE registrada, una vez validados los datos.",
        "El embajador es responsable de las obligaciones fiscales que deriven de los ingresos percibidos.",
      ]} />

      <H2>6. Conducta</H2>
      <P>NOSTERRA podrá suspender o dar de baja a un embajador que:</P>
      <UL items={[
        "Use prácticas engañosas, spam o publicidad falsa.",
        "Promueva el consumo a menores de edad o el consumo irresponsable de alcohol.",
        "Use la marca de forma no autorizada o que dañe su reputación.",
        "Proporcione datos falsos o realice actividades fraudulentas.",
      ]} />

      <H2>7. Relación entre las partes</H2>
      <P>
        El programa no constituye una relación laboral, de sociedad ni de representación entre el
        embajador y NOSTERRA. El embajador participa de forma independiente.
      </P>

      <H2>8. Modificaciones y vigencia</H2>
      <P>
        NOSTERRA puede modificar los porcentajes de comisión, los niveles, los umbrales y las
        condiciones del programa, así como suspenderlo, notificándolo por los medios disponibles. El
        programa no tiene una vigencia mínima garantizada.
      </P>

      <H2>9. Datos personales</H2>
      <P>
        El tratamiento de los datos del embajador se rige por nuestro{" "}
        <Link href="/privacidad" className="text-gold hover:underline">Aviso de Privacidad</Link>.
      </P>

      <P className="pt-4 text-xs text-muted/70">
        Este documento es una versión general. Te recomendamos validarlo con un asesor legal y, en su
        caso, con tu contador para el tratamiento fiscal de las comisiones.
      </P>
    </LegalShell>
  );
}
