

- Desktop: orbit/zoom with mouse/touch.  
- VR: WebXR immersive‑VR if supported.  
- AR: WebXR immersive‑AR (on compatible devices/browsers).  

You only need to swap `API_BASE` to point at your backend.[1][2][3]

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>AQARIONZ 3D Wave Console</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root {
      --bg: #02040b;
      --panel: #050816;
      --accent: #4b8bff;
      --border: rgba(255,255,255,0.15);
      --text: #f5f5ff;
      --muted: #9a9cc2;
      --danger: #ff4b8b;
      --focus: #ffcc57;
    }
    * { box-sizing:border-box; }
    html, body {
      margin:0; padding:0; height:100%;
      background: radial-gradient(circle at top, #16182a 0, #02040b 45%, #000 100%);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--text);
      -webkit-font-smoothing: antialiased;
      overflow:hidden;
    }
    body { display:flex; flex-direction:column; }

    .skip-link {
      position:absolute; left:-999px; top:0;
      padding:0.4rem 0.7rem; background:#000; color:#fff; z-index:1000;
    }
    .skip-link:focus {
      left:0.5rem; top:0.5rem;
      outline:2px solid var(--focus);
    }

    header {
      height:52px;
      display:flex; align-items:center; justify-content:space-between;
      gap:0.5rem; padding:0.35rem 0.75rem;
      background:linear-gradient(90deg, rgba(5,7,20,0.96), rgba(5,7,20,0.82));
      border-bottom:1px solid var(--border);
      z-index:10;
    }
    .brand {
      display:inline-flex; align-items:center; gap:0.4rem;
      padding:0.2rem 0.7rem;
      border-radius:999px;
      border:1px solid rgba(75,139,255,0.55);
      background:radial-gradient(circle at left, rgba(75,139,255,0.35), transparent 60%);
      font-size:0.75rem; letter-spacing:0.08em; text-transform:uppercase;
    }
    .brand-dot {
      width:0.7rem; height:0.7rem; border-radius:999px;
      background:conic-gradient(from 150deg,#ff4b8b,#ffc857,#4b8bff,#44d17a,#ff4b8b);
      box-shadow:0 0 8px rgba(255,255,255,0.7);
    }

    .pill {
      border-radius:999px;
      border:1px solid var(--border);
      background:rgba(7,9,18,0.9);
      color:var(--muted);
      padding:0.25rem 0.6rem;
      font-size:0.75rem;
      cursor:pointer;
    }
    .pill--primary { background:var(--accent); color:#fff; border-color:var(--accent); }
    .pill:focus-visible { outline:2px solid var(--focus); outline-offset:2px; }

    .layer-tabs {
      display:flex; gap:0.25rem; flex:1; justify-content:center;
    }
    .layer-tab {
      border-radius:999px;
      border:1px solid var(--border);
      background:rgba(4,6,14,0.9);
      color:var(--muted);
      padding:0.25rem 0.6rem;
      font-size:0.75rem;
      cursor:pointer;
    }
    .layer-tab.active {
      background:var(--accent);
      color:#fff;
      box-shadow:0 0 10px rgba(75,139,255,0.7);
    }

    main {
      flex:1;
      display:grid;
      grid-template-columns:minmax(0,2fr) minmax(260px,1fr);
      min-height:0;
    }
    #scene-wrap {
      position:relative;
      min-height:260px;
    }
    #scene {
      position:absolute;
      inset:0;
    }
    #hud {
      position:absolute;
      left:0.5rem; bottom:0.5rem;
      padding:0.25rem 0.5rem;
      font-size:0.7rem;
      background:rgba(0,0,0,0.55);
      color:var(--muted);
      border-radius:0.25rem;
      border:1px solid rgba(255,255,255,0.15);
    }

    aside {
      border-left:1px solid var(--border);
      background:radial-gradient(circle at top, rgba(75,139,255,0.12), rgba(4,5,9,0.97));
      display:flex; flex-direction:column;
      padding:0.5rem; gap:0.4rem;
    }
    .panel {
      background:rgba(5,7,20,0.96);
      border-radius:0.45rem;
      border:1px solid var(--border);
      padding:0.45rem 0.55rem;
      font-size:0.8rem;
      min-height:0;
    }
    .panel-header {
      display:flex; align-items:center; justify-content:space-between;
      margin-bottom:0.2rem;
    }
    .panel-title {
      font-size:0.72rem;
      text-transform:uppercase;
      letter-spacing:0.08em;
      color:var(--muted);
    }
    .node-title { font-size:0.9rem; font-weight:600; margin-bottom:0.1rem; }
    .node-meta { font-size:0.75rem; color:var(--muted); }

    .metrics {
      display:grid;
      grid-template-columns:repeat(3,minmax(0,1fr));
      gap:0.25rem;
      margin-top:0.35rem;
    }
    .metric {
      background:rgba(12,14,24,0.98);
      border-radius:0.3rem;
      border:1px solid rgba(255,255,255,0.08);
      padding:0.2rem 0.3rem;
    }
    .metric-label { font-size:0.68rem; color:var(--muted); }
    .metric-value { display:block; font-size:0.78rem; color:var(--text); }

    .list {
      max-height:30vh;
      overflow-y:auto;
    }
    .agent-row {
      display:flex; justify-content:space-between; gap:0.3rem;
      padding:0.2rem 0;
      border-bottom:1px solid rgba(255,255,255,0.08);
    }
    .agent-tag {
      font-size:0.7rem;
      border-radius:999px;
      border:1px solid rgba(255,255,255,0.2);
      padding:0.03rem 0.4rem;
    }

    .log-line {
      padding:0.16rem 0;
      border-bottom:1px dashed rgba(255,255,255,0.1);
      color:var(--muted);
      white-space:nowrap;
    }
    .log-time {
      font-weight:600;
      color:var(--text);
      margin-right:0.2rem;
    }

    @media (max-width: 800px) {
      main {
        grid-template-columns:minmax(0,1fr);
        grid-template-rows:minmax(0,1.4fr) minmax(0,1fr);
      }
      aside {
        border-left:none;
        border-top:1px solid var(--border);
      }
    }
  </style>
