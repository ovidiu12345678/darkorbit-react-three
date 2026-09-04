import { useEffect, useRef, useState } from "react";
import InterfataJoc from "./components/InterfataJoc.jsx";

const WORLD_WIDTH = 1800;
const WORLD_HEIGHT = 1200;
const PLAYER_SPEED = 315;
const PLAYER_RADIUS = 38;
const SHIP_WIDTH = 210;
const SHIP_HEIGHT = 140;
const ENEMY_SPEED = 72;
const PROJECTILE_SPEED = 360;
const STOP_DISTANCE = 8;
const LASER_RANGE = 470;
const LASER_COOLDOWN = 0.32;
const SHIP_TEXTURE_FORWARD_OFFSET = (157.4 * Math.PI) / 180;

const AMMO_TYPES = [
  { id: "x1", label: "x1", color: "#59e6ff", damage: 6, shieldDamage: 4 },
  { id: "x2", label: "x2", color: "#8cff6b", damage: 9, shieldDamage: 6 },
  { id: "x3", label: "x3", color: "#ffd35a", damage: 13, shieldDamage: 8 },
  { id: "x4", label: "x4", color: "#ff4add", damage: 18, shieldDamage: 10 },
  { id: "sab", label: "SAB", color: "#82b7ff", damage: 2, shieldDamage: 18, drainShield: true },
];

const AMMO_BY_ID = Object.fromEntries(AMMO_TYPES.map((ammo) => [ammo.id, ammo]));

const ENEMIES = [
  { id: "x-01", x: 1550, y: 255, color: "#8cff6b", scale: 0.9 },
  { id: "x-02", x: 290, y: 270, color: "#ff4add", scale: 0.95 },
  { id: "x-03", x: 1505, y: 980, color: "#36f5ff", scale: 0.82 },
  { id: "x-04", x: 330, y: 980, color: "#ffd35a", scale: 0.86 },
].map((enemy, index) => ({
  ...enemy,
  baseX: enemy.x,
  baseY: enemy.y,
  angle: 0,
  cooldown: 0.8 + index * 0.35,
  hp: 100,
  shield: 70,
  hitFlash: 0,
  respawnIn: 0,
  patrol: index * 1.7,
}));

const BONUS_BOXES = [
  { x: 350, y: 845, color: "#36f5ff" },
  { x: 510, y: 675, color: "#ffd35a" },
  { x: 1170, y: 590, color: "#ffd35a" },
  { x: 1378, y: 745, color: "#7dffef" },
  { x: 970, y: 902, color: "#ffd35a" },
  { x: 820, y: 430, color: "#8cff6b" },
];

const ASTEROIDS = [
  [455, 520, 26],
  [690, 410, 34],
  [1255, 360, 44],
  [1430, 865, 38],
  [1060, 752, 54],
  [870, 980, 28],
  [335, 955, 22],
  [1500, 550, 32],
  [620, 875, 26],
  [1140, 675, 24],
];

