import { useFrame, useLoader } from "@react-three/fiber";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import folosesteTastatura from "../hooks/useTastatura.jsx";
import { densitateGazLaPunct } from "../utils/fundalSpatial.js";

const STORAGE_KEY_TUNING_NAVA = "darkorbit-nava-manual-axes-bank-v2";

const TUNING_INITIAL = {
  // Tuning / play mode
  lockMovementWhileTuning: 0,

  // Miscare
  speed: 2,
  rotationSpeed: 2,
  stopDistance: 0.65,

  // Pozitie globala
  shipWorldY: 3.2,
  parentScale: 1.28,

  // Sprite total
  spriteOffsetX: 0,
  spriteOffsetY: 0,
  spriteOffsetZ: 0,
  spriteRotationDeg: 0,
  spriteScaleX: 1,
  spriteScaleY: 1,

  // Inclinare / banking nava
  bankEnabled: 1,
  bankManualDeg: -49.5361,
  bankAutoStrength: 4.5,
  bankMaxDeg: 15.273,
  bankLerp: 0.12,
  bankDirection: 1,
  bankPivotX: 0,
  bankPivotY: 0,
  bankPivotZ: 0,
  bankPitchDeg: 0,
  bankRollDeg: 0,

  // Nava
  shipOffsetX: -0.151,
  shipOffsetY: 0.359,
  shipOffsetZ: 0,
  shipRotationDeg: 158.3815,
  shipScaleX: 7.2659,
  shipScaleY: 9.5873,


  // Motor stanga
  leftFlameX: -0.1823,
  leftFlameY: -5.0977,
  leftFlameZ: 0.08,
  leftFlameRotationDeg: 0,
  leftFlameScaleX: 1.3,
  leftFlameScaleY: 3.6,

  // Motor dreapta
  rightFlameX: 0.472,
  rightFlameY: -5.041,
  rightFlameZ: 0.08,
  rightFlameRotationDeg: 0,
  rightFlameScaleX: 1.3,
  rightFlameScaleY: 3.6,

  // Flacari
  flameIdle: 0,
  flameMovingBase: 0.75,
  flamePulseAmp: 0.25,
  flamePulseSpeed: 24,
  flameFadeSpeed: 3.2,

  // Indicator / sageata
  indicatorX: 0,
  indicatorY: 4.2,
  indicatorZ: 0.14,
  indicatorRotationDeg: 0,
  indicatorScaleX: 1,
  indicatorScaleY: 1,
  indicatorOpacity: 0.92,

  // Lumina
  lightX: 0,
  lightY: 0,
  lightZ: 0.6,
  lightIntensity: 5.4,
  lightDistance: 14,

  // Camera
  cameraOffsetX: 0,
  cameraOffsetY: 68,
  cameraOffsetZ: 54,

  cameraTargetOffsetX: 0,
  cameraTargetOffsetY: 0,
  cameraTargetOffsetZ: 0,

  cameraZoom: 18,
  cameraLerpPosition: 0.08,
  cameraLerpZoom: 0.06,

  // Axe manuale
  gizmoSize: 4.5,
};

const OBIECTE_TUNING = [
  {
    key: "spriteCore",
    label: "Tot sprite-ul",
    fields: [
      "spriteOffsetX",
      "spriteOffsetY",
      "spriteOffsetZ",
      "spriteRotationDeg",
      "spriteScaleX",
      "spriteScaleY",
    ],
  },
  {
    key: "bank",
    label: "Inclinare nava",
    fields: [
      "bankEnabled",
      "bankManualDeg",
      "bankAutoStrength",
      "bankMaxDeg",
      "bankLerp",
      "bankDirection",
      "bankPivotX",
      "bankPivotY",
      "bankPivotZ",
      "bankPitchDeg",
      "bankRollDeg",
    ],
  },
  {
    key: "ship",
    label: "Nava",
    fields: [
      "shipOffsetX",
      "shipOffsetY",
      "shipOffsetZ",
      "shipRotationDeg",
      "shipScaleX",
      "shipScaleY",
    ],
  },
  {
    key: "leftFlame",
    label: "Motor stanga",
    fields: [
      "leftFlameX",
      "leftFlameY",
      "leftFlameZ",
      "leftFlameRotationDeg",
      "leftFlameScaleX",
      "leftFlameScaleY",
    ],
  },
  {
    key: "rightFlame",
    label: "Motor dreapta",
    fields: [
      "rightFlameX",
      "rightFlameY",
      "rightFlameZ",
      "rightFlameRotationDeg",
      "rightFlameScaleX",
      "rightFlameScaleY",
    ],
  },
  {
    key: "indicator",
    label: "Sageata",
    fields: [
      "indicatorX",
      "indicatorY",
      "indicatorZ",
      "indicatorRotationDeg",
      "indicatorScaleX",
      "indicatorScaleY",
    ],
  },
  {
    key: "light",
    label: "Lumina",
    fields: ["lightX", "lightY", "lightZ"],
  },
  {
    key: "cameraOffset",
    label: "Camera offset",
    fields: ["cameraOffsetX", "cameraOffsetY", "cameraOffsetZ"],
  },
  {
    key: "cameraTarget",
    label: "Camera target",
    fields: [
      "cameraTargetOffsetX",
      "cameraTargetOffsetY",
      "cameraTargetOffsetZ",
    ],
  },
];

const CAMPURI_NUMERICE = [
  "lockMovementWhileTuning",
  "speed",
  "rotationSpeed",
  "stopDistance",
  "shipWorldY",
  "parentScale",

  "bankEnabled",
  "bankManualDeg",
  "bankAutoStrength",
  "bankMaxDeg",
  "bankLerp",
  "bankDirection",
  "bankPitchDeg",
  "bankRollDeg",

  "flameIdle",
  "flameMovingBase",
  "flamePulseAmp",
  "flamePulseSpeed",
  "flameFadeSpeed",
  "indicatorOpacity",
  "lightIntensity",
  "lightDistance",
  "cameraZoom",
  "cameraLerpPosition",
  "cameraLerpZoom",
  "gizmoSize",
];

function degToRad(deg) {
  return THREE.MathUtils.degToRad(deg || 0);
}

function radToDeg(rad) {
  return Number(THREE.MathUtils.radToDeg(rad).toFixed(4));
}

function fixed(value) {
  return Number(value.toFixed(4));
}

function safeScale(value) {
  return Math.max(0.01, fixed(value));
}

function incarcaTuningInitial() {
  try {
    if (typeof window === "undefined") {
      return TUNING_INITIAL;
    }

    const salvat = window.localStorage.getItem(STORAGE_KEY_TUNING_NAVA);

    if (!salvat) {
      return TUNING_INITIAL;
    }

    return {
      ...TUNING_INITIAL,
      ...JSON.parse(salvat),
    };
  } catch {
    return TUNING_INITIAL;
  }
}

function salveazaTuning(tuning) {
  try {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(STORAGE_KEY_TUNING_NAVA, JSON.stringify(tuning));
  } catch {
    // ignoram erorile de localStorage
  }
}

