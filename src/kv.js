const GIFT_PREFIX = "gift:";

function randomId(len = 8) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let out = "";
  for (let i = 0; i < len; i++) out += chars[bytes[i] % chars.length];
  return out;
}

export async function listGifts(env) {
  const list = await env.GIFTS.list({ prefix: GIFT_PREFIX });
  const gifts = await Promise.all(
    list.keys.map(async (k) => {
      const raw = await env.GIFTS.get(k.name);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return { id: k.name.slice(GIFT_PREFIX.length), ...data };
    })
  );
  return gifts.filter(Boolean).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function getGift(env, id) {
  const raw = await env.GIFTS.get(GIFT_PREFIX + id);
  if (!raw) return null;
  return { id, ...JSON.parse(raw) };
}

export async function createGift(env, { passcode, message, title }) {
  let id = randomId();
  while (await env.GIFTS.get(GIFT_PREFIX + id)) {
    id = randomId();
  }
  const data = {
    passcode,
    message,
    title: title || "",
    createdAt: Date.now(),
  };
  await env.GIFTS.put(GIFT_PREFIX + id, JSON.stringify(data));
  return { id, ...data };
}

export async function updateGift(env, id, { passcode, message, title }) {
  const existing = await getGift(env, id);
  if (!existing) return null;
  const data = {
    passcode: passcode !== undefined ? passcode : existing.passcode,
    message: message !== undefined ? message : existing.message,
    title: title !== undefined ? title : existing.title,
    createdAt: existing.createdAt,
  };
  await env.GIFTS.put(GIFT_PREFIX + id, JSON.stringify(data));
  return { id, ...data };
}

export async function deleteGift(env, id) {
  await env.GIFTS.delete(GIFT_PREFIX + id);
}

const ATTEMPT_PREFIX = "attempts:";
const ATTEMPT_LIMIT = 10;
const ATTEMPT_WINDOW_SECONDS = 15 * 60;

export async function isRateLimited(env, id) {
  const raw = await env.GIFTS.get(ATTEMPT_PREFIX + id);
  const count = raw ? Number(raw) : 0;
  return count >= ATTEMPT_LIMIT;
}

export async function recordFailedAttempt(env, id) {
  const key = ATTEMPT_PREFIX + id;
  const raw = await env.GIFTS.get(key);
  const count = (raw ? Number(raw) : 0) + 1;
  await env.GIFTS.put(key, String(count), { expirationTtl: ATTEMPT_WINDOW_SECONDS });
}

export async function clearFailedAttempts(env, id) {
  await env.GIFTS.delete(ATTEMPT_PREFIX + id);
}
