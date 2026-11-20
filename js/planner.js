/* ==========================================================================
   TERRAVOYAGE — Interactive Roadmap Architect, Budget Calc, Packing & Phrases
   ========================================================================== */

window.TerraVoyage = window.TerraVoyage || {};

window.TerraVoyage.initPlanner = function initPlanner(helpers) {
  const { DESTINATIONS, PACKING_KITS, PHRASEBOOK, CURRENCIES } = window.TerraVoyage;
  const { formatMoney, esc, notify, getCurrencyCode } = helpers;

  const ROADMAP_KEY = 'terravoyage_roadmaps_v1';
  const PACKING_KEY = 'terravoyage_packing_v1';

  let savedRoadmaps = loadJson(ROADMAP_KEY, {});
  let activeDestId = 'ooty-coonoor';

  function groupedOptionsHtml() {
    const opts = (scope) =>
      DESTINATIONS.filter((d) => d.scope === scope)
        .map((d) => `<option value="${d.id}">${d.icon} ${esc(d.name)} (${esc(d.country)})</option>`)
        .join('');
    return `
      <optgroup label="Tamil Nadu (TN)">${opts('tn')}</optgroup>
      <optgroup label="India">${opts('india')}</optgroup>
      <optgroup label="Other Countries">${opts('world')}</optgroup>
    `;
  }

  let packingState = loadJson(PACKING_KEY, {
    kit: 'city',
    checked: {},
    custom: []
  });

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function saveRoadmaps() {
    try {
      localStorage.setItem(ROADMAP_KEY, JSON.stringify(savedRoadmaps));
    } catch (_) {}
  }

  function savePacking() {
    try {
      localStorage.setItem(PACKING_KEY, JSON.stringify(packingState));
    } catch (_) {}
  }

  /* ------------------------------------------------------------------------
     1. Interactive Day-by-Day Visual Roadmap Designer
     ------------------------------------------------------------------------ */
  function getSteps(destId) {
    if (!savedRoadmaps[destId]) {
      const dest = DESTINATIONS.find((d) => d.id === destId) || DESTINATIONS[0];
      savedRoadmaps[destId] = dest.roadmap.map((s) => ({ ...s }));
    }
    return savedRoadmaps[destId];
  }

  function renderRoadmap() {
    const destSel = document.getElementById('roadmap-dest-select');
    const spine = document.getElementById('timeline-spine');
    const summaryEl = document.getElementById('roadmap-summary');
    if (!spine) return;

    if (destSel && destSel.value !== activeDestId) destSel.value = activeDestId;

    const dest = DESTINATIONS.find((d) => d.id === activeDestId) || DESTINATIONS[0];
    const steps = getSteps(activeDestId);
    const totalUsd = steps.reduce((acc, s) => acc + (Number(s.cost) || 0), 0);
    const doneCount = steps.filter((s) => s.done).length;

    summaryEl.textContent = `${dest.name}, ${dest.country} · ${steps.length} stops (${doneCount} done) · Est. ${formatMoney(totalUsd)}`;

    if (!steps.length) {
      spine.innerHTML = `<div class="timeline-node"><p style="margin:0;color:var(--ink-secondary);">No stops yet — add your first milestone using the form on the right!</p></div>`;
      return;
    }

    spine.innerHTML = steps
      .map(
        (step, idx) => `
      <article class="timeline-node ${step.done ? 'is-done' : ''}">
        <span class="timeline-dot" aria-hidden="true">${step.done ? '✓' : ''}</span>
        <div class="node-top">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span class="node-day-tag">Day ${step.day} · ${esc(step.time)}</span>
            <span style="font-size:0.75rem;color:var(--ink-muted);font-weight:600;">${esc(step.category)}</span>
            <span style="font-family:var(--font-mono);font-size:0.78rem;color:var(--terracotta);font-weight:700;">
              ${step.cost > 0 ? formatMoney(step.cost) : 'Free'}
            </span>
          </div>
          <div class="node-controls">
            <button type="button" class="mini-btn" data-step-toggle="${idx}" title="Mark complete">${step.done ? '↺' : '✓'}</button>
            <button type="button" class="mini-btn" data-step-move="${idx}" data-dir="-1" title="Move up">↑</button>
            <button type="button" class="mini-btn" data-step-move="${idx}" data-dir="1" title="Move down">↓</button>
            <button type="button" class="mini-btn" data-step-del="${idx}" title="Remove stop">✕</button>
          </div>
        </div>
        <h4 class="node-title">${esc(step.title)}</h4>
      </article>
    `
      )
      .join('');

    spine.querySelectorAll('[data-step-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = Number(btn.dataset.stepToggle);
        steps[i].done = !steps[i].done;
        saveRoadmaps();
        renderRoadmap();
      });
    });

    spine.querySelectorAll('[data-step-move]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = Number(btn.dataset.stepMove);
        const dir = Number(btn.dataset.dir);
        const target = i + dir;
        if (target < 0 || target >= steps.length) return;
        [steps[i], steps[target]] = [steps[target], steps[i]];
        saveRoadmaps();
        renderRoadmap();
      });
    });

    spine.querySelectorAll('[data-step-del]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = Number(btn.dataset.stepDel);
        steps.splice(i, 1);
        saveRoadmaps();
        renderRoadmap();
        notify('Removed milestone from roadmap');
      });
    });
  }

  function initRoadmapControls() {
    const destSel = document.getElementById('roadmap-dest-select');
    if (destSel) {
      destSel.innerHTML = groupedOptionsHtml();
      destSel.value = activeDestId;
      destSel.addEventListener('change', (e) => {
        activeDestId = e.target.value;
        renderRoadmap();
      });
    }

    const form = document.getElementById('add-stop-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const day = Math.max(1, Number(document.getElementById('stop-day').value) || 1);
      const time = document.getElementById('stop-time').value || '10:00';
      const category = document.getElementById('stop-cat').value;
      const cost = Math.max(0, Number(document.getElementById('stop-cost').value) || 0);
      const title = document.getElementById('stop-title').value.trim();
      if (!title) return;

      const steps = getSteps(activeDestId);
      steps.push({ day, time, category, cost, title, done: false });
      steps.sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
      saveRoadmaps();
      form.reset();
      document.getElementById('stop-day').value = String(day);
      renderRoadmap();
      notify('Added new stop to your trip roadmap');
    });

    document.getElementById('roadmap-reset-btn')?.addEventListener('click', () => {
      delete savedRoadmaps[activeDestId];
      saveRoadmaps();
      renderRoadmap();
      notify('Restored curated roadmap template');
    });

    // 1. Shareable Link Generator for Itinerary
    document.getElementById('roadmap-share-link-btn')?.addEventListener('click', () => {
      const shareUrl = `${window.location.origin}${window.location.pathname}?roadmap=${encodeURIComponent(activeDestId)}#roadmap-section`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(() => {
          notify(`🔗 Copied shareable link for ${activeDestId} itinerary!`);
        }).catch(() => {
          prompt('Copy itinerary link:', shareUrl);
        });
      } else {
        prompt('Copy itinerary link:', shareUrl);
      }
    });

    // 2. WhatsApp Day-by-Day Itinerary Share
    document.getElementById('roadmap-whatsapp-btn')?.addEventListener('click', () => {
      const dest = DESTINATIONS.find((d) => d.id === activeDestId) || DESTINATIONS[0];
      const steps = getSteps(activeDestId);
      const shareUrl = `${window.location.origin}${window.location.pathname}?roadmap=${encodeURIComponent(activeDestId)}#roadmap-section`;

      const lines = [
        `🗺️ *Miravoya · Trip Itinerary for ${dest.name}, ${dest.country}*`,
        `🗓️ *Best Season:* ${dest.bestSeason} | 🌤️ *Weather:* ${dest.weather}`,
        ''
      ];

      const days = {};
      steps.forEach((s) => {
        if (!days[s.day]) days[s.day] = [];
        days[s.day].push(s);
      });

      Object.keys(days).sort((a, b) => Number(a) - Number(b)).forEach((dayNum) => {
        lines.push(`📅 *DAY ${dayNum}:*`);
        days[dayNum].forEach((s) => {
          const costStr = s.cost > 0 ? `(${formatMoney(s.cost)})` : '(Free)';
          lines.push(`• *${s.time}* [${s.category}] ${s.title} ${costStr}`);
        });
        lines.push('');
      });

      lines.push('🔗 *View & Customize Full Itinerary on Miravoya:*');
      lines.push(shareUrl);

      const waText = encodeURIComponent(lines.join('\n'));
      window.open(`https://api.whatsapp.com/send?text=${waText}`, '_blank');
      notify(`Opening WhatsApp with ${dest.name} itinerary...`);
    });

    // 3. Export PDF / Print Itinerary
    document.getElementById('roadmap-pdf-btn')?.addEventListener('click', () => {
      const dest = DESTINATIONS.find((d) => d.id === activeDestId) || DESTINATIONS[0];
      const steps = getSteps(activeDestId);
      const printContainer = document.getElementById('print-statement-container');
      if (!printContainer) return;

      const dateStr = new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      const days = {};
      steps.forEach((s) => {
        if (!days[s.day]) days[s.day] = [];
        days[s.day].push(s);
      });

      const totalEstCost = steps.reduce((sum, s) => sum + (Number(s.cost) || 0), 0);

      const daysHtml = Object.keys(days).sort((a, b) => Number(a) - Number(b)).map((dayNum) => {
        const daySteps = days[dayNum];
        const dayCost = daySteps.reduce((sum, s) => sum + (Number(s.cost) || 0), 0);
        return `
          <div style="margin-bottom:18px;" class="print-page-avoid">
            <div style="background:#0e7490;color:#ffffff;padding:6px 12px;border-radius:4px;font-weight:700;font-size:13px;display:flex;justify-content:space-between;">
              <span>📅 DAY ${dayNum} ITINERARY</span>
              <span>Day Est. Cost: ${formatMoney(dayCost)}</span>
            </div>
            <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;margin-top:6px;">
              <thead>
                <tr style="background:#f8fafc;border-bottom:1px solid #cbd5e1;font-size:11px;text-transform:uppercase;color:#475569;">
                  <th style="padding:6px 8px;text-align:left;width:70px;">Time</th>
                  <th style="padding:6px 8px;text-align:left;width:100px;">Category</th>
                  <th style="padding:6px 8px;text-align:left;">Milestone &amp; Activity</th>
                  <th style="padding:6px 8px;text-align:right;width:90px;">Est. Cost</th>
                </tr>
              </thead>
              <tbody>
                ${daySteps.map((s) => `
                  <tr style="border-bottom:1px solid #e2e8f0;font-size:12px;">
                    <td style="padding:6px 8px;font-family:monospace;font-weight:600;color:#0e7490;">${esc(s.time)}</td>
                    <td style="padding:6px 8px;"><span style="background:#f1f5f9;padding:2px 6px;border-radius:3px;font-size:10px;font-weight:600;">${esc(s.category)}</span></td>
                    <td style="padding:6px 8px;font-weight:600;">[ ] ${esc(s.title)}</td>
                    <td style="padding:6px 8px;text-align:right;font-weight:700;">${s.cost > 0 ? formatMoney(s.cost) : 'Free'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }).join('');

      printContainer.innerHTML = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;max-width:850px;margin:0 auto;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0e7490;padding-bottom:12px;margin-bottom:16px;">
            <div>
              <h1 style="font-size:24px;margin:0;color:#0e7490;letter-spacing:-0.02em;">Miravoya Global Travel Studio</h1>
              <p style="font-size:13px;color:#475569;margin:4px 0 0;">Official Travel Itinerary &amp; Milestone Route Plan</p>
            </div>
            <div style="text-align:right;font-size:12px;color:#64748b;">
              <div><strong>Print Date:</strong> ${dateStr}</div>
              <div><strong>Destination:</strong> ${esc(dest.name)} (${esc(dest.code)})</div>
            </div>
          </div>

          <div style="background:#f8fafc;padding:12px 16px;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:16px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;font-size:12px;">
            <span><strong>Destination:</strong> ${esc(dest.icon)} ${esc(dest.name)}, ${esc(dest.country)}</span>
            <span><strong>Best Season:</strong> ${esc(dest.bestSeason)}</span>
            <span><strong>Weather:</strong> ${esc(dest.weather)}</span>
            <span><strong>Ideal Stay:</strong> ${esc(dest.bestDays || '3–4 Days')}</span>
            <span><strong>Total Route Cost:</strong> <strong style="color:#0e7490;">${formatMoney(totalEstCost)}</strong></span>
          </div>

          ${daysHtml}

          <div style="border-top:1px solid #cbd5e1;padding-top:10px;text-align:center;font-size:11px;color:#94a3b8;margin-top:20px;">
            Generated via Miravoya Travel Studio · Zero-Cost Client Architecture · Have a wonderful trip!
          </div>
        </div>
      `;

      window.print();
    });

    // Check URL parameters on load for ?roadmap=
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const roadmapParam = urlParams.get('roadmap');
      if (roadmapParam && DESTINATIONS.some((d) => d.id === roadmapParam)) {
        activeDestId = roadmapParam;
        if (destSel) destSel.value = roadmapParam;
        renderRoadmap();
        setTimeout(() => {
          document.getElementById('roadmap-section')?.scrollIntoView({ behavior: 'smooth' });
          notify(`Loaded ${roadmapParam} trip itinerary from link!`);
        }, 500);
      }
    } catch (_) {}

    document.getElementById('roadmap-export-btn')?.addEventListener('click', () => {
      const dest = DESTINATIONS.find((d) => d.id === activeDestId) || DESTINATIONS[0];
      const steps = getSteps(activeDestId);
      const lines = [
        `# Miravoya Trip Roadmap — ${dest.name}, ${dest.country}`,
        `Best Season: ${dest.bestSeason} | Weather: ${dest.weather} | Visa: ${dest.visa}`,
        '',
        ...steps.map((s) => `- [${s.done ? 'x' : ' '}] **Day ${s.day} (${s.time})** [${s.category}] ${s.title} — ${s.cost > 0 ? formatMoney(s.cost) : 'Free'}`)
      ];
      const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `terravoyage-${dest.id}-roadmap.md`;
      a.click();
      URL.revokeObjectURL(url);
      notify(`Exported ${dest.name} roadmap (.md)`);
    });
  }

  /* ------------------------------------------------------------------------
     2. Interactive Trip Budget & Split-Bill Calculator
     ------------------------------------------------------------------------ */
  function initBudgetCalc() {
    const destSel = document.getElementById('budget-dest');
    const daysSlider = document.getElementById('budget-days');
    const pplSlider = document.getElementById('budget-travelers');
    const tierSel = document.getElementById('budget-tier');

    if (!destSel) return;

    destSel.innerHTML = groupedOptionsHtml();

    function updateBudget() {
      const dest = DESTINATIONS.find((d) => d.id === destSel.value) || DESTINATIONS[0];
      const days = Number(daysSlider.value);
      const people = Number(pplSlider.value);
      const mult = tierSel.value === 'budget' ? 0.72 : tierSel.value === 'luxury' ? 1.65 : 1;

      document.getElementById('budget-days-val').textContent = `${days} days`;
      document.getElementById('budget-ppl-val').textContent = `${people} ${people === 1 ? 'traveler' : 'travelers'}`;

      const flights = Math.round(dest.flightUsd * people * (tierSel.value === 'luxury' ? 1.55 : 1));
      const stay = Math.round(dest.dailyUsd * 0.48 * days * Math.ceil(people / 2) * mult);
      const food = Math.round(dest.dailyUsd * 0.28 * days * people * mult);
      const acts = Math.round(dest.dailyUsd * 0.24 * days * people * mult);
      const total = flights + stay + food + acts;
      const perPerson = Math.round(total / people);

      document.getElementById('budget-total').textContent = formatMoney(total);
      document.getElementById('budget-per-person').textContent = `${formatMoney(perPerson)} / person`;

      const pF = Math.round((flights / total) * 100);
      const pS = Math.round((stay / total) * 100);
      const pFd = Math.round((food / total) * 100);
      const pA = Math.max(0, 100 - pF - pS - pFd);

      document.getElementById('seg-flights').style.width = `${pF}%`;
      document.getElementById('seg-stays').style.width = `${pS}%`;
      document.getElementById('seg-food').style.width = `${pFd}%`;
      document.getElementById('seg-acts').style.width = `${pA}%`;

      document.getElementById('legend-flights').textContent = `Flights ${formatMoney(flights)}`;
      document.getElementById('legend-stays').textContent = `Stays ${formatMoney(stay)}`;
      document.getElementById('legend-food').textContent = `Food ${formatMoney(food)}`;
      document.getElementById('legend-acts').textContent = `Activities ${formatMoney(acts)}`;
    }

    [destSel, daysSlider, pplSlider, tierSel].forEach((el) => el.addEventListener('input', updateBudget));
    updateBudget();
    return updateBudget;
  }

  /* ------------------------------------------------------------------------
     3. Smart Adaptive Packing Checklist
     ------------------------------------------------------------------------ */
  function initPacking() {
    const kitSel = document.getElementById('pack-kit-select');
    const listEl = document.getElementById('pack-list');
    const progEl = document.getElementById('pack-progress');
    const form = document.getElementById('pack-add-form');
    const input = document.getElementById('pack-custom-input');

    if (!kitSel) return;
    kitSel.value = packingState.kit;

    function renderPack() {
      const base = PACKING_KITS[packingState.kit] || PACKING_KITS.city;
      const items = [...packingState.custom, ...base];
      const done = items.filter((item) => packingState.checked[item]).length;
      const pct = items.length ? Math.round((done / items.length) * 100) : 0;

      progEl.textContent = `${done}/${items.length} packed (${pct}%)`;
      document.getElementById('pack-bar-fill').style.width = `${pct}%`;

      listEl.innerHTML = items
        .map((item) => {
          const checked = Boolean(packingState.checked[item]);
          return `
            <li class="pack-item ${checked ? 'is-checked' : ''}">
              <label>
                <input type="checkbox" data-pack-item="${esc(item)}" ${checked ? 'checked' : ''} />
                <span>${esc(item)}</span>
              </label>
            </li>
          `;
        })
        .join('');

      listEl.querySelectorAll('[data-pack-item]').forEach((cb) => {
        cb.addEventListener('change', () => {
          packingState.checked[cb.dataset.packItem] = cb.checked;
          savePacking();
          renderPack();
        });
      });
    }

    kitSel.addEventListener('change', () => {
      packingState.kit = kitSel.value;
      savePacking();
      renderPack();
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = input.value.trim();
      if (!val) return;
      packingState.custom = [val, ...packingState.custom];
      input.value = '';
      savePacking();
      renderPack();
    });

    renderPack();
  }

  /* ------------------------------------------------------------------------
     4. Live Currency Converter & Essential Phrasebook
     ------------------------------------------------------------------------ */
  function initPhraseAndCurrency() {
    const langSel = document.getElementById('phrase-lang-select');
    const listEl = document.getElementById('phrase-list');
    const amtInput = document.getElementById('fx-amount');
    const fromSel = document.getElementById('fx-from');
    const toSel = document.getElementById('fx-to');
    const outEl = document.getElementById('fx-result');

    if (langSel && listEl) {
      const langs = Object.keys(PHRASEBOOK);
      langSel.innerHTML = langs.map((l) => `<option value="${l}">${l}</option>`).join('');
      const renderPhrases = () => {
        const list = PHRASEBOOK[langSel.value] || [];
        listEl.innerHTML = list
          .map(
            (p) => `
          <div class="phrase-item">
            <span class="phrase-en">${esc(p.en)}</span>
            <span class="phrase-local">${esc(p.local)}</span>
          </div>
        `
          )
          .join('');
      };
      langSel.addEventListener('change', renderPhrases);
      renderPhrases();
    }

    if (amtInput && fromSel && toSel) {
      const codes = Object.keys(CURRENCIES);
      fromSel.innerHTML = codes.map((c) => `<option value="${c}">${c}</option>`).join('');
      toSel.innerHTML = codes.map((c) => `<option value="${c}">${c}</option>`).join('');
      fromSel.value = 'USD';
      toSel.value = getCurrencyCode() === 'USD' ? 'INR' : getCurrencyCode();

      const calcFx = () => {
        const val = parseFloat(amtInput.value) || 0;
        const usd = val / CURRENCIES[fromSel.value].rate;
        const converted = usd * CURRENCIES[toSel.value].rate;
        outEl.textContent = `${CURRENCIES[toSel.value].symbol}${converted.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${toSel.value}`;
      };

      [amtInput, fromSel, toSel].forEach((el) => el.addEventListener('input', calcFx));
      calcFx();
    }
  }

  initRoadmapControls();
  const refreshBudget = initBudgetCalc();
  initPacking();
  initPhraseAndCurrency();
  renderRoadmap();

  return {
    selectRoadmapDestination(destId) {
      activeDestId = destId;
      renderRoadmap();
      document.getElementById('roadmap-section')?.scrollIntoView({ behavior: 'smooth' });
    },
    refreshCurrencyDisplays() {
      renderRoadmap();
      if (refreshBudget) refreshBudget();
    }
  };
};
