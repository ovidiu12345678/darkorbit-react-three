const PORT = 9123;

async function send(ws, method, params = {}) {
  const id = Math.floor(Math.random() * 1e9);
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve) => {
    function onMsg(ev) {
      const data = JSON.parse(ev.data);
      if (data.id === id) {
        ws.removeEventListener("message", onMsg);
        resolve(data.result);
      }
    }
    ws.addEventListener("message", onMsg);
  });
}

async function main() {
  const res = await fetch(`http://127.0.0.1:${PORT}/json/new?http://localhost:5173/debug-source.html`, { method: "PUT" });
  const target = await res.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener("open", resolve));
  await send(ws, "Page.enable");
  await send(ws, "Emulation.setDeviceMetricsOverride", { width: 2200, height: 1500, deviceScaleFactor: 1, mobile: false });
  await new Promise((r) => setTimeout(r, 1200));

  const fs = await import("fs");
  const shot = await send(ws, "Page.captureScreenshot", {
    format: "png",
    clip: { x: 150, y: 0, width: 650, height: 500, scale: 1.5 },
  });
  fs.writeFileSync("E:/darkorbit-react-three-romana/darkorbit-react-three/source-zoom.png", Buffer.from(shot.data, "base64"));

  process.exit(0);
}

main().catch((e) => { console.error("FAILED:", e); process.exit(1); });
