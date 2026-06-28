/**
 * 群聊趋势：复读机 / 斗图
 */

export function normalizeRepeatText(text) {
  return String(text || '').trim().replace(/\s+/g, ' ');
}

export function isStickerKind(kind) {
  return kind === 'image' || kind === 'sticker';
}

/** @param {string} text */
export function isRepeatCandidateText(text, maxLen = 120) {
  const t = normalizeRepeatText(text);
  if (!t || t.length < 1 || t.length > maxLen) return false;
  if (t === '[图片]' || t === '[文件]') return false;
  return true;
}

/**
 * 末尾连续相同文字：至少 minUsers 个不同用户、minSame 条相同内容
 * @param {object[]} recentList
 * @param {string} [selfId]
 */
export function detectGroupRepeatTrend(recentList, selfId, opts = {}) {
  const minUsers = Math.max(2, Number(opts.minUsers) || 2);
  const minSame = Math.max(minUsers, Number(opts.minSame) || minUsers);
  const maxAgeMs = Math.max(10000, Number(opts.maxAgeMs) || 120000);
  const maxLen = Math.max(10, Number(opts.maxLen) || 120);
  const botId = selfId ? String(selfId) : 'self';
  const now = Date.now();

  const chain = [];
  for (let i = recentList.length - 1; i >= 0; i--) {
    const m = recentList[i];
    if (!m) continue;
    if (now - (Number(m.ts) || 0) > maxAgeMs) break;
    if (String(m.userId) === botId) continue;
    if (m.kind && m.kind !== 'text') break;
    if (!isRepeatCandidateText(m.text, maxLen)) break;
    chain.unshift(m);
    if (chain.length >= 12) break;
  }

  if (chain.length < minSame) return null;
  const norm = normalizeRepeatText(chain[0].text);
  if (!chain.every((m) => normalizeRepeatText(m.text) === norm)) return null;
  const users = new Set(chain.map((m) => String(m.userId)));
  if (users.size < minUsers) return null;
  return { text: norm, count: chain.length, userCount: users.size };
}

/**
 * 末尾连续发表情/图片：至少 minUsers 个不同用户、minCount 条
 */
export function detectStickerBattleTrend(recentList, selfId, opts = {}) {
  const minUsers = Math.max(2, Number(opts.minUsers) || 2);
  const minCount = Math.max(minUsers, Number(opts.minCount) || minUsers);
  const maxAgeMs = Math.max(10000, Number(opts.maxAgeMs) || 90000);
  const botId = selfId ? String(selfId) : 'self';
  const now = Date.now();

  const chain = [];
  for (let i = recentList.length - 1; i >= 0; i--) {
    const m = recentList[i];
    if (!m) continue;
    if (now - (Number(m.ts) || 0) > maxAgeMs) break;
    if (String(m.userId) === botId) continue;
    const kind = m.kind || (m.text === '[图片]' ? 'image' : 'text');
    if (!isStickerKind(kind)) break;
    chain.unshift(m);
    if (chain.length >= 10) break;
  }

  if (chain.length < minCount) return null;
  const users = new Set(chain.map((m) => String(m.userId)));
  if (users.size < minUsers) return null;
  return { count: chain.length, userCount: users.size };
}

/** 机器人刚跟过同类趋势则跳过，避免复读/斗图循环 */
export function botRecentlyTrended(recentList, selfId, trendType, windowMs = 45000) {
  const botId = selfId ? String(selfId) : 'self';
  const now = Date.now();
  for (let i = recentList.length - 1; i >= 0; i--) {
    const m = recentList[i];
    if (String(m.userId) !== botId) break;
    if (now - (Number(m.ts) || 0) > windowMs) break;
    if (m.trendSource === trendType) return true;
  }
  return false;
}
