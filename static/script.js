// ─── State ───────────────────────────────────────────────
const state = {
    pso:     { locations: [], map: null, markers: [], polyline: null },
    ga:      { locations: [], map: null, markers: [], polyline: null },
    compare: { locations: [], map: null, markers: [], psoLine: null, gaLine: null }
};

let charts = { pso: null, ga: null, compare: null };
let runHistory = [];
let wins = { pso: 0, ga: 0, draw: 0 };

function reorderRoute(route) {
    const idx = route.indexOf(0);
    return [...route.slice(idx), ...route.slice(0, idx)];
}

function drawRouteCanvas(canvasId, route, locations) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    if (locations.length < 2) return;

    // Normalize coordinates to fit canvas
    const lats = locations.map(l => l[0]);
    const lngs = locations.map(l => l[1]);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const pad = 40;

    function project(loc) {
        const x = pad + (loc[1] - minLng) / (maxLng - minLng || 1) * (W - pad * 2);
        const y = H - pad - (loc[0] - minLat) / (maxLat - minLat || 1) * (H - pad * 2);
        return [x, y];
    }

    const ordered = reorderRoute(route);
    const pts = ordered.map(i => project(locations[i]));

    // Draw route lines with arrows
    for (let i = 0; i < pts.length; i++) {
        const from = pts[i];
        const to   = pts[(i + 1) % pts.length];
        const dx = to[0] - from[0];
        const dy = to[1] - from[1];
        const angle = Math.atan2(dy, dx);
        const stopAt = 10;
        const toX = to[0] - stopAt * Math.cos(angle);
        const toY = to[1] - stopAt * Math.sin(angle);

        // Line
        ctx.beginPath();
        ctx.strokeStyle = '#a78bfa';
        ctx.lineWidth = 2;
        ctx.moveTo(from[0], from[1]);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        // Arrowhead at midpoint
        const midX = (from[0] + toX) / 2;
        const midY = (from[1] + toY) / 2;
        const aLen = 10, aAng = 0.4;
        ctx.beginPath();
        ctx.fillStyle = '#a78bfa';
        ctx.moveTo(midX, midY);
        ctx.lineTo(midX - aLen * Math.cos(angle - aAng), midY - aLen * Math.sin(angle - aAng));
        ctx.lineTo(midX - aLen * Math.cos(angle + aAng), midY - aLen * Math.sin(angle + aAng));
        ctx.closePath();
        ctx.fill();
    }

    // Draw nodes
    ordered.forEach((cityIdx, i) => {
        const [x, y] = pts[i];
        const isWarehouse = cityIdx === 0;

        if (isWarehouse) {
            // Draw star
            ctx.save();
            ctx.translate(x, y);
            const spikes = 5, outerR = 11, innerR = 5;
            let rot = (Math.PI / 2) * 3;
            const step = Math.PI / spikes;
            ctx.beginPath();
            ctx.moveTo(0, -outerR);
            for (let s = 0; s < spikes; s++) {
                ctx.lineTo(Math.cos(rot) * outerR, Math.sin(rot) * outerR); rot += step;
                ctx.lineTo(Math.cos(rot) * innerR, Math.sin(rot) * innerR); rot += step;
            }
            ctx.closePath();
            ctx.fillStyle = '#facc15';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 0.8;
            ctx.stroke();
            ctx.restore();
            ctx.fillStyle = '#000';
            ctx.font = 'bold 9px Segoe UI';
            ctx.fillText('W', x - 4, y + 3);
        } else {
            ctx.beginPath();
            ctx.arc(x, y, 9, 0, 2 * Math.PI);
            ctx.fillStyle = '#4c1d95';
            ctx.fill();
            ctx.strokeStyle = '#a78bfa';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = '9px Segoe UI';
            const label = `S${cityIdx}`;
            ctx.fillText(label, x - (label.length > 2 ? 6 : 4), y + 3);
        }
    });
}

// ─── Tab Switching ────────────────────────────────────────
function showTab(name) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + name).classList.add('active');
    event.target.classList.add('active');

    // Init maps lazily
    setTimeout(() => {
        if (name === 'pso'     && !state.pso.map)     initMap('pso');
        if (name === 'ga'      && !state.ga.map)      initMap('ga');
        if (name === 'compare' && !state.compare.map) initMap('compare');
    }, 50);
}

