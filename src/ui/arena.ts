import { CONFIG } from '../config';
import { CREATURES } from '../data/creatures';
import { areaById } from '../game/progression';
import type { GameEvent } from '../game/events';
import type { RunState } from '../game/state';
import { formatNumber } from './format';

const A = CONFIG.arena;
const EMOJI_FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", system-ui, sans-serif';

interface Floater {
  text: string;
  color: string;
  size: number;
  x: number;
  y: number;
  age: number;
}
interface Effect {
  kind: 'ring' | 'swing';
  /** Ring radius (tap strikes). */
  radius: number;
  x: number;
  y: number;
  toX: number;
  toY: number;
  age: number;
}

export interface ArenaRenderer {
  /** Fit the canvas to its container; call when the container may have changed size. */
  resize(): void;
  draw(run: RunState, dt: number, moveMode: boolean): void;
  showEvents(events: GameEvent[]): void;
  /** Convert a pointer position to arena units. */
  toWorld(clientX: number, clientY: number): { x: number; y: number };
  clear(): void;
}

export function createArenaRenderer(canvas: HTMLCanvasElement, wrap: HTMLElement): ArenaRenderer {
  const ctx = canvas.getContext('2d')!;
  let scale = 1;
  let dpr = 1;
  let floaters: Floater[] = [];
  let effects: Effect[] = [];
  /** Last known x per enemy, to flip sprites toward their direction of travel. */
  const lastX = new Map<number, { x: number; facingRight: boolean }>();

  function resize(): void {
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (w === 0 || h === 0) return;
    scale = Math.min(w / A.width, h / A.height);
    dpr = window.devicePixelRatio || 1;
    canvas.style.width = `${A.width * scale}px`;
    canvas.style.height = `${A.height * scale}px`;
    canvas.width = Math.round(A.width * scale * dpr);
    canvas.height = Math.round(A.height * scale * dpr);
  }

  function emoji(icon: string, x: number, y: number, size: number, flip = false, filter = ''): void {
    ctx.save();
    ctx.translate(x, y);
    if (flip) ctx.scale(-1, 1);
    if (filter) ctx.filter = filter;
    ctx.font = `${size}px ${EMOJI_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, 0, 0);
    ctx.restore();
  }

  function hpBar(x: number, y: number, width: number, pct: number): void {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x - width / 2, y, width, 1.4);
    ctx.fillStyle = '#d9534f';
    ctx.fillRect(x - width / 2, y, width * Math.max(0, pct), 1.4);
  }

  return {
    resize,

    toWorld(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      return { x: ((clientX - rect.left) / rect.width) * A.width, y: ((clientY - rect.top) / rect.height) * A.height };
    },

    clear() {
      floaters = [];
      effects = [];
      lastX.clear();
    },

    showEvents(events) {
      for (const ev of events) {
        switch (ev.type) {
          case 'damage':
            floaters.push({
              text: ev.double ? `-${formatNumber(ev.amount)} ×2!` : `-${formatNumber(ev.amount)}`,
              color: ev.double ? '#ff5e7e' : ev.source === 'tap' ? '#ff8a65' : '#e8e6e1',
              size: ev.source === 'tap' || ev.double ? 4.4 : 3.6,
              x: ev.x + (Math.random() - 0.5) * 4,
              y: ev.y - 4,
              age: 0,
            });
            break;
          case 'kill':
            floaters.push({ text: `+${formatNumber(ev.gold)}g`, color: '#f2c14e', size: 4, x: ev.x, y: ev.y - 7, age: 0 });
            break;
          case 'tap':
            effects.push({ kind: 'ring', radius: ev.radius, x: ev.x, y: ev.y, toX: 0, toY: 0, age: 0 });
            break;
          case 'swing':
            effects.push({ kind: 'swing', radius: 0, x: ev.fromX, y: ev.fromY, toX: ev.toX, toY: ev.toY, age: 0 });
            break;
        }
      }
    },

    draw(run, dt, moveMode) {
      if (canvas.width === 0) resize();
      const area = areaById(run.areaId);
      ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);

      // Floor with a faint dot grid.
      ctx.fillStyle = area?.floor ?? '#2b2d36';
      ctx.fillRect(0, 0, A.width, A.height);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      for (let gx = 5; gx < A.width; gx += 10) for (let gy = 5; gy < A.height; gy += 10) ctx.fillRect(gx - 0.3, gy - 0.3, 0.6, 0.6);
      if (moveMode) {
        ctx.strokeStyle = 'rgba(124,198,254,0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, 0.5, A.width - 1, A.height - 1);
      }

      // Move marker.
      const mt = run.player.moveTarget;
      if (mt) {
        ctx.strokeStyle = '#7cc6fe';
        ctx.lineWidth = 0.6;
        ctx.setLineDash([1.5, 1.5]);
        ctx.beginPath();
        ctx.arc(mt.x, mt.y, 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Enemies.
      const alive = new Set<number>();
      for (const e of run.enemies) {
        alive.add(e.id);
        const def = CREATURES[e.creatureId];
        const r = e.isBoss ? A.bossRadius : A.enemyRadius;
        const prev = lastX.get(e.id);
        const facingRight = prev ? (Math.abs(e.x - prev.x) > 0.001 ? e.x > prev.x : prev.facingRight) : false;
        lastX.set(e.id, { x: e.x, facingRight });
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(e.x, e.y + r * 0.8, r * 0.8, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        // Most creature emoji face left; mirror them when walking right.
        emoji(def.icon, e.x, e.y, r * 2.1, facingRight, def.tint ?? '');
        if (e.hp.lt(e.maxHp)) hpBar(e.x, e.y - r - 2.5, r * 2, e.hp.div(e.maxHp).toNumber());
        if (e.id === run.player.targetId) {
          ctx.strokeStyle = 'rgba(242,193,78,0.5)';
          ctx.lineWidth = 0.4;
          ctx.beginPath();
          ctx.arc(e.x, e.y, r + 1.2, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      for (const id of lastX.keys()) if (!alive.has(id)) lastX.delete(id);

      // Effects.
      effects = effects.filter((fx) => (fx.age += dt) < (fx.kind === 'ring' ? 0.35 : 0.15));
      for (const fx of effects) {
        if (fx.kind === 'ring') {
          const t = fx.age / 0.35;
          ctx.strokeStyle = `rgba(255,138,101,${1 - t})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(fx.x, fx.y, fx.radius * (0.4 + 0.6 * t), 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.strokeStyle = `rgba(255,255,255,${0.8 - fx.age / 0.15 * 0.8})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(fx.x, fx.y);
          ctx.lineTo(fx.toX, fx.toY);
          ctx.stroke();
        }
      }

      // Player.
      const p = run.player;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + A.playerRadius * 0.9, A.playerRadius * 0.9, A.playerRadius * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f2c14e';
      ctx.strokeStyle = '#1b1d24';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, A.playerRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      emoji('⚔️', p.x, p.y + 0.2, A.playerRadius * 1.3);

      // Floating numbers.
      floaters = floaters.filter((f) => (f.age += dt) < 0.8);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const f of floaters) {
        ctx.globalAlpha = 1 - f.age / 0.8;
        ctx.font = `800 ${f.size}px system-ui, sans-serif`;
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, f.x, f.y - f.age * 9);
      }
      ctx.globalAlpha = 1;
    },
  };
}
