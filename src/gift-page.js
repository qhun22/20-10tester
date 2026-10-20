import { FLOWERS_MARKUP } from "./flowers-markup.js";
import { escapeHtml, escapeJsString } from "./html-utils.js";

export function renderGiftPage({ title, message, notFound = false }) {
  const safeTitle = escapeHtml(title || "Món quà 20/10");
  const messageJs = escapeJsString(message || "");

  const body = notFound
    ? `<main class="passcode-screen">
        <section class="passcode-card" aria-labelledby="passcode-title">
          <div class="lock-icon" aria-hidden="true">?</div>
          <h1 id="passcode-title">Không tìm thấy</h1>
          <p class="passcode-subtitle">Món quà này không tồn tại hoặc đã bị xoá.</p>
        </section>
      </main>`
    : `<main class="passcode-screen" id="passcodeScreen">
        <section class="passcode-card" aria-labelledby="passcode-title">
          <div class="lock-icon" aria-hidden="true">&#9825;</div>
          <h1 id="passcode-title">Nhập pass nha</h1>
          <p class="passcode-subtitle">Mở món quà dành riêng cho bạn</p>

          <div class="passcode-dots" aria-label="Mã gồm 4 chữ số" id="passcodeDots"></div>
          <p id="passcode-message" class="passcode-message" aria-live="polite"></p>

          <div class="keypad" aria-label="Bàn phím nhập mã" id="keypad"></div>
        </section>
      </main>
      <div class="gift-stage container" id="giftStage" hidden>
          <div class="night"></div>
          <div class="message-card" id="messageCard">
            <p class="message-text" id="messageText"></p>
          </div>
          ${FLOWERS_MARKUP}
      </div>`;

  const script = notFound
    ? ""
    : `<script>
      (function () {
        var MESSAGE = ${messageJs};
        var dotsContainer = document.getElementById("passcodeDots");
        var keypad = document.getElementById("keypad");
        var message = document.getElementById("passcode-message");
        var passcodeScreen = document.getElementById("passcodeScreen");
        var giftStage = document.getElementById("giftStage");
        var messageText = document.getElementById("messageText");
        var enteredPin = "";
        var pinLength = 4;

        for (var i = 0; i < pinLength; i++) {
          var dot = document.createElement("span");
          dot.className = "passcode-dot";
          dotsContainer.appendChild(dot);
        }
        var dots = dotsContainer.querySelectorAll(".passcode-dot");

        var keys = ["1","2","3","4","5","6","7","8","9"];
        keys.forEach(function (k) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "key";
          btn.dataset.key = k;
          btn.textContent = k;
          keypad.appendChild(btn);
        });
        var placeholder = document.createElement("span");
        placeholder.className = "keypad-placeholder";
        placeholder.setAttribute("aria-hidden", "true");
        keypad.appendChild(placeholder);

        var zeroBtn = document.createElement("button");
        zeroBtn.type = "button";
        zeroBtn.className = "key";
        zeroBtn.dataset.key = "0";
        zeroBtn.textContent = "0";
        keypad.appendChild(zeroBtn);

        var delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "key key-delete";
        delBtn.dataset.action = "delete";
        delBtn.setAttribute("aria-label", "Xóa số cuối");
        delBtn.textContent = "\\u00d7";
        keypad.appendChild(delBtn);

        function updateDots() {
          dots.forEach(function (dot, index) {
            dot.classList.toggle("is-filled", index < enteredPin.length);
          });
        }

        function typeMessage(text) {
          messageText.textContent = "";
          var cursor = document.createElement("span");
          cursor.className = "message-cursor";
          cursor.textContent = "|";
          messageText.appendChild(cursor);
          var i = 0;
          function step() {
            if (i < text.length) {
              cursor.insertAdjacentText("beforebegin", text[i]);
              i++;
              window.setTimeout(step, 35);
            } else {
              cursor.remove();
            }
          }
          step();
        }

        function unlock() {
          passcodeScreen.remove();
          giftStage.hidden = false;
          window.setTimeout(function () {
            giftStage.classList.remove("container");
          }, 50);
          typeMessage(MESSAGE);
        }

        function submitPin() {
          fetch(window.location.pathname + "/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ passcode: enteredPin })
          })
            .then(function (res) { return res.json().then(function (data) { return { status: res.status, data: data }; }); })
            .then(function (result) {
              if (result.data && result.data.ok) {
                message.textContent = "Đúng rồi, đang mở quà...";
                message.classList.remove("is-error");
                window.setTimeout(unlock, 180);
              } else if (result.status === 429) {
                message.textContent = "Nhập sai quá nhiều lần, thử lại sau nha";
                message.classList.add("is-error");
                enteredPin = "";
                updateDots();
              } else {
                message.textContent = "Pass chưa đúng, thử lại nha";
                message.classList.add("is-error");
                enteredPin = "";
                updateDots();
              }
            })
            .catch(function () {
              message.textContent = "Có lỗi xảy ra, thử lại nha";
              message.classList.add("is-error");
              enteredPin = "";
              updateDots();
            });
        }

        function addDigit(digit) {
          if (enteredPin.length >= pinLength) return;
          enteredPin += digit;
          message.textContent = "";
          message.classList.remove("is-error");
          updateDots();
          if (enteredPin.length === pinLength) {
            window.setTimeout(submitPin, 180);
          }
        }

        keypad.addEventListener("click", function (event) {
          var btn = event.target.closest("button");
          if (!btn) return;
          if (btn.dataset.action === "delete") {
            enteredPin = enteredPin.slice(0, -1);
            message.textContent = "";
            message.classList.remove("is-error");
            updateDots();
            return;
          }
          if (btn.dataset.key) addDigit(btn.dataset.key);
        });

        document.addEventListener("keydown", function (event) {
          if (!passcodeScreen.isConnected) return;
          if (/^[0-9]$/.test(event.key)) {
            addDigit(event.key);
          } else if (event.key === "Backspace") {
            enteredPin = enteredPin.slice(0, -1);
            updateDots();
          }
        });
      }());
    </script>`;

  return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#eef1f3">
    <title>${safeTitle}</title>
    <link rel="stylesheet" href="/css/style.css">
    <link rel="stylesheet" href="/css/main.css">
    <link rel="icon" href="/img/flowers.png" type="image/x-icon">
</head>
<body>
    ${body}
    ${script}
</body>
</html>`;
}