// ─── Map Init ─────────────────────────────────────────────
function initMap(tab) {
    const map = L.map(tab + '-map').setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    map.on('click', e => addLocation(tab, e.latlng.lat, e.latlng.lng));
    state[tab].map = map;
}

// ─── Icons ────────────────────────────────────────────────
function warehouseIcon() {
    return L.divIcon({
        className: '',
        html: `<div style="background:#facc15;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;border:2px solid #fff;box-shadow:0 2px 6px #0008;">🏭</div>`,
        iconSize: [28, 28], iconAnchor: [14, 14]
    });
}

function deliveryIcon(num) {
    return L.divIcon({
        className: '',
        html: `<div style="background:#a78bfa;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;border:2px solid #fff;box-shadow:0 2px 6px #0008;">${num}</div>`,
        iconSize: [26, 26], iconAnchor: [13, 13]
    });
}

// ─── Add Location ─────────────────────────────────────────
function addLocation(tab, lat, lng) {
    const s = state[tab];
    const idx = s.locations.length;
    s.locations.push([lat, lng]);

    const icon   = idx === 0 ? warehouseIcon() : deliveryIcon(idx);
    const label  = idx === 0 ? 'Warehouse' : `Stop ${idx}`;
    const marker = L.marker([lat, lng], { icon })
        .addTo(s.map)
        .bindPopup(label)
        .openPopup();

    s.markers.push(marker);
    document.getElementById(tab + '-location-count').innerText =
        `Locations added: ${s.locations.length} (1 warehouse + ${s.locations.length - 1} stops)`;
}

// ─── Clear Map ────────────────────────────────────────────
function clearMap(tab) {
    const s = state[tab];
    s.markers.forEach(m => s.map.removeLayer(m));
    s.markers = [];
    s.locations = [];

    if (s.polyline) { s.map.removeLayer(s.polyline); s.polyline = null; }
    if (s.psoLine)  { s.map.removeLayer(s.psoLine);  s.psoLine  = null; }
    if (s.gaLine)   { s.map.removeLayer(s.gaLine);   s.gaLine   = null; }

    document.getElementById(tab + '-location-count').innerText = 'Locations added: 0';

    if (tab === 'pso') {
        document.getElementById('pso-result').style.display    = 'none';
        document.getElementById('pso-chart-box').style.display = 'none';
    } else if (tab === 'ga') {
        document.getElementById('ga-result').style.display    = 'none';
        document.getElementById('ga-chart-box').style.display = 'none';
    } else {
        document.getElementById('compare-result').style.display    = 'none';
        document.getElementById('compare-chart-box').style.display = 'none';
    }
}

// ─── Random Locations ─────────────────────────────────────
function randomLocations(tab) {
    clearMap(tab);
    const s = state[tab];
    const center = s.map.getCenter();
    const count  = Math.floor(Math.random() * 6) + 6;
    for (let i = 0; i < count; i++) {
        const lat = center.lat + (Math.random() - 0.5) * 8;
        const lng = center.lng + (Math.random() - 0.5) * 8;
        addLocation(tab, lat, lng);
    }
}

// ─── Draw Route on Map ────────────────────────────────────
function drawRouteOnMap(tab, route, locations, color, lineKey) {
    const s = state[tab];
    if (s[lineKey]) s.map.removeLayer(s[lineKey]);

    const latlngs = [...route.map(i => locations[i]), locations[route[0]]];
    s[lineKey] = L.polyline(latlngs, {
        color, weight: 3, opacity: 0.85
    }).addTo(s.map);
}

// ─── Draw Convergence Chart ───────────────────────────────
function drawChart(canvasId, chartKey, datasets) {
    const box = document.getElementById(chartKey + '-chart-box') ||
                document.getElementById('compare-chart-box');
    if (box) box.style.display = 'block';

    if (charts[chartKey]) charts[chartKey].destroy();
    const ctx = document.getElementById(canvasId).getContext('2d');
    charts[chartKey] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: datasets[0].data.map((_, i) => i),
            datasets
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: '#ccc' } } },
            scales: {
                x: { ticks: { color: '#888' }, grid: { color: '#2a2a4a' },
                     title: { display: true, text: 'Iteration', color: '#888' } },
                y: { ticks: { color: '#888' }, grid: { color: '#2a2a4a' },
                     title: { display: true, text: 'Best Distance', color: '#888' } }
            }
        }
    });
}

