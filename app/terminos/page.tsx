import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell, H2, P, UL } from "@/components/layout/LegalShell";

export const metadata: Metadata = {
  title: "Términos y Condiciones · NOSTERRA Mezcal",
  description: "Términos y Condiciones de venta de NOSTERRA Mezcal, Casa Jiménez Elixirs & Spirits.",
};

export default function TerminosPage() {
  return (
    <LegalShell title="Términos y Condiciones" updated="junio de 2026">
      <P>
        Los presentes Términos y Condiciones regulan el uso del sitio www.nosterramezcal.com y la
        compra de productos de <strong>NOSTERRA</strong>, operado por <strong>Casa Jiménez Elixirs
        &amp; Spirits</strong>. Al navegar o realizar una compra, aceptas estos términos.
      </P>

      <H2>1. Mayoría de edad</H2>
      <P>
        La venta de bebidas alcohólicas está prohibida a menores de edad. Al comprar declaras ser
        mayor de 18 años. NOSTERRA podrá solicitar identificación oficial al momento de la entrega y
        negar la misma a quien no acredite la mayoría de edad. “El abuso en el consumo de este
        producto es nocivo para la salud.”
      </P>

      <H2>2. Productos y precios</H2>
      <UL items={[
        "Los precios se muestran en pesos mexicanos (MXN) e incluyen los impuestos aplicables, salvo que se indique lo contrario.",
        "Las imágenes son ilustrativas; pueden existir variaciones propias de un producto artesanal.",
        "Los precios y la disponibilidad pueden cambiar sin previo aviso; el precio aplicable es el vigente al momento de confirmar el pedido.",
        "Las ediciones limitadas están sujetas a existencias.",
      ]} />

      <H2>3. Pedidos y pago</H2>
      <P>
        Los pagos con tarjeta se procesan a través de Mercado Pago. El pedido se confirma una vez
        aprobado el pago. NOSTERRA se reserva el derecho de cancelar pedidos en caso de error de
        precio evidente, falta de existencias o sospecha de fraude, reembolsando lo pagado.
      </P>

      <H2>4. Envíos</H2>
      <UL items={[
        "Realizamos envíos únicamente dentro de la República Mexicana.",
        "El tiempo estimado de entrega es de 3 a 5 días hábiles, pudiendo variar por zona o por la paquetería.",
        "El costo de envío se muestra antes de finalizar la compra; puede aplicar envío gratis a partir del monto vigente.",
        "Es responsabilidad del cliente proporcionar una dirección correcta y completa. Debe haber una persona mayor de edad para recibir el pedido.",
      ]} />

      <H2>5. Cupones y descuentos</H2>
      <P>
        Los cupones y códigos de descuento están sujetos a las condiciones de cada promoción
        (vigencia, monto mínimo, usos máximos) y no son acumulables salvo que se indique. NOSTERRA
        puede modificar o cancelar promociones en cualquier momento.
      </P>

      <H2>6. Cambios y devoluciones</H2>
      <P>
        Por tratarse de productos de consumo, solo se aceptan cambios o reembolsos cuando el producto
        llegue dañado, defectuoso o sea distinto al solicitado. Deberás notificarlo a{" "}
        <a href="mailto:hola@nosterramezcal.com" className="text-gold hover:underline">hola@nosterramezcal.com</a>{" "}
        dentro de los 5 días naturales posteriores a la entrega, conservando el producto y su empaque.
      </P>

      <H2>7. Programa de embajadores</H2>
      <P>
        La participación en el programa de embajadores se rige por sus propios{" "}
        <Link href="/terminos-embajadores" className="text-gold hover:underline">Términos del Programa de Embajadores</Link>.
      </P>

      <H2>8. Propiedad intelectual</H2>
      <P>
        Las marcas, logotipos, textos, imágenes y contenidos del sitio son propiedad de NOSTERRA /
        Casa Jiménez Elixirs &amp; Spirits y no pueden usarse sin autorización por escrito.
      </P>

      <H2>9. Responsabilidad</H2>
      <P>
        NOSTERRA no será responsable por el uso indebido de sus productos. El consumo de alcohol es
        responsabilidad de quien lo consume.
      </P>

      <H2>10. Datos personales</H2>
      <P>
        El tratamiento de tus datos se rige por nuestro{" "}
        <Link href="/privacidad" className="text-gold hover:underline">Aviso de Privacidad</Link>.
      </P>

      <H2>11. Ley aplicable</H2>
      <P>
        Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier controversia
        se someterá a los tribunales competentes del estado de Oaxaca, sin perjuicio de los derechos
        que como consumidor te otorga la PROFECO.
      </P>

      <P className="pt-4 text-xs text-muted/70">
        Este documento es una versión general. Te recomendamos validarlo con un asesor legal para
        ajustarlo a la operación específica de tu empresa.
      </P>
    </LegalShell>
  );
}
