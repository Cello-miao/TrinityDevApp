/**
 * Expo config plugin: injects network_security_config.xml into the Android build.
 * Bundles the project root CA (nginx/certs/rootCA.crt) into res/raw/root_ca so
 * the APK itself trusts the dev HTTPS server — no device-level cert install needed.
 */
const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const NETWORK_SECURITY_XML = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <!--
    Trust system CAs, user-installed CAs, and the project dev root CA
    bundled at res/raw/root_ca.  cleartext traffic is still blocked.
  -->
  <base-config cleartextTrafficPermitted="false">
    <trust-anchors>
      <certificates src="system"/>
      <certificates src="user"/>
      <certificates src="@raw/root_ca"/>
    </trust-anchors>
  </base-config>
</network-security-config>
`;

module.exports = function withAndroidNetworkSecurity(config) {
  // Step 1: copy rootCA.crt → res/raw/root_ca  AND  write network_security_config.xml
  config = withDangerousMod(config, [
    'android',
    (modConfig) => {
      const platformRoot = modConfig.modRequest.platformProjectRoot;

      // res/xml
      const xmlDir = path.join(platformRoot, 'app', 'src', 'main', 'res', 'xml');
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(path.join(xmlDir, 'network_security_config.xml'), NETWORK_SECURITY_XML);

      // res/raw — bundle project root CA so APK trusts it without device install
      const rawDir = path.join(platformRoot, 'app', 'src', 'main', 'res', 'raw');
      fs.mkdirSync(rawDir, { recursive: true });
      const projectRoot = modConfig.modRequest.projectRoot;
      const caCertSrc = path.join(projectRoot, 'nginx', 'certs', 'rootCA.crt');
      if (fs.existsSync(caCertSrc)) {
        fs.copyFileSync(caCertSrc, path.join(rawDir, 'root_ca.crt'));
      } else {
        console.warn('[withAndroidNetworkSecurity] rootCA.crt not found at', caCertSrc);
      }

      return modConfig;
    },
  ]);

  // Step 2: reference it from AndroidManifest.xml <application>
  config = withAndroidManifest(config, (modConfig) => {
    const application = modConfig.modResults.manifest.application?.[0];
    if (application) {
      application.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    }
    return modConfig;
  });

  return config;
};
