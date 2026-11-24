// tiny-stack-vm-01: one small interpreter for make.fun's tiny stack ISA
// (kit: generator/subject/ISA.md; vm.mjs there is the rule). Every check runs
// in ISA.md's order: step limit, pc range, opcode known, immediate fits, then
// the stack needs (underflow 2, overflow 3), then the instruction's own traps.
// Arithmetic is exact: Math.imul for MUL, unsigned reads for DIVU/MODU/LTU,
// shift counts masked to 5 bits, and each trap keeps the output written so
// far and exits with the trap's own code (2 to 11), never a single fault.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Per-opcode [immediate bytes, pops, pushes]; a missing entry is trap 5.
const IM = new Array(256).fill(-1);
const PP = new Array(256).fill(0);
const PU = new Array(256).fill(0);
const def = (o, i, p, u) => { IM[o] = i; PP[o] = p; PU[o] = u; };
def(0x00, 0, 0, 0); def(0x01, 1, 0, 1); def(0x02, 4, 0, 1); def(0x03, 0, 1, 0);
def(0x04, 0, 1, 2); def(0x05, 0, 2, 2); def(0x06, 0, 2, 3); def(0x07, 0, 3, 3);
for (let o = 0x10; o <= 0x22; o++) def(o, 0, 2, 1);
def(0x17, 0, 1, 1); def(0x1b, 0, 1, 1);
def(0x30, 2, 0, 0); def(0x31, 2, 1, 0); def(0x32, 2, 1, 0); def(0x33, 2, 0, 0);
def(0x34, 0, 0, 0); def(0x40, 0, 1, 1); def(0x41, 0, 2, 0); def(0x50, 0, 1, 0);
def(0x51, 0, 1, 0); def(0x52, 0, 0, 1); def(0x53, 0, 1, 0);

const enc = new TextEncoder();

function run(p, inp) {
  const n = p.length;
  const D = new Int32Array(256);
  const C = new Int32Array(64);
  const M = new Int32Array(256);
  const out = new Uint8Array(65536);
  let sp = 0, csp = 0, ol = 0, ip = 0, pc = 0, steps = 0;
  const done = (code) => ({ out: out.slice(0, ol), code });
  for (;;) {
    if (steps === 1000000) return done(10);
    if (pc < 0 || pc >= n) return done(9);
    const op = p[pc];
    if (IM[op] < 0) return done(5);
    if (pc + IM[op] >= n) return done(9);
    steps++;
    if (sp < PP[op]) return done(2);
    if (sp - PP[op] + PU[op] > 256) return done(3);
    const next = pc + 1 + IM[op];
    pc = next;
    if (op >= 0x10 && op <= 0x22 && op !== 0x17 && op !== 0x1b) {
      const b = D[sp - 1], a = D[sp - 2];
      let r;
      if (op === 0x10) r = (a + b) | 0;
      else if (op === 0x11) r = (a - b) | 0;
      else if (op === 0x12) r = Math.imul(a, b);
      else if (op === 0x13) { if (b === 0) return done(4); r = a === -2147483648 && b === -1 ? a : (a / b) | 0; }
      else if (op === 0x14) { if (b === 0) return done(4); r = b === -1 ? 0 : (a % b) | 0; }
      else if (op === 0x15) { if (b === 0) return done(4); r = Math.floor((a >>> 0) / (b >>> 0)) | 0; }
      else if (op === 0x16) { if (b === 0) return done(4); r = ((a >>> 0) % (b >>> 0)) | 0; }
      else if (op === 0x18) r = a & b;
      else if (op === 0x19) r = a | b;
      else if (op === 0x1a) r = a ^ b;
      else if (op === 0x1c) r = a << (b & 31);
      else if (op === 0x1d) r = a >> (b & 31);
      else if (op === 0x1e) r = (a >>> (b & 31)) | 0;
      else if (op === 0x20) r = a === b ? 1 : 0;
      else if (op === 0x21) r = a < b ? 1 : 0;
      else r = (a >>> 0) < (b >>> 0) ? 1 : 0;
      D[sp - 2] = r;
      sp--;
      continue;
    }
    switch (op) {
      case 0x00: return done(0);
      case 0x01: D[sp++] = (p[next - 1] << 24) >> 24; break;
      case 0x02: D[sp++] = p[next - 4] | (p[next - 3] << 8) | (p[next - 2] << 16) | (p[next - 1] << 24); break;
      case 0x03: sp--; break;
      case 0x04: D[sp] = D[sp - 1]; sp++; break;
      case 0x05: { const t = D[sp - 1]; D[sp - 1] = D[sp - 2]; D[sp - 2] = t; break; }
      case 0x06: D[sp] = D[sp - 2]; sp++; break;
      case 0x07: { const a = D[sp - 3]; D[sp - 3] = D[sp - 2]; D[sp - 2] = D[sp - 1]; D[sp - 1] = a; break; }
      case 0x17: D[sp - 1] = -D[sp - 1] | 0; break;
      case 0x1b: D[sp - 1] = ~D[sp - 1]; break;
      case 0x30: case 0x31: case 0x32: {
        const rel = ((p[next - 2] | (p[next - 1] << 8)) << 16) >> 16;
        let take = true;
        if (op !== 0x30) { const v = D[--sp]; take = op === 0x31 ? v === 0 : v !== 0; }
        if (take) pc = next + rel;
        break;
      }
      case 0x33:
        if (csp === 64) return done(7);
        C[csp++] = next;
        pc = p[next - 2] | (p[next - 1] << 8);
        break;
      case 0x34:
        if (csp === 0) return done(8);
        pc = C[--csp];
        break;
      case 0x40: {
        const ad = D[sp - 1];
        if (ad < 0 || ad > 255) return done(6);
        D[sp - 1] = M[ad];
        break;
      }
      case 0x41: {
        const ad = D[sp - 1];
        if (ad < 0 || ad > 255) return done(6);
        M[ad] = D[sp - 2];
        sp -= 2;
        break;
      }
      case 0x50: {
        const bs = enc.encode(String(D[sp - 1]));
        if (ol + bs.length > 65536) return done(11);
        sp--;
        out.set(bs, ol);
        ol += bs.length;
        break;
      }
      case 0x51:
        if (ol + 1 > 65536) return done(11);
        out[ol++] = D[--sp] & 255;
        break;
      case 0x52: D[sp++] = ip < inp.length ? inp[ip++] : -1; break;
      case 0x53: return done(D[--sp] & 255);
    }
  }
}

const I = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
// Only directories are instances; a stray file in /input must not crash the
// run and leave every later instance unanswered.
const ids = readdirSync(I, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
for (const id of ids) {
  const r = run(new Uint8Array(readFileSync(join(I, id, 'program.bin'))), new Uint8Array(readFileSync(join(I, id, 'input.bin'))));
  mkdirSync(join(O, id), { recursive: true });
  writeFileSync(join(O, id, 'stdout.bin'), r.out);
  writeFileSync(join(O, id, 'exit.txt'), `${r.code}\n`);
}
