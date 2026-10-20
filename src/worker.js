import { renderGiftPage } from "./gift-page.js";
import { renderLoginPage, renderAdminDashboard } from "./admin-page.js";
import { createSessionCookie, clearSessionCookie, isAuthenticated } from "./auth.js";
import {
  listGifts,
  getGift,
  createGift,
  updateGift,
  deleteGift,
  isRateLimited,
  recordFailedAttempt,
  clearFailedAttempts,
} from "./kv.js";
import { renderQrSvg } from "./qr.js";

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
}

function html(str, init = {}) {
  return new Response(str, {
    ...init,
    headers: { "Content-Type": "text/html; charset=UTF-8", ...(init.headers || {}) },
  });
}

function isValidPasscode(v) {
  return typeof v === "string" && /^[0-9]{4}$/.test(v);
}

async function requireAdmin(request, env) {
  return isAuthenticated(request, env.SESSION_SECRET);
}

async function handleAdminApi(request, env, url) {
  if (!(await requireAdmin(request, env))) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const parts = url.pathname.split("/").filter(Boolean); // admin, api, gifts, [id], [qr.svg]
  const id = parts[3];
  const subresource = parts[4];

  if (request.method === "GET" && id && subresource === "qr.svg") {
    const gift = await getGift(env, id);
    if (!gift) return json({ error: "Không tìm thấy" }, { status: 404 });
    const svg = renderQrSvg(`${url.origin}/g/${id}`);
    return new Response(svg, {
      headers: { "Content-Type": "image/svg+xml; charset=UTF-8", "Cache-Control": "no-store" },
    });
  }

  if (request.method === "GET" && !id) {
    const gifts = await listGifts(env);
    return json({ gifts });
  }

  if (request.method === "POST" && !id) {
    const body = await request.json().catch(() => null);
    if (!body || !isValidPasscode(body.passcode) || !body.message) {
      return json({ error: "Thiếu mật khẩu (4 số) hoặc nội dung" }, { status: 400 });
    }
    const gift = await createGift(env, {
      passcode: body.passcode,
      message: String(body.message).slice(0, 4000),
      title: String(body.title || "").slice(0, 200),
    });
    return json({ gift });
  }

  if (request.method === "PUT" && id) {
    const body = await request.json().catch(() => null);
    if (!body) return json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
    if (body.passcode !== undefined && !isValidPasscode(body.passcode)) {
      return json({ error: "Mật khẩu phải gồm đúng 4 số" }, { status: 400 });
    }
    const gift = await updateGift(env, id, {
      passcode: body.passcode,
      message: body.message !== undefined ? String(body.message).slice(0, 4000) : undefined,
      title: body.title !== undefined ? String(body.title).slice(0, 200) : undefined,
    });
    if (!gift) return json({ error: "Không tìm thấy" }, { status: 404 });
    return json({ gift });
  }

  if (request.method === "DELETE" && id) {
    await deleteGift(env, id);
    return json({ ok: true });
  }

  return json({ error: "Not found" }, { status: 404 });
}

async function handleAdmin(request, env, url) {
  if (url.pathname === "/admin/login" && request.method === "POST") {
    const form = await request.formData();
    const username = form.get("username");
    const password = form.get("password");
    if (username === env.ADMIN_USERNAME && password === env.ADMIN_PASSWORD) {
      const cookie = await createSessionCookie(env.SESSION_SECRET);
      return new Response(null, {
        status: 302,
        headers: { Location: "/admin", "Set-Cookie": cookie },
      });
    }
    return html(renderLoginPage({ error: "Sai tài khoản hoặc mật khẩu" }), { status: 401 });
  }

  if (url.pathname === "/admin/logout") {
    return new Response(null, {
      status: 302,
      headers: { Location: "/admin", "Set-Cookie": clearSessionCookie() },
    });
  }

  if (url.pathname === "/admin") {
    const authed = await requireAdmin(request, env);
    if (!authed) return html(renderLoginPage());
    const gifts = await listGifts(env);
    return html(renderAdminDashboard({ gifts, origin: url.origin }));
  }

  return json({ error: "Not found" }, { status: 404 });
}

async function handleGift(request, env, url) {
  const parts = url.pathname.split("/").filter(Boolean); // g, id, [verify]
  const id = parts[1];
  const action = parts[2];

  if (!id) return json({ error: "Not found" }, { status: 404 });

  const gift = await getGift(env, id);

  if (action === "verify" && request.method === "POST") {
    if (!gift) return json({ ok: false }, { status: 404 });
    if (await isRateLimited(env, id)) {
      return json({ ok: false, rateLimited: true }, { status: 429 });
    }
    const body = await request.json().catch(() => null);
    const ok = !!body && body.passcode === gift.passcode;
    if (ok) {
      await clearFailedAttempts(env, id);
    } else {
      await recordFailedAttempt(env, id);
    }
    return json({ ok });
  }

  if (!action) {
    if (!gift) {
      return html(renderGiftPage({ notFound: true }), { status: 404 });
    }
    return html(renderGiftPage({ title: gift.title, message: gift.message }));
  }

  return json({ error: "Not found" }, { status: 404 });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (url.pathname.startsWith("/admin/api/")) {
        return await handleAdminApi(request, env, url);
      }
      if (url.pathname.startsWith("/admin")) {
        return await handleAdmin(request, env, url);
      }
      if (url.pathname.startsWith("/g/")) {
        return await handleGift(request, env, url);
      }
      if (url.pathname === "/" || url.pathname === "") {
        return new Response(null, { status: 302, headers: { Location: "/admin" } });
      }

      return env.ASSETS.fetch(request);
    } catch (err) {
      return json({ error: "Internal error", detail: String(err && err.message || err) }, { status: 500 });
    }
  },
};
