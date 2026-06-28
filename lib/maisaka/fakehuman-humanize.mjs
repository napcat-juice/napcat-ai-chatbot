/**
 * 伪人拟人化发送：回复 / 插话 / @+空格 / 错别字撤回
 */

/** @param {object} cfg */
export function pickFakeHumanSendStyle(cfg) {
  const replyW = Math.max(0, Number(cfg?.fakeHumanReplyStyleChance ?? 0.4));
  const atMsgW = Math.max(0, Number(cfg?.fakeHumanAtMessageChance ?? 0.35));
  const interjectW = Math.max(0, Number(cfg?.fakeHumanInterjectChance ?? 0.35));
  const atOnlyW = Math.max(0, Number(cfg?.fakeHumanAtOnlyChance ?? 0.08));
  const total = replyW + atMsgW + interjectW + atOnlyW || 1;
  const r = Math.random() * total;
  if (r < replyW) return 'reply';
  if (r < replyW + atMsgW) return 'at_message';
  if (r < replyW + atMsgW + interjectW) return 'interject';
  return 'at_only';
}

/** @param {string} text @param {object} cfg */
export function maybeMakeTypo(text, cfg) {
  if (cfg?.fakeHumanTypoEnabled === false) return null;
  const chance = Math.max(0, Math.min(1, Number(cfg?.fakeHumanTypoChance ?? 0.14)));
  if (Math.random() >= chance) return null;
  const s = String(text || '').trim();
  if (s.length < 3 || s.length > 120) return null;

  const swaps = [
    ['的', '得'], ['了', '啦'], ['吗', '嘛'], ['在', '再'], ['做', '作'],
    ['哈', '啊'], ['吧', '把'], ['是', '事'], ['不', '布'], ['这', '着']
  ];
  for (const [a, b] of swaps) {
    if (s.includes(a) && Math.random() < 0.55) {
      const idx = s.indexOf(a);
      const typo = s.slice(0, idx) + b + s.slice(idx + a.length);
      if (typo !== s) return { typo, correct: s };
    }
  }
  if (s.length >= 4) {
    const i = 1 + Math.floor(Math.random() * (s.length - 2));
    const chars = [...s];
    [chars[i], chars[i + 1]] = [chars[i + 1], chars[i]];
    const typo = chars.join('');
    if (typo !== s) return { typo, correct: s };
  }
  return null;
}

export function sleepMs(ms) {
  return new Promise((res) => setTimeout(res, Math.max(0, ms)));
}