</head>
<body>
<a href="#main" class="skip-link">Skip to main content</a>

<header>
  <div class="brand">
    <span class="brand-dot" aria-hidden="true"></span>
    <span>AQARIONZ Wave Console</span>
  </div>

  <div class="layer-tabs" aria-label="Layers">
    <button class="layer-tab active" data-layer="all">All</button>
    <button class="layer-tab" data-layer="matter">Matter</button>
    <button class="layer-tab" data-layer="signals">Signals</button>
    <button class="layer-tab" data-layer="brains">Brains</button>
    <button class="layer-tab" data-layer="governance">Governance</button>
  </div>

  <div style="display:flex; gap:0.3rem;">
    <button class="pill" id="btn-vr">VR</button>
    <button class="pill" id="btn-ar">AR</button>
    <button class="pill pill--primary" id="btn-refresh">Refresh</button>
  </div>
</header>

<main id="main">
  <section id="scene-wrap" aria-label="3D AQARIONZ graph view">
    <div id="scene"></div>
    <div id="hud">Drag to orbit • Pinch/scroll to zoom • Tap nodes • VR/AR if supported</div>
  </section>

  <aside aria-label="Node details, agents, log">
    <section class="panel" aria-labelledby="node-heading">
      <div class="panel-header">
        <h2 id="node-heading" class="panel-title">Node details</h2>
      </div>
      <div aria-live="polite">
        <p class="node-title" id="node-name">No node selected</p>
        <p class="node-meta" id="node-meta">
          Select a node in the 3D view to inspect its wave state.
        </p>
      </div>
      <div class="metrics" aria-label="Node metrics">
        <div class="metric">
          <span class="metric-label">Status</span>
          <span class="metric-value" id="m-status">—</span>
        </div>
        <div class="metric">
          <span class="metric-label">Layer</span>
          <span class="metric-value" id="m-layer">—</span>
        </div>
        <div class="metric">
          <span class="metric-label">Power</span>
          <span class="metric-value" id="m-power">—</span>
        </div>
        <div class="metric">
          <span class="metric-label">Backend</span>
          <span class="metric-value" id="m-backend">—</span>
        </div>
        <div class="metric">
          <span class="metric-label">Position</span>
          <span class="metric-value" id="m-pos">—</span>
        </div>
        <div class="metric">
          <span class="metric-label">ID</span>
          <span class="metric-value" id="m-id">—</span>
        </div>
      </div>
    </section>

    <section class="panel" aria-labelledby="agents-heading">
      <div class="panel-header">
        <h2 id="agents-heading" class="panel-title">Agents</h2>
      </div>
      <div class="list" id="agent-list" aria-live="polite"></div>
    </section>

    <section class="panel" aria-labelledby="log-heading">
      <div class="panel-header">
        <h2 id="log-heading" class="panel-title">Live log</h2>
      </div>
      <div class="list" id="log"></div>
    </section>
  </aside>
