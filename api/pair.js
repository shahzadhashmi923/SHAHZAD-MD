import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys"
import fs from "fs"

export default async function handler(req, res) {
  try {
    const num = (req.query.num || "").replace(/[^0-9]/g, "");
    if (!num) return res.status(400).json({ error: "Number missing" });

    const dir = `/tmp/${num}`;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(dir);
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ["SHAHZAD-MD", "Chrome", "1.0.0"],
    });

    sock.ev.on("creds.update", saveCreds);

    // Wait a bit then request code
    await new Promise((r) => setTimeout(r, 2000));
    
    if (!sock.authState.creds.registered) {
      let code = await sock.requestPairingCode(num);
      return res.status(200).json({ code });
    } else {
      return res.status(200).json({ error: "Already registered" });
    }
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: e.message });
  }
}
