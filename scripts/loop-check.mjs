const RPC = "https://evm-testnet.qore.host";
const CONTRACT = "0xad9261bf5e318c34e3d51435288a354c8f60d2eb";
const DEPLOYER = "0xD5327A02C83C737Db5633728DA6AE7EC623f610a";
const SAMPLE = "Dear future me, this is a sample letter. It was sealed on the QoreChain testnet and it opens five minutes later. Nothing real is inside.";
const GET = "0x3aac3858", TOTAL = "0xb49ce17f", OPEN = "0x21e11f88";
async function rpc(method, params) {
  const r = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
  const j = await r.json(); if (j.error) throw new Error(JSON.stringify(j.error)); return j.result;
}
const pad = (n) => BigInt(n).toString(16).padStart(64, "0");
function encStr(s) { const b = new TextEncoder().encode(s); let d = ""; b.forEach(x => d += x.toString(16).padStart(2,"0")); d = d.padEnd(Math.ceil(d.length/64)*64, "0"); return { len: pad(b.length), data: d }; }
function encOpen(id, letter) { const s = encStr(letter); return OPEN + pad(id) + pad(64) + s.len + s.data; }
const now = Math.floor(Date.now()/1000);
console.log("now:", now, new Date(now*1000).toISOString());
const total = await rpc("eth_call", [{ to: CONTRACT, data: TOTAL }, "latest"]);
console.log("totalCapsules:", parseInt(total, 16));
const raw = await rpc("eth_call", [{ to: CONTRACT, data: GET + pad(0) }, "latest"]);
const body = raw.slice(2); const w = i => body.slice(i*64,(i+1)*64);
const off = parseInt(w(4),16), len = parseInt(body.slice(off*2, off*2+64),16);
const title = new TextDecoder().decode(new Uint8Array(body.slice(off*2+64, off*2+64+len*2).match(/../g).map(h=>parseInt(h,16))));
console.log("capsule 0:", { creator: "0x"+w(0).slice(24), letterHash: "0x"+w(1), unlockTime: parseInt(w(2),16), opened: parseInt(w(3),16)!==0, title });
// Simulate open with correct letter, from deployer
try {
  const res = await rpc("eth_call", [{ from: DEPLOYER, to: CONTRACT, data: encOpen(0, SAMPLE) }, "latest"]);
  console.log("open simulation (correct letter): SUCCESS, returned", res);
} catch (e) { console.log("open simulation (correct letter): REVERTED:", e.message); }
// Simulate open with wrong letter — should revert
try {
  const res = await rpc("eth_call", [{ from: DEPLOYER, to: CONTRACT, data: encOpen(0, "wrong letter") }, "latest"]);
  console.log("open simulation (wrong letter): UNEXPECTED SUCCESS", res);
} catch (e) { console.log("open simulation (wrong letter): correctly reverts"); }
