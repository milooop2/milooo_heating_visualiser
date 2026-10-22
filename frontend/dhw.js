// DHW color animator – kolorowanie zbiornika CWU wg temperatury.
// Współpracuje z gradientem #linearGradient5 w SVG.
// Gradient ma 4 stopy:
//   #dhw-stop-hot-top   offset 0    (góra, czerwony)
//   #dhw-stop-hot-bot   offset X    (granica czerwony, przesuwana)
//   #dhw-stop-cold-top  offset X    (granica niebieski, przesuwana)
//   #dhw-stop-cold-bot  offset 1    (dół, niebieski)

export class DhwColorizer {
  constructor(svgRoot) {
    this.root = svgRoot;
    this.hotBot  = svgRoot.querySelector("#dhw-stop-hot-bot");
    this.coldTop = svgRoot.querySelector("#dhw-stop-cold-top");

    // Zakres temperatur: poniżej MIN – sam niebieski, powyżej MAX – sam czerwony.
    this.MIN = 25;
    this.MAX = 48;
    // Szerokość miękkiego przejścia (0.05 = 5% w każdą stronę).
    this.SOFT = 0.15;

    this._lastTemp = null;
  }

  update(temp) {
    const t = parseFloat(temp);
    if (isNaN(t)) return;

    // Nie przeliczaj, jeśli temperatura się nie zmieniła.
    if (this._lastTemp === t) return;
    this._lastTemp = t;

    if (!this.hotBot || !this.coldTop) return;

    // ratio 0 (zimno) .. 1 (gorąco)
    let ratio = (t - this.MIN) / (this.MAX - this.MIN);
    ratio = Math.min(1, Math.max(0, ratio));

    // boundary: 0 = granica na górze (dużo niebieskiego),
    //           1 = granica na dole (dużo czerwonego).
    //const boundary = 1 - ratio; //odwrócenie kolorów 
    const boundary = ratio;

    const hotBotOffset  = Math.max(0, boundary - this.SOFT);
    const coldTopOffset = Math.min(1, boundary + this.SOFT);

    this.hotBot.setAttribute("offset",  hotBotOffset.toFixed(3));
    this.coldTop.setAttribute("offset", coldTopOffset.toFixed(3));
  }
}