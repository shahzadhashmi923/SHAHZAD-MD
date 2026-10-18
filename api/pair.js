import makeWASocket, { useMultiFileAuthState, makeCacheableSignalKeyStore, delay } from "@whiskeysockets/baileys"
import P from "pino"
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  const num = (req.query.num || "").replace(/[^0-9]/g, "");
  if (!num) return res.status(400).json({ error: "Number do" });
  try {
    const { state, saveCreds } = await useMultiFileAuthState("/tmp/" + num);
    const sock = makeWASocket({
      auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, P().child({}).info) },
      printQRInTerminal: false,
      logger: P({ level: "silent" }),
      browser: ["Ubuntu", "Chrome", "20.0"]
    });
    sock.ev.on("creds.update", saveCreds);
    if (!sock.authState.creds.registered) {
      await delay(3000);
      let code = await sock.requestPairingCode(num);
      code = code?.match(/.{1,4}/g)?.join("-") || code;
      return res.json({ code });
    }
    return res.json({ error: "Already registered" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
