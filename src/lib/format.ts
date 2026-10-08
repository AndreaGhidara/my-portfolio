/** Un numero a due cifre: «07», «12». Numeri di cartella, di scontrino, date, ore. */
export const pad2 = (n: number) => String(n).padStart(2, "0");
