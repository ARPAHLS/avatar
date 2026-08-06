/**
 * Embed AVATAR icon into the packaged .exe without winCodeSign / rcedit native deps.
 * Needed because signAndEditExecutable is false (symlink privilege issues on some Windows setups).
 */
const fs = require('fs');
const path = require('path');
const ResEdit = require('resedit');

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'win32') return;

  const exeName = `${context.packager.appInfo.productFilename}.exe`;
  const exePath = path.join(context.appOutDir, exeName);
  const icoPath = path.join(__dirname, '..', 'build', 'icon.ico');

  if (!fs.existsSync(exePath)) {
    console.warn('[afterPack] exe missing:', exePath);
    return;
  }
  if (!fs.existsSync(icoPath)) {
    console.warn('[afterPack] icon.ico missing:', icoPath);
    return;
  }

  const exeBuf = Buffer.from(fs.readFileSync(exePath));
  const icoFile = ResEdit.Data.IconFile.from(fs.readFileSync(icoPath));
  const exe = ResEdit.NtExecutable.from(exeBuf, true);
  const res = ResEdit.NtExecutableResource.from(exe);
  const iconGroups = ResEdit.Resource.IconGroupEntry.fromEntries(res.entries);
  const iconId = iconGroups.length > 0 ? iconGroups[0].id : 1;
  const lang = iconGroups.length > 0 ? iconGroups[0].lang : 1033;

  ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
    res.entries,
    iconId,
    lang,
    icoFile.icons.map((icon) => icon.data),
  );

  res.outputResource(exe);
  fs.writeFileSync(exePath, Buffer.from(exe.generate()));
  console.log('[afterPack] embedded icon into', exeName);
};
