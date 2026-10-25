(() => {
  if (window.__deltaForceCodeHelperLoaded) return;
  window.__deltaForceCodeHelperLoaded = true;

  const INPUT_SELECTOR = "input.spr.exc-input";
  const SUBMIT_SELECTOR = "a.spr.btn-exchange";
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  const host = document.createElement("div");
  host.id = "delta-code-helper-root";
  host.style.cssText = "all:initial;position:fixed;z-index:2147483647;right:20px;bottom:20px;width:min(390px,calc(100vw - 32px));font-family:Inter,'Segoe UI',Arial,sans-serif;color:#eef4ff;";
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      * { box-sizing: border-box; }
      .card { overflow:hidden; border:1px solid rgba(148,163,184,.2); border-radius:18px; background:#101827; box-shadow:0 20px 60px rgba(0,0,0,.4); color:#eef4ff; }
      .top { padding:17px 18px 14px; background:linear-gradient(130deg,#172b49,#172033 68%); border-bottom:1px solid rgba(148,163,184,.13); }
      .heading { display:flex; align-items:center; gap:11px; }
      .logo { display:grid; place-items:center; width:38px; height:38px; border-radius:12px; background:linear-gradient(145deg,#57a5ff,#6759f5); color:white; font-size:19px; font-weight:800; box-shadow:0 5px 18px #4f79ff55; }
      h2 { margin:0; color:#f7f9ff; font-size:15px; font-weight:750; letter-spacing:.1px; }
      .subtitle { margin-top:4px; color:#aab8ce; font-size:11px; }
      .body { padding:16px 18px 18px; }
      label { display:flex; justify-content:space-between; margin-bottom:8px; color:#dce6f5; font-size:12px; font-weight:650; }
      .hint { color:#8e9db3; font-size:11px; font-weight:400; }
      textarea { display:block; width:100%; min-height:116px; max-height:220px; resize:vertical; border:1px solid #344258; border-radius:11px; outline:none; padding:11px 12px; background:#0b1220; color:#f4f7fc; font:12px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace; transition:border-color .15s,box-shadow .15s; }
      textarea::placeholder { color:#74839a; }
      textarea:focus { border-color:#5c9dff; box-shadow:0 0 0 3px #4388fa22; }
      textarea:disabled { opacity:.62; }
      .meta { display:flex; align-items:center; justify-content:space-between; margin-top:8px; color:#8e9db3; font-size:11px; }
      .statusline { display:flex; align-items:flex-start; gap:8px; margin:14px 0 12px; min-height:32px; color:#c4d0e1; font-size:12px; line-height:1.45; }
      .dot { flex:none; width:8px; height:8px; margin-top:4px; border-radius:50%; background:#718096; }
      .dot.active { background:#41d99a; box-shadow:0 0 10px #41d99a77; }
      .dot.paused { background:#f4b942; }
      .dot.error { background:#ff7373; }
      .progress-wrap { height:5px; overflow:hidden; border-radius:8px; background:#263246; }
      .progress { width:0; height:100%; border-radius:8px; background:linear-gradient(90deg,#4c9aff,#7e72ff); transition:width .25s ease; }
      .progress-label { display:flex; justify-content:space-between; margin:7px 0 14px; color:#92a1b6; font-size:10px; }
      .buttons { display:flex; gap:8px; }
      button { min-height:38px; border:0; border-radius:10px; padding:0 13px; cursor:pointer; color:#edf4ff; font:650 12px 'Segoe UI',Arial,sans-serif; transition:filter .15s,transform .15s,background .15s; }
      button:hover:not(:disabled) { filter:brightness(1.1); transform:translateY(-1px); }
      button:disabled { cursor:not-allowed; opacity:.42; }
      .primary { flex:1; background:linear-gradient(110deg,#398cf5,#6259ec); box-shadow:0 5px 15px #456ff033; }
      .secondary { background:#263348; }
      .stop { background:#3a2730; color:#ffbdc4; }
      .foot { margin-top:12px; color:#77879e; font-size:10px; line-height:1.4; }
      @media (max-width:480px) { :host { right:10px !important; bottom:10px !important; width:calc(100vw - 20px) !important; } }
    </style>
    <section class="card" aria-label="Delta Force Code Helper">
      <header class="top">
        <div class="heading"><div class="logo">D</div><div><h2>Delta Force · Nhập mã</h2><div class="subtitle">Tự động gửi lần lượt từng mã đổi thưởng</div></div></div>
      </header>
      <div class="body">
        <label for="codes"><span>Danh sách mã</span><span class="hint">mỗi dòng một mã</span></label>
        <textarea id="codes" spellcheck="false" placeholder="DFCODE123&#10;DFCODE456&#10;DFCODE789"></textarea>
        <div class="meta"><span id="count">0 mã</span><span>Ngăn cách bằng xuống dòng hoặc dấu phẩy</span></div>
        <div class="statusline"><span class="dot" id="dot"></span><span id="status" aria-live="polite">Dán danh sách mã vào đây để bắt đầu.</span></div>
        <div class="progress-wrap"><div class="progress" id="progress"></div></div>
        <div class="progress-label"><span id="progressText">Sẵn sàng</span><span id="percent">0%</span></div>
        <div class="buttons">
          <button class="primary" id="start">▶&nbsp; Bắt đầu</button>
          <button class="secondary" id="pause" disabled>Tạm dừng</button>
          <button class="stop" id="stop" disabled>Dừng</button>
        </div>
        <div class="foot">Hãy đăng nhập và hoàn tất xác minh trên trang trước khi chạy. Kiểm tra kết quả hiển thị sau mỗi mã.</div>
      </div>
    </section>`;
  document.documentElement.appendChild(host);

  const $ = selector => shadow.querySelector(selector);
  const textarea = $("#codes");
  const count = $("#count");
  const status = $("#status");
  const dot = $("#dot");
  const progress = $("#progress");
  const progressText = $("#progressText");
  const percent = $("#percent");
  const startButton = $("#start");
  const pauseButton = $("#pause");
  const stopButton = $("#stop");

  let running = false;
  let paused = false;
  let stopRequested = false;
  let pauseResolver = null;
  let current = 0;
  let total = 0;

  function getCodes() {
    return textarea.value.split(/[\n\r,;]+/).map(code => code.trim()).filter(Boolean);
  }

  function updateCount() {
    const amount = getCodes().length;
    count.textContent = `${amount} mã`;
  }

  function setStatus(message, state = "") {
    status.textContent = message;
    dot.className = `dot ${state}`.trim();
  }

  function updateProgress(done, all) {
    const value = all ? Math.round(done / all * 100) : 0;
    progress.style.width = `${value}%`;
    progressText.textContent = all ? `${done} / ${all} mã` : "Sẵn sàng";
    percent.textContent = `${value}%`;
  }

  function setRunningControls(isRunning) {
    running = isRunning;
    textarea.disabled = isRunning;
    startButton.disabled = isRunning;
    pauseButton.disabled = !isRunning;
    stopButton.disabled = !isRunning;
    startButton.textContent = isRunning ? "Đang chạy…" : "▶  Bắt đầu";
  }

  function dismissNotice() {
    const labels = new Set(["ok", "đóng", "đồng ý", "xác nhận", "确 定", "确定"]);
    const candidates = [...document.querySelectorAll('button, a, [role="button"]')];
    const button = candidates.find(element => {
      const rect = element.getBoundingClientRect();
      const text = (element.innerText || element.getAttribute("aria-label") || "").trim().toLowerCase();
      return rect.width && rect.height && labels.has(text);
    });
    if (button) {
      button.click();
      return;
    }
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    document.elementFromPoint(2, 2)?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
  }

  async function waitUntilResumed() {
    while (paused && !stopRequested) {
      await new Promise(resolve => { pauseResolver = resolve; });
      pauseResolver = null;
    }
  }

  textarea.addEventListener("input", updateCount);
  startButton.addEventListener("click", async () => {
    const codes = getCodes();
    if (!codes.length) {
      setStatus("Hãy nhập hoặc dán ít nhất một mã trước khi bắt đầu.", "error");
      textarea.focus();
      return;
    }

    current = 0;
    total = codes.length;
    paused = false;
    stopRequested = false;
    setRunningControls(true);
    pauseButton.textContent = "Tạm dừng";
    updateProgress(0, total);

    try {
      for (const [index, code] of codes.entries()) {
        await waitUntilResumed();
        if (stopRequested) break;

        setStatus(`Đang nhập mã ${index + 1}/${total}: ${code}`, "active");
        progressText.textContent = `Đang xử lý ${index + 1} / ${total}`;
        const input = document.querySelector(INPUT_SELECTOR);
        const submit = document.querySelector(SUBMIT_SELECTOR);
        if (!input || !submit) throw new Error("Không tìm thấy ô nhập hoặc nút đổi mã trên trang.");
        input.scrollIntoView({ block: "center" });
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
        setter.call(input, code);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        await delay(350);
        submit.click();
        await delay(2200);
        dismissNotice();
        current = index + 1;
        updateProgress(current, total);

        if (paused && !stopRequested) {
          setStatus(`Đã xử lý ${current}/${total} mã. Đang tạm dừng.`, "paused");
          await waitUntilResumed();
        }
        if (stopRequested) break;
        if (index + 1 < total) await delay(1500);
      }

      if (stopRequested) {
        setStatus(`Đã dừng theo yêu cầu sau ${current}/${total} mã.`, "paused");
      } else {
        updateProgress(total, total);
        setStatus(`Đã gửi xong ${total} mã. Hãy xem kết quả trên trang.`, "active");
      }
    } catch (error) {
      setStatus(`Đã dừng sau ${current} mã: ${error.message}`, "error");
    } finally {
      paused = false;
      stopRequested = false;
      setRunningControls(false);
      pauseButton.textContent = "Tạm dừng";
    }
  });

  pauseButton.addEventListener("click", () => {
    if (!running) return;
    paused = !paused;
    if (paused) {
      pauseButton.textContent = "Tiếp tục";
      setStatus(`Đang tạm dừng sau mã hiện tại (${current}/${total}).`, "paused");
    } else {
      pauseButton.textContent = "Tạm dừng";
      setStatus(`Tiếp tục xử lý từ mã ${current + 1}/${total}.`, "active");
      pauseResolver?.();
    }
  });

  stopButton.addEventListener("click", () => {
    stopRequested = true;
    paused = false;
    pauseResolver?.();
    setStatus("Đang dừng sau khi hoàn tất mã hiện tại…", "paused");
  });

  updateCount();
})();