// ─── Stats HTML ───────────────────────────────────────────
function statsHTML(score, route, locations, iterations, colorClass) {
    // Always start route display from warehouse (index 0)
    const warehouseIdx = route.indexOf(0);
    const reordered = [...route.slice(warehouseIdx), ...route.slice(0, warehouseIdx)];

    return `
        <div class="stat-row"><span class="stat-label">Best Distance</span>
            <span class="stat-value ${colorClass}">${score} km</span></div>
        <div class="stat-row"><span class="stat-label">Locations</span>
            <span class="stat-value">${locations.length}</span></div>
        <div class="stat-row"><span class="stat-label">Iterations</span>
            <span class="stat-value">${iterations}</span></div>
        <div class="stat-row"><span class="stat-label">Route</span>
            <span class="stat-value" style="font-size:0.78rem;">
                🏭 → ${reordered.slice(1).map(r => `S${r}`).join(' → ')} → 🏭
            </span></div>`;
}

// ─── Run Single Solver ────────────────────────────────────
async function runSolver(tab) {
    const s = state[tab];
    if (s.locations.length < 3) { alert('Please add at least 3 locations!'); return; }

    const iterations = document.getElementById(tab + '-iterations').value;
    const population = document.getElementById(tab + '-population').value;
    const algo       = tab === 'pso' ? 'pso' : 'genetic';

    document.getElementById(tab + '-result').style.display    = 'none';
    document.getElementById(tab + '-chart-box').style.display = 'none';
    document.getElementById(tab + '-loading').style.display   = 'block';

    try {
        const res  = await fetch('/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cities: s.locations, algorithm: algo, iterations, population })
        });
        const data = await res.json();
        document.getElementById(tab + '-loading').style.display = 'none';
        if (data.error) { alert(data.error); return; }

        const color     = tab === 'pso' ? '#a78bfa' : '#6ee7b7';
        const colorClass = tab === 'pso' ? 'orange' : 'green';

        document.getElementById(tab + '-result').style.display = 'block';
        document.getElementById(tab + '-stats').innerHTML =
            statsHTML(data.best_score, data.best_route, s.locations, iterations, colorClass);

        drawRouteOnMap(tab, data.best_route, s.locations, color, 'polyline');
        drawRouteCanvas(tab + '-route-canvas', data.best_route, s.locations);
        drawChart(tab + '-chart', tab, [{
            label: tab.toUpperCase(),
            data: data.history,
            borderColor: color,
            backgroundColor: color + '22',
            fill: true, tension: 0.3, pointRadius: 0
        }]);

        // Log to analysis
        logRun(tab === 'pso' ? 'PSO' : 'GA', s.locations.length, iterations, data.best_score, null);

    } catch (err) {
        document.getElementById(tab + '-loading').style.display = 'none';
        alert('Something went wrong. Make sure Flask is running!');
    }
}

