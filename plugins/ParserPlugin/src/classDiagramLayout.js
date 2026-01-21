function deepCloneJson(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function singleKey(obj) {
  const keys = Object.keys(obj || {});
  if (keys.length !== 1) throw new Error("Expected one-key object");
  return [keys[0], obj[keys[0]]];
}

function listEntities(parsed) {
  const entities = [];

  for (const c of (parsed.classes || [])) {
    const [name, body] = singleKey(c);
    entities.push({ kind: "class", name, body });
  }

  for (const i of (parsed.interfaces || [])) {
    const [name, body] = singleKey(i);
    entities.push({ kind: "interface", name, body });
  }

  return entities;
}

function normalizeAttributes(body) {
  return (body?.attributes || []).map(a => {
    const [attrName, attrBody] = singleKey(a);
    return { name: attrName, type: attrBody?.type ?? "" };
  });
}

function normalizeMethods(body) {
  return (body?.methods || []).map(m => {
    const [methodName, methodBody] = singleKey(m);

    const parameters = (methodBody?.parameters || []).map(p => {
      const [parName, parType] = singleKey(p);
      return { name: parName, type: parType };
    });

    return { name: methodName, parameters, returnType: methodBody?.returnType ?? "void" };
  });
}

function buildLines(entity, cfg) {
  const headerLines = entity.kind === "interface" && cfg.showInterfaceStereotype
    ? [cfg.interfaceStereotypeLine, entity.name]
    : [entity.name];

  const attrs = normalizeAttributes(entity.body);
  const methods = normalizeMethods(entity.body);

  const attrLines = attrs.map(a => a.type ? `${a.name}: ${a.type}` : a.name);

  const methodLines = methods.map(m => {
    const params = (m.parameters || []).map(p => `${p.name}: ${p.type}`).join(", ");
    return `${m.name}(${params}): ${m.returnType || "void"}`;
  });

  return { headerLines, attrLines, methodLines };
}

function computeSize(lines, cfg) {
  // total number of lines in each compartment
  const hCount = Math.max(lines.headerLines.length, 1);
  const aCount = lines.attrLines.length;
  const mCount = lines.methodLines.length;

  // measure width by character count
  const all = [...lines.headerLines, ...lines.attrLines, ...lines.methodLines];
  const maxLen = all.length ? Math.max(...all.map(s => String(s).length)) : 0;
  const width = Math.max(cfg.minWidth, 2 * cfg.paddingX + maxLen);

  let height = cfg.paddingY; // top padding

  // header
  height += cfg.lineHeight * hCount;

  // between header and attributes
  if (aCount > 0 || mCount > 0) {
    height += cfg.sepHeight; 
  }

  // attributes
  if (aCount > 0) {
    height += cfg.lineHeight * aCount;
  }

  // between attributes and methods
  if (mCount > 0) {
    height += cfg.sepHeight;
  }

  // methods
  if (mCount > 0) {
    height += cfg.lineHeight * mCount;
  }

  // bottom padding
  height += cfg.paddingY;

  // offset constant
  height -= 15;

  return { width, height };
}

function gridLayoutAt(items, cfg, originX, originY, maxRowWidth) {
  let x = originX;
  let y = originY;
  let rowMaxH = 0;

  const rowLimit = originX + maxRowWidth;

  for (const it of items) {
    if (x !== originX && (x + it.size.width) > rowLimit) {
      x = originX;
      y = y + rowMaxH + cfg.vGap;
      rowMaxH = 0;
    }

    it.layout = { x, y, width: it.size.width, height: it.size.height };

    x = x + it.size.width + cfg.hGap;
    rowMaxH = Math.max(rowMaxH, it.size.height);
  }

  let maxRight = originX;
  let maxBottom = originY;
  for (const it of items) {
    if (!it.layout) continue;
    maxRight = Math.max(maxRight, it.layout.x + it.layout.width);
    maxBottom = Math.max(maxBottom, it.layout.y + it.layout.height);
  }

  return {
    items,
    bounds: {
      x: originX,
      y: originY,
      width: Math.max(0, maxRight - originX),
      height: Math.max(0, maxBottom - originY)
    }
  };
}

function gridLayout(items, cfg) {
  return gridLayoutAt(items, cfg, cfg.marginLeft, cfg.marginTop, cfg.maxRowWidth).items;
}

function applyLayoutsBack(parsed, placed) {
  const map = new Map(placed.map(p => [`${p.kind}:${p.name}`, p.layout]));

  function apply(arr, kind) {
    for (const wrapper of (arr || [])) {
      const [name, body] = singleKey(wrapper);
      const layout = map.get(`${kind}:${name}`);
      if (layout) body.layout = layout;
    }
  }

  apply(parsed.classes, "class");
  apply(parsed.interfaces, "interface");
}

// -------------------------
// Relations (graph-based placement)
// -------------------------

function isRelationsJson(obj) {
  return !!obj && typeof obj === "object" && (
    Array.isArray(obj.associations) || Array.isArray(obj.inheritances)
  );
}

function buildNodes(outModelJson, cfg) {
  const entities = listEntities(outModelJson);
  const nodes = [];

  for (const e of entities) {
    const lines = buildLines(e, cfg);
    const size = computeSize(lines, cfg);
    nodes.push({
      id: `${e.kind}:${e.name}`,
      kind: e.kind,
      name: e.name,
      size,
      layout: null
    });
  }

  const nodeById = new Map(nodes.map(n => [n.id, n]));

  const nameToId = new Map();
  for (const n of nodes) {
    if (!nameToId.has(n.name)) {
      nameToId.set(n.name, n.id);
      continue;
    }
    const existingId = nameToId.get(n.name);
    const existing = nodeById.get(existingId);
    if (existing && existing.kind === "interface" && n.kind === "class") {
      nameToId.set(n.name, n.id);
    }
  }

  const indexById = new Map();
  nodes.forEach((n, idx) => indexById.set(n.id, idx));

  return { nodes, nodeById, nameToId, indexById };
}

function parseRelations(relJson, nameToId, nodeById) {
  const assocEdges = [];
  const inhEdges = [];

  for (const a of (relJson?.associations || [])) {
    const u = nameToId.get(a.from);
    const v = nameToId.get(a.to);
    if (!u || !v) continue;
    if (!nodeById.has(u) || !nodeById.has(v)) continue;
    if (u === v) continue;
    assocEdges.push({ kind: "assoc", u, v, fromName: a.from, toName: a.to });
  }

  for (const e of (relJson?.inheritances || [])) {
    if (e.type !== "extends") continue;
    const child = nameToId.get(e.from);
    const parent = nameToId.get(e.to);
    if (!child || !parent) continue;
    if (!nodeById.has(child) || !nodeById.has(parent)) continue;
    if (child === parent) continue;
    inhEdges.push({ kind: "inh", child, parent, type: e.type, fromName: e.from, toName: e.to });
  }

  const undirected = [];
  for (const ed of assocEdges) undirected.push({ u: ed.u, v: ed.v });
  for (const ed of inhEdges) undirected.push({ u: ed.child, v: ed.parent });

  return { assocEdges, inhEdges, undirected };
}

function connectedComponents(nodeIds, undirectedEdges) {
  const adj = new Map();
  for (const id of nodeIds) adj.set(id, []);

  for (const e of undirectedEdges) {
    if (!adj.has(e.u) || !adj.has(e.v)) continue;
    adj.get(e.u).push(e.v);
    adj.get(e.v).push(e.u);
  }

  const seen = new Set();
  const comps = [];

  for (const start of nodeIds) {
    if (seen.has(start)) continue;
    const stack = [start];
    seen.add(start);
    const comp = [];

    while (stack.length) {
      const cur = stack.pop();
      comp.push(cur);
      for (const nb of adj.get(cur)) {
        if (!seen.has(nb)) {
          seen.add(nb);
          stack.push(nb);
        }
      }
    }

    comps.push(comp);
  }

  return comps;
}

function computeDegrees(nodeIds, undirectedEdges) {
  const deg = new Map(nodeIds.map(id => [id, 0]));
  for (const e of undirectedEdges) {
    if (deg.has(e.u)) deg.set(e.u, deg.get(e.u) + 1);
    if (deg.has(e.v)) deg.set(e.v, deg.get(e.v) + 1);
  }
  return deg;
}

function computeInheritanceLevels(compIds, inhEdges) {
  const inComp = new Set(compIds);

  const childrenOf = new Map();
  const indeg = new Map();

  for (const id of compIds) {
    childrenOf.set(id, []);
    indeg.set(id, 0);
  }

  for (const e of inhEdges) {
    if (!inComp.has(e.child) || !inComp.has(e.parent)) continue;
    childrenOf.get(e.parent).push(e.child);
    indeg.set(e.child, indeg.get(e.child) + 1);
  }

  const queue = [];
  for (const [id, d] of indeg.entries()) {
    if (d === 0) queue.push(id);
  }

  const level = new Map(compIds.map(id => [id, 0]));

  while (queue.length) {
    const p = queue.shift();
    const pLevel = level.get(p) || 0;
    for (const ch of childrenOf.get(p)) {
      level.set(ch, Math.max(level.get(ch) || 0, pLevel + 1));
      indeg.set(ch, indeg.get(ch) - 1);
      if (indeg.get(ch) === 0) queue.push(ch);
    }
  }

  return level;
}

function hasInheritanceInside(compIds, inhEdges) {
  const inComp = new Set(compIds);
  for (const e of inhEdges) {
    if (inComp.has(e.child) && inComp.has(e.parent)) return true;
  }
  return false;
}

function layoutComponentLocal(compIds, nodeById, cfg, rel, indexById) {
  const originX = 0;
  const originY = 0;

  const useLayered = hasInheritanceInside(compIds, rel.inhEdges);

  const stableSort = (ids) =>
    ids.slice().sort((a, b) => (indexById.get(a) ?? 0) - (indexById.get(b) ?? 0));

  if (!useLayered) {
    const items = stableSort(compIds).map(id => nodeById.get(id)).filter(Boolean);
    return gridLayoutAt(items, cfg, originX, originY, cfg.maxRowWidth);
  }

  const degrees = computeDegrees(compIds, rel.undirected);
  const level = computeInheritanceLevels(compIds, rel.inhEdges);

  const layers = new Map();
  for (const id of compIds) {
    const L = level.get(id) ?? 0;
    if (!layers.has(L)) layers.set(L, []);
    layers.get(L).push(id);
  }

  const sortedLevels = [...layers.keys()].sort((a, b) => a - b);

  let y = originY;
  const placed = [];

  for (const L of sortedLevels) {
    let x = originX;
    let rowMaxH = 0;

    const layerIds = layers.get(L).slice().sort((a, b) => {
      const da = degrees.get(a) || 0;
      const db = degrees.get(b) || 0;
      if (db !== da) return db - da;
      return (indexById.get(a) ?? 0) - (indexById.get(b) ?? 0);
    });

    for (const id of layerIds) {
      const node = nodeById.get(id);
      if (!node) continue;
      node.layout = { x, y, width: node.size.width, height: node.size.height };
      placed.push(node);
      x = x + node.size.width + cfg.hGap;
      rowMaxH = Math.max(rowMaxH, node.size.height);
    }

    y = y + rowMaxH + cfg.vGap;
  }

  let maxRight = originX;
  let maxBottom = originY;
  for (const node of placed) {
    maxRight = Math.max(maxRight, node.layout.x + node.layout.width);
    maxBottom = Math.max(maxBottom, node.layout.y + node.layout.height);
  }

  return {
    items: placed,
    bounds: {
      x: originX,
      y: originY,
      width: Math.max(0, maxRight - originX),
      height: Math.max(0, maxBottom - originY)
    }
  };
}

function offsetNodes(nodes, dx, dy) {
  for (const n of nodes) {
    if (!n.layout) continue;
    n.layout = {
      x: n.layout.x + dx,
      y: n.layout.y + dy,
      width: n.layout.width,
      height: n.layout.height
    };
  }
}

function layoutWithRelations(allNodes, nodeById, rel, cfg, indexById) {
  const nodeIds = allNodes.map(n => n.id);

  const comps = connectedComponents(nodeIds, rel.undirected);

  const compOrderKey = (comp) => {
    let min = Infinity;
    for (const id of comp) {
      const idx = indexById.get(id);
      if (idx != null && idx < min) min = idx;
    }
    return min;
  };
  comps.sort((a, b) => compOrderKey(a) - compOrderKey(b));

  const compLayouts = comps.map(compIds => {
    const local = layoutComponentLocal(compIds, nodeById, cfg, rel, indexById);
    const placedNodes = compIds.map(id => nodeById.get(id)).filter(Boolean);
    return { compIds, localBounds: local.bounds, placedNodes };
  });

  let cx = cfg.marginLeft;
  let cy = cfg.marginTop;
  let rowMaxH = 0;
  const rowLimit = cfg.marginLeft + cfg.maxRowWidth;

  for (const comp of compLayouts) {
    const w = comp.localBounds.width;
    const h = comp.localBounds.height;

    if (cx !== cfg.marginLeft && (cx + w) > rowLimit) {
      cx = cfg.marginLeft;
      cy = cy + rowMaxH + cfg.vGap;
      rowMaxH = 0;
    }

    offsetNodes(comp.placedNodes, cx, cy);

    cx = cx + w + cfg.hGap;
    rowMaxH = Math.max(rowMaxH, h);
  }
}

// -------------------------
// Relation placement
// -------------------------

function rectCenter(r) {
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}

function midpointAnchor(rect, targetCenter) {
  const c = rectCenter(rect);
  const dx = targetCenter.x - c.x;
  const dy = targetCenter.y - c.y;

  if (Math.abs(dx) >= Math.abs(dy)) {
    // horizontal
    return dx >= 0
      ? { x: rect.x + rect.width, y: c.y }
      : { x: rect.x, y: c.y };
  } else {
    // vertical
    return dy >= 0
      ? { x: c.x, y: rect.y + rect.height } 
      : { x: c.x, y: rect.y };              
  }
}

function computeRelationEndpoints(relationsJson, nameToId, nodeById) {
  const skipped = { associations: [], inheritances: [] };

  const associations = [];
  for (const e of (relationsJson?.associations || [])) {
    const aId = nameToId.get(e.from);
    const bId = nameToId.get(e.to);
    const a = aId ? nodeById.get(aId) : null;
    const b = bId ? nodeById.get(bId) : null;

    if (!a?.layout || !b?.layout) {
      skipped.associations.push(e);
      continue;
    }

    const aC = rectCenter(a.layout);
    const bC = rectCenter(b.layout);

    associations.push({
      from: e.from,
      to: e.to,
      pFrom: midpointAnchor(a.layout, bC),
      pTo: midpointAnchor(b.layout, aC)
    });
  }

  const inheritances = [];
  for (const e of (relationsJson?.inheritances || [])) {
    if (e.type !== "extends") continue;

    const childId = nameToId.get(e.from);
    const parentId = nameToId.get(e.to);
    const child = childId ? nodeById.get(childId) : null;
    const parent = parentId ? nodeById.get(parentId) : null;

    if (!child?.layout || !parent?.layout) {
      skipped.inheritances.push(e);
      continue;
    }

    const cC = rectCenter(child.layout);
    const pC = rectCenter(parent.layout);

    inheritances.push({
      from: e.from,
      to: e.to,
      type: e.type,
      pFrom: midpointAnchor(child.layout, pC),
      pTo: midpointAnchor(parent.layout, cC)
    });
  }

  return { associations, inheritances, skipped };
}



// -------------------------
// Main entry
// -------------------------

export function layoutJson(modelJson, relationsOrOptions = null, maybeOptions = {}) {
  const relationsJson = isRelationsJson(relationsOrOptions) ? relationsOrOptions : null;
  const options = relationsJson ? (maybeOptions || {}) : (relationsOrOptions || {});

  const cfg = {
    // units
    charWidth: 8,
    lineHeight: 18,
    paddingX: 12,
    paddingY: 10,
    sepHeight: 6,

    // placement
    marginLeft: 40,
    marginTop: 40,
    hGap: 60,
    vGap: 60,
    maxRowWidth: 1200,

    // UML
    showInterfaceStereotype: true,
    interfaceStereotypeLine: "«interface»",
    includeEmptyCompartments: true,
    minEmptyCompartmentLines: 1,
    minWidth: 160,

    ...options
  };

  const out = deepCloneJson(modelJson);

  const { nodes, nodeById, nameToId, indexById } = buildNodes(out, cfg);

  if (!relationsJson) {
    gridLayout(nodes, cfg);
  } else {
    const rel = parseRelations(relationsJson, nameToId, nodeById);
    layoutWithRelations(nodes, nodeById, rel, cfg, indexById);
    out.relations = relationsJson;

    // mid to mid
    out.relationEndpoints = computeRelationEndpoints(relationsJson, nameToId, nodeById);
  }

  applyLayoutsBack(out, nodes);
  out.layoutConfig = cfg;

  return out;
}
