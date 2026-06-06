import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/store/CartDrawer";
import { Hero } from "@/components/marketing/Hero";
import { Tienda } from "@/components/marketing/Tienda";
import { EdicionConmemorativa } from "@/components/marketing/EdicionConmemorativa";
import { ProcesoArtesanal } from "@/components/marketing/ProcesoArtesanal";
import { HistoriaSection } from "@/components/marketing/HistoriaSection";
import { Testimonios } from "@/components/marketing/Testimonios";
import { ContactoSection } from "@/components/marketing/ContactoSection";

export default function Home() {
  return (
    <>
      <Navbar />
      <CartDrawer />
      <main className="flex-1">
        <Hero />
        <Tienda />
        <EdicionConmemorativa />
        <ProcesoArtesanal />
        <HistoriaSection />
        <Testimonios />
        <ContactoSection />
      </main>
      <Footer />
    </>
  );
}
