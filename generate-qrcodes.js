/**
 * QR Code Generator for Easter Egg Hunt
 *
 * Usage:
 *   1. npm install qrcode
 *   2. Edit BASE_URL below to your GitHub Pages URL
 *   3. node generate-qrcodes.js
 *
 * Generates:
 *   - Individual QR code PNGs in qrcodes/ folder
 *   - A printable HTML sheet (qrcodes/print-sheet.html) with all 72 QR codes
 */

const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// ====== CONFIGURE THIS ======
const BASE_URL = 'https://YOUR_USERNAME.github.io/easter-egg-hunt-stenaline';
// ============================

// Load egg data
const eggsContent = fs.readFileSync(path.join(__dirname, 'js', 'eggs.js'), 'utf8');
const match = eggsContent.match(/const EGG_DATA = ({[\s\S]*?});/);
if (!match) {
    console.error('Could not parse eggs.js');
    process.exit(1);
}
const EGG_DATA = JSON.parse(match[1]);

const outputDir = path.join(__dirname, 'qrcodes');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

async function generate() {
    const entries = Object.entries(EGG_DATA);
    let printHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>QR-koder - Påskäggsjakt</title>
<style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .qr-item {
        border: 2px dashed #ccc;
        border-radius: 8px;
        padding: 12px;
        text-align: center;
        page-break-inside: avoid;
    }
    .qr-item img { width: 150px; height: 150px; }
    .qr-item p { margin: 6px 0 0; font-size: 14px; font-weight: bold; color: #004a93; }
    @media print {
        .grid { grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .qr-item { border: 1px dashed #999; padding: 8px; }
        .qr-item img { width: 120px; height: 120px; }
    }
</style>
</head>
<body>
<h1 style="text-align:center; color:#004a93; margin-bottom: 20px;">Påskäggsjakt - QR-koder</h1>
<div class="grid">`;

    for (const [token, data] of entries) {
        const url = `${BASE_URL}/?egg=${token}`;
        const filename = `egg-${String(data.pieceIndex + 1).padStart(2, '0')}.png`;
        const filepath = path.join(outputDir, filename);

        await QRCode.toFile(filepath, url, {
            width: 400,
            margin: 2,
            color: { dark: '#004a93', light: '#ffffff' }
        });

        // Also generate data URL for print sheet
        const dataUrl = await QRCode.toDataURL(url, {
            width: 200,
            margin: 2,
            color: { dark: '#004a93', light: '#ffffff' }
        });

        printHtml += `
    <div class="qr-item">
        <img src="${dataUrl}" alt="Ägg ${data.pieceIndex + 1}">
        <p>Ägg #${data.pieceIndex + 1}</p>
    </div>`;

        console.log(`Generated: ${filename}`);
    }

    printHtml += `
</div>
</body>
</html>`;

    fs.writeFileSync(path.join(outputDir, 'print-sheet.html'), printHtml);
    console.log(`\nDone! ${entries.length} QR codes generated in qrcodes/`);
    console.log('Open qrcodes/print-sheet.html to print all codes.');
}

generate().catch(console.error);