function copiazaTuning(tuning) {
  const text = JSON.stringify(tuning, null, 2);
  console.log("TUNING NAVA:", text);

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text);
  }
}

const VITEZA_LIVE_FACTOR = 1.3;

function diferentaUnghiulara(start, end) {
  return (
    THREE.MathUtils.euclideanModulo(end - start + Math.PI, Math.PI * 2) -
    Math.PI
  );
}

function rotesteSpre(unghiCurent, unghiTinta, pasMaxim) {
  const delta = diferentaUnghiulara(unghiCurent, unghiTinta);

  if (Math.abs(delta) <= pasMaxim) {
    return unghiTinta;
  }

  return unghiCurent + Math.sign(delta) * pasMaxim;
}

const vertexShaderNava = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShaderNava = `
  uniform sampler2D uTexture;
  uniform float uOpacity;
  varying vec2 vUv;

  void main() {
    vec4 tex = texture2D(uTexture, vUv);

    float alfaFundal = tex.a;

    float alfaMargine = smoothstep(0.0, 0.05, vUv.x) *
      (1.0 - smoothstep(0.95, 1.0, vUv.x));

    alfaMargine *= smoothstep(0.0, 0.05, vUv.y) *
      (1.0 - smoothstep(0.95, 1.0, vUv.y));

    vec3 culoare = tex.rgb * vec3(1.08, 1.12, 1.16);
    float alfa = alfaFundal * alfaMargine * uOpacity;

    gl_FragColor = vec4(culoare, alfa);
  }
`;

const vertexShaderSimplu = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShaderFlacara = `
  uniform float uIntensitate;
  uniform vec3 uCuloare;
  varying vec2 vUv;

  void main() {
    float lungime = 1.0 - vUv.y;
    float distOrizontala = (vUv.x - 0.5) * 2.0;

    float latime = clamp(1.0 - 0.85 * pow(clamp(lungime, 0.0, 1.0), 0.6), 0.16, 1.0);
    float razaGlow = sqrt(pow(distOrizontala / latime, 2.0) + pow(lungime * 1.15, 2.0));
    float glow = exp(-razaGlow * razaGlow * 3.2);

    float nucleu = exp(-pow(distOrizontala / (latime * 0.45), 2.0) * 4.0) *
      exp(-pow(lungime * 1.4, 2.0) * 5.0);
    nucleu = clamp(nucleu, 0.0, 1.0);

    vec3 culoareNucleu = mix(uCuloare, vec3(1.0), 0.7);
    vec3 culoare = mix(uCuloare, culoareNucleu, nucleu);

    float alfa = clamp(glow, 0.0, 1.0) * uIntensitate;

    gl_FragColor = vec4(culoare, alfa);
  }
`;

function TuningDomMenu({
  tuning,
  setTuning,
  active,
  setActive,
  selected,
  setSelected,
  mode,
  setMode,
  savedAt,
}) {
  const panelRef = useRef(null);
  const propsRef = useRef(null);
  const [collapsed, setCollapsed] = useState(true);

  propsRef.current = {
    tuning,
    setTuning,
    active,
    setActive,
    selected,
    setSelected,
    mode,
    setMode,
    savedAt,
    collapsed,
    setCollapsed,
  };

  useEffect(() => {
    const panel = document.createElement("div");
    panelRef.current = panel;

    Object.assign(panel.style, {
      position: "fixed",
      left: "12px",
      top: "12px",
      zIndex: "999999",
      width: "410px",
      maxHeight: "88vh",
      overflow: "auto",
      padding: "12px",
      background: "rgba(0,0,0,0.88)",
      color: "#7dffef",
      border: "1px solid rgba(125,255,239,0.75)",
      borderRadius: "8px",
      fontFamily: "monospace",
      fontSize: "12px",
      boxShadow: "0 0 24px rgba(0,255,255,0.25)",
      userSelect: "none",
    });

    const stop = (event) => {
      event.stopPropagation();
    };

    const onClick = (event) => {
      stop(event);

      const target = event.target;
      const action = target?.dataset?.action;

      if (!action) return;

      const p = propsRef.current;

      if (action === "toggleCollapsed") {
        const next = !p.collapsed;
        p.setCollapsed(next);
        p.setActive(!next);
      }

      if (action === "toggleAxes") {
        p.setActive((v) => !v);
      }

      if (action === "copy") {
        copiazaTuning(p.tuning);
      }

      if (action === "resetAll") {
        p.setTuning(TUNING_INITIAL);
      }

      if (action === "resetSelected") {
        const config = OBIECTE_TUNING.find((item) => item.key === p.selected);
        if (!config) return;

        p.setTuning((current) => {
          const next = { ...current };

          for (const field of config.fields) {
            next[field] = TUNING_INITIAL[field];
          }

          return next;
        });
      }

      if (action === "savePlay") {
        p.setTuning((current) => {
          const next = {
            ...current,
            lockMovementWhileTuning: 0,
          };

          salveazaTuning(next);
          return next;
        });

        p.setActive(false);
        p.setCollapsed(true);
      }
    };

    const onInput = (event) => {
      stop(event);

      const target = event.target;
      const field = target?.dataset?.field;

      if (!field) return;

      const value =
        target.type === "checkbox"
          ? target.checked
            ? 1
            : 0
          : Number(target.value);

      propsRef.current.setTuning((current) => ({
        ...current,
        [field]: Number.isFinite(value) ? value : 0,
      }));
    };

    const onChange = (event) => {
      stop(event);

      const target = event.target;
      const action = target?.dataset?.change;

      if (action === "selected") {
        propsRef.current.setSelected(target.value);
      }

      if (action === "mode") {
        propsRef.current.setMode(target.value);
      }
    };

    const events = [
      "pointerdown",
      "pointerup",
      "pointermove",
      "mousedown",
      "mouseup",
      "dblclick",
      "wheel",
      "touchstart",
      "touchmove",
      "touchend",
    ];

    for (const eventName of events) {
      panel.addEventListener(eventName, stop, true);
    }

    panel.addEventListener("click", onClick);
    panel.addEventListener("input", onInput);
    panel.addEventListener("change", onChange);

    document.body.appendChild(panel);

    return () => {
      for (const eventName of events) {
        panel.removeEventListener(eventName, stop, true);
      }

      panel.removeEventListener("click", onClick);
      panel.removeEventListener("input", onInput);
      panel.removeEventListener("change", onChange);
      panel.remove();
    };
  }, []);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const config = OBIECTE_TUNING.find((item) => item.key === selected);
    const fields = config?.fields || [];

    const numericHtml = CAMPURI_NUMERICE.map((field) => {
      const checked = tuning[field] >= 0.5 ? "checked" : "";

      if (field === "lockMovementWhileTuning" || field === "bankEnabled") {
        return `
          <label style="display:flex;gap:8px;align-items:center;margin-top:6px;">
            <input type="checkbox" data-field="${field}" ${checked}/>
            <span>${field}</span>
          </label>
        `;
      }

      return `
        <label style="display:grid;grid-template-columns:1fr 92px;gap:6px;align-items:center;margin-top:6px;">
          <span>${field}</span>
          <input type="number" step="0.01" data-field="${field}" value="${tuning[field]}" style="width:100%;"/>
        </label>
      `;
    }).join("");

    const objectFieldsHtml = fields.map((field) => {
      if (field === "bankEnabled") {
        const checked = tuning[field] >= 0.5 ? "checked" : "";

        return `
          <label style="display:flex;gap:8px;align-items:center;margin-top:6px;">
            <input type="checkbox" data-field="${field}" ${checked}/>
            <span>${field}</span>
          </label>
        `;
      }

      return `
        <label style="display:grid;grid-template-columns:1fr 92px;gap:6px;align-items:center;margin-top:6px;">
          <span>${field}</span>
          <input type="number" step="0.01" data-field="${field}" value="${tuning[field]}" style="width:100%;"/>
        </label>
      `;
    }).join("");

    const optionsHtml = OBIECTE_TUNING.map((item) => {
      return `<option value="${item.key}" ${
        item.key === selected ? "selected" : ""
      }>${item.label}</option>`;
    }).join("");

    panel.style.width = collapsed ? "210px" : "410px";

    panel.innerHTML = `
      <div style="display:flex;gap:8px;align-items:center;">
        <b style="flex:1;">Tuning nava fara Drei</b>
        <button data-action="toggleCollapsed">${collapsed ? "Deschide" : "Inchide"}</button>
      </div>

      ${collapsed ? "" : `
        <div style="margin-top:10px;">
          <label>
            Obiect:
            <select data-change="selected" style="width:100%;margin-top:4px;">
              ${optionsHtml}
            </select>
          </label>
        </div>

        <div style="margin-top:10px;">
          <label>
            Mod axe:
            <select data-change="mode" style="width:100%;margin-top:4px;">
              <option value="translate" ${mode === "translate" ? "selected" : ""}>Muta</option>
              <option value="rotate" ${mode === "rotate" ? "selected" : ""}>Roteste</option>
              <option value="scale" ${mode === "scale" ? "selected" : ""}>Scaleaza</option>
            </select>
          </label>
        </div>

        <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;">
          <button data-action="toggleAxes">${active ? "Ascunde axe" : "Arata axe"}</button>
          <button data-action="copy">Copiaza JSON</button>
          <button data-action="resetSelected">Reset obiect</button>
          <button data-action="resetAll">Reset tot</button>
          <button data-action="savePlay" style="background:#0a8f5a;color:white;font-weight:bold;">
            Salveaza & Joaca
          </button>
        </div>

        <div style="margin-top:8px;color:#9efff3;">
          Auto-save: <b>${savedAt || "nesalvat inca"}</b>
        </div>

        <div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(125,255,239,0.35);">
          <b>Obiect selectat: ${config?.label || selected}</b>
          ${objectFieldsHtml}
        </div>

        <div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(125,255,239,0.35);">
          <b>Parametri generali</b>
          ${numericHtml}
        </div>

        <div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(125,255,239,0.35);opacity:0.85;line-height:1.45;">
          Click-urile pe meniu sunt blocate si nu mai ajung in harta.<br/>
          Inclinare nava:<br/>
          - alege <b>Inclinare nava</b><br/>
          - <b>Muta</b> schimba pivotul<br/>
          - <b>Roteste</b> schimba bankManualDeg<br/>
          - <b>Scaleaza</b>: X = bankMaxDeg, Y = bankAutoStrength<br/>
          Daca se inclina invers, seteaza <b>bankDirection = -1</b>.<br/>
          Cand e gata, apasa <b>Salveaza & Joaca</b>.
        </div>
      `}
    `;
  }, [tuning, active, selected, mode, collapsed, savedAt]);

  return null;
}

