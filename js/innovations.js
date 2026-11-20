/* ==========================================================================
   TERRAVOYAGE — Signature Innovations (Not Found on Ordinary Travel Sites)
   1. Trip DNA Matchmaker (Live Compatibility Scoring + 1-Click Full Setup)
   2. 12-Month "When to Go" Weather & Crowd Heatmap (Jan–Dec Interactive)
   3. Ambient Travel Soundscapes (Web Audio: Ocean Surf / Alpine Wind / Rain)
   ========================================================================== */

window.TerraVoyage = window.TerraVoyage || {};

window.TerraVoyage.initInnovations = function initInnovations(helpers) {
  const { DESTINATIONS } = window.TerraVoyage;
  const { formatMoney, esc, notify, openFullGuide, selectRoadmap, jumpToBooking } = helpers;

  // Peak months (0 = Jan .. 11 = Dec) for each destination
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function parseBestMonths(seasonStr) {
    const map = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
    const peak = new Set();
    const ranges = String(seasonStr).match(/[A-Z][a-z]{2}[–-][A-Z][a-z]{2}/g) || [];
    ranges.forEach((r) => {
      const [a, b] = r.split(/[–-]/);
      const start = map[a];
      const end = map[b];
      if (start === undefined || end === undefined) return;
      let cur = start;
      for (let i = 0; i < 12; i += 1) {
        peak.add(cur);
        if (cur === end) break;
        cur = (cur + 1) % 12;
      }
    });
    return peak;
  }

  /* ------------------------------------------------------------------------
     INNOVATION 1: Trip DNA Matchmaker
     ------------------------------------------------------------------------ */
  function initTripDna() {
    const scopeSel = document.getElementById('dna-scope');
    const budgetSlider = document.getElementById('dna-budget');
    const budgetVal = document.getElementById('dna-budget-val');
    const daysSlider = document.getElementById('dna-days');
    const daysVal = document.getElementById('dna-days-val');
    const vibeSel = document.getElementById('dna-vibe');
    const paceSel = document.getElementById('dna-pace');
    const runBtn = document.getElementById('dna-run-btn');
    const outWrap = document.getElementById('dna-results');

    if (!runBtn || !outWrap) return;

    function updateLabels() {
      budgetVal.textContent = formatMoney(Number(budgetSlider.value));
      daysVal.textContent = `${daysSlider.value} Days`;
    }

    function computeMatches() {
      const scope = scopeSel.value;
      const maxUsd = Number(budgetSlider.value);
      const days = Number(daysSlider.value);
      const vibe = vibeSel.value;
      const pace = paceSel.value;

      const pool = DESTINATIONS.filter((d) => scope === 'all' || d.scope === scope);

      const scored = pool.map((d) => {
        const estTotal = d.flightUsd + d.dailyUsd * days;
        let score = 58;

        // Budget alignment (up to +24)
        if (estTotal <= maxUsd) {
          score += 24;
        } else {
          const ratio = maxUsd / estTotal;
          score += Math.max(0, Math.round(ratio * 20));
        }

        // Vibe alignment (+14)
        if (vibe === 'Any' || d.styles.includes(vibe)) score += 14;

        // Pace bonus (+4)
        if (pace === 'relaxed' && (d.styles.includes('Beaches') || d.styles.includes('Hills'))) score += 4;
        if (pace === 'adventure' && d.styles.includes('Adventure')) score += 4;
        if (pace === 'culture' && (d.styles.includes('Heritage') || d.styles.includes('City'))) score += 4;

        score = Math.min(99, Math.max(54, score));

        const reasons = [];
        if (estTotal <= maxUsd) reasons.push(`Fits within your ${formatMoney(maxUsd)} budget`);
        else reasons.push(`Stretch pick (~${formatMoney(estTotal)} est.)`);
        if (vibe !== 'Any' && d.styles.includes(vibe)) reasons.push(`Strong ${vibe} match`);
        reasons.push(`Best in ${d.bestSeason}`);

        return { dest: d, score, estTotal, reasons };
      });

      scored.sort((a, b) => b.score - a.score || b.dest.rating - a.dest.rating);
      const top3 = scored.slice(0, 3);

      outWrap.innerHTML = top3
        .map(
          (m, idx) => `
        <article class="dna-match-card ${idx === 0 ? 'is-top-match' : ''}">
          <div class="frame-photo-banner" style="background:${m.dest.gradient};height:102px;">
            <img class="dest-photo-bg" data-photo-id="${m.dest.id}" loading="lazy" alt="${esc(m.dest.name)}" />
            <span class="frame-photo-overlay-badge">${idx === 0 ? '🏆 #1 SOULMATE' : `#${idx + 1} RUNNER-UP`}</span>
            <button type="button" class="dest-weather-badge spot-weather-badge" data-weather-dest="${m.dest.id}" title="Live weather for ${esc(m.dest.name)}" aria-label="Weather for ${esc(m.dest.name)}">
              <span class="dw-icon" data-weather-icon="${m.dest.id}">⛅</span>
              <span class="dw-temp" data-weather-temp="${m.dest.id}">--°</span>
            </button>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:2px;">
            <h4 style="margin:0;font-family:var(--font-serif);font-size:1.12rem;line-height:1.2;word-break:break-word;">${m.dest.icon} ${esc(m.dest.name)}</h4>
            <span class="dna-score-ring">${m.score}% Match</span>
          </div>
          <div style="font-size:0.75rem;color:var(--ink-muted);">${esc(m.dest.country)} · Est. ${days}d: <strong style="color:var(--ink-primary);">${formatMoney(m.estTotal)}</strong></div>
          <p style="margin:2px 0 0;font-size:0.8rem;color:var(--ink-secondary);line-height:1.45;">${esc(m.reasons.join(' · '))}</p>
          <div class="dna-card-actions">
            <button type="button" class="btn btn-sm btn-teal dna-btn-full" data-dna-launch="${m.dest.id}">⚡ Load Roadmap</button>
            <button type="button" class="btn btn-sm" data-dna-guide="${m.dest.id}">Guide</button>
            <button type="button" class="btn btn-sm btn-primary" data-dna-book="${m.dest.id}">Book</button>
          </div>
        </article>
      `
        )
        .join('');

      window.TerraVoyage.photos?.hydratePhotos(outWrap);
      window.TerraVoyage.weather?.hydrateCardBadges(outWrap);

      outWrap.querySelectorAll('[data-dna-launch]').forEach((b) => {
        b.addEventListener('click', () => {
          selectRoadmap(b.dataset.dnaLaunch);
          notify('Loaded matched trip into Roadmap Architect!');
        });
      });
      outWrap.querySelectorAll('[data-dna-guide]').forEach((b) => {
        b.addEventListener('click', () => openFullGuide(b.dataset.dnaGuide));
      });
      outWrap.querySelectorAll('[data-dna-book]').forEach((b) => {
        b.addEventListener('click', () => jumpToBooking(b.dataset.dnaBook));
      });
    }

    [budgetSlider, daysSlider].forEach((el) => el.addEventListener('input', updateLabels));
    runBtn.addEventListener('click', () => {
      computeMatches();
      notify('Synthesized your personalized Trip DNA matches!');
    });

    updateLabels();
    computeMatches();
    return { updateLabels, computeMatches };
  }

  /* ------------------------------------------------------------------------
     INNOVATION 2: Interactive 12-Month "When to Go" Heatmap
     ------------------------------------------------------------------------ */
  function initSeasonHeatmap() {
    const pillsWrap = document.getElementById('heatmap-months');
    const gridEl = document.getElementById('heatmap-results');
    const headingEl = document.getElementById('heatmap-heading');
    if (!pillsWrap || !gridEl) return;

    let activeMonth = new Date().getMonth();

    function renderHeatmap() {
      pillsWrap.innerHTML = MONTHS.map(
        (m, idx) =>
          `<button type="button" class="month-pill ${idx === activeMonth ? 'is-active' : ''}" data-month-idx="${idx}">${m}</button>`
      ).join('');

      pillsWrap.querySelectorAll('[data-month-idx]').forEach((btn) => {
        btn.addEventListener('click', () => {
          activeMonth = Number(btn.dataset.monthIdx);
          renderHeatmap();
        });
      });

      const peakList = [];
      const mildList = [];

      DESTINATIONS.forEach((d) => {
        const peaks = parseBestMonths(d.bestSeason);
        if (peaks.has(activeMonth)) peakList.push(d);
        else mildList.push(d);
      });

      headingEl.textContent = `${peakList.length} Peak Perfection destinations for ${MONTHS[activeMonth]}`;

      gridEl.innerHTML = peakList
        .slice(0, 12)
        .map(
          (d) => `
        <button type="button" class="heat-card" data-heat-open="${d.id}">
          <span class="thumb-photo-box" style="background:${d.gradient};">
            <img class="dest-photo-bg" data-photo-id="${d.id}" loading="lazy" alt="${esc(d.name)}" />
            <span style="font-size:1.1rem;">${d.icon}</span>
          </span>
          <div style="text-align:left;min-width:0;">
            <div style="font-weight:700;font-size:0.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(d.name)}</div>
            <div style="font-size:0.72rem;color:var(--ink-muted);">${esc(d.region)} · ${esc(d.weather)}</div>
          </div>
          <span style="margin-left:auto;font-family:var(--font-mono);font-size:0.7rem;color:var(--sage);font-weight:700;">PEAK</span>
        </button>
      `
        )
        .join('');

      window.TerraVoyage.photos?.hydratePhotos(gridEl);

      gridEl.querySelectorAll('[data-heat-open]').forEach((btn) => {
        btn.addEventListener('click', () => openFullGuide(btn.dataset.heatOpen));
      });
    }

    renderHeatmap();
  }

  /* ------------------------------------------------------------------------
     INNOVATION 4: Ambient Travel Soundscapes (Web Audio Pink/Filtered Noise)
     ------------------------------------------------------------------------ */
  function initSoundscapes() {
    const btns = document.querySelectorAll('[data-sound-mode]');
    if (!btns.length) return;

    let ctx = null;
    let source = null;
    let gainNode = null;
    let lfo = null;
    let activeMode = null;

    function stopSound() {
      try {
        source?.stop();
        lfo?.stop();
      } catch (_) { }
      source = null;
      lfo = null;
      activeMode = null;
      btns.forEach((b) => b.classList.remove('is-active'));
    }

    function startSound(mode) {
      stopSound();
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!ctx) ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const bufferSize = ctx.sampleRate * 3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      for (let i = 0; i < bufferSize; i += 1) {
        const white = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + white * 0.029;
        b1 = 0.985 * b1 + white * 0.032;
        b2 = 0.95 * b2 + white * 0.048;
        data[i] = (b0 + b1 + b2) * 0.55;
      }

      source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      gainNode = ctx.createGain();

      if (mode === 'ocean') {
        filter.type = 'lowpass';
        filter.frequency.value = 460;
        gainNode.gain.value = 0.22;
        // Slow wave swell LFO
        lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 0.14;
        lfoGain.gain.value = 220;
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();
      } else if (mode === 'mountain') {
        filter.type = 'bandpass';
        filter.frequency.value = 540;
        filter.Q.value = 1.8;
        gainNode.gain.value = 0.16;
      } else {
        // Cozy rain
        filter.type = 'highpass';
        filter.frequency.value = 900;
        gainNode.gain.value = 0.09;
      }

      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start();

      activeMode = mode;
      btns.forEach((b) => b.classList.toggle('is-active', b.dataset.soundMode === mode));
      notify(`Ambient soundscape: ${mode === 'ocean' ? 'Ocean Waves' : mode === 'mountain' ? 'Alpine Wind' : 'Monsoon Rain'}`);
    }

    btns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.soundMode;
        if (activeMode === mode) {
          stopSound();
          notify('Ambient soundscape muted');
        } else {
          startSound(mode);
        }
      });
    });
  }

  const dnaApi = initTripDna();
  initSeasonHeatmap();
  initSoundscapes();

  return {
    refreshCurrencyDisplays() {
      dnaApi?.updateLabels();
      dnaApi?.computeMatches();
    }
  };
};
