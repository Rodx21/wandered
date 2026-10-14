/**
 * run-android.js
 * Uninstalls the existing app from any connected Android device/emulator
 * before running expo run:android. This prevents:
 *   INSTALL_FAILED_INSUFFICIENT_STORAGE: Failed to override installation location
 */
const { execSync, spawnSync } = require('child_process');

const PACKAGE = 'com.wandered.app';
const ADB = 'adb';

function getConnectedDevices() {
  try {
    const out = execSync(`${ADB} devices`, { encoding: 'utf8' });
    return out
      .split('\n')
      .slice(1)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('*') && l.includes('\tdevice'))
      .map((l) => l.split('\t')[0]);
  } catch {
    return [];
  }
}

const devices = getConnectedDevices();
if (devices.length === 0) {
  console.log('[run-android] No devices found, skipping uninstall step.');
} else {
  for (const device of devices) {
    console.log(`[run-android] Uninstalling ${PACKAGE} from ${device}...`);
    try {
      execSync(`${ADB} -s ${device} uninstall ${PACKAGE}`, { stdio: 'pipe' });
      console.log(`[run-android] Uninstalled successfully.`);
    } catch {
      console.log(`[run-android] App not installed (or already removed) — continuing.`);
    }
  }
}

// Now run expo run:android
const result = spawnSync('npx', ['expo', 'run:android'], {
  stdio: 'inherit',
  shell: true,
});

process.exit(result.status ?? 0);