// ─── Run Compare ──────────────────────────────────────────
async function runCompare() {
    const s = state.compare;
    if (s.locations.length < 3) { alert('Please add at least 3 locations!'); return; }

    const iterations = document.getElementById('compare-iterations').value;
    const population = document.getElementById('compare-population').value;

    document.getElementById('compare-result').style.display    = 'none';
    document.getElementById('compare-chart-box').style.display = 'none';
    document.getElementById('compare-loading').style.display   = 'block';

    try {
        const res  = await fetch('/compare', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cities: s.locations, iterations, population })
        });
        const data = await res.json();
        document.getElementById('compare-loading').style.display = 'none';
        if (data.error) { alert(data.error); return; }

        const pso = data.pso, ga = data.ga;
        const isTie   = pso.best_score === ga.best_score;
        const psoWins = pso.best_score < ga.best_score;

        document.getElementById('compare-result').style.display = 'block';
        document.getElementById('compare-stats').innerHTML = `
            <div class="stat-row">
                <span class="stat-label">🌀 PSO Best Distance</span>
                <span class="stat-value orange">${pso.best_score} km
                    ${!isTie && psoWins ? '<span class="winner-badge">🏆 Winner</span>' : ''}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">🧬 GA Best Distance</span>
                <span class="stat-value green">${ga.best_score} km
                    ${!isTie && !psoWins ? '<span class="winner-badge">🏆 Winner</span>' : ''}</span>
            </div>
            ${isTie ? `<div class="stat-row"><span class="stat-label">Result</span>
                <span class="stat-value blue">🤝 It's a Draw!</span></div>` : ''}
            <div class="stat-row">
                <span class="stat-label">Difference</span>
                <span class="stat-value">${Math.abs(pso.best_score - ga.best_score).toFixed(2)} km</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">🌀 PSO Route</span>
                <span class="stat-value" style="font-size:0.78rem;">
                    ${reorderRoute(ga.best_route).map(r => r === 0 ? '🏭' : `S${r}`).join(' ➔ ')} → 🏭</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">🧬 GA Route</span>
                <span class="stat-value" style="font-size:0.78rem;">
                    ${reorderRoute(pso.best_route).map(r => r === 0 ? '🏭' : `S${r}`).join(' ➔ ')} → 🏭</span>
            </div>`;

        drawRouteOnMap('compare', pso.best_route, s.locations, '#a78bfa', 'psoLine');
        drawRouteOnMap('compare', ga.best_route,  s.locations, '#6ee7b7', 'gaLine');

        drawChart('compare-chart', 'compare', [
            { label: 'PSO', data: pso.history, borderColor: '#a78bfa',
              fill: false, tension: 0.3, pointRadius: 0 },
            { label: 'GA',  data: ga.history,  borderColor: '#6ee7b7',
              fill: false, tension: 0.3, pointRadius: 0 }
        ]);

        // Log to analysis
        const result = isTie ? 'draw' : psoWins ? 'pso' : 'ga';
        logRun('Compare', s.locations.length, iterations, pso.best_score, result, ga.best_score);

    } catch (err) {
        document.getElementById('compare-loading').style.display = 'none';
        alert('Something went wrong. Make sure Flask is running!');
    }
}

// ─── Analysis Logging ─────────────────────────────────────
function logRun(algo, locations, iterations, score, compareResult, gaScore) {
    const run = { algo, locations, iterations, score, compareResult, gaScore, id: runHistory.length + 1 };
    runHistory.push(run);
    if (compareResult) {
        if (compareResult === 'pso')  wins.pso++;
        if (compareResult === 'ga')   wins.ga++;
        if (compareResult === 'draw') wins.draw++;
    }
    updateAnalysis();
}

function updateAnalysis() {
    document.getElementById('pso-wins').innerText  = wins.pso;
    document.getElementById('ga-wins').innerText   = wins.ga;
    document.getElementById('draw-wins').innerText = wins.draw;

    if (runHistory.length === 0) {
        document.getElementById('history-empty').style.display = 'block';
        document.getElementById('history-table').style.display = 'none';
        return;
    }

    document.getElementById('history-empty').style.display = 'none';
    document.getElementById('history-table').style.display = 'table';

    document.getElementById('history-body').innerHTML = runHistory.map(r => {
        const algoBadge = r.algo === 'PSO'     ? 'badge-pso' :
                          r.algo === 'GA'      ? 'badge-ga'  : 'badge-compare';
        const resultCell = r.compareResult === 'pso'  ? '<span class="badge badge-win">PSO Won</span>' :
                           r.compareResult === 'ga'   ? '<span class="badge badge-win">GA Won</span>'  :
                           r.compareResult === 'draw' ? '<span class="badge badge-draw">Draw</span>'   : '—';
        const scoreText  = r.algo === 'Compare'
            ? `PSO: ${r.score} / GA: ${r.gaScore}`
            : r.score;
        return `<tr>
            <td>${r.id}</td>
            <td><span class="badge ${algoBadge}">${r.algo}</span></td>
            <td>${r.locations}</td>
            <td>${r.iterations}</td>
            <td>${scoreText}</td>
            <td>${resultCell}</td>
        </tr>`;
    }).join('');
}

function clearAnalysis() {
    runHistory = [];
    wins = { pso: 0, ga: 0, draw: 0 };
    updateAnalysis();
}

function enterApp() {
    document.getElementById('landing').style.display = 'none';
    document.getElementById('app').style.display = 'block';
}