function syncTuningFromObject(selected, obj, setTuning) {
  setTuning((current) => {
    const next = { ...current };

    if (selected === "spriteCore") {
      next.spriteOffsetX = fixed(obj.position.x);
      next.spriteOffsetY = fixed(obj.position.y);
      next.spriteOffsetZ = fixed(obj.position.z);
      next.spriteRotationDeg = radToDeg(obj.rotation.z);
      next.spriteScaleX = safeScale(obj.scale.x);
      next.spriteScaleY = safeScale(obj.scale.y);
    }

    if (selected === "bank") {
      next.bankPivotX = fixed(obj.position.x);
      next.bankPivotY = fixed(obj.position.y);
      next.bankPivotZ = fixed(obj.position.z);
      next.bankManualDeg = radToDeg(obj.rotation.z);

      next.bankMaxDeg =
        safeScale(obj.scale.x) * TUNING_INITIAL.bankMaxDeg;

      next.bankAutoStrength =
        safeScale(obj.scale.y) * TUNING_INITIAL.bankAutoStrength;
    }

    if (selected === "ship") {
      next.shipOffsetX = fixed(obj.position.x);
      next.shipOffsetY = fixed(obj.position.y);
      next.shipOffsetZ = fixed(obj.position.z);
      next.shipRotationDeg = radToDeg(obj.rotation.z);
      next.shipScaleX = safeScale(obj.scale.x);
      next.shipScaleY = safeScale(obj.scale.y);
    }

    if (selected === "leftFlame") {
      next.leftFlameX = fixed(obj.position.x);
      next.leftFlameY = fixed(obj.position.y);
      next.leftFlameZ = fixed(obj.position.z);
      next.leftFlameRotationDeg = radToDeg(obj.rotation.z);
      next.leftFlameScaleX = safeScale(obj.scale.x);
      next.leftFlameScaleY = safeScale(obj.scale.y);
    }

    if (selected === "rightFlame") {
      next.rightFlameX = fixed(obj.position.x);
      next.rightFlameY = fixed(obj.position.y);
      next.rightFlameZ = fixed(obj.position.z);
      next.rightFlameRotationDeg = radToDeg(obj.rotation.z);
      next.rightFlameScaleX = safeScale(obj.scale.x);
      next.rightFlameScaleY = safeScale(obj.scale.y);
    }

    if (selected === "indicator") {
      next.indicatorX = fixed(obj.position.x);
      next.indicatorY = fixed(obj.position.y);
      next.indicatorZ = fixed(obj.position.z);
      next.indicatorRotationDeg = radToDeg(obj.rotation.z);
      next.indicatorScaleX = safeScale(obj.scale.x);
      next.indicatorScaleY = safeScale(obj.scale.y);
    }

    if (selected === "light") {
      next.lightX = fixed(obj.position.x);
      next.lightY = fixed(obj.position.y);
      next.lightZ = fixed(obj.position.z);
    }

    if (selected === "cameraOffset") {
      next.cameraOffsetX = fixed(obj.position.x);
      next.cameraOffsetY = fixed(obj.position.y);
      next.cameraOffsetZ = fixed(obj.position.z);
    }

    if (selected === "cameraTarget") {
      next.cameraTargetOffsetX = fixed(obj.position.x);
      next.cameraTargetOffsetY = fixed(obj.position.y);
      next.cameraTargetOffsetZ = fixed(obj.position.z);
    }

    return next;
  });
}