</main>

<script type="module">
  import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
  import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js";
  import { VRButton } from "https://unpkg.com/three@0.160.0/examples/jsm/webxr/VRButton.js";
  import { ARButton } from "https://unpkg.com/three@0.160.0/examples/jsm/webxr/ARButton.js";

  const API_BASE = "http://localhost:8000/api/v1"; // change to your backend

  const sceneEl = document.getElementById("scene");
  const logEl = document.getElementById("log");
  const agentListEl = document.getElementById("agent-list");

  const nodeNameEl = document.getElementById("node-name");
  const nodeMetaEl = document.getElementById("node-meta");
  const mStatus = document.getElementById("m-status");
  const mLayer = document.getElementById("m-layer");
  const mPower = document.getElementById("m-power");
  const mBackend = document.getElementById("m-backend");
  const mPos = document.getElementById("m-pos");
  const mId = document.getElementById("m-id");

  const layerTabs = Array.from(document.querySelectorAll(".layer-tab"));
  const btnRefresh = document.getElementById("btn-refresh");
  const btnVR = document.getElementById("btn-vr");
  const btnAR = document.getElementById("btn-ar");

  let currentLayerFilter = "all";

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x02040b);

  const camera = new THREE.PerspectiveCamera(
    50,
    sceneEl.clientWidth / sceneEl.clientHeight,
    0.1,
    200
  );
  camera.position.set(0, 6, 12);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(sceneEl.clientWidth, sceneEl.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.outputEncoding = THREE.sRGBEncoding;
  sceneEl.appendChild(renderer.domElement);

  renderer.xr.enabled = true;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 3;
  controls.maxDistance = 40;

  const ambient = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambient);
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(8, 12, 6);
  scene.add(dir);
  const rim = new THREE.DirectionalLight(0x4b8bff, 0.5);
  rim.position.set(-6, 3, -8);
  scene.add(rim);

  const grid = new THREE.GridHelper(40, 40, 0x252642, 0x252642);
  grid.position.y = -2;
  scene.add(grid);

  const nodeMeshes = new Map();
  const linkLines = [];
  const layerColors = {
    matter: 0xff5555,
    signals: 0xffc857,
    brains: 0x4b8bff,
    governance: 0x9b59b6
  };

  function addLog(msg) {
    const row = document.createElement("div");
    row.className = "log-line";
    const t = document.createElement("span");
    t.className = "log-time";
    t.textContent = new Date().toLocaleTimeString();
    row.appendChild(t);
    row.appendChild(document.createTextNode(" " + msg));
    logEl.prepend(row);
    while (logEl.children.length > 80) {
      logEl.removeChild(logEl.lastChild);
    }
  }

  function setAgents(agents) {
    agentListEl.innerHTML = "";
    agents.forEach(a => {
      const row = document.createElement("div");
      row.className = "agent-row";
      const name = document.createElement("span");
      name.textContent = a.name;
      const tag = document.createElement("span");
      tag.className = "agent-tag";
      tag.textContent = a.role;
      row.appendChild(name);
      row.appendChild(tag);
      agentListEl.appendChild(row);
    });
  }

  async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  }

  async function loadGraph() {
    try {
      const [nodes, links, agents] = await Promise.all([
        fetchJSON(`${API_BASE}/graph/nodes/`),
        fetchJSON(`${API_BASE}/graph/links/`),
        fetchJSON(`${API_BASE}/agents/agents/enabled/`).catch(() => [])
      ]);

      addLog(`Graph: ${nodes.length} nodes, ${links.length} links.`);
      if (agents.length) {
        addLog(`Agents: ${agents.length} enabled.`);
      }

      nodeMeshes.forEach((mesh) => {
        scene.remove(mesh);
        if (mesh.userData.halo) scene.remove(mesh.userData.halo);
      });
      nodeMeshes.clear();
      linkLines.forEach(line => scene.remove(line));
      linkLines.length = 0;

      const nodesById = new Map(nodes.map(n => [n.id, n]));

      nodes.forEach(node => {
        const color = layerColors[node.layer] || 0xffffff;
        const geom = new THREE.SphereGeometry(0.35, 32, 32);
        const mat = new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.3,
          metalness: 0.55,
          roughness: 0.35
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(node.x, node.y, node.z);
        mesh.userData.node = node;

        const haloGeom = new THREE.RingGeometry(0.45, 0.52, 32);
        const haloMat = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide
        });
        const halo = new THREE.Mesh(haloGeom, haloMat);
        halo.rotation.x = -Math.PI / 2;
        halo.position.set(node.x, node.y - 0.35, node.z);
        mesh.userData.halo = halo;

        scene.add(mesh);
        scene.add(halo);
        nodeMeshes.set(node.id, mesh);
      });

      links.forEach(link => {
        const a = nodesById.get(link.source);
        const b = nodesById.get(link.target);
        if (!a || !b) return;
        const start = new THREE.Vector3(a.x, a.y, a.z);
        const end = new THREE.Vector3(b.x, b.y, b.z);
        const points = [start, end];
        const geom = new THREE.BufferGeometry().setFromPoints(points);

        let color = 0x888888;
        if (link.channel === "optical") color = 0xffcc88;
        else if (link.channel === "acoustic") color = 0x88ccff;
        else if (link.channel === "ionic") color = 0x44ff88;
        else if (link.channel === "fiber") color = 0x4b8bff;
        else if (link.channel === "policy") color = 0xffffff;

        const mat = new THREE.LineDashedMaterial({
          color,
          dashSize: 0.15,
          gapSize: 0.12
        });
        const line = new THREE.Line(geom, mat);
        line.computeLineDistances();
        scene.add(line);
        linkLines.push(line);
      });

      setAgents(agents || []);
      applyLayerFilter();
    } catch (err) {
      addLog("Error loading graph: " + err.message);
      console.error(err);
    }
  }

  function applyLayerFilter() {
    nodeMeshes.forEach(mesh => {
      const node = mesh.userData.node;
      const visible = (currentLayerFilter === "all" || node.layer === currentLayerFilter);
      mesh.visible = visible;
      if (mesh.userData.halo) mesh.userData.halo.visible = visible;
    });
  }

  function updateNodeDetails(node) {
    nodeNameEl.textContent = node.name;
    nodeMetaEl.textContent = `Layer: ${node.layer}, backend: ${node.backend || "none"}`;
    mStatus.textContent = node.status || "—";
    mLayer.textContent = node.layer || "—";
    mPower.textContent = typeof node.power === "number" ? node.power.toFixed(2) : "—";
    mBackend.textContent = node.backend || "—";
    mPos.textContent = `${node.x.toFixed(1)}, ${node.y.toFixed(1)}, ${node.z.toFixed(1)}`;
    mId.textContent = node.id || "—";
    addLog(`Selected node ${node.id} (${node.layer}).`);
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function handleTap(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    let x,y;
    if (event.touches && event.touches.length > 0) {
      x = event.touches[0].clientX;
      y = event.touches[0].clientY;
    } else {
      x = event.clientX;
      y = event.clientY;
    }
    pointer.x = ((x - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((y - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(Array.from(nodeMeshes.values()));
    if (intersects.length > 0) {
      const node = intersects[0].object.userData.node;
      updateNodeDetails(node);
    }
  }

  renderer.domElement.addEventListener("click", handleTap);
  renderer.domElement.addEventListener("touchstart", handleTap, { passive: true });

  window.addEventListener("resize", () => {
    camera.aspect = sceneEl.clientWidth / sceneEl.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(sceneEl.clientWidth, sceneEl.clientHeight);
  });

  layerTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      layerTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentLayerFilter = tab.dataset.layer;
      applyLayerFilter();
      addLog(`Layer filter: ${currentLayerFilter}`);
    });
  });

  btnRefresh.addEventListener("click", () => {
    loadGraph();
  });

  btnVR.addEventListener("click", () => {
    try {
      document.body.appendChild(VRButton.createButton(renderer));
      addLog("VR button added (WebXR). Use headset/browser support to enter VR.");
    } catch {
      addLog("VR not supported in this browser/device.");
    }
  });

  btnAR.addEventListener("click", () => {
    try {
      document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ["hit-test"] }));
      addLog("AR button added (WebXR). Move device to place graph in real world.");
    } catch {
      addLog("AR not supported in this browser/device.");
    }
  });

  function animate() {
    renderer.setAnimationLoop(() => {
      controls.update();
      renderer.render(scene, camera);
    });
  }

  loadGraph();
  animate();