const initialStats = {
  viata: 100,
  scut: 100,
  atacuri: 0,
  amenintare: "sector liber",
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function lerpAngle(current, target, amount) {
  const delta = ((((target - current) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  return current + delta * amount;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function smoothstep(edge0, edge1, value) {
  const x = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return x * x * (3 - 2 * x);
}

function createMaskedImage(image, threshold = 0.15) {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  for (let index = 0; index < pixels.length; index += 4) {
    const r = pixels[index] / 255;
    const g = pixels[index + 1] / 255;
    const b = pixels[index + 2] / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max - min;
    const luminance = r * 0.299 + g * 0.587 + b * 0.114;
    const alpha = smoothstep(threshold, 0.35, max + saturation * 0.75 + luminance * 0.25);

    pixels[index] = Math.min(255, pixels[index] * 1.12);
    pixels[index + 1] = Math.min(255, pixels[index + 1] * 1.12);
    pixels[index + 2] = Math.min(255, pixels[index + 2] * 1.16);
    pixels[index + 3] = Math.round(alpha * 255);
  }

  context.putImageData(imageData, 0, 0);
  return canvas;
}

function formatCoord(value, size) {
  return ((value - size / 2) / 10).toFixed(1);
}

function drawEllipseShield(ctx, player, shieldPercent, flash) {
  if (shieldPercent <= 0.01 && flash <= 0.01) return;

  const baseAlpha = shieldPercent > 0 ? 0.045 + shieldPercent * 0.08 : 0;
  const pulse = Math.sin(performance.now() * 0.006) * 0.015;
  const color = shieldPercent < 0.22 ? "255, 76, 134" : "91, 244, 255";

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.translate(player.x, player.y);

  const glow = ctx.createRadialGradient(0, 0, 8, 0, 0, PLAYER_RADIUS * 1.85 + flash * 18);
  glow.addColorStop(0, `rgba(${color}, ${0.02 + flash * 0.03})`);
  glow.addColorStop(0.62, `rgba(${color}, ${baseAlpha + pulse + flash * 0.09})`);
  glow.addColorStop(1, `rgba(${color}, 0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(0, 0, PLAYER_RADIUS * 1.82 + flash * 12, PLAYER_RADIUS * 1.15 + flash * 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = 2 + flash * 2;
  ctx.strokeStyle = `rgba(${color}, ${0.22 + shieldPercent * 0.34 + flash * 0.3})`;
  ctx.beginPath();
  ctx.ellipse(0, 0, PLAYER_RADIUS * 1.78 + flash * 13, PLAYER_RADIUS * 1.1 + flash * 7, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1;
  ctx.strokeStyle = `rgba(255, 255, 255, ${flash * 0.15})`;
  for (let index = 0; index < 3; index += 1) {
    const radiusX = PLAYER_RADIUS * (1.42 + index * 0.15) + flash * 16;
    const radiusY = PLAYER_RADIUS * (0.86 + index * 0.1) + flash * 9;
    ctx.beginPath();
    ctx.ellipse(0, 0, radiusX, radiusY, 0, Math.PI * 0.18 + index, Math.PI * 1.18 + index);
    ctx.stroke();
  }

  ctx.restore();
}

function drawShip(ctx, shipImage, player, moving, shieldPercent, flash) {
  const rotation = player.angle + SHIP_TEXTURE_FORWARD_OFFSET;

  drawEllipseShield(ctx, player, shieldPercent, flash);

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);

  if (moving) {
    const flame = 0.7 + Math.sin(performance.now() * 0.03) * 0.25;
    const gradient = ctx.createLinearGradient(-PLAYER_RADIUS * 1.5, 0, -PLAYER_RADIUS * 2.9, 0);
    gradient.addColorStop(0, `rgba(71, 244, 255, ${0.42 * flame})`);
    gradient.addColorStop(1, "rgba(71, 244, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(-PLAYER_RADIUS * 0.75, -15);
    ctx.lineTo(-PLAYER_RADIUS * 2.8, 0);
    ctx.lineTo(-PLAYER_RADIUS * 0.75, 15);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(rotation);
  ctx.shadowColor = "rgba(61, 246, 255, 0.75)";
  ctx.shadowBlur = 18;
  ctx.drawImage(shipImage, -SHIP_WIDTH / 2, -SHIP_HEIGHT / 2, SHIP_WIDTH, SHIP_HEIGHT);
  ctx.restore();

  if (flash > 0.02) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.translate(player.x, player.y);
    ctx.strokeStyle = `rgba(255, 255, 255, ${flash * 0.22})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, PLAYER_RADIUS * 2.04 + flash * 22, PLAYER_RADIUS * 1.3 + flash * 12, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawEnemy(ctx, enemyImage, enemy, selected) {
  if (enemy.respawnIn > 0) return;

  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.rotate(enemy.angle + Math.PI / 2);
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = selected ? "#ffffff" : enemy.color;
  ctx.lineWidth = 3;
  ctx.globalAlpha = selected ? 0.78 : 0.45;
  ctx.beginPath();
  ctx.arc(0, 0, (38 + enemy.hitFlash * 10) * enemy.scale, 0, Math.PI * 2);
  ctx.stroke();

  if (enemy.shield > 0) {
    ctx.strokeStyle = "rgba(91, 244, 255, 0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 46 * enemy.scale, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (enemy.shield / 70));
    ctx.stroke();
  }

  if (enemy.hp > 0 && enemy.hp < 100) {
    ctx.strokeStyle = "rgba(255, 78, 120, 0.62)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 51 * enemy.scale, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (enemy.hp / 100));
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.shadowColor = enemy.color;
  ctx.shadowBlur = 16 + enemy.hitFlash * 16;
  ctx.drawImage(enemyImage, -42 * enemy.scale, -32 * enemy.scale, 84 * enemy.scale, 64 * enemy.scale);
  ctx.restore();
}

function drawBonusBox(ctx, box, time) {
  const pulse = 0.85 + Math.sin(time * 0.004 + box.x) * 0.15;

  ctx.save();
  ctx.translate(box.x, box.y);
  ctx.rotate(time * 0.001 + box.x);
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = box.color;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 2;
  ctx.strokeRect(-10 * pulse, -10 * pulse, 20 * pulse, 20 * pulse);
  ctx.fillStyle = box.color;
  ctx.globalAlpha = 0.7;
  ctx.fillRect(-5, -5, 10, 10);
  ctx.restore();
}

function drawAsteroid(ctx, asteroid, time) {
  const [x, y, radius] = asteroid;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(time * 0.0002 + x);
  ctx.fillStyle = "rgba(80, 92, 104, 0.62)";
  ctx.strokeStyle = "rgba(84, 235, 255, 0.2)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let index = 0; index < 9; index += 1) {
    const angle = (index / 9) * Math.PI * 2;
    const r = radius * (0.72 + ((index * 37) % 17) / 55);
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawLaser(ctx, laser) {
  const alpha = clamp(laser.life / laser.maxLife, 0, 1);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  ctx.shadowColor = laser.color;
  ctx.shadowBlur = 16;

  ctx.strokeStyle = laser.color;
  ctx.globalAlpha = 0.28 * alpha;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(laser.fromX, laser.fromY);
  ctx.lineTo(laser.toX, laser.toY);
  ctx.stroke();

  ctx.globalAlpha = 0.88 * alpha;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(laser.fromX, laser.fromY);
  ctx.lineTo(laser.toX, laser.toY);
  ctx.stroke();

  ctx.fillStyle = laser.color;
  ctx.globalAlpha = 0.75 * alpha;
  ctx.beginPath();
  ctx.arc(laser.toX, laser.toY, 7 + (1 - alpha) * 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export default function Aplicatie() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const keysRef = useRef({});
  const selectedAmmoRef = useRef("x1");
  const [selectedAmmo, setSelectedAmmo] = useState("x1");
  const [hud, setHud] = useState({
    pozitieJucator: [0, 0, 0],
    statistici: initialStats,
    tintaJucator: null,
  });

  function selectAmmo(ammoId) {
    selectedAmmoRef.current = ammoId;
    setSelectedAmmo(ammoId);
  }

  useEffect(() => {
    let rafId = 0;
    let stopped = false;

    async function startGame() {
      const [mapImage, shipRaw, enemyRaw] = await Promise.all([
        loadImage(`${import.meta.env.BASE_URL}assets/harta-spatiala.jpg`),
        loadImage(`${import.meta.env.BASE_URL}assets/nava-jucator.jpg`),
        loadImage(`${import.meta.env.BASE_URL}assets/inamic-gheata.jpg`),
      ]);

      if (stopped) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const shipImage = createMaskedImage(shipRaw, 0.12);
      const enemyImage = createMaskedImage(enemyRaw, 0.1);

      const game = {
        mapImage,
        shipImage,
        enemyImage,
        width: 1,
        height: 1,
        dpr: 1,
        camera: { x: 0, y: 0 },
        player: {
          x: WORLD_WIDTH * 0.5,
          y: WORLD_HEIGHT * 0.5,
          angle: 0,
          target: null,
          moving: false,
          shield: 100,
          hp: 100,
          shieldFlash: 0,
          lastHitAt: 0,
        },
        enemies: ENEMIES.map((enemy) => ({ ...enemy })),
        projectiles: [],
        lasers: [],
        selectedEnemyId: null,
        attacking: false,
        laserCooldown: 0,
        stats: { ...initialStats },
        lastHudUpdate: 0,
        lastTime: performance.now(),
      };

      gameRef.current = game;

      function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = window.innerWidth;
        const height = window.innerHeight;
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        game.width = width;
        game.height = height;
        game.dpr = dpr;
      }

      function screenToWorld(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        return {
          x: game.camera.x + clientX - rect.left,
          y: game.camera.y + clientY - rect.top,
        };
      }

      function findEnemyAt(point) {
        return game.enemies.find((enemy) => {
          if (enemy.respawnIn > 0) return false;
          return Math.hypot(enemy.x - point.x, enemy.y - point.y) < 58 * enemy.scale;
        });
      }

      function findNearestEnemy(maxRange = LASER_RANGE) {
        let nearest = null;
        let nearestDistance = maxRange;

        for (const enemy of game.enemies) {
          if (enemy.respawnIn > 0) continue;
          const dist = Math.hypot(enemy.x - game.player.x, enemy.y - game.player.y);
          if (dist < nearestDistance) {
            nearest = enemy;
            nearestDistance = dist;
          }
        }

        return nearest;
      }

      function damageEnemy(enemy, ammo) {
        let shieldDamage = ammo.shieldDamage;
        let hullDamage = ammo.damage;
        const drainedShield = Math.min(enemy.shield, shieldDamage);

        enemy.shield -= drainedShield;
        shieldDamage -= drainedShield;

        if (ammo.drainShield && drainedShield > 0) {
          game.player.shield = Math.min(100, game.player.shield + drainedShield * 0.55);
          game.player.shieldFlash = Math.max(game.player.shieldFlash, 0.42);
        }

        if (!ammo.drainShield) {
          hullDamage += shieldDamage * 0.45;
        } else {
          hullDamage = enemy.shield <= 0 ? 1.5 : 0;
        }

        enemy.hp = Math.max(0, enemy.hp - hullDamage);
        enemy.hitFlash = 1;

        if (enemy.hp <= 0) {
          enemy.respawnIn = 4.2;
          game.attacking = false;
          game.selectedEnemyId = null;
          game.stats.amenintare = "tinta distrusa";
        }
      }

      function fireLaser(enemy, now) {
        const ammo = AMMO_BY_ID[selectedAmmoRef.current] || AMMO_BY_ID.x1;
        const angle = Math.atan2(enemy.y - game.player.y, enemy.x - game.player.x);
        const muzzleDistance = PLAYER_RADIUS * 1.08;

        game.lasers.push({
          fromX: game.player.x + Math.cos(angle) * muzzleDistance,
          fromY: game.player.y + Math.sin(angle) * muzzleDistance,
          toX: enemy.x,
          toY: enemy.y,
          color: ammo.color,
          life: 0.34,
          maxLife: 0.34,
        });

        damageEnemy(enemy, ammo);
        game.laserCooldown = LASER_COOLDOWN;
        game.stats.amenintare = ammo.id === "sab" ? "sab activ" : "laser activ";
      }

      function onPointerDown(event) {
        const target = screenToWorld(event.clientX, event.clientY);
        const clickedEnemy = findEnemyAt(target);

        if (clickedEnemy) {
          game.selectedEnemyId = clickedEnemy.id;
          game.attacking = true;
          game.player.target = null;
          game.stats.amenintare = "tinta blocata";
          setHud((current) => ({
            ...current,
            tintaJucator: null,
            statistici: { ...game.stats, scut: game.player.shield, viata: game.player.hp },
          }));
          return;
        }

        game.player.target = {
          x: clamp(target.x, 24, WORLD_WIDTH - 24),
          y: clamp(target.y, 24, WORLD_HEIGHT - 24),
        };
        game.stats.amenintare = "ruta calculata";
        setHud((current) => ({
          ...current,
          tintaJucator: [
            Number(formatCoord(game.player.target.x, WORLD_WIDTH)),
            0,
            Number(formatCoord(game.player.target.y, WORLD_HEIGHT)),
          ],
          statistici: { ...game.stats, scut: game.player.shield, viata: game.player.hp },
        }));
      }

      function onKeyDown(event) {
        keysRef.current[event.code] = true;

        if (event.code === "Digit1") selectAmmo("x1");
        if (event.code === "Digit2") selectAmmo("x2");
        if (event.code === "Digit3") selectAmmo("x3");
        if (event.code === "Digit4") selectAmmo("x4");
        if (event.code === "Digit5") selectAmmo("sab");

        if (event.code === "Space" && !event.repeat) {
          event.preventDefault();
          const nearest = findNearestEnemy();
          if (nearest) {
            game.selectedEnemyId = nearest.id;
            game.attacking = !game.attacking || game.selectedEnemyId !== nearest.id;
            game.stats.amenintare = game.attacking ? "tinta blocata" : "sector liber";
          }
        }
      }

      function onKeyUp(event) {
        keysRef.current[event.code] = false;
      }

      function applyDamage(amount) {
        const shieldDamage = Math.min(game.player.shield, amount);
        game.player.shield -= shieldDamage;
        const remaining = amount - shieldDamage;

        if (remaining > 0) {
          game.player.hp = Math.max(0, game.player.hp - remaining);
        }

        game.player.shieldFlash = 1;
        game.player.lastHitAt = performance.now();
        game.stats.atacuri += 1;
        game.stats.amenintare = game.player.hp <= 0 ? "nava avariata" : "contact ostil";
      }

      function update(dt, now) {
        const player = game.player;
        const keys = keysRef.current;
        let dx = 0;
        let dy = 0;

        if (keys.KeyW || keys.ArrowUp) dy -= 1;
        if (keys.KeyS || keys.ArrowDown) dy += 1;
        if (keys.KeyA || keys.ArrowLeft) dx -= 1;
        if (keys.KeyD || keys.ArrowRight) dx += 1;

        let targetAngle = player.angle;
        let moving = false;

        if (dx !== 0 || dy !== 0) {
          const length = Math.hypot(dx, dy);
          dx /= length;
          dy /= length;
          player.target = null;
          moving = true;
          targetAngle = Math.atan2(dy, dx);
          player.x += dx * PLAYER_SPEED * dt;
          player.y += dy * PLAYER_SPEED * dt;
        } else if (player.target) {
          dx = player.target.x - player.x;
          dy = player.target.y - player.y;
          const length = Math.hypot(dx, dy);

          if (length > STOP_DISTANCE) {
            dx /= length;
            dy /= length;
            moving = true;
            targetAngle = Math.atan2(dy, dx);
            player.x += dx * PLAYER_SPEED * dt;
            player.y += dy * PLAYER_SPEED * dt;
          } else {
            player.target = null;
          }
        }

        player.moving = moving;
        if (moving) {
          player.angle = lerpAngle(player.angle, targetAngle, Math.min(1, dt * 9));
        }

        player.x = clamp(player.x, 36, WORLD_WIDTH - 36);
        player.y = clamp(player.y, 36, WORLD_HEIGHT - 36);

        if (now - player.lastHitAt > 3500 && player.shield < 100) {
          player.shield = Math.min(100, player.shield + dt * 4.5);
        }

        player.shieldFlash = Math.max(0, player.shieldFlash - dt * 2.6);
        game.laserCooldown = Math.max(0, game.laserCooldown - dt);
        game.lasers = game.lasers.filter((laser) => {
          laser.life -= dt;
          return laser.life > 0;
        });

        for (const enemy of game.enemies) {
          enemy.hitFlash = Math.max(0, enemy.hitFlash - dt * 3.8);

          if (enemy.respawnIn > 0) {
            enemy.respawnIn -= dt;
            if (enemy.respawnIn <= 0) {
              enemy.x = enemy.baseX;
              enemy.y = enemy.baseY;
              enemy.hp = 100;
              enemy.shield = 70;
              enemy.cooldown = 1.2;
              enemy.hitFlash = 0;
            }
            continue;
          }

          const toPlayerX = player.x - enemy.x;
          const toPlayerY = player.y - enemy.y;
          const dist = Math.hypot(toPlayerX, toPlayerY);
          enemy.cooldown -= dt;

          if (dist < 360) {
            const nx = toPlayerX / dist;
            const ny = toPlayerY / dist;
            const lateralX = -ny;
            const lateralY = nx;
            enemy.angle = lerpAngle(enemy.angle, Math.atan2(toPlayerY, toPlayerX), dt * 5);

            if (dist > 148) {
              enemy.x += nx * ENEMY_SPEED * dt;
              enemy.y += ny * ENEMY_SPEED * dt;
            } else if (dist < 105) {
              enemy.x -= nx * ENEMY_SPEED * 0.72 * dt;
              enemy.y -= ny * ENEMY_SPEED * 0.72 * dt;
            }

            const orbit = Math.sin(now * 0.002 + enemy.patrol);
            enemy.x += lateralX * orbit * 34 * dt;
            enemy.y += lateralY * orbit * 34 * dt;

            if (dist < 285 && enemy.cooldown <= 0) {
              game.projectiles.push({
                x: enemy.x,
                y: enemy.y,
                vx: nx * PROJECTILE_SPEED,
                vy: ny * PROJECTILE_SPEED,
                life: 1.9,
                color: enemy.color,
              });
              enemy.cooldown = 1.25 + Math.random() * 0.85;
            }
          } else {
            enemy.angle += dt * 0.35;
            enemy.x += Math.cos(now * 0.00045 + enemy.patrol) * 8 * dt;
            enemy.y += Math.sin(now * 0.0005 + enemy.patrol) * 8 * dt;
          }

          enemy.x = clamp(enemy.x, 40, WORLD_WIDTH - 40);
          enemy.y = clamp(enemy.y, 40, WORLD_HEIGHT - 40);
        }

        const selectedEnemy = game.enemies.find(
          (enemy) => enemy.id === game.selectedEnemyId && enemy.respawnIn <= 0
        );

        if (game.attacking && selectedEnemy) {
          const distToTarget = Math.hypot(selectedEnemy.x - player.x, selectedEnemy.y - player.y);
          if (distToTarget <= LASER_RANGE && game.laserCooldown <= 0) {
            fireLaser(selectedEnemy, now);
          } else if (distToTarget > LASER_RANGE) {
            game.stats.amenintare = "tinta in afara razei";
          }
        } else if (game.attacking && !selectedEnemy) {
          game.attacking = false;
          game.selectedEnemyId = null;
        }

        game.projectiles = game.projectiles.filter((projectile) => {
          projectile.x += projectile.vx * dt;
          projectile.y += projectile.vy * dt;
          projectile.life -= dt;

          if (Math.hypot(projectile.x - player.x, projectile.y - player.y) < PLAYER_RADIUS * 1.2) {
            applyDamage(5);
            return false;
          }

          return projectile.life > 0;
        });

        game.camera.x = clamp(player.x - game.width / 2, 0, Math.max(0, WORLD_WIDTH - game.width));
        game.camera.y = clamp(player.y - game.height / 2, 0, Math.max(0, WORLD_HEIGHT - game.height));

        if (now - game.lastHudUpdate > 90) {
          game.lastHudUpdate = now;
          setHud({
            pozitieJucator: [
              Number(formatCoord(player.x, WORLD_WIDTH)),
              0,
              Number(formatCoord(player.y, WORLD_HEIGHT)),
            ],
            statistici: {
              viata: Math.round(player.hp),
              scut: Math.round(player.shield),
              atacuri: game.stats.atacuri,
              amenintare: game.stats.amenintare,
            },
            tintaJucator: player.target
              ? [
                  Number(formatCoord(player.target.x, WORLD_WIDTH)),
                  0,
                  Number(formatCoord(player.target.y, WORLD_HEIGHT)),
                ]
              : null,
          });
        }
      }

      function draw(time) {
        const { camera, width, height, dpr } = game;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);

        ctx.save();
        ctx.translate(-camera.x, -camera.y);
        ctx.drawImage(game.mapImage, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);

        ctx.strokeStyle = "rgba(81, 244, 255, 0.075)";
        ctx.lineWidth = 1;
        for (let x = 0; x <= WORLD_WIDTH; x += 100) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, WORLD_HEIGHT);
          ctx.stroke();
        }
        for (let y = 0; y <= WORLD_HEIGHT; y += 100) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(WORLD_WIDTH, y);
          ctx.stroke();
        }

        for (const asteroid of ASTEROIDS) {
          drawAsteroid(ctx, asteroid, time);
        }

        for (const box of BONUS_BOXES) {
          drawBonusBox(ctx, box, time);
        }

        for (const enemy of game.enemies) {
          drawEnemy(ctx, game.enemyImage, enemy, enemy.id === game.selectedEnemyId);
        }

        for (const projectile of game.projectiles) {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.fillStyle = projectile.color;
          ctx.shadowColor = projectile.color;
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(projectile.x, projectile.y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        for (const laser of game.lasers) {
          drawLaser(ctx, laser);
        }

        if (game.player.target) {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.strokeStyle = "rgba(125, 255, 239, 0.72)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(game.player.target.x, game.player.target.y, 28 + Math.sin(time * 0.009) * 4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        drawShip(
          ctx,
          game.shipImage,
          game.player,
          game.player.moving,
          game.player.shield / 100,
          game.player.shieldFlash
        );

        ctx.restore();
      }

      function frame(now) {
        if (stopped) return;
        const dt = Math.min(0.035, (now - game.lastTime) / 1000);
        game.lastTime = now;
        update(dt, now);
        draw(now);
        rafId = requestAnimationFrame(frame);
      }

      resize();
      window.addEventListener("resize", resize);
      canvas.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      rafId = requestAnimationFrame(frame);

      game.cleanup = () => {
        window.removeEventListener("resize", resize);
        canvas.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
      };
    }

    startGame();

    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
      gameRef.current?.cleanup?.();
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="joc-2d-canvas" />
      <div className="bara-munitie" onPointerDown={(event) => event.stopPropagation()}>
        {AMMO_TYPES.map((ammo) => (
          <button
            key={ammo.id}
            type="button"
            className={`buton-munitie ${selectedAmmo === ammo.id ? "activ" : ""}`}
            style={{ "--ammo-color": ammo.color }}
            onClick={() => selectAmmo(ammo.id)}
          >
            <span>{ammo.label}</span>
            <strong>INF</strong>
          </button>
        ))}
      </div>
      <InterfataJoc
        pozitieJucator={hud.pozitieJucator}
        statistici={hud.statistici}
        tintaJucator={hud.tintaJucator}
      />
    </>
  );
}
