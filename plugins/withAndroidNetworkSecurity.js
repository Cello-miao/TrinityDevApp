/**
 * Expo config plugin: injects network_security_config.xml into the Android build.
 * Allows the app to trust user-installed CA certificates (e.g. dev self-signed CA).
 * Only trust-anchors are widened; cleartext traffic remains blocked.
 */
const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const NETWORK_SECURITY_XML = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <!--
    Allow the system + user-installed CA certs in all builds.
    This is needed for local HTTPS dev servers whose root CA was manually
    installed on the device via Settings → Security → Install certificate.
  -->
  <base-config cleartextTrafficPermitted="false">
    <trust-anchors>
      <certificates src="system"/>
      <certificates src="user"/>
    </trust-anchors>
  </base-config>
</network-security-config>
`;

module.exports = function withAndroidNetworkSecurity(config) {
  // Step 1: write network_security_config.xml into res/xml/
  config = withDangerousMod(config, [
    'android',
    (modConfig) => {
      const xmlDir = path.join(
        modConfig.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'xml'
      );
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(path.join(xmlDir, 'network_security_config.xml'), NETWORK_SECURITY_XML);
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
