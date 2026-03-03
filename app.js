// Simple node visualizer and editor
// Loads sample nodes, renders boxes, draws SVG links using meta_data.parent_node / child_node

const NODES_KEY = 'factor_nodes_v1';

const sample = {
  "node_1":{
    "type":"sql_query",
    "inputs":{
      "query":"select * from table_1 where period = 202501",
      "table_1":"table_1_name"
    },
    "meta_data":{
      "display_name":"Node 1",
      "parent_node":"",
      "child_node":[]
    }
  }
};

let nodes = {};
const container = document.getElementById('nodes-container');
const svg = document.getElementById('links-svg');
const TYPE_CONFIG_PATH = 'node_config.json';
let allowedTypes = [];
let typeConfig = { metric_schema: {}, input_tables: [] };

function loadTypes(){
  fetch(TYPE_CONFIG_PATH).then(r=>r.json()).then(j=>{ allowedTypes = (j && j.types) || []; typeConfig.metric_schema = (j && j.metric_schema) || {}; typeConfig.input_tables = (j && j.input_tables) || []; populateTypeSelect(); populateSqlPools(); }).catch(()=>{ allowedTypes = ['sql_query','llm_query','human_approval','template']; populateTypeSelect(); });
}

function populateTypeSelect(){
  const sel = document.getElementById('type');
  if(!sel) return;
  sel.innerHTML = allowedTypes.map(t=>`<option value="${t}">${t}</option>`).join('');
}

function load(){
  const raw = localStorage.getItem(NODES_KEY);
  if(raw){
    try{ nodes = JSON.parse(raw); return }
    catch(e){ console.warn('corrupt local nodes, falling back to sample') }
  }
  // create more sample nodes to ~10
  nodes = {...sample};
  for(let i=4;i<=10;i++){
    const id = `node_${i}`;
    nodes[id] = {type: i%2? 'sql_query':'python', inputs:{}, meta_data:{display_name:`Node ${i}`, parent_node: i===4? 'node_2' : `node_${Math.max(2, i-1)}`, child_node:[]}};
  }
  persist();
}

function persist(){ localStorage.setItem(NODES_KEY, JSON.stringify(nodes, null, 2)); }

function clearSvg(){ while(svg.firstChild) svg.removeChild(svg.firstChild); }

