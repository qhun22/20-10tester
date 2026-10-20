import qrcode from "qrcode-generator";

const HEART_PATH =
  "M50 88 C20 65, 5 45, 5 28 C5 13, 17 2, 31 2 C40 2, 47 7, 50 14 C53 7, 60 2, 69 2 C83 2, 95 13, 95 28 C95 45, 80 65, 50 88 Z";

export function renderQrSvg(text, { size = 220, margin = 2, withLogo = true } = {}) {
  const qr = qrcode(0, withLogo ? "H" : "M");
  qr.addData(text);
  qr.make();
  const count = qr.getModuleCount();
  const cell = size / (count + margin * 2);

  let paths = "";
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) {
        const x = (col + margin) * cell;
        const y = (row + margin) * cell;
        paths += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}" />`;
      }
    }
  }

  let logo = "";
  if (withLogo) {
    const logoBoxSize = size * 0.26;
    const logoBoxX = (size - logoBoxSize) / 2;
    const logoBoxY = (size - logoBoxSize) / 2;
    const heartScale = (logoBoxSize * 0.62) / 95;
    const heartX = logoBoxX + (logoBoxSize - 95 * heartScale) / 2;
    const heartY = logoBoxY + (logoBoxSize - 88 * heartScale) / 2;
    logo = `<rect x="${logoBoxX.toFixed(2)}" y="${logoBoxY.toFixed(2)}" width="${logoBoxSize.toFixed(2)}" height="${logoBoxSize.toFixed(2)}" rx="${(logoBoxSize * 0.18).toFixed(2)}" fill="#fff" stroke="#000" stroke-width="1.5"/>
<g transform="translate(${heartX.toFixed(2)} ${heartY.toFixed(2)}) scale(${heartScale.toFixed(4)})">
<path d="${HEART_PATH}" fill="#e0527a"/>
</g>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
<rect width="${size}" height="${size}" fill="#fff"/>
<g fill="#000">${paths}</g>
${logo}
</svg>`;
}
