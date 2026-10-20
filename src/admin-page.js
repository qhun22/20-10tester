import { escapeHtml } from "./html-utils.js";

const SHELL_HEAD = `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#eef1f3">
<link rel="icon" href="/img/flowers.png" type="image/x-icon">
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    font-family: Saira, Arial, sans-serif;
    background: #eef1f3;
    color: #222;
  }
  .wrap { max-width: 720px; margin: 0 auto; padding: 32px 18px 60px; }
  h1 { font-size: 1.5rem; margin: 0 0 24px; }
  .card {
    background: #fff;
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 18px;
    box-shadow: 0 6px 20px rgba(0,0,0,.06);
  }
  label { display: block; font-size: .85rem; color: #555; margin: 10px 0 4px; }
  input[type=text], input[type=password], textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ccd3d6;
    border-radius: 10px;
    font: inherit;
    font-family: inherit;
  }
  textarea { min-height: 100px; resize: vertical; }
  button {
    font: inherit;
    cursor: pointer;
    border: none;
    border-radius: 10px;
    padding: 10px 16px;
    background: #3a6ea5;
    color: #fff;
  }
  button.danger { background: #c0392b; }
  button.secondary { background: #888; }
  .row { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 14px; }
  .gift-item { border-top: 1px solid #eee; padding: 14px 0; }
  .gift-item:first-child { border-top: none; }
  .gift-id { font-weight: 700; }
  .gift-meta { font-size: .8rem; color: #777; margin: 4px 0 10px; word-break: break-all; }
  .qr-box { display: flex; gap: 16px; align-items: flex-start; flex-wrap: wrap; margin-top: 10px; }
  .qr-box img { background: #fff; border-radius: 8px; }
  a.link-url { color: #3a6ea5; text-decoration: none; }
  .error { color: #c0392b; font-size: .85rem; margin-top: 8px; }
  .top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .top-bar a { color: #555; font-size: .85rem; text-decoration: none; }
</style>`;

export function renderLoginPage({ error } = {}) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>${SHELL_HEAD}<title>Admin đăng nhập</title></head>
<body>
  <div class="wrap" style="max-width:400px;">
    <h1>Đăng nhập admin</h1>
    <div class="card">
      <form method="POST" action="/admin/login">
        <label for="username">Tài khoản</label>
        <input type="text" id="username" name="username" autocomplete="username" required>
        <label for="password">Mật khẩu</label>
        <input type="password" id="password" name="password" autocomplete="current-password" required>
        ${error ? `<p class="error">${escapeHtml(error)}</p>` : ""}
        <div class="row">
          <button type="submit">Đăng nhập</button>
        </div>
      </form>
    </div>
  </div>
</body>
</html>`;
}

export function renderAdminDashboard({ gifts, origin }) {
  const items = gifts
    .map((g) => {
      const url = `${origin}/g/${g.id}`;
      return `<div class="gift-item" data-gift-id="${escapeHtml(g.id)}">
        <div class="gift-id">${escapeHtml(g.title || "(không tên)")} &mdash; <code>${escapeHtml(g.id)}</code></div>
        <div class="gift-meta"><a class="link-url" href="/g/${escapeHtml(g.id)}" target="_blank" rel="noopener">${escapeHtml(url)}</a></div>
        <form class="edit-form" data-id="${escapeHtml(g.id)}">
          <label>Tiêu đề</label>
          <input type="text" name="title" value="${escapeHtml(g.title || "")}">
          <label>Mật khẩu (4 số)</label>
          <input type="text" name="passcode" value="${escapeHtml(g.passcode || "")}" pattern="[0-9]{4}" maxlength="4">
          <label>Nội dung lời chúc</label>
          <textarea name="message">${escapeHtml(g.message || "")}</textarea>
          <div class="row">
            <button type="submit">Lưu</button>
            <button type="button" class="secondary qr-btn">Hiện QR</button>
            <button type="button" class="danger delete-btn">Xoá</button>
          </div>
        </form>
        <div class="qr-box" hidden></div>
      </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="vi">