function drawLinks(){ clearSvg();
  const ns = 'http://www.w3.org/2000/svg';
  // add arrow marker
  const defs = document.createElementNS(ns, 'defs');
  const marker = document.createElementNS(ns, 'marker');
  marker.setAttribute('id','arrow');
  // smaller arrowhead
  marker.setAttribute('markerWidth','6');
  marker.setAttribute('markerHeight','6');
  marker.setAttribute('refX','4');
  marker.setAttribute('refY','3');
  marker.setAttribute('orient','auto');
  marker.setAttribute('markerUnits','strokeWidth');
  const arrowPath = document.createElementNS(ns,'path');
  arrowPath.setAttribute('d','M0,0 L0,6 L4,3 z');
  arrowPath.setAttribute('fill','#06b6d4');
  marker.appendChild(arrowPath);
  defs.appendChild(marker);
  svg.appendChild(defs);

  Object.entries(nodes).forEach(([id, node])=>{
    const childArr = node.meta_data?.child_node || [];
    childArr.forEach(childId=>{
      if(!nodes[childId]) return;
      // arrow directed from child -> parent (child is lower, parent higher)
      const parentEl = document.querySelector(`.node-box[data-id="${id}"]`);
      const childEl = document.querySelector(`.node-box[data-id="${childId}"]`);
      if(!parentEl||!childEl) return;
      const ra = parentEl.getBoundingClientRect();
      const rb = childEl.getBoundingClientRect();
      const ctn = container.getBoundingClientRect();
      // compute edge-intersection points so arrows start/end at rectangle borders (not centers)
      const parentRect = { left: ra.left - ctn.left, top: ra.top - ctn.top, width: ra.width, height: ra.height };
      const childRect = { left: rb.left - ctn.left, top: rb.top - ctn.top, width: rb.width, height: rb.height };
      const parentCenter = { x: parentRect.left + parentRect.width/2, y: parentRect.top + parentRect.height/2 };
      const childCenter = { x: childRect.left + childRect.width/2, y: childRect.top + childRect.height/2 };

      function intersectEdge(rect, targetX, targetY){
        const cx = rect.left + rect.width/2; const cy = rect.top + rect.height/2;
        const dx = targetX - cx; const dy = targetY - cy;
        if(Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return { x: cx, y: cy };
        const cand = [];
        // vertical sides
        if(Math.abs(dx) > 1e-6){
          let t = (rect.left - cx)/dx; let y = cy + t*dy;
          if(t >= 0 && y >= rect.top && y <= rect.top + rect.height) cand.push({t, x: rect.left, y});
          t = (rect.left + rect.width - cx)/dx; y = cy + t*dy;
          if(t >= 0 && y >= rect.top && y <= rect.top + rect.height) cand.push({t, x: rect.left + rect.width, y});
        }
        // horizontal sides
        if(Math.abs(dy) > 1e-6){
          let t = (rect.top - cy)/dy; let x = cx + t*dx;
          if(t >= 0 && x >= rect.left && x <= rect.left + rect.width) cand.push({t, x, y: rect.top});
          t = (rect.top + rect.height - cy)/dy; x = cx + t*dx;
          if(t >= 0 && x >= rect.left && x <= rect.left + rect.width) cand.push({t, x, y: rect.top + rect.height});
        }
        if(cand.length === 0) return { x: cx, y: cy };
        cand.sort((a,b)=>a.t - b.t);
        return { x: cand[0].x, y: cand[0].y };
      }

      const start = intersectEdge(childRect, parentCenter.x, parentCenter.y);
      const end = intersectEdge(parentRect, childCenter.x, childCenter.y);
      // rectangular elbow routing: go vertically from start, horizontally, then vertically to end
      const midY = (start.y + end.y) / 2;
      const path = document.createElementNS(ns,'path');
      const d = `M ${start.x} ${start.y} L ${start.x} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`;
      path.setAttribute('d', d);
      path.setAttribute('stroke','#06b6d4');
      path.setAttribute('stroke-width','2');
      path.setAttribute('fill','none');
      path.setAttribute('stroke-linejoin','round');
      path.setAttribute('opacity','0.95');
      path.setAttribute('marker-end','url(#arrow)');
      svg.appendChild(path);
    })
  })
}

function render(){
  container.innerHTML = '';
  const MAX_DISPLAY = 50;
  const allIds = Object.keys(nodes);
  const displayedIds = allIds.slice(0, MAX_DISPLAY);
  if(allIds.length > MAX_DISPLAY){
    // show a small warning on top of canvas
    const note = document.createElement('div');
    note.style.position = 'absolute';
    note.style.left = '20px';
    note.style.top = '0px';
    note.style.padding = '6px 10px';
    note.style.background = 'rgba(0,0,0,0.5)';
    note.style.borderRadius = '6px';
    note.style.fontSize = '12px';
    note.textContent = `Showing ${MAX_DISPLAY} of ${allIds.length} nodes`;
    container.appendChild(note);
  }

  displayedIds.forEach(id=>{
    const node = nodes[id];
    const el = document.createElement('div');
    el.className = 'node-box';
    el.setAttribute('data-id', id);
    el.innerHTML = `<div class="node-title">${node.meta_data?.display_name || id}</div>
      <div class="node-type">${node.type}</div>
      <div class="node-meta">id: ${id}</div>`;
    container.appendChild(el);
    makeDraggable(el);
    el.addEventListener('click', (e)=>{ e.stopPropagation(); openEditor(id); });
  });

  // compute automatic layout positions (skip nodes manually positioned by user)
  requestAnimationFrame(()=>{
    computeLayout();
    const rect = container.getBoundingClientRect();
    svg.setAttribute('width', rect.width);
    svg.setAttribute('height', rect.height);
    drawLinks();
  })
}

// Compute hierarchical levels and layout nodes accordingly.
function computeLayout(){
  // Build adjacency and find roots
  // Ignore nodes explicitly marked to skip layout (newly created manual nodes)
  Object.keys(nodes).forEach(k=>{ nodes[k].meta_data.child_node = nodes[k].meta_data.child_node || []; });
  const layoutIds = Object.keys(nodes).filter(id => !nodes[id].meta_data?.skip_layout);
  const parentOf = {};
  layoutIds.forEach(id => { const p = nodes[id].meta_data?.parent_node || ''; parentOf[id] = p && nodes[p] && !nodes[p].meta_data?.skip_layout ? p : ''; });
  const roots = layoutIds.filter(id=>!parentOf[id]);

  // Build tree(s) and compute subtree sizes (number of leaves)
  const visited = new Set();
  const treeChildren = {};
  // only include children that participate in layout
  layoutIds.forEach(id=> treeChildren[id] = (nodes[id].meta_data.child_node||[]).filter(ch => nodes[ch] && !nodes[ch].meta_data?.skip_layout));

  function computeLeaves(id, seen=new Set()){
    if(seen.has(id)) return 0; // break cycles
    seen.add(id);
    const kids = treeChildren[id] || [];
    if(kids.length === 0) return 1;
    let sum = 0;
    kids.forEach(k=> sum += computeLeaves(k, new Set(seen)));
    return sum || 1;
  }

  const leavesCount = {};
  layoutIds.forEach(id=> leavesCount[id] = computeLeaves(id));

  // assign x positions: perform an inorder-like traversal, spacing leaves evenly
  const nodeW = 200; const nodeH = 100; const vGap = 160; const hGap = 40; const padding = 20;
  let nextX = padding;
  const positions = {};

  function layout(id, depth){
    const el = document.querySelector(`.node-box[data-id="${id}"]`);
    const kids = treeChildren[id] || [];
    if(kids.length === 0){
      // leaf
      const x = nextX;
      positions[id] = {x, y: padding + depth*vGap};
      nextX += nodeW + hGap;
      return positions[id];
    }
    // layout children first
    const childPos = [];
    kids.forEach(k=>{ const pos = layout(k, depth+1); if(pos) childPos.push(pos); });
    if(childPos.length===0){
      // fallback as leaf
      const x = nextX; positions[id] = {x, y: padding + depth*vGap}; nextX += nodeW + hGap; return positions[id];
    }
    // center parent above children
    const minX = Math.min(...childPos.map(p=>p.x));
    const maxX = Math.max(...childPos.map(p=>p.x));
    const centerX = (minX + maxX)/2;
    positions[id] = {x: centerX, y: padding + depth*vGap};
    return positions[id];
  }

  // If no roots (cycle), treat all layout-participating nodes as pseudo-root list
  const startRoots = roots.length ? roots : layoutIds;
  startRoots.forEach(r=>{ if(!visited.has(r)) layout(r,0); });

  // apply positions to elements, unless manual
  const rect = container.getBoundingClientRect();
  const totalWidth = Math.max(nextX, rect.width);
  const neededHeight = padding*2 + (Math.max(...Object.values(positions).map(p=>p.y)) || 0) + nodeH;
  container.style.height = Math.max(neededHeight, 600) + 'px';

  // center the whole layout horizontally in container
  const posValues = Object.values(positions);
  if(posValues.length === 0) return; // nothing to layout
  const minX = Math.min(...posValues.map(p=>p.x));
  const maxX = Math.max(...posValues.map(p=>p.x));
  const layoutWidth = (maxX - minX) + nodeW;
  const offsetX = Math.max(padding, (rect.width - layoutWidth)/2 + container.scrollLeft) - minX;

  Object.entries(positions).forEach(([id,pos])=>{
    const el = document.querySelector(`.node-box[data-id="${id}"]`);
    if(!el) return;
    if(el.dataset.manual === 'true') return;
    el.style.left = (pos.x + offsetX) + 'px';
    el.style.top = pos.y + 'px';
  });
}

// simple dragging
function makeDraggable(el){
  let offsetX=0, offsetY=0, startX=0, startY=0; let dragging=false;
  el.addEventListener('mousedown', (e)=>{
    dragging=true; el.classList.add('dragging');
    // mark as manual position so automatic layout doesn't reposition
    el.dataset.manual = 'true';
    startX = e.clientX; startY = e.clientY;
    const rect = el.getBoundingClientRect();
    const c = container.getBoundingClientRect();
    offsetX = rect.left - c.left; offsetY = rect.top - c.top;
    document.addEventListener('mousemove', onmove);
    document.addEventListener('mouseup', onup, {once:true});
  });

  function onmove(e){
    if(!dragging) return;
    const dx = e.clientX - startX; const dy = e.clientY - startY;
    el.style.left = (offsetX + dx) + 'px';
    el.style.top = (offsetY + dy) + 'px';
    drawLinks();
  }

  function onup(){
    dragging=false; el.classList.remove('dragging'); document.removeEventListener('mousemove', onmove);
    // if dropped near another node, make this node a child of that node
    const nearest = findNearestNode(el, 120);
    if(nearest && nearest.el){
      const targetId = nearest.el.dataset.id;
      const thisId = el.dataset.id;
      // update parent pointers
      const oldParent = nodes[thisId].meta_data?.parent_node;
      if(oldParent && nodes[oldParent]){
        nodes[oldParent].meta_data.child_node = (nodes[oldParent].meta_data.child_node||[]).filter(x=>x!==thisId);
      }
  nodes[thisId].meta_data.parent_node = targetId;
  // once attached, clear skip_layout so automatic layout will include this node
  if(nodes[thisId].meta_data.skip_layout) delete nodes[thisId].meta_data.skip_layout;
      nodes[targetId].meta_data.child_node = Array.from(new Set([...(nodes[targetId].meta_data.child_node||[]), thisId]));
      persist(); refreshParentOptions();
    }
    drawLinks();
  }
}

// helper to find nearest node to a given element center within threshold
function findNearestNode(el, threshold=120){
  const rect = container.getBoundingClientRect();
  const a = el.getBoundingClientRect();
  const cx = a.left - rect.left + a.width/2;
  const cy = a.top - rect.top + a.height/2;
  let best = null; let bestDist = Infinity;
  document.querySelectorAll('.node-box').forEach(other=>{
    if(other === el) return;
    const b = other.getBoundingClientRect();
    const bx = b.left - rect.left + b.width/2;
    const by = b.top - rect.top + b.height/2;
    const d = Math.hypot(bx-cx, by-cy);
    if(d < bestDist){ bestDist = d; best = other; }
  });
  if(bestDist <= threshold) return {el: best, dist: bestDist};
  return null;
}

// Editor
const editor = {
  idSpan: document.getElementById('node-id'),
  display: document.getElementById('display_name'),
  type: document.getElementById('type'),
  parent: document.getElementById('parent_node'),
  saveBtn: document.getElementById('save-btn'),
  addBtn: document.getElementById('add-btn'),
  delBtn: document.getElementById('del-btn')
};

function refreshParentOptions(){
  const keys = Object.keys(nodes);
  editor.parent.innerHTML = `<option value="">(none)</option>` + keys.map(k=>`<option value="${k}">${k} — ${nodes[k].meta_data?.display_name||k}</option>`).join('');
}

// SQL builder helpers
function populateSqlPools(){
  const selectPool = document.getElementById('select-pool'); if(selectPool){ selectPool.innerHTML = ''; Object.keys(typeConfig.metric_schema || {}).forEach(k=>{ const opt = document.createElement('option'); opt.value = k; opt.textContent = k; selectPool.appendChild(opt); }); }
  const wherePool = document.getElementById('where-pool'); if(wherePool){ wherePool.innerHTML = ''; Object.keys(typeConfig.metric_schema || {}).forEach(k=>{ const opt = document.createElement('option'); opt.value = k; opt.textContent = k; wherePool.appendChild(opt); }); }
  const fromPool = document.getElementById('from-pool'); if(fromPool){ fromPool.innerHTML = ''; (typeConfig.input_tables||[]).forEach(t=>{ const opt = document.createElement('option'); opt.value = t; opt.textContent = t; fromPool.appendChild(opt); }); }
  const joinPool = document.getElementById('join-pool'); if(joinPool){ joinPool.innerHTML=''; (typeConfig.input_tables||[]).forEach(t=>{ const opt = document.createElement('option'); opt.value = t; opt.textContent = t; joinPool.appendChild(opt); }); }
}

function getSchemaColumns(table){
  if(!table) return [];
  if(typeConfig.table_schemas && typeConfig.table_schemas[table]) return Object.keys(typeConfig.table_schemas[table]);
  return Object.keys(typeConfig.metric_schema || {});
}

function populateOnColumns(fromTable, joinTable){
  const left = document.getElementById('on-left');
  const right = document.getElementById('on-right');
  const aAlias = 'a'; const bAlias = 'b';
  if(left){ left.innerHTML = ''; const cols = getSchemaColumns(fromTable); cols.forEach(c=>{ const opt = document.createElement('option'); opt.value = `${aAlias}.${c}`; opt.textContent = c; left.appendChild(opt); }); }
  if(right){ right.innerHTML = ''; const cols = getSchemaColumns(joinTable); cols.forEach(c=>{ const opt = document.createElement('option'); opt.value = `${bAlias}.${c}`; opt.textContent = c; right.appendChild(opt); }); }
}

function updateGeneratedSql(){
  const mode = document.getElementById('sql-mode')?.value || 'predefined';
  if(mode === 'customized'){ document.getElementById('sql-generated').value = document.getElementById('sql-custom-text').value; return; }
  const selectPool = document.getElementById('select-pool');
  const sels = selectPool ? (Array.from(selectPool.selectedOptions).map(o=>`a.${o.value}`).join(', ') || 'a.*') : 'a.*';
  const from = document.getElementById('from-pool')?.value || '';
  const join = document.getElementById('join-pool')?.value || '';
  const whereSel = document.getElementById('where-pool');
  const whereCol = whereSel ? (`a.${whereSel.value}`) : '';
  const whereOp = document.getElementById('where-op')?.value || '';
  const whereValRaw = document.getElementById('where-value')?.value || '';
  const whereVal = whereValRaw.trim();
  const joinType = document.getElementById('join-type')?.value || '';
  // on-left and on-right values already include alias prefix
  const leftCol = Array.from((document.getElementById('on-left')||{selectedOptions:[]}).selectedOptions).map(o=>o.value)[0];
  const rightCol = Array.from((document.getElementById('on-right')||{selectedOptions:[]}).selectedOptions).map(o=>o.value)[0];
  let q = `SELECT ${sels} FROM ${from} a`;
  if(whereCol && whereOp && whereVal !== ''){
    if(whereOp === 'IN'){
      const items = whereVal.split(',').map(s=>s.trim()).filter(Boolean).map(s=> isNaN(s) ? `'${s.replace(/'/g,"\\'")}'` : s);
      q += ` WHERE ${whereCol} IN (${items.join(', ')})`;
    } else if(whereOp === 'BETWEEN'){
      const parts = whereVal.split(',').map(s=>s.trim());
      if(parts.length>=2) q += ` WHERE ${whereCol} BETWEEN ${parts[0]} AND ${parts[1]}`;
    } else {
      const val = isNaN(whereVal) ? `'${whereVal.replace(/'/g,"\\'")}'` : whereVal;
      q += ` WHERE ${whereCol} ${whereOp} ${val}`;
    }
  }
  if(join){ q += ` ${joinType} ${join} b`; if(leftCol && rightCol) q += ` ON ${leftCol} = ${rightCol}`; }
  document.getElementById('sql-generated').value = q;
}

let activeId = null;
function openEditor(id){ activeId = id; const n = nodes[id]; editor.idSpan.textContent = id; editor.display.value = n.meta_data?.display_name || '';
  // ensure type select contains current type; if unknown, add it temporarily
  const sel = document.getElementById('type');
  if(sel){
    if(n.type && !allowedTypes.includes(n.type)){
      const opt = document.createElement('option'); opt.value = n.type; opt.textContent = n.type; sel.appendChild(opt);
    }
    sel.value = n.type || '';
  }
  editor.parent.value = n.meta_data?.parent_node || '';
  // populate SQL pools and generated SQL if sql_query
  populateSqlPools();
  if(n.type === 'sql_query'){
    document.getElementById('sql-generated').value = n.inputs?.query || '';
  }
}

editor.saveBtn.addEventListener('click', ()=>{
  if(!activeId) return alert('Select a node first');
  try{
    nodes[activeId].type = document.getElementById('type')?.value || editor.type.value;
    nodes[activeId].inputs = nodes[activeId].inputs || {};
    if(nodes[activeId].type === 'sql_query'){
      nodes[activeId].inputs.query = document.getElementById('sql-generated')?.value || nodes[activeId].inputs.query || '';
      // also persist selected from/join for convenience
      nodes[activeId].inputs._from = document.getElementById('from-pool')?.value || nodes[activeId].inputs._from || '';
      nodes[activeId].inputs._join = document.getElementById('join-pool')?.value || nodes[activeId].inputs._join || '';
    }
    nodes[activeId].meta_data = nodes[activeId].meta_data || {};
    nodes[activeId].meta_data.display_name = editor.display.value;
    const oldParent = nodes[activeId].meta_data.parent_node || '';
    const newParent = editor.parent.value || '';
    nodes[activeId].meta_data.parent_node = newParent;
    // update child_node lists
    if(oldParent && nodes[oldParent]){
      nodes[oldParent].meta_data.child_node = (nodes[oldParent].meta_data.child_node||[]).filter(x=>x!==activeId);
    }
    if(newParent){
      nodes[newParent].meta_data.child_node = Array.from(new Set([...(nodes[newParent].meta_data.child_node||[]), activeId]));
  // if the node was previously skipping layout, include it now that it has a parent
  if(nodes[activeId].meta_data.skip_layout) delete nodes[activeId].meta_data.skip_layout;
    }
    persist();
    render();
    refreshParentOptions();
  }catch(e){ alert('Invalid JSON in Inputs'); }
});

editor.addBtn.addEventListener('click', ()=>{
  const id = `node_${Date.now()}`;
  const t = (document.getElementById('type') && document.getElementById('type').value) || 'sql_query';
  nodes[id] = {type:t, inputs:{}, meta_data:{display_name:id, parent_node:'', child_node:[], skip_layout: true}};
  persist(); refreshParentOptions(); render(); openEditor(id);
});

editor.delBtn.addEventListener('click', ()=>{
  if(!activeId) return; if(!confirm('Delete node '+activeId+'?')) return;
  // remove from parent's child list
  const p = nodes[activeId].meta_data?.parent_node;
  if(p && nodes[p]) nodes[p].meta_data.child_node = (nodes[p].meta_data.child_node||[]).filter(x=>x!==activeId);
  // remove references from others' child lists
  Object.values(nodes).forEach(n=>{ n.meta_data.child_node = (n.meta_data.child_node||[]).filter(x=>x!==activeId); });
  delete nodes[activeId]; activeId = null; editor.idSpan.textContent='(none)'; persist(); render(); refreshParentOptions();
});

// click empty space to deselect
document.getElementById('canvas-wrapper').addEventListener('click', ()=>{ activeId=null; editor.idSpan.textContent='(none)'; });

// Delegate SQL builder button clicks
document.addEventListener('click', (e)=>{
  if(!e.target) return;
  if(e.target.matches && e.target.matches('.sql-check')){
    const row = e.target.closest && e.target.closest('.sql-row'); if(!row) return;
    if(row.id === 'sql-select-row'){
      // apply selects -> enable FROM
      document.getElementById('sql-from-row')?.classList.remove('disabled');
      updateGeneratedSql();
    }
    if(row.id === 'sql-from-row'){
      // apply from -> populate ON-left and enable WHERE
      const fromVal = document.getElementById('from-pool')?.value || '';
      const joinVal = document.getElementById('join-pool')?.value || '';
      populateOnColumns(fromVal, joinVal);
      document.getElementById('sql-where-row')?.classList.remove('disabled');
      updateGeneratedSql();
    }
    if(row.id === 'sql-where-row'){
      document.getElementById('sql-join-row')?.classList.remove('disabled'); updateGeneratedSql();
    }
    if(row.id === 'sql-join-row'){
      const joinVal = document.getElementById('join-pool')?.value || '';
      const fromVal = document.getElementById('from-pool')?.value || '';
      populateOnColumns(fromVal, joinVal);
      document.getElementById('sql-on-row')?.classList.remove('disabled'); document.getElementById('sql-on-row').style.display='block';
      updateGeneratedSql();
    }
    if(row.id === 'sql-on-row') updateGeneratedSql();
  }

  if(e.target.matches && e.target.matches('.sql-skip')){
    const row = e.target.closest && e.target.closest('.sql-row'); if(!row) return;
    if(row.id === 'sql-where-row') document.getElementById('sql-join-row')?.classList.remove('disabled');
    if(row.id === 'sql-join-row'){ document.getElementById('sql-on-row')?.classList.add('disabled'); document.getElementById('sql-on-row').style.display='none'; }
    updateGeneratedSql();
  }
});

// double click empty canvas to create a new node at cursor position
document.getElementById('canvas-wrapper').addEventListener('dblclick', (e)=>{
  // ignore dblclicks that happen on an existing node
  if(e.target.closest && e.target.closest('.node-box')) return;
  // compute position relative to container
  const ctnRect = container.getBoundingClientRect();
  const x = e.clientX - ctnRect.left;
  const y = e.clientY - ctnRect.top;

  // create unique id and node object; mark it to skip layout so existing nodes won't be rebalanced
  const id = `node_${Date.now()}`;
  nodes[id] = { type: 'sql_query', inputs: {}, meta_data: { display_name: id, parent_node: '', child_node: [], skip_layout: true } };
  persist(); refreshParentOptions(); render();

  // after render, position the newly created element and mark as manual so layout won't move it
  requestAnimationFrame(()=>{
    const el = document.querySelector(`.node-box[data-id="${id}"]`);
    if(!el) return;
    el.dataset.manual = 'true';
    // place so that cursor is roughly at center of the node
    const w = el.getBoundingClientRect().width || 200;
    const h = el.getBoundingClientRect().height || 100;
    el.style.left = (x - w/2) + 'px';
    el.style.top = (y - h/2) + 'px';
    drawLinks();
    openEditor(id);
  });
});

window.addEventListener('resize', ()=> drawLinks());

// boot
load(); refreshParentOptions(); render();
loadTypes();

