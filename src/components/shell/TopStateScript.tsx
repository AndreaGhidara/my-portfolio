import { AT_TOP_THRESHOLD } from "./atTop";

// Dentro <head>, prima del paint: l'header nasce gia' trasparente in cima. Senza
// JavaScript l'attributo non compare mai e la barra resta opaca, non illeggibile.
export function TopStateScript() {
  const code = `(function(){try{
    if (window.scrollY < ${AT_TOP_THRESHOLD}) document.documentElement.setAttribute('data-at-top','');
  }catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
