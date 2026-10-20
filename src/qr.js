import qrcode from "qrcode-generator";

export function renderQrSvg(text, { size = 220, margin = 2 } = {}) {
  const qr = qrcode(0, "M");
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

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
<rect width="${size}" height="${size}" fill="#fff"/>
<g fill="#000">${paths}</g>
</svg>`;
}
