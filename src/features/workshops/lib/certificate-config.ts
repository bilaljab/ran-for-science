// Everything that depends on the certificate DESIGN lives here. To change the
// design: replace public/certificate/template.jpg (3508x2480, A4 landscape)
// and adjust the numbers below. All values are canvas pixels; the y values
// are text BASELINES.
//
// The template image carries only the FIXED artwork (border, ribbons, title,
// "تشهد منصة RAN For Science بأن", signatories, logo). The attendee name and
// the whole middle paragraph are drawn by code, because bold variable words
// sit inside the sentences.

export const CERTIFICATE = {
  width: 3508,
  height: 2480,
  templateSrc: "/certificate/template.jpg",

  colors: { ink: "#136671", mauve: "#a678a8" },

  // Horizontal centre of the white panel.
  centerX: 1752,
  // Text must stay inside this width; longer text shrinks (name) or wraps (title).
  maxTextWidth: 3000,

  name: { y: 790, fontSize: 138, minFontSize: 64 },
  paragraph: { fontSize: 110, lineGap: 200, firstLineY: 970 },
  workshopTitle: { fontSize: 118, lineHeight: 150 },
  closingText: "سائلين الله له/لها دوام التوفيق والنجاح الدائم",
} as const;
