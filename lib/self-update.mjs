/**
 * 从 GitHub Release 检查并安装插件更新。
 */
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export const UPDATE_REPO = 'SUSRDev/napcat-ai-chatbot';
export const UPDATE_REPO_URL = `https://github.com/${UPDATE_REPO}`;
export const GITHUB_API = `https://api.github.com/repos/${UPDATE_REPO}/releases/latest`;

const SKIP_COPY = new Set(['config.json', 'node_modules', '.git', '.update-tmp', '.update-backup']);
const PRESERVE_FILE_RE = /^config\.json$/i;

export function parseSemver(version) {
  const m = String(version || '').trim().replace(/^v/i, '').match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return { major: +m[1], minor: +m[2], patch: +m[3], raw: `${m[1]}.${m[2]}.${m[3]}` };
}

export function compareSemver(a, b) {
  const va = parseSemver(a);
  const vb = parseSemver(b);
  if (!va && !vb) return 0;
  if (!va) return -1;
  if (!vb) return 1;
  if (va.major !== vb.major) return va.major - vb.major;
  if (va.minor !== vb.minor) return va.minor - vb.minor;
  return va.patch - vb.patch;
}

export function readLocalVersion(pluginDir) {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(pluginDir, 'package.json'), 'utf-8'));
    return String(raw.version || '0.0.0');
  } catch {
    return '0.0.0';
  }
}

export function pickZipAsset(release) {
  const assets = Array.isArray(release?.assets) ? release.assets : [];
  return assets.find((a) => /^napcat-plugin-chat-bot-v.*\.zip$/i.test(a.name))
    || assets.find((a) => /\.zip$/i.test(a.name))
    || null;
}

export async function fetchLatestRelease(logger) {
  const res = await fetch(GITHUB_API, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'napcat-plugin-chat-bot-updater'
    }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GitHub API ${res.status}: ${text.slice(0, 200)}`);
  }
  const release = await res.json();
  const tag = String(release.tag_name || release.name || '').trim();
  const version = tag.replace(/^v/i, '');
  const asset = pickZipAsset(release);
  if (!asset?.browser_download_url) {
    throw new Error('最新 Release 未找到插件 zip 安装包');
  }
  logger?.info?.(`[chat-bot] 检测到最新 Release: ${tag}`);
  return {
    tag,
    version,
    name: String(release.name || tag),
    htmlUrl: String(release.html_url || UPDATE_REPO_URL + '/releases'),
    publishedAt: release.published_at || null,
    assetName: asset.name,
    downloadUrl: asset.browser_download_url
  };
}

export async function checkForUpdate(pluginDir, logger) {
  const currentVersion = readLocalVersion(pluginDir);
  const latest = await fetchLatestRelease(logger);
  const hasUpdate = compareSemver(latest.version, currentVersion) > 0;
  return {
    currentVersion,
    latestVersion: latest.version,
    hasUpdate,
    release: latest,
    checkedAt: Date.now()
  };
}

async function downloadFile(url, destPath, logger) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'napcat-plugin-chat-bot-updater' }
  });
  if (!res.ok) throw new Error(`下载失败 HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buf);
  logger?.info?.(`[chat-bot] 已下载更新包 (${Math.round(buf.length / 1024)} KB)`);
}

async function extractZip(zipPath, destDir, logger) {
  fs.mkdirSync(destDir, { recursive: true });
  if (process.platform === 'win32') {
    const ps = `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force`;
    await execFileAsync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps], { timeout: 180000 });
    return;
  }
  try {
    await execFileAsync('unzip', ['-o', zipPath, '-d', destDir], { timeout: 180000 });
  } catch (e) {
    throw new Error('解压失败，请确保系统已安装 unzip，或在 Windows 上使用 PowerShell');
  }
}

function resolveExtractRoot(extractDir) {
  const entries = fs.readdirSync(extractDir, { withFileTypes: true });
  if (entries.length === 1 && entries[0].isDirectory()) {
    const sub = path.join(extractDir, entries[0].name);
    if (fs.existsSync(path.join(sub, 'package.json'))) return sub;
  }
  return extractDir;
}

function shouldSkipCopy(name) {
  if (!name || name.startsWith('.')) return true;
  if (SKIP_COPY.has(name)) return true;
  if (PRESERVE_FILE_RE.test(name)) return true;
  return false;
}

function copyRecursive(srcDir, destDir, logger) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const ent of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (shouldSkipCopy(ent.name)) continue;
    const src = path.join(srcDir, ent.name);
    const dest = path.join(destDir, ent.name);
    if (ent.isDirectory()) {
      copyRecursive(src, dest, logger);
    } else if (ent.isFile()) {
      fs.copyFileSync(src, dest);
    }
  }
}

function rmRecursive(target) {
  if (!fs.existsSync(target)) return;
  fs.rmSync(target, { recursive: true, force: true });
}

export async function applyReleaseUpdate(pluginDir, releaseInfo, logger) {
  const tmpRoot = path.join(pluginDir, '.update-tmp');
  const zipPath = path.join(tmpRoot, releaseInfo.assetName || 'update.zip');
  const extractDir = path.join(tmpRoot, 'extract');
  rmRecursive(tmpRoot);
  fs.mkdirSync(tmpRoot, { recursive: true });

  try {
    await downloadFile(releaseInfo.downloadUrl, zipPath, logger);
    await extractZip(zipPath, extractDir, logger);
    const sourceRoot = resolveExtractRoot(extractDir);
    if (!fs.existsSync(path.join(sourceRoot, 'package.json'))) {
      throw new Error('更新包结构无效，缺少 package.json');
    }
    copyRecursive(sourceRoot, pluginDir, logger);
    const newVersion = readLocalVersion(pluginDir);
    logger?.info?.(`[chat-bot] 插件已更新至 v${newVersion}`);
    return { success: true, version: newVersion };
  } finally {
    rmRecursive(tmpRoot);
  }
}