<head>${SHELL_HEAD}<title>Admin</title></head>
<body>
  <div class="wrap">
    <div class="top-bar">
      <h1 style="margin:0">Quản lý món quà</h1>
      <a href="/admin/logout">Đăng xuất</a>
    </div>

    <div class="card">
      <h2 style="margin-top:0;font-size:1.05rem;">Tạo link mới</h2>
      <form id="createForm">
        <label>Tiêu đề (tuỳ chọn)</label>
        <input type="text" name="title" placeholder="VD: Gửi chị A">
        <label>Mật khẩu (4 số)</label>
        <input type="text" name="passcode" pattern="[0-9]{4}" maxlength="4" required placeholder="VD: 1503">
        <label>Nội dung lời chúc</label>
        <textarea name="message" required placeholder="Chúc em 20/10 vui vẻ..."></textarea>
        <div class="row">
          <button type="submit">Tạo link</button>
        </div>
      </form>
    </div>

    <div class="card" id="giftList">
      ${items || "<p>Chưa có link nào.</p>"}
    </div>
  </div>

  <script>
    var ORIGIN = ${JSON.stringify(origin)};

    document.getElementById("createForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var form = e.target;
      var data = {
        title: form.title.value,
        passcode: form.passcode.value,
        message: form.message.value
      };
      fetch("/admin/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      }).then(function (r) {
        if (r.ok) window.location.reload();
        else r.json().then(function (d) { alert(d.error || "Lỗi tạo link"); });
      });
    });

    document.querySelectorAll(".edit-form").forEach(function (form) {
      var id = form.dataset.id;
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var data = {
          title: form.title.value,
          passcode: form.passcode.value,
          message: form.message.value
        };
        fetch("/admin/api/gifts/" + id, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        }).then(function (r) {
          if (r.ok) window.location.reload();
          else r.json().then(function (d) { alert(d.error || "Lỗi lưu"); });
        });
      });

      form.parentElement.querySelector(".delete-btn").addEventListener("click", function () {
        if (!confirm("Xoá link này?")) return;
        fetch("/admin/api/gifts/" + id, { method: "DELETE" }).then(function (r) {
          if (r.ok) window.location.reload();
        });
      });

      form.parentElement.querySelector(".qr-btn").addEventListener("click", function () {
        var box = form.parentElement.querySelector(".qr-box");
        var url = ORIGIN + "/g/" + id;
        var svgUrl = "/admin/api/gifts/" + id + "/qr.svg?t=" + Date.now();
        if (box.hidden) {
          box.hidden = false;
          box.innerHTML = "";
          var img = document.createElement("img");
          img.width = 180;
          img.height = 180;
          img.alt = "QR code";
          img.src = svgUrl;
          box.appendChild(img);

          var actions = document.createElement("div");
          actions.innerHTML = "<div><a class=\\"link-url\\" href=\\"" + url + "\\" target=\\"_blank\\">" + url + "</a></div>" +
            "<div class=\\"row\\" style=\\"margin-top:8px;\\">" +
            "<button type=\\"button\\" class=\\"secondary download-svg\\">Tải SVG</button>" +
            "<button type=\\"button\\" class=\\"secondary download-png\\">Tải PNG</button>" +
            "</div>";
          box.appendChild(actions);

          actions.querySelector(".download-svg").addEventListener("click", function () {
            var a = document.createElement("a");
            a.href = svgUrl;
            a.download = "qr-" + id + ".svg";
            document.body.appendChild(a);
            a.click();
            a.remove();
          });

          actions.querySelector(".download-png").addEventListener("click", function () {
            fetch(svgUrl)
              .then(function (r) { return r.text(); })
              .then(function (svgText) {
                var svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
                var blobUrl = URL.createObjectURL(svgBlob);
                var tmpImg = new Image();
                tmpImg.onload = function () {
                  var scale = 4;
                  var canvas = document.createElement("canvas");
                  canvas.width = tmpImg.width * scale;
                  canvas.height = tmpImg.height * scale;
                  var ctx = canvas.getContext("2d");
                  ctx.drawImage(tmpImg, 0, 0, canvas.width, canvas.height);
                  URL.revokeObjectURL(blobUrl);
                  canvas.toBlob(function (pngBlob) {
                    var pngUrl = URL.createObjectURL(pngBlob);
                    var a = document.createElement("a");
                    a.href = pngUrl;
                    a.download = "qr-" + id + ".png";
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(pngUrl);
                  }, "image/png");
                };
                tmpImg.src = blobUrl;
              });
          });
        } else {
          box.hidden = true;
        }
      });
    });
  </script>
</body>
</html>`;
}