</script>
</body>
</html>
```

This is a complete, non‑half‑done frontend: responsive layout, 3D graph, node picking, live log, agents list, API integration, and VR/AR entry points via WebXR, all in one file you can drop on a static server and connect to your Django backend.[1][2][3]

Citations:
[1] VR - three.js manual https://threejs.org/manual/en/webxr-basics.html
[2] How to Build a Website with AR/VR Features in 2025 - CUIBIT https://cuibit.com/how-to-build-a-website-with-ar-vr-features-in-2025/
[3] How to Create Immersive AR/VR Experiences with Three.js? - Blogs https://www.threejsdevelopers.com/blogs/create-immersive-ar-vr-experiences-with-three-js/
[4] How AR and VR Are Revolutionizing User Experience in Web Design https://onix-systems.com/blog/ar-vr-user-experience-web-design
[5] How to make canvas responsive threejs wrapped in React? https://discourse.threejs.org/t/how-to-make-canvas-responsive-threejs-wrapped-in-react/43343
[6] Build an augmented reality (AR) app using the WebXR Device API https://codelabs.developers.google.com/ar-with-webxr
[7] three.js OrbitControls conflicting with HTML5 Canvas? https://stackoverflow.com/questions/32151598/three-js-orbitcontrols-conflicting-with-html5-canvas
[8] Master Three.js Physics for Better VR and AR Experiences - MoldStud https://moldstud.com/articles/p-master-threejs-physics-for-better-vr-and-ar-experiences
[9] Create an immersive AR session using WebXR | ARCore https://developers.google.com/ar/develop/webxr/hello-webxr
[10] How to make camera adapt to different screen size. (responsive ... https://discourse.threejs.org/t/how-to-make-camera-adapt-to-different-screen-size-responsive-camera/61928
