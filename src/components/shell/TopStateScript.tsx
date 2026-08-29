/**
 * Va reso dentro <head>, come ThemeScript: segna se la pagina è ancora in
 * cima PRIMA del primo paint, così l'header nasce già trasparente e non si
 * vede la barra opaca lampeggiare sopra la ragnatela all'angolo.
 *
 * La polarità è scelta apposta: senza JavaScript l'attributo non compare
 * mai e l'header tiene il suo fondo pieno. Il caso peggiore è una barra
 * sempre opaca, non una nav illeggibile sopra il contenuto che scorre.
 */
export function TopStateScript() {
  const code = `(function(){try{
    if (window.scrollY < 8) document.documentElement.setAttribute('data-at-top','');
  }catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