function ManualTransformGizmo({
  tuning,
  refsTuning,
  active,
  selected,
  mode,
  setTuning,
  setDraggingAxes,
}) {
  const groupRef = useRef();
  const dragRef = useRef(null);

  const tmpPos = useMemo(() => new THREE.Vector3(), []);
  const tmpQuat = useMemo(() => new THREE.Quaternion(), []);
  const plane = useMemo(() => new THREE.Plane(), []);
  const planeNormal = useMemo(() => new THREE.Vector3(), []);
  const worldPoint = useMemo(() => new THREE.Vector3(), []);
  const localPoint = useMemo(() => new THREE.Vector3(), []);

  const getSelectedObject = useCallback(() => {
    return refsTuning[selected]?.current || null;
  }, [refsTuning, selected]);

  const intersectParentPlane = useCallback(
    (event, obj) => {
      if (!obj?.parent) return null;

      obj.updateWorldMatrix(true, false);
      obj.getWorldPosition(tmpPos);
      obj.getWorldQuaternion(tmpQuat);

      planeNormal.set(0, 0, 1).applyQuaternion(tmpQuat).normalize();
      plane.setFromNormalAndCoplanarPoint(planeNormal, tmpPos);

      const hit = event.ray.intersectPlane(plane, worldPoint);
      if (!hit) return null;

      localPoint.copy(worldPoint);
      obj.parent.worldToLocal(localPoint);

      return localPoint.clone();
    },
    [localPoint, plane, planeNormal, tmpPos, tmpQuat, worldPoint]
  );

  useFrame(({ camera }) => {
    const group = groupRef.current;
    const obj = getSelectedObject();

    if (!group || !obj) return;

    obj.updateWorldMatrix(true, false);
    obj.getWorldPosition(tmpPos);
    obj.getWorldQuaternion(tmpQuat);

    group.position.copy(tmpPos);
    group.quaternion.copy(tmpQuat);

    const size = Math.max(0.4, tuning.gizmoSize || 4.5);

    if ("zoom" in camera) {
      const zoomScale = 13 / Math.max(0.001, camera.zoom);
      group.scale.setScalar(size * zoomScale);
    } else {
      group.scale.setScalar(size);
    }
  });

  const beginDrag = useCallback(
    (kind, event) => {
      event.stopPropagation();

      const obj = getSelectedObject();
      if (!obj) return;

      const startMouse = intersectParentPlane(event, obj);
      if (!startMouse) return;

      event.target.setPointerCapture?.(event.pointerId);

      const axisX = new THREE.Vector3(1, 0, 0)
        .applyQuaternion(obj.quaternion)
        .normalize();

      const axisY = new THREE.Vector3(0, 1, 0)
        .applyQuaternion(obj.quaternion)
        .normalize();

      const center = obj.position.clone();
      const startVector = startMouse.clone().sub(center);
      const startAngle = Math.atan2(startVector.y, startVector.x);

      dragRef.current = {
        kind,
        obj,
        startMouse,
        startPosition: obj.position.clone(),
        startRotationZ: obj.rotation.z,
        startScale: obj.scale.clone(),
        startAngle,
        axisX,
        axisY,
      };

      setDraggingAxes(true);
    },
    [getSelectedObject, intersectParentPlane, setDraggingAxes]
  );

  const updateDrag = useCallback(
    (event) => {
      const drag = dragRef.current;
      if (!drag) return;

      event.stopPropagation();

      const currentMouse = intersectParentPlane(event, drag.obj);
      if (!currentMouse) return;

      const delta = currentMouse.clone().sub(drag.startMouse);

      if (drag.kind === "move-free") {
        drag.obj.position.copy(drag.startPosition).add(delta);
      }

      if (drag.kind === "move-x") {
        const amount = delta.dot(drag.axisX);
        drag.obj.position
          .copy(drag.startPosition)
          .add(drag.axisX.clone().multiplyScalar(amount));
      }

      if (drag.kind === "move-y") {
        const amount = delta.dot(drag.axisY);
        drag.obj.position
          .copy(drag.startPosition)
          .add(drag.axisY.clone().multiplyScalar(amount));
      }

      if (drag.kind === "scale-x") {
        const amount = delta.dot(drag.axisX);
        drag.obj.scale.x = Math.max(0.01, drag.startScale.x + amount);
      }

      if (drag.kind === "scale-y") {
        const amount = delta.dot(drag.axisY);
        drag.obj.scale.y = Math.max(0.01, drag.startScale.y + amount);
      }

      if (drag.kind === "scale-free") {
        const diagonal = drag.axisX.clone().add(drag.axisY).normalize();
        const amount = delta.dot(diagonal);

        drag.obj.scale.x = Math.max(0.01, drag.startScale.x + amount);
        drag.obj.scale.y = Math.max(0.01, drag.startScale.y + amount);
      }

      if (drag.kind === "rotate") {
        const center = drag.obj.position.clone();
        const vector = currentMouse.clone().sub(center);
        const angle = Math.atan2(vector.y, vector.x);
        const diff = angle - drag.startAngle;

        drag.obj.rotation.z = drag.startRotationZ + diff;
      }

      syncTuningFromObject(selected, drag.obj, setTuning);
    },
    [intersectParentPlane, selected, setTuning]
  );

  const endDrag = useCallback(
    (event) => {
      event.stopPropagation();

      if (dragRef.current) {
        event.target.releasePointerCapture?.(event.pointerId);
      }

      dragRef.current = null;
      setDraggingAxes(false);
    },
    [setDraggingAxes]
  );

  if (!active) return null;

  const axisLen = 1;
  const axisThickness = 0.055;
  const handleSize = 0.18;

  const sharedMaterialProps = {
    transparent: true,
    opacity: 0.9,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  };

  const pointerProps = (kind) => ({
    onPointerDown: (event) => beginDrag(kind, event),
    onPointerMove: updateDrag,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  });

  return (
    <group ref={groupRef} renderOrder={999}>
      {mode === "translate" && (
        <>
          <mesh position={[axisLen / 2, 0, 0.02]} {...pointerProps("move-x")}>
            <planeGeometry args={[axisLen, axisThickness]} />
            <meshBasicMaterial color="#ff3b3b" {...sharedMaterialProps} />
          </mesh>

          <mesh position={[0, axisLen / 2, 0.02]} {...pointerProps("move-y")}>
            <planeGeometry args={[axisThickness, axisLen]} />
            <meshBasicMaterial color="#32ff7e" {...sharedMaterialProps} />
          </mesh>

          <mesh position={[0, 0, 0.04]} {...pointerProps("move-free")}>
            <planeGeometry args={[0.24, 0.24]} />
            <meshBasicMaterial color="#7dffef" {...sharedMaterialProps} />
          </mesh>
        </>
      )}

      {mode === "scale" && (
        <>
          <mesh position={[axisLen, 0, 0.04]} {...pointerProps("scale-x")}>
            <planeGeometry args={[handleSize, handleSize]} />
            <meshBasicMaterial color="#ff3b3b" {...sharedMaterialProps} />
          </mesh>

          <mesh position={[0, axisLen, 0.04]} {...pointerProps("scale-y")}>
            <planeGeometry args={[handleSize, handleSize]} />
            <meshBasicMaterial color="#32ff7e" {...sharedMaterialProps} />
          </mesh>

          <mesh
            position={[axisLen * 0.75, axisLen * 0.75, 0.04]}
            {...pointerProps("scale-free")}
          >
            <planeGeometry args={[handleSize, handleSize]} />
            <meshBasicMaterial color="#ffd43b" {...sharedMaterialProps} />
          </mesh>
        </>
      )}

      {mode === "rotate" && (
        <>
          <mesh position={[0, 0, 0.03]} {...pointerProps("rotate")}>
            <torusGeometry args={[0.72, 0.025, 8, 64]} />
            <meshBasicMaterial color="#ffd43b" {...sharedMaterialProps} />
          </mesh>

          <mesh position={[0.72, 0, 0.05]} {...pointerProps("rotate")}>
            <planeGeometry args={[0.16, 0.16]} />
            <meshBasicMaterial color="#ffd43b" {...sharedMaterialProps} />
          </mesh>
        </>
      )}
    </group>
  );
}

