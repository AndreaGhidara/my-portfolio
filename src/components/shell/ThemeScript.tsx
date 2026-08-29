/**
 * Va reso dentro <head>, prima di qualsiasi contenuto: applica il tema
 * salvato in modo sincrono, così la pagina non lampeggia di bianco prima
 * di diventare scura. È l'unico caso in cui uno script bloccante si
 * giustifica — sono poche decine di byte.
 */
export function ThemeScript() {
  const code = `(function(){try{
    var saved = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = saved || (prefersDark ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.setAttribute('data-theme','dark');
  }catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
