import fs from 'fs';
import path from 'path';

export type SettingsMap = Record<string, any>;

const DATA_DIR = path.resolve(process.cwd(), 'data');
const SETTINGS_FILE = path.resolve(DATA_DIR, 'global-settings.json');

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

async function readSettingsFile(): Promise<SettingsMap> {
  ensureDataDir();
  if (!fs.existsSync(SETTINGS_FILE)) {
    // Initialize with empty settings
    const initial: SettingsMap = {};
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  const raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed.settings === 'object') ? parsed.settings : {};
  } catch {
    // If file is corrupted, reset
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({}, null, 2), 'utf8');
    return {};
  }
}

async function writeSettingsFile(settings: SettingsMap): Promise<void> {
  ensureDataDir();
  const payload = {
    settings,
    lastUpdated: new Date().toISOString(),
  };
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(payload, null, 2), 'utf8');
}

export async function loadSettings(): Promise<SettingsMap> {
  return await readSettingsFile();
}

export async function saveSettings(settings: SettingsMap): Promise<void> {
  await writeSettingsFile(settings);
}

export async function getSetting(key: string, defaultValue?: any): Promise<any> {
  const settings = await loadSettings();
  if (Object.prototype.hasOwnProperty.call(settings, key)) {
    return settings[key];
  }
  return defaultValue;
}

export async function setSetting(key: string, value: any): Promise<void> {
  const current = await loadSettings();
  current[key] = value;
  await saveSettings(current);
}