function TuningHandles({
  tuning,
  lightHandle,
  cameraOffsetHandle,
  cameraTargetHandle,
}) {
  return (
    <>
      <group
        ref={lightHandle}
        position={[tuning.lightX, tuning.lightY, tuning.lightZ]}
      >
        <mesh visible={false}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial />
        </mesh>
      </group>

      <group
        ref={cameraOffsetHandle}
        position={[
          tuning.cameraOffsetX,
          tuning.cameraOffsetY,
          tuning.cameraOffsetZ,
        ]}
      >
        <mesh visible={false}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial />
        </mesh>
      </group>

      <group
        ref={cameraTargetHandle}
        position={[
          tuning.cameraTargetOffsetX,
          tuning.cameraTargetOffsetY,
          tuning.cameraTargetOffsetZ,
        ]}
      >
        <mesh visible={false}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial />
        </mesh>
      </group>
    </>
  );
}

function NavaExacta({
  tuning,
  vizual,
  spriteCore,
  bankGroup,
  bankHandle,
  shipMesh,
  leftFlameMesh,
  rightFlameMesh,
  indicatorMesh,
}) {
  const texturaNava = useLoader(
    THREE.TextureLoader,
    "/assets/GoliathDarkOrbit.png"
  );

  useEffect(() => {
    texturaNava.colorSpace = THREE.SRGBColorSpace;
    texturaNava.anisotropy = 16;
    texturaNava.needsUpdate = true;
  }, [texturaNava]);

  const uniformeNava = useMemo(
    () => ({
      uTexture: { value: texturaNava },
      uOpacity: { value: 1 },
    }),
    [texturaNava]
  );

  const uniformeFlacaraStanga = useMemo(
    () => ({
      uIntensitate: { value: 0.6 },
      uCuloare: { value: new THREE.Color("#5be9ff") },
    }),
    []
  );

  const uniformeFlacaraDreapta = useMemo(
    () => ({
      uIntensitate: { value: 0.6 },
      uCuloare: { value: new THREE.Color("#5be9ff") },
    }),
    []
  );

  return (
    <group ref={vizual}>
      <group
        ref={spriteCore}
        position={[
          tuning.spriteOffsetX,
          tuning.spriteOffsetY,
          tuning.spriteOffsetZ,
        ]}
        rotation={[0, 0, degToRad(tuning.spriteRotationDeg)]}
        scale={[tuning.spriteScaleX, tuning.spriteScaleY, 1]}
      >
        {/* Handle invizibil pentru pivot/inclinare. Selecteaza "Inclinare nava". */}
        <group
          ref={bankHandle}
          position={[
            tuning.bankPivotX,
            tuning.bankPivotY,
            tuning.bankPivotZ,
          ]}
          rotation={[0, 0, degToRad(tuning.bankManualDeg)]}
          scale={[
            Math.max(0.01, tuning.bankMaxDeg / TUNING_INITIAL.bankMaxDeg),
            Math.max(
              0.01,
              tuning.bankAutoStrength / TUNING_INITIAL.bankAutoStrength
            ),
            1,
          ]}
        >
          <mesh visible={false}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial />
          </mesh>
        </group>

        {/* Doar nava + motoarele se inclina. */}
        <group
          ref={bankGroup}
          position={[
            tuning.bankPivotX,
            tuning.bankPivotY,
            tuning.bankPivotZ,
          ]}
        >
          <group
            position={[
              -tuning.bankPivotX,
              -tuning.bankPivotY,
              -tuning.bankPivotZ,
            ]}
          >
            <mesh
              ref={shipMesh}
              rotation={[0, 0, degToRad(tuning.shipRotationDeg)]}
              position={[
                tuning.shipOffsetX,
                tuning.shipOffsetY,
                tuning.shipOffsetZ,
              ]}
              scale={[tuning.shipScaleX, tuning.shipScaleY, 1]}
              renderOrder={10}
            >
              <planeGeometry args={[1, 1]} />
              <shaderMaterial
                uniforms={uniformeNava}
                vertexShader={vertexShaderNava}
                fragmentShader={fragmentShaderNava}
                transparent
                depthWrite={false}
                depthTest={false}
                side={THREE.DoubleSide}
                toneMapped={false}
              />
            </mesh>

            <mesh
              ref={leftFlameMesh}
              position={[
                tuning.leftFlameX,
                tuning.leftFlameY,
                tuning.leftFlameZ,
              ]}
              rotation={[0, 0, degToRad(tuning.leftFlameRotationDeg)]}
              scale={[tuning.leftFlameScaleX, tuning.leftFlameScaleY, 1]}
              renderOrder={11}
            >
              <planeGeometry args={[1, 1]} />
              <shaderMaterial
                uniforms={uniformeFlacaraStanga}
                vertexShader={vertexShaderSimplu}
                fragmentShader={fragmentShaderFlacara}
                transparent
                depthWrite={false}
                depthTest={false}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
              />
            </mesh>

            <mesh
              ref={rightFlameMesh}
              position={[
                tuning.rightFlameX,
                tuning.rightFlameY,
                tuning.rightFlameZ,
              ]}
              rotation={[0, 0, degToRad(tuning.rightFlameRotationDeg)]}
              scale={[tuning.rightFlameScaleX, tuning.rightFlameScaleY, 1]}
              renderOrder={11}
            >
              <planeGeometry args={[1, 1]} />
              <shaderMaterial
                uniforms={uniformeFlacaraDreapta}
                vertexShader={vertexShaderSimplu}
                fragmentShader={fragmentShaderFlacara}
                transparent
                depthWrite={false}
                depthTest={false}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
              />
            </mesh>
          </group>
        </group>

        {/* Sageata ramane indicator curat, nu se inclina. */}
        <IndicatorDirectie tuning={tuning} indicatorMesh={indicatorMesh} />

        <pointLight
          position={[tuning.lightX, tuning.lightY, tuning.lightZ]}
          color="#36f5ff"
          intensity={tuning.lightIntensity}
          distance={tuning.lightDistance}
        />
      </group>
    </group>
  );
}

