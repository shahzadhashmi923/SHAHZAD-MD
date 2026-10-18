const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");

module.exports = async (req, res) => {
  const num = req.query.num?.replace(/[^0-9]/g,'');
  if(!num) return res.json({error:"Number do"});

  const dir = `/tmp/${num}`;
  if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true});
  
  const { state, saveCreds } = await useMultiFileAuthState(dir);
  const sock = makeWASocket({ auth: state, printQRInTerminal:false, browser:["SHAHZAD-MD","Chrome","1.0"] });

  sock.ev.on("creds.update", saveCreds);

  if(!sock.authState.creds.registered){
    await new Promise(r=>setTimeout(r,1500));
    let code = await sock.requestPairingCode(num);
    code = code?.match(/.{1,4}/g)?.join("-") || code;
    return res.json({code});
  }
  res.json({error:"Already paired"});
};
