import type { Metadata } from "next";
import { LegalShell, H2, P, UL } from "@/components/layout/LegalShell";

export const metadata: Metadata = {
  title: "Aviso de Privacidad · NOSTERRA Mezcal",
  description: "Aviso de Privacidad de NOSTERRA Mezcal, Casa Jiménez Elixirs & Spirits.",
};

export default function PrivacidadPage() {
  return (
    <LegalShell title="Aviso de Privacidad" updated="junio de 2026">
      <P>
        En cumplimiento de la Ley Federal de Protección de Datos Personales en Posesión de los
        Particulares (LFPDPPP), su Reglamento y los Lineamientos del Aviso de Privacidad, ponemos a
        tu disposición el presente Aviso de Privacidad.
      </P>

      <H2>1. Responsable de tus datos personales</H2>
      <P>
        <strong>Casa Jiménez Elixirs &amp; Spirits</strong> (en adelante, “NOSTERRA”), con domicilio
        en Santiago Matatlán, Oaxaca, México, y correo de contacto{" "}
        <a href="mailto:hola@nosterramezcal.com" className="text-gold hover:underline">hola@nosterramezcal.com</a>,
        es responsable del tratamiento y protección de tus datos personales.
      </P>

      <H2>2. Datos personales que recabamos</H2>
      <P>Para las finalidades señaladas en este aviso podemos recabar los siguientes datos:</P>
      <UL items={[
        "De identificación y contacto: nombre, apellidos, correo electrónico, teléfono y/o WhatsApp.",
        "De domicilio: calle, número, colonia, código postal, ciudad y estado (para el envío de pedidos).",
        "De facturación/fiscales (solo si los proporcionas): RFC, CURP y razón social.",
        "Datos bancarios (solo para embajadores que solicitan pago de comisiones): CLABE, banco y titular de la cuenta.",
        "De confirmación de mayoría de edad (18 años o más).",
      ]} />
      <P>
        No recabamos datos personales sensibles. Los datos de pago con tarjeta son procesados
        directamente por nuestra plataforma de pagos (Mercado Pago); NOSTERRA no almacena los datos
        completos de tu tarjeta.
      </P>

      <H2>3. Finalidades del tratamiento</H2>
      <P><strong>Finalidades primarias</strong> (necesarias para la relación con nosotros):</P>
      <UL items={[
        "Procesar, preparar y enviar tus pedidos.",
        "Verificar que eres mayor de edad, conforme a la NOM-070-SCFI y la legislación aplicable.",
        "Emitir comprobantes y, en su caso, facturas.",
        "Dar seguimiento, atención y soporte a tu compra o a tu cuenta de embajador.",
        "Gestionar el programa de embajadores: códigos, comisiones y pagos.",
      ]} />
      <P><strong>Finalidades secundarias</strong> (puedes oponerte a ellas):</P>
      <UL items={[
        "Enviarte promociones, novedades y campañas de marketing.",
        "Realizar encuestas de satisfacción y estudios de mercado.",
      ]} />
      <P>
        Si no deseas que tus datos se usen para finalidades secundarias, puedes manifestarlo enviando
        un correo a hola@nosterramezcal.com. Tu negativa no será motivo para negarte los servicios.
      </P>

      <H2>4. Transferencias de datos</H2>
      <P>
        Tus datos pueden ser compartidos con proveedores que nos ayudan a operar, únicamente para las
        finalidades anteriores: plataforma de pagos (Mercado Pago), servicios de envío/paquetería,
        proveedores de infraestructura tecnológica y de correo electrónico. No vendemos ni
        comercializamos tus datos personales con terceros.
      </P>

      <H2>5. Derechos ARCO</H2>
      <P>
        Tienes derecho a Acceder, Rectificar, Cancelar u Oponerte (derechos ARCO) al tratamiento de
        tus datos, así como a revocar tu consentimiento. Para ejercerlos, envía tu solicitud a{" "}
        <a href="mailto:hola@nosterramezcal.com" className="text-gold hover:underline">hola@nosterramezcal.com</a>,
        indicando tu nombre, el derecho que deseas ejercer y la información sobre la que recae. Te
        responderemos en los plazos que marca la ley.
      </P>

      <H2>6. Conservación de los datos</H2>
      <P>
        Conservamos tus datos durante el tiempo necesario para cumplir las finalidades descritas y las
        obligaciones legales, fiscales y contables aplicables; posteriormente serán cancelados.
      </P>

      <H2>7. Uso de cookies y tecnologías</H2>
      <P>
        Nuestro sitio puede utilizar cookies y tecnologías similares (incluida analítica web) para
        mejorar tu experiencia y entender el uso del sitio. Puedes deshabilitar las cookies desde la
        configuración de tu navegador.
      </P>

      <H2>8. Cambios al Aviso de Privacidad</H2>
      <P>
        Cualquier modificación a este aviso será publicada en esta misma página. Te recomendamos
        revisarla periódicamente.
      </P>

      <P className="pt-4 text-xs text-muted/70">
        Este documento es una versión general. Te recomendamos validarlo con un asesor legal para
        ajustarlo a la operación específica de tu empresa.
      </P>
    </LegalShell>
  );
}