const BARA_NAVA_HP_MAX = 100;
const BARA_NAVA_SCUT_MAX = 100;

function BaraStareNavaJucator({ playerRef, viata, scut }) {
  const grup = useRef();
  const tintaPozitie = useMemo(() => new THREE.Vector3(), []);
  const initializat = useRef(false);

  useFrame(({ camera }) => {
    if (!grup.current || !playerRef?.current) return;

    tintaPozitie.set(playerRef.current.x, playerRef.current.y + 5.4, playerRef.current.z);

    if (!initializat.current) {
      grup.current.position.copy(tintaPozitie);
      grup.current.quaternion.copy(camera.quaternion);
      initializat.current = true;
      return;
    }

    grup.current.position.lerp(tintaPozitie, 0.5);
    grup.current.quaternion.slerp(camera.quaternion, 0.35);
  });

  const procentScut = THREE.MathUtils.clamp((scut ?? BARA_NAVA_SCUT_MAX) / BARA_NAVA_SCUT_MAX, 0, 1);
  const procentHp = THREE.MathUtils.clamp((viata ?? BARA_NAVA_HP_MAX) / BARA_NAVA_HP_MAX, 0, 1);

  const LATIME = 2.6;
  const INALTIME_FUNDAL = 0.26;
  const INALTIME_UMPLERE = 0.19;
  const Y_SCUT = 0.4;
  const Y_HP = 0;

  return (
    <group ref={grup} renderOrder={950}>
      {/* Scut */}
      <mesh position={[0, Y_SCUT, -0.002]} renderOrder={950}>
        <planeGeometry args={[LATIME + 0.1, INALTIME_FUNDAL + 0.1]} />
        <meshBasicMaterial
          color="#bdf3ff"
          transparent
          opacity={0.45}
          depthWrite={false}
          depthTest={false}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, Y_SCUT, -0.001]} renderOrder={951}>
        <planeGeometry args={[LATIME, INALTIME_FUNDAL]} />
        <meshBasicMaterial color="#021018" transparent opacity={0.85} depthWrite={false} depthTest={false} />
      </mesh>
      <mesh
        position={[-LATIME / 2 + (LATIME / 2) * procentScut, Y_SCUT, 0.001]}
        scale={[Math.max(procentScut, 0.0001), 1, 1]}
        renderOrder={952}
      >
        <planeGeometry args={[LATIME, INALTIME_UMPLERE]} />
        <meshBasicMaterial
          color="#5be3ff"
          transparent
          opacity={1}
          depthWrite={false}
          depthTest={false}
          toneMapped={false}
        />
      </mesh>

      {/* HP */}
      <mesh position={[0, Y_HP, -0.002]} renderOrder={953}>
        <planeGeometry args={[LATIME + 0.1, INALTIME_FUNDAL + 0.1]} />
        <meshBasicMaterial
          color="#c4ffd2"
          transparent
          opacity={0.45}
          depthWrite={false}
          depthTest={false}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, Y_HP, -0.001]} renderOrder={954}>
        <planeGeometry args={[LATIME, INALTIME_FUNDAL]} />
        <meshBasicMaterial color="#0a2412" transparent opacity={0.85} depthWrite={false} depthTest={false} />
      </mesh>
      <mesh
        position={[-LATIME / 2 + (LATIME / 2) * procentHp, Y_HP, 0.001]}
        scale={[Math.max(procentHp, 0.0001), 1, 1]}
        renderOrder={955}
      >
        <planeGeometry args={[LATIME, INALTIME_UMPLERE]} />
        <meshBasicMaterial
          color="#52ff85"
          transparent
          opacity={1}
          depthWrite={false}
          depthTest={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

export default function NavaJucatorului({
  playerRef,
  tintaJucator,
  tintaLive,
  seteazaTintaJucator,
  seteazaPozitieJucator,
  seteazaEfecteAtmosferice,
  marimeHarta,
  ataca,
  tintaSelectata,
  pozitiiInamici,
  multiplicatorViteza,
  viata,
  scut,
}) {
  const [tuning, setTuning] = useState(incarcaTuningInitial);
  const [axesActive, setAxesActive] = useState(false);
  const [selected, setSelected] = useState("ship");
  const [mode, setMode] = useState("translate");
  const [draggingAxes, setDraggingAxes] = useState(false);
  const [savedAt, setSavedAt] = useState("");

  useEffect(() => {
    salveazaTuning(tuning);
    setSavedAt(new Date().toLocaleTimeString());
  }, [tuning]);

  const nava = useRef();
  const vizual = useRef();
  const spriteCore = useRef();

  const bankGroup = useRef();
  const bankHandle = useRef();

  const shipMesh = useRef();
  const leftFlameMesh = useRef();
  const rightFlameMesh = useRef();
  const indicatorMesh = useRef();

  const lightHandle = useRef();
  const cameraOffsetHandle = useRef();
  const cameraTargetHandle = useRef();

  const bankCurentDeg = useRef(0);
  const unghiAnteriorBank = useRef(0);

  const refsTuning = useMemo(
    () => ({
      spriteCore,
      bank: bankHandle,
      ship: shipMesh,
      leftFlame: leftFlameMesh,
      rightFlame: rightFlameMesh,
      indicator: indicatorMesh,
      light: lightHandle,
      cameraOffset: cameraOffsetHandle,
      cameraTarget: cameraTargetHandle,
    }),
    []
  );

  const tasteApasate = folosesteTastatura();

  const ultimulUpdateHud = useRef(0);
  const intensitateMotorActuala = useRef(TUNING_INITIAL.flameIdle);

  const calatorie = useRef({
    activa: false,
    startX: 0,
    startZ: 0,
    tintaX: 0,
    tintaZ: 0,
    unghi: 0,
    durata: 0,
    timpStart: 0,
  });

  const ultimaTintaId = useRef(null);

  const directieLume = useMemo(() => new THREE.Vector3(), []);
  const cameraDreapta = useMemo(() => new THREE.Vector3(), []);
  const cameraSus = useMemo(() => new THREE.Vector3(), []);
  const cameraTargetTemp = useMemo(() => new THREE.Vector3(), []);

  useFrame((stare, timpDeltaBrut) => {
    if (!nava.current) return;

    const timpDelta = Math.min(timpDeltaBrut, 0.05);
    const pozitie = nava.current.position;
    const limitaHarta = marimeHarta / 2 - 4.5;

    const tuningBlocheazaMiscarea =
      tuning.lockMovementWhileTuning >= 0.5 && axesActive;

    const viteza = Math.max(0.001, tuning.speed) * Math.max(0.001, multiplicatorViteza || 1);
    const vitezaRotatie = Math.max(0.001, tuning.rotationSpeed);
    const distantaOprire = Math.max(0, tuning.stopDistance);

    if (nava.current.userData.unghiVizual === undefined) {
      nava.current.userData.unghiVizual = 0;
    }

    let seMisca = false;

    if (tuningBlocheazaMiscarea || draggingAxes) {
      if (tintaJucator) seteazaTintaJucator(null);
      calatorie.current.activa = false;
      ultimaTintaId.current = null;
    } else {
      let miscareX = 0;
      let miscareZ = 0;

      if (tasteApasate.current.KeyW || tasteApasate.current.ArrowUp) {
        miscareZ -= 1;
      }

      if (tasteApasate.current.KeyS || tasteApasate.current.ArrowDown) {
        miscareZ += 1;
      }

      if (tasteApasate.current.KeyA || tasteApasate.current.ArrowLeft) {
        miscareX -= 1;
      }

      if (tasteApasate.current.KeyD || tasteApasate.current.ArrowRight) {
        miscareX += 1;
      }

      const controlManual = miscareX !== 0 || miscareZ !== 0;
      const unghiCurent = nava.current.userData.unghiVizual;

      if (controlManual) {
        if (tintaJucator) {
          seteazaTintaJucator(null);
        }

        calatorie.current.activa = false;
        ultimaTintaId.current = null;

        const lungime = Math.hypot(miscareX, miscareZ);
        const dirX = miscareX / lungime;
        const dirZ = miscareZ / lungime;
        const unghiDorit = Math.atan2(dirX, dirZ);

        nava.current.userData.unghiVizual = rotesteSpre(
          unghiCurent,
          unghiDorit,
          vitezaRotatie * timpDelta
        );

        pozitie.x += dirX * viteza * timpDelta;
        pozitie.z += dirZ * viteza * timpDelta;
        seMisca = true;
      } else if (tintaJucator) {
        const tintaX = THREE.MathUtils.clamp(
          tintaJucator[0],
          -limitaHarta,
          limitaHarta
        );

        const tintaZ = THREE.MathUtils.clamp(
          tintaJucator[2],
          -limitaHarta,
          limitaHarta
        );

        if (tintaLive) {
          ultimaTintaId.current = null;
          calatorie.current.activa = false;

          const dx = tintaX - pozitie.x;
          const dz = tintaZ - pozitie.z;
          const distanta = Math.hypot(dx, dz);

          if (distanta > distantaOprire) {
            const unghiDorit = Math.atan2(dx, dz);

            nava.current.userData.unghiVizual = rotesteSpre(
              unghiCurent,
              unghiDorit,
              vitezaRotatie * 1.3 * timpDelta
            );

            const pas = Math.min(viteza * VITEZA_LIVE_FACTOR * timpDelta, distanta);
            pozitie.x += (dx / distanta) * pas;
            pozitie.z += (dz / distanta) * pas;
            seMisca = true;
          }
        } else {
          const tintaId = `${tintaX.toFixed(3)}_${tintaZ.toFixed(3)}`;

          if (ultimaTintaId.current !== tintaId) {
            ultimaTintaId.current = tintaId;

            const dx = tintaX - pozitie.x;
            const dz = tintaZ - pozitie.z;
            const distanta = Math.hypot(dx, dz);

            calatorie.current.startX = pozitie.x;
            calatorie.current.startZ = pozitie.z;
            calatorie.current.tintaX = tintaX;
            calatorie.current.tintaZ = tintaZ;
            calatorie.current.unghi = Math.atan2(dx, dz);
            calatorie.current.durata = distanta / viteza;
            calatorie.current.timpStart = stare.clock.elapsedTime;
            calatorie.current.activa = distanta > distantaOprire;

            if (!calatorie.current.activa) {
              seteazaTintaJucator(null);
            }
          }

          if (calatorie.current.activa) {
            const {
              startX,
              startZ,
              tintaX: tintaXCalatorie,
              tintaZ: tintaZCalatorie,
              unghi,
              durata,
              timpStart,
            } = calatorie.current;

            const elapsed = stare.clock.elapsedTime - timpStart;
            const progres = durata > 0 ? elapsed / durata : 1;

            nava.current.userData.unghiVizual = rotesteSpre(
              unghiCurent,
              unghi,
              vitezaRotatie * timpDelta
            );

            if (progres >= 1) {
              pozitie.x = tintaXCalatorie;
              pozitie.z = tintaZCalatorie;

              calatorie.current.activa = false;
              ultimaTintaId.current = null;
              seteazaTintaJucator(null);
            } else {
              pozitie.x = THREE.MathUtils.lerp(startX, tintaXCalatorie, progres);
              pozitie.z = THREE.MathUtils.lerp(startZ, tintaZCalatorie, progres);
              seMisca = true;
            }
          }
        }
      }
    }

    if (ataca && tintaSelectata && pozitiiInamici?.current) {
      const pozitieInamic = pozitiiInamici.current[tintaSelectata];

      if (pozitieInamic) {
        const dxInamic = pozitieInamic.x - pozitie.x;
        const dzInamic = pozitieInamic.z - pozitie.z;

        if (dxInamic !== 0 || dzInamic !== 0) {
          nava.current.userData.unghiVizual = Math.atan2(dxInamic, dzInamic);
        }
      }
    }

    pozitie.x = THREE.MathUtils.clamp(pozitie.x, -limitaHarta, limitaHarta);
    pozitie.z = THREE.MathUtils.clamp(pozitie.z, -limitaHarta, limitaHarta);
    pozitie.y = tuning.shipWorldY;

    /*
      Inclinare automata stanga/dreapta.
      Se bazeaza pe cat de rapid se schimba directia navei.
    */
    const unghiPentruBank = nava.current.userData.unghiVizual || 0;
    const deltaBank = diferentaUnghiulara(
      unghiAnteriorBank.current,
      unghiPentruBank
    );

    unghiAnteriorBank.current = unghiPentruBank;

    const vitezaUnghiularaBank = timpDelta > 0 ? deltaBank / timpDelta : 0;
    const bankMax = Math.max(0, tuning.bankMaxDeg);

    const bankAutoTarget =
      tuning.bankEnabled >= 0.5
        ? THREE.MathUtils.clamp(
            vitezaUnghiularaBank *
              tuning.bankAutoStrength *
              tuning.bankDirection,
            -bankMax,
            bankMax
          )
        : 0;

    bankCurentDeg.current = THREE.MathUtils.lerp(
      bankCurentDeg.current,
      bankAutoTarget,
      THREE.MathUtils.clamp(tuning.bankLerp, 0, 1)
    );

    if (bankGroup.current) {
      const bankTotalDeg = tuning.bankManualDeg + bankCurentDeg.current;

      bankGroup.current.position.set(
        tuning.bankPivotX,
        tuning.bankPivotY,
        tuning.bankPivotZ
      );

      bankGroup.current.rotation.set(
        degToRad(tuning.bankPitchDeg),
        degToRad(bankTotalDeg),
        degToRad(tuning.bankRollDeg)
      );
    }

    const pulsMotorTinta = seMisca
      ? tuning.flameMovingBase +
        Math.sin(stare.clock.elapsedTime * tuning.flamePulseSpeed) *
          tuning.flamePulseAmp
      : tuning.flameIdle;

    intensitateMotorActuala.current = THREE.MathUtils.lerp(
      intensitateMotorActuala.current,
      pulsMotorTinta,
      THREE.MathUtils.clamp(timpDelta * Math.max(0.001, tuning.flameFadeSpeed), 0, 1)
    );

    if (leftFlameMesh.current && rightFlameMesh.current) {
      leftFlameMesh.current.material.uniforms.uIntensitate.value =
        intensitateMotorActuala.current;
      rightFlameMesh.current.material.uniforms.uIntensitate.value =
        intensitateMotorActuala.current;
    }

    if (playerRef?.current) {
      playerRef.current.set(pozitie.x, pozitie.y, pozitie.z);
    }

    if (stare.clock.elapsedTime - ultimulUpdateHud.current > 0.08) {
      ultimulUpdateHud.current = stare.clock.elapsedTime;
      seteazaPozitieJucator([pozitie.x, pozitie.y, pozitie.z]);

      const factorScalareHarta = marimeHarta / 210;
      const zonaRadiatieLatime = 4.5 * factorScalareHarta * 2;
      const distantaPanaLaMargine =
        limitaHarta - Math.max(Math.abs(pozitie.x), Math.abs(pozitie.z));
      const nivelRadiatie = THREE.MathUtils.clamp(
        1 - distantaPanaLaMargine / zonaRadiatieLatime,
        0,
        1
      );
      const nivelGaz = densitateGazLaPunct(pozitie.x, pozitie.z, marimeHarta);

      seteazaEfecteAtmosferice?.({ gaz: nivelGaz, radiatie: nivelRadiatie });
    }

    const cameraTarget = cameraTargetTemp.set(
      pozitie.x + tuning.cameraTargetOffsetX,
      tuning.cameraTargetOffsetY,
      pozitie.z + tuning.cameraTargetOffsetZ
    );

    const cameraLerpPosition = THREE.MathUtils.clamp(
      tuning.cameraLerpPosition,
      0,
      1
    );

    const cameraLerpZoom = THREE.MathUtils.clamp(tuning.cameraLerpZoom, 0, 1);

    stare.camera.position.x = THREE.MathUtils.lerp(
      stare.camera.position.x,
      pozitie.x + tuning.cameraOffsetX,
      cameraLerpPosition
    );

    stare.camera.position.y = THREE.MathUtils.lerp(
      stare.camera.position.y,
      tuning.cameraOffsetY,
      cameraLerpPosition
    );

    stare.camera.position.z = THREE.MathUtils.lerp(
      stare.camera.position.z,
      pozitie.z + tuning.cameraOffsetZ,
      cameraLerpPosition
    );

    if ("zoom" in stare.camera) {
      const zoomMaximPermis = 24;
      const zoomTinta = Math.min(tuning.cameraZoom, zoomMaximPermis);

      stare.camera.zoom = THREE.MathUtils.lerp(
        stare.camera.zoom,
        zoomTinta,
        cameraLerpZoom
      );

      stare.camera.updateProjectionMatrix();
    }

    stare.camera.lookAt(cameraTarget);

    /*
      Plan DarkOrbit:
      - vizualul copiaza camera => sprite 2D in planul ecranului
      - apoi se roteste dupa directia de mers
      - spriteCore ramane reglabil separat
    */
    if (vizual.current) {
      const unghiVizual = nava.current.userData.unghiVizual || 0;

      directieLume.set(Math.sin(unghiVizual), 0, Math.cos(unghiVizual));

      cameraDreapta.set(1, 0, 0).applyQuaternion(stare.camera.quaternion);
      cameraSus.set(0, 1, 0).applyQuaternion(stare.camera.quaternion);

      const directieEcranX = directieLume.dot(cameraDreapta);
      const directieEcranY = directieLume.dot(cameraSus);

      const unghiSprite = Math.atan2(-directieEcranX, directieEcranY);

      vizual.current.quaternion.copy(stare.camera.quaternion);
      vizual.current.rotateZ(unghiSprite);
    }

    nava.current.rotation.set(0, 0, 0);
  });

  return (
    <>
      <group
        ref={nava}
        position={[-532.4, tuning.shipWorldY, -16.1]}
        scale={[
          tuning.parentScale,
          tuning.parentScale,
          tuning.parentScale,
        ]}
      >
        <NavaExacta
          tuning={tuning}
          vizual={vizual}
          spriteCore={spriteCore}
          bankGroup={bankGroup}
          bankHandle={bankHandle}
          shipMesh={shipMesh}
          leftFlameMesh={leftFlameMesh}
          rightFlameMesh={rightFlameMesh}
          indicatorMesh={indicatorMesh}
        />

        <TuningHandles
          tuning={tuning}
          lightHandle={lightHandle}
          cameraOffsetHandle={cameraOffsetHandle}
          cameraTargetHandle={cameraTargetHandle}
        />
      </group>

      <BaraStareNavaJucator playerRef={playerRef} viata={viata} scut={scut} />

      <ManualTransformGizmo
        tuning={tuning}
        refsTuning={refsTuning}
        active={axesActive}
        selected={selected}
        mode={mode}
        setTuning={setTuning}
        setDraggingAxes={setDraggingAxes}
      />

      <TuningDomMenu
        tuning={tuning}
        setTuning={setTuning}
        active={axesActive}
        setActive={setAxesActive}
        selected={selected}
        setSelected={setSelected}
        mode={mode}
        setMode={setMode}
        savedAt={savedAt}
      />
    </>
  );
}

function IndicatorDirectie({ tuning, indicatorMesh }) {
  const forma = useMemo(() => {
    const shape = new THREE.Shape();

    shape.moveTo(0, 2.0);
    shape.lineTo(-0.85, 0);
    shape.lineTo(0, 0.65);
    shape.lineTo(0.85, 0);
    shape.closePath();

    return new THREE.ShapeGeometry(shape);
  }, []);

  return (
    <mesh
      ref={indicatorMesh}
      geometry={forma}
      position={[tuning.indicatorX, tuning.indicatorY, tuning.indicatorZ]}
      rotation={[0, 0, degToRad(tuning.indicatorRotationDeg)]}
      scale={[tuning.indicatorScaleX, tuning.indicatorScaleY, 1]}
      renderOrder={12}
    >
      <meshBasicMaterial
        color="#ffb02e"
        transparent
        opacity={THREE.MathUtils.clamp(tuning.indicatorOpacity, 0, 1)}
        depthWrite={false}
        depthTest={false}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}
