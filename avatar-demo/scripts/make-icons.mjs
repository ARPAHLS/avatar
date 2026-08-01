/**
 * Build Windows icon assets from AVATAR_LOGO_150.png (black → transparent).
 * Writes build/icon.png (256), build/icon-512.png, and multi-size build/icon.ico.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import pngToIco from 'png-to-ico';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const buildDir = path.join(root, 'build');
const logoPath = path.join(root, 'public', 'AVATAR_LOGO_150.png');

fs.mkdirSync(buildDir, { recursive: true });

const ps = `
Add-Type -AssemblyName System.Drawing
$srcPath = '${logoPath.replace(/'/g, "''")}'
$build = '${buildDir.replace(/'/g, "''")}'
$src = [System.Drawing.Bitmap]::FromFile($srcPath)
$sizes = @(16, 24, 32, 48, 64, 128, 256, 512)
foreach ($size in $sizes) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $bmp.SetResolution(72, 72)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
  $g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, $size, $size))
  $g.Dispose()
  for ($x = 0; $x -lt $size; $x++) {
    for ($y = 0; $y -lt $size; $y++) {
      $c = $bmp.GetPixel($x, $y)
      # Key near-black (logo plate) to transparent; keep pale mark
      if ($c.A -gt 0 -and $c.R -lt 40 -and $c.G -lt 40 -and $c.B -lt 40) {
        $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
      }
    }
  }
  $out = Join-Path $build ("icon-" + $size + ".png")
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}
$src.Dispose()
Copy-Item (Join-Path $build 'icon-256.png') (Join-Path $build 'icon.png') -Force
Write-Host 'png sizes ready'
`;

const result = spawnSync('powershell', ['-NoProfile', '-Command', ps], {
  encoding: 'utf8',
  maxBuffer: 10 * 1024 * 1024,
});
if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(result.status ?? 1);
}
console.log(result.stdout.trim());

const pngSizes = [16, 24, 32, 48, 64, 128, 256].map((s) =>
  path.join(buildDir, `icon-${s}.png`),
);
const ico = await pngToIco(pngSizes);
fs.writeFileSync(path.join(buildDir, 'icon.ico'), ico);
console.log('wrote build/icon.ico', ico.length, 'bytes');
