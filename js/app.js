/* ==========================================================================
   MIRAVOYA — World Map, TN/India/World Explorer, Full Guide, Book & Compare
   ========================================================================== */

(function () {
  window.Miravoya = window.Miravoya || window.TerraVoyage || {};
  window.TerraVoyage = window.Miravoya;
  const { DESTINATIONS, SCOPES, PLACE_CATEGORIES, CURRENCIES, initPlanner, initInnovations, initPowerExtras } = window.Miravoya;

  const STATE_KEY = 'terravoyage_state_v2';
  const VALID_THEMES = ['horizon', 'aurora', 'sahara', 'monaco', 'santorini', 'tokyo', 'kyoto'];
  const MAP_QUICK_IDS = ['ooty-coonoor', 'madurai', 'rameswaram', 'goa', 'kerala-munnar', 'kyoto', 'santorini', 'dubai'];

  let state = loadState();
  let plannerApi = null;
  let innovationsApi = null;
  let extrasApi = null;

  function loadState() {
    const fallback = {
      theme: 'monaco', // Monaco Grand Luxe as the impressive luxury showcase
      currency: 'INR',
      scope: 'all', // 'all' | 'tn' | 'india' | 'world'
      category: 'All',
      exploreMode: 'places', // 'places' | 'spots'
      search: '',
      activeMapId: 'ooty-coonoor',
      mapCustomQuery: '',
      mapMode: '', // '' = Map | 'k' = Satellite | 'h' = Hybrid
      compareIds: ['ooty-coonoor', 'kerala-munnar', 'kyoto'],
      bookingTab: 'flights',
      bookedTrips: []
    };
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      if (parsed.theme === 'santorini') {
        parsed.theme = 'monaco';
      }
      return {
        ...fallback,
        theme: VALID_THEMES.includes(parsed.theme) ? parsed.theme : 'monaco',
        currency: CURRENCIES[parsed.currency] ? parsed.currency : 'INR',
        compareIds: Array.isArray(parsed.compareIds) && parsed.compareIds.length ? parsed.compareIds : fallback.compareIds,
        bookedTrips: Array.isArray(parsed.bookedTrips) ? parsed.bookedTrips : []
      };
    } catch (_) {
      return fallback;
    }
  }

  function saveState() {
    try {
      localStorage.setItem(
        STATE_KEY,
        JSON.stringify({
          theme: state.theme,
          currency: state.currency,
          compareIds: state.compareIds,
          bookedTrips: state.bookedTrips
        })
      );
    } catch (_) { }
  }

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatMoney(usd) {
    const cur = CURRENCIES[state.currency] || CURRENCIES.INR;
    const val = Math.round(usd * cur.rate);
    return `${cur.symbol}${val.toLocaleString()}`;
  }

  let toastTimer = null;
  function notify(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-visible'), 2500);
  }

  /* ------------------------------------------------------------------------
     1. High-Precision Live Location Engine + Exact Pin Calibrator + Google Map
        - Fresh High-Accuracy GPS (enableHighAccuracy: true, maximumAge: 0)
        - Smart Precision Gate (never lets coarse ±2km drift overwrite pinpoint GPS)
        - Exact Pin Calibrator (search street/building/lat,lng & lock at z=17)
        - Network IP fallback only when GPS is unavailable
     ------------------------------------------------------------------------ */
  const LIVE_POS_CACHE_KEY = 'terravoyage_exact_pos_v2';
  try {
    localStorage.removeItem('terravoyage_last_live_pos_v1'); // Clear legacy coarse cache
  } catch (_) { }

  let liveGpsWatchId = null;
  let liveGpsFollowing = true;
  let livePos = loadCachedLivePos(); // { lat, lng, label, accuracy, speedKmh, source: 'pinned'|'gps'|'network', updatedAt }
  let bestSessionAccuracy = Infinity;
  let lastRenderedLivePos = null;
  let mapHasLoadedOnce = false;

  function loadCachedLivePos() {
    try {
      const raw = localStorage.getItem(LIVE_POS_CACHE_KEY);
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (typeof p?.lat === 'number' && typeof p?.lng === 'number') {
        // Trust user-pinned exact locations OR genuine high-accuracy GPS (<= 150m)
        if (p.source === 'pinned' || (p.source === 'gps' && p.accuracy > 0 && p.accuracy <= 150)) {
          return p;
        }
      }
    } catch (_) { }
    return null;
  }

  function saveCachedLivePos(pos) {
    try {
      localStorage.setItem(LIVE_POS_CACHE_KEY, JSON.stringify(pos));
    } catch (_) { }
  }

  function clearCachedLivePos() {
    try {
      localStorage.removeItem(LIVE_POS_CACHE_KEY);
    } catch (_) { }
  }

  function hideMapLoading() {
    const loader = document.getElementById('gmap-loading');
    if (loader) loader.classList.add('is-hidden');
  }

  function metersBetween(a, b) {
    if (!a || !b) return Infinity;
    const R = 6371000;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLon = ((b.lng - a.lng) * Math.PI) / 180;
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }

  function findNearestDestination(lat, lng) {
    let best = null;
    let bestKm = Infinity;
    DESTINATIONS.forEach((d) => {
      const m = String(d.coords).match(/([\d.]+)°\s*([NS]),\s*([\d.]+)°\s*([EW])/);
      if (!m) return;
      const dLat = parseFloat(m[1]) * (m[2] === 'S' ? -1 : 1);
      const dLng = parseFloat(m[3]) * (m[4] === 'W' ? -1 : 1);
      const km = metersBetween({ lat, lng }, { lat: dLat, lng: dLng }) / 1000;
      if (km < bestKm) {
        bestKm = km;
        best = d;
      }
    });
    return best ? { dest: best, km: Math.round(bestKm) } : null;
  }

  function updateLiveButtonUI() {
    const btn = document.getElementById('gmap-live-btn');
    const lbl = document.getElementById('gmap-live-label');
    if (!btn || !lbl) return;
    btn.classList.toggle('is-live', liveGpsFollowing && Boolean(livePos));
    if (liveGpsFollowing && livePos) {
      if (livePos.source === 'pinned') lbl.textContent = 'EXACT PIN ON';
      else if (livePos.source === 'gps') lbl.textContent = livePos.accuracy <= 120 ? 'PINPOINT GPS' : 'LIVE GPS ON';
      else lbl.textContent = 'AUTO LOC ON';
    } else if (liveGpsFollowing) {
      lbl.textContent = 'Scanning GPS...';
    } else {
      lbl.textContent = 'My Live Location';
    }
  }

  function reverseGeocodeLabel(lat, lng, expectedSource) {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&lat=${lat}&lon=${lng}`)
      .then((r) => r.json())
      .then((geo) => {
        const a = geo?.address || {};
        const primary = a.amenity || a.building || a.road || a.neighbourhood || a.suburb || a.hamlet || a.village || a.town;
        const secondary = a.suburb && a.suburb !== primary ? a.suburb : a.city || a.state_district || a.county;
        const area = [primary, secondary, a.state]
          .filter(Boolean)
          .filter((v, idx, arr) => arr.indexOf(v) === idx)
          .slice(0, 3)
          .join(', ');
        if (area && livePos && livePos.source === expectedSource && Math.abs(livePos.lat - lat) < 0.002) {
          livePos.label = area;
          livePos.exactArea = true;
          saveCachedLivePos(livePos);
          renderWorldMap(true);
        }
      })
      .catch(() => { });
  }

  // Layer 1: Automatic zero-click IP geolocation fallback (ONLY used if no pinned or GPS fix exists)
  async function detectNetworkLocationAuto() {
    if (livePos && (livePos.source === 'pinned' || livePos.source === 'gps')) return true;

    const providers = [
      async () => {
        const res = await fetch('https://ipwho.is/', { cache: 'no-store' });
        const d = await res.json();
        if (!d || d.success === false || typeof d.latitude !== 'number') return null;
        return { lat: d.latitude, lng: d.longitude, label: [d.city, d.region, d.country].filter(Boolean).join(', ') };
      },
      async () => {
        const res = await fetch('https://get.geojs.io/v1/ip/geo.json', { cache: 'no-store' });
        const d = await res.json();
        const lat = parseFloat(d?.latitude);
        const lng = parseFloat(d?.longitude);
        if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
        return { lat, lng, label: [d.city, d.region, d.country].filter(Boolean).join(', ') };
      },
      async () => {
        const res = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
        const d = await res.json();
        if (typeof d?.latitude !== 'number' || typeof d?.longitude !== 'number') return null;
        return { lat: d.latitude, lng: d.longitude, label: [d.city, d.region, d.country_name].filter(Boolean).join(', ') };
      }
    ];

    for (const run of providers) {
      try {
        const loc = await run();
        if (loc) {
          // Only apply network location if exact GPS or user pin hasn't already locked
          if (!livePos || livePos.source === 'network') {
            livePos = {
              lat: loc.lat,
              lng: loc.lng,
              label: loc.label || 'Current Area',
              accuracy: null,
              speedKmh: 0,
              source: 'network',
              updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            };
            if (liveGpsFollowing) {
              lastRenderedLivePos = null;
              renderWorldMap(false);
            }
          }
          return true;
        }
      } catch (_) {
        // Try next provider
      }
    }
    return false;
  }

  // Layer 2: Fresh High-Accuracy Browser GPS (enableHighAccuracy: true, maximumAge: 0 + Precision Gate)
  function startLiveGpsTracking(isAutoStart, forceFreshScan) {
    liveGpsFollowing = true;
    state.mapCustomQuery = '';

    // If user explicitly pinned their exact location and this is an auto-boot, keep their exact pin!
    if (isAutoStart && livePos && livePos.source === 'pinned') {
      updateLiveButtonUI();
      renderWorldMap(false);
      return;
    }

    if (forceFreshScan) {
      if (liveGpsWatchId !== null) {
        navigator.geolocation.clearWatch(liveGpsWatchId);
        liveGpsWatchId = null;
      }
      bestSessionAccuracy = Infinity;
      livePos = null;
      lastRenderedLivePos = null;
      clearCachedLivePos();
      const loader = document.getElementById('gmap-loading');
      if (loader) loader.classList.remove('is-hidden');
    }

    updateLiveButtonUI();

    if (livePos && !isAutoStart && !forceFreshScan) {
      lastRenderedLivePos = null;
      renderWorldMap(false);
    }

    if (!('geolocation' in navigator)) {
      if (!livePos) detectNetworkLocationAuto();
      return;
    }

    const handleGpsFix = (pos) => {
      // Never override an explicitly user-pinned exact location during background watch ticks
      if (livePos && livePos.source === 'pinned' && !forceFreshScan) return;

      const acc = Math.round(pos.coords.accuracy || 0);
      const next = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        label: '',
        accuracy: acc,
        speedKmh: pos.coords.speed && pos.coords.speed > 0 ? Math.round(pos.coords.speed * 3.6) : 0,
        source: 'gps',
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };

      const movedMeters = metersBetween(livePos, next);
      const isSharperFix = acc > 0 && acc < bestSessionAccuracy;
      const genuinelyMoved = livePos && livePos.source === 'gps' && movedMeters > Math.max(acc * 0.8, 35);

      // Precision Gate: reject coarse desktop Wi-Fi drift (e.g. ±2100m) if we already have a sharper fix!
      if (livePos && livePos.source === 'gps' && !isSharperFix && !genuinelyMoved && acc > bestSessionAccuracy * 1.25) {
        return;
      }

      if (acc > 0 && acc < bestSessionAccuracy) bestSessionAccuracy = acc;

      const upgradedFromNetwork = !livePos || livePos.source !== 'gps';
      const significantImprovement = livePos && livePos.accuracy && acc > 0 && acc <= livePos.accuracy * 0.6;

      // Preserve existing label only if we barely moved
      if (livePos && movedMeters < 45 && livePos.label) {
        next.label = livePos.label;
        next.exactArea = livePos.exactArea;
      }

      livePos = next;
      if (acc > 0 && acc <= 150) saveCachedLivePos(livePos);
      updateLiveButtonUI();

      // Reverse-geocode exact street / building / neighborhood name for the HUD
      if (upgradedFromNetwork || significantImprovement || movedMeters >= 45 || !livePos.exactArea) {
        reverseGeocodeLabel(next.lat, next.lng, 'gps');
      }

      if (liveGpsFollowing) {
        const movedFromRendered = metersBetween(lastRenderedLivePos, next);
        const shouldReloadMap = upgradedFromNetwork || significantImprovement || !lastRenderedLivePos || movedFromRendered >= 15;
        renderWorldMap(!shouldReloadMap, upgradedFromNetwork || significantImprovement);
      }
    };

    const handleGpsErr = (err) => {
      if (liveGpsWatchId !== null) {
        navigator.geolocation.clearWatch(liveGpsWatchId);
        liveGpsWatchId = null;
      }
      if (livePos) {
        liveGpsFollowing = true;
        renderWorldMap(true);
      } else {
        detectNetworkLocationAuto().then((ok) => {
          if (!ok && !mapHasLoadedOnce) {
            liveGpsFollowing = false;
            renderWorldMap(false);
          }
        });
      }
      if (!isAutoStart && err.code === 1) {
        notify('Location permission blocked — use "🎯 Fix Exact Pin" or allow browser Location');
      }
    };

    // Always request FRESH HIGH-ACCURACY GPS (maximumAge: 0 avoids stale OS Wi-Fi cache!)
    navigator.geolocation.getCurrentPosition(handleGpsFix, handleGpsErr, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 20000
    });

    if (liveGpsWatchId === null) {
      liveGpsWatchId = navigator.geolocation.watchPosition(handleGpsFix, () => { }, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20000
      });
    }
  }

  function applyExactPinnedLocation(lat, lng, labelText) {
    if (liveGpsWatchId !== null) {
      navigator.geolocation.clearWatch(liveGpsWatchId);
      liveGpsWatchId = null;
    }
    liveGpsFollowing = true;
    state.mapCustomQuery = '';
    livePos = {
      lat: Number(lat),
      lng: Number(lng),
      label: labelText || `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`,
      accuracy: 5,
      speedKmh: 0,
      source: 'pinned',
      exactArea: Boolean(labelText),
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    saveCachedLivePos(livePos);
    lastRenderedLivePos = null;
    renderWorldMap(false, true);
    if (!labelText) reverseGeocodeLabel(livePos.lat, livePos.lng, 'pinned');
    const drawer = document.getElementById('gmap-calibrate-drawer');
    if (drawer) drawer.hidden = true;
    notify(`🎯 Exact location locked: ${livePos.label}`);
  }

  function initAutomaticLiveMap() {
    // 1. If user already pinned their exact spot (or cached high-precision GPS), show it immediately!
    if (livePos) {
      liveGpsFollowing = true;
      renderWorldMap(false);
      if (livePos.source === 'pinned') return;
    } else {
      renderMapPills();
    }

    // 2. Prioritize Fresh High-Accuracy GPS first; only fall back to IP network if GPS takes > 2.5s
    startLiveGpsTracking(true, false);

    setTimeout(() => {
      if (!livePos) detectNetworkLocationAuto();
    }, 2400);

    // 3. Safety fallback if offline & no GPS after 5s
    setTimeout(() => {
      if (!mapHasLoadedOnce) {
        liveGpsFollowing = false;
        renderWorldMap(false);
      }
    }, 5000);
  }

  function renderMapPills() {
    const pillsWrap = document.getElementById('gmap-quick-pills');
    if (!pillsWrap) return;
    const showingLive = liveGpsFollowing && Boolean(livePos);
    const quickList = MAP_QUICK_IDS.map((id) => DESTINATIONS.find((d) => d.id === id)).filter(Boolean);
    pillsWrap.innerHTML = quickList
      .map((d) => {
        const active = !showingLive && !state.mapCustomQuery && d.id === state.activeMapId;
        const shortName = d.name.split('&')[0].split('(')[0].trim();
        return `<button type="button" class="gmap-pill ${active ? 'is-active' : ''}" data-gmap-dest="${d.id}">${d.icon} ${esc(shortName)}</button>`;
      })
      .join('');

    pillsWrap.querySelectorAll('[data-gmap-dest]').forEach((btn) => {
      btn.addEventListener('click', () => {
        liveGpsFollowing = false;
        state.activeMapId = btn.dataset.gmapDest;
        state.mapCustomQuery = '';
        const inp = document.getElementById('gmap-search-input');
        if (inp) inp.value = '';
        renderWorldMap(false);
      });
    });
  }

  let radarAnimTimer = null;
  let radarAltInterval = null;

  function playMapZoomInAnimation(targetLabel) {
    const iframe = document.getElementById('google-map-iframe');
    const radar = document.getElementById('gmap-radar-hud');
    const altPill = document.getElementById('radar-alt-pill');
    if (!iframe || !radar || !altPill) return;

    clearTimeout(radarAnimTimer);
    clearInterval(radarAltInterval);

    // Restart CSS keyframe cleanly
    iframe.classList.remove('is-dive-zooming');
    radar.classList.remove('is-active');
    void iframe.offsetWidth;
    iframe.classList.add('is-dive-zooming');
    radar.classList.add('is-active');

    let alt = 12400;
    const steps = 16;
    let tick = 0;
    altPill.textContent = `🛰️ ZOOMING IN · ${alt.toLocaleString()} m`;

    radarAltInterval = setInterval(() => {
      tick += 1;
      const progress = tick / steps;
      alt = Math.max(120, Math.round(12400 * Math.pow(1 - progress, 2.4)));
      if (tick >= steps) {
        clearInterval(radarAltInterval);
        const shortLbl = String(targetLabel || 'LIVE LOCATION').slice(0, 26).toUpperCase();
        altPill.textContent = `🎯 LOCKED · ${shortLbl}`;
      } else {
        altPill.textContent = `🛰️ ZOOMING IN · ${alt.toLocaleString()} m`;
      }
    }, 75);

    radarAnimTimer = setTimeout(() => {
      radar.classList.remove('is-active');
      iframe.classList.remove('is-dive-zooming');
    }, 1750);
  }

  function renderWorldMap(skipIframeReload, animateZoomIn) {
    const iframe = document.getElementById('google-map-iframe');
    if (!iframe) return;

    const dest = DESTINATIONS.find((d) => d.id === state.activeMapId) || DESTINATIONS[0];
    const showingLive = liveGpsFollowing && Boolean(livePos);
    const latStr = showingLive ? livePos.lat.toFixed(6) : '';
    const lngStr = showingLive ? livePos.lng.toFixed(6) : '';
    const queryText = showingLive
      ? `${latStr},${lngStr}`
      : state.mapCustomQuery || `${dest.name}, ${dest.country}`;

    // Smart adaptive zoom based on exact precision so roads & exact pin are always centered cleanly
    let zoom = 12;
    if (showingLive) {
      if (livePos.source === 'pinned') {
        zoom = 17; // Exact user-calibrated street/building pin
      } else if (livePos.source === 'gps' && livePos.accuracy > 0 && livePos.accuracy <= 100) {
        zoom = 17; // Pinpoint street-level GPS
      } else if (livePos.source === 'gps' && livePos.accuracy > 0 && livePos.accuracy <= 600) {
        zoom = 15; // Neighborhood-level GPS
      } else {
        zoom = 13; // Wide desktop Wi-Fi / network area (shows full roads & landmarks)
      }
    } else if (state.mapCustomQuery) {
      zoom = 14;
    }

    // Pass BOTH q=lat,lng AND ll=lat,lng so Google Maps drops the pin and centers on the EXACT coordinate
    const llParam = showingLive ? `&ll=${encodeURIComponent(`${latStr},${lngStr}`)}` : '';
    const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(queryText)}${llParam}&t=${encodeURIComponent(state.mapMode)}&z=${zoom}&hl=en&ie=UTF8&iwloc=&output=embed`;

    const isFirstOpen = !mapHasLoadedOnce;
    if (!skipIframeReload && iframe.src !== embedUrl) {
      const targetName = showingLive ? (livePos.label || 'Your Location') : state.mapCustomQuery || dest.name;
      iframe.onload = () => {
        hideMapLoading();
        if (isFirstOpen || animateZoomIn !== false) {
          playMapZoomInAnimation(targetName);
        }
      };
      iframe.src = embedUrl;
      mapHasLoadedOnce = true;
      if (showingLive) lastRenderedLivePos = { lat: livePos.lat, lng: livePos.lng };
    } else if (mapHasLoadedOnce) {
      hideMapLoading();
    }

    document.querySelectorAll('[data-gmap-mode]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.gmapMode === state.mapMode);
    });
    updateLiveButtonUI();
    renderMapPills();

    // Update Map HUD
    const openLink = document.getElementById('map-hud-open-gmaps');
    if (showingLive) {
      const nearest = findNearestDestination(livePos.lat, livePos.lng);
      const speedText = livePos.speedKmh > 0 ? ` · ${livePos.speedKmh} km/h` : '';
      const nearText = nearest ? ` · Nearest: ${nearest.dest.name} (${nearest.km} km)` : '';
      let modeTag = 'Auto Area Estimate · Tap "🎯 Fix Exact Pin" if off';
      if (livePos.source === 'pinned') {
        modeTag = `🎯 Exact Calibrated Pin (${livePos.lat.toFixed(5)}, ${livePos.lng.toFixed(5)})`;
      } else if (livePos.source === 'gps') {
        modeTag =
          livePos.accuracy > 300
            ? `📡 Wi-Fi Estimate (±${livePos.accuracy}m) · Tap "🎯 Fix Exact Pin" if off`
            : `🎯 Pinpoint GPS · ±${livePos.accuracy}m`;
      }
      const titleLabel = livePos.label ? `🟢 ${livePos.label}` : `🟢 Your Live Location (${livePos.lat.toFixed(4)}, ${livePos.lng.toFixed(4)})`;

      document.getElementById('map-hud-title').textContent = titleLabel;
      document.getElementById('map-hud-meta').textContent = `${modeTag}${speedText} · Updated ${livePos.updatedAt}${nearText}`;
      if (openLink) {
        openLink.href = `https://www.google.com/maps/search/?api=1&query=${livePos.lat},${livePos.lng}`;
        openLink.textContent = 'Open My Pin ↗';
      }
      const nearDest = nearest ? nearest.dest : dest;
      document.getElementById('map-hud-book').onclick = () => jumpToBooking(nearDest.id);
      document.getElementById('map-hud-roadmap').onclick = () => plannerApi?.selectRoadmapDestination(nearDest.id);
    } else if (state.mapCustomQuery) {
      document.getElementById('map-hud-title').textContent = `📍 ${state.mapCustomQuery}`;
      document.getElementById('map-hud-meta').textContent = 'Live Google Maps View · Tap "My Live Location" to return';
      if (openLink) {
        openLink.href = livePos
          ? `https://www.google.com/maps/dir/?api=1&origin=${livePos.lat},${livePos.lng}&destination=${encodeURIComponent(state.mapCustomQuery)}`
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(state.mapCustomQuery)}`;
        openLink.textContent = livePos ? 'Directions ↗' : 'Google Maps ↗';
      }
      document.getElementById('map-hud-book').onclick = () => jumpToBooking(dest.id);
      document.getElementById('map-hud-roadmap').onclick = () => plannerApi?.selectRoadmapDestination(dest.id);
    } else {
      document.getElementById('map-hud-title').textContent = `${dest.icon} ${dest.name}, ${dest.country}`;
      document.getElementById('map-hud-meta').textContent = `${dest.coords} · ${dest.weather} · ${formatMoney(dest.dailyUsd)}/day`;
      if (openLink) {
        openLink.href = livePos
          ? `https://www.google.com/maps/dir/?api=1&origin=${livePos.lat},${livePos.lng}&destination=${encodeURIComponent(queryText)}`
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryText)}`;
        openLink.textContent = livePos ? 'Directions ↗' : 'Google Maps ↗';
      }
      document.getElementById('map-hud-book').onclick = () => jumpToBooking(dest.id);
      document.getElementById('map-hud-roadmap').onclick = () => plannerApi?.selectRoadmapDestination(dest.id);
    }
  }

  function showDestinationOnGoogleMap(destId) {
    liveGpsFollowing = false;
    state.activeMapId = destId;
    state.mapCustomQuery = '';
    renderWorldMap(false);
    document.getElementById('google-map-stage')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const d = DESTINATIONS.find((x) => x.id === destId);
    if (d) notify(`Showing ${d.name} on Google Maps`);
  }

  /* ------------------------------------------------------------------------
     2. Explore: TN / India / Other Countries + Categories + Full Details
     ------------------------------------------------------------------------ */
  function renderScopesAndCategories() {
    const scopeWrap = document.getElementById('scope-grid');
    const catWrap = document.getElementById('category-chips');

    scopeWrap.innerHTML = SCOPES.map((s) => {
      const count = s.id === 'all' ? DESTINATIONS.length : DESTINATIONS.filter((d) => d.scope === s.id).length;
      const active = state.scope === s.id;
      return `
        <button type="button" class="scope-card ${active ? 'is-active' : ''}" data-scope-id="${s.id}" role="tab" aria-selected="${active}">
          <span class="scope-card-title">${esc(s.label)}</span>
          <span class="scope-card-sub">${count} places · ${esc(s.sub)}</span>
        </button>
      `;
    }).join('');

    scopeWrap.querySelectorAll('[data-scope-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.scope = btn.dataset.scopeId;
        renderScopesAndCategories();
        renderExplore();
      });
    });

    catWrap.innerHTML = PLACE_CATEGORIES.map((c) => {
      const active = state.category === c.id;
      return `<button type="button" class="chip ${active ? 'is-active' : ''}" data-cat-id="${c.id}">${esc(c.label)}</button>`;
    }).join('');

    catWrap.querySelectorAll('[data-cat-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.category = btn.dataset.catId;
        renderScopesAndCategories();
        renderExplore();
      });
    });
  }

  function showSpotOnGoogleMap(spotName, dest) {
    liveGpsFollowing = false;
    state.activeMapId = dest.id;
    state.mapCustomQuery = `${spotName}, ${dest.name}, ${dest.country}`;
    renderWorldMap();
    document.getElementById('google-map-stage')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    notify(`Showing ${spotName} on Google Maps`);
  }

  function renderExplore() {
    const grid = document.getElementById('dest-grid');
    if (!grid) return;

    const q = state.search.trim().toLowerCase();
    const list = DESTINATIONS.filter((d) => {
      if (state.scope !== 'all' && d.scope !== state.scope) return false;
      if (state.category !== 'All' && !d.styles.includes(state.category)) return false;
      if (!q) return true;
      const text = `${d.name} ${d.country} ${d.region} ${d.highlight} ${d.description} ${d.styles.join(' ')} ${(d.topPlaces || []).map((p) => `${p.name} ${p.note}`).join(' ')}`.toLowerCase();
      return text.includes(q);
    });

    const scopeLabels = { tn: 'TAMIL NADU', india: 'INDIA', world: 'INTERNATIONAL' };

    // UNIFIED EXPLORE: ONE HEADLINE & CONTENT PER DESTINATION (WITH TOURIST SPOTS)
    document.getElementById('explore-count').textContent = `${list.length} ${list.length === 1 ? 'place' : 'places'} · ${list.reduce((n, d) => n + (d.topPlaces?.length || 0), 0)} tourist spots`;

    if (!list.length) {
      grid.innerHTML = `<div class="panel-card" style="grid-column:1/-1;text-align:center;">No places matched this filter. Try switching to <strong>All Categories</strong> or another region!</div>`;
      return;
    }

    grid.className = 'dest-grid is-cinematic';

    grid.innerHTML = list
      .map((d) => {
        const compared = state.compareIds.includes(d.id);
        const spots = d.topPlaces || [];
        const spotCount = spots.length;

        return `
          <article class="dest-card is-cinematic spot-cinematic-card">
            <div class="dest-visual is-cinematic" style="background:${d.gradient}; cursor:pointer;" data-cinema-dest="${d.id}" title="Click to view 4K Cinema Reel for ${esc(d.name)}">
              <img class="dest-photo-bg" data-photo-id="${d.id}" loading="lazy" alt="${esc(d.name)}, ${esc(d.country)}" />
              <span class="dest-emblem" aria-hidden="true">${d.icon}</span>
              <div class="dest-top">
                <span class="cinema-card-badge">🎬 2.39:1 CINEMATIC</span>
                <div class="dest-top-right">
                  <button type="button" class="dest-weather-badge" data-weather-dest="${d.id}" title="Click to view full live weather report & plan trip days" aria-label="View live weather & plan trip days for ${esc(d.name)}">
                    <span class="dw-icon" data-weather-icon="${d.id}">⛅</span>
                    <span class="dw-temp" data-weather-temp="${d.id}">--°</span>
                  </button>
                  <span class="dest-rating">★ ${d.rating.toFixed(1)}</span>
                </div>
              </div>
              <div class="dest-heading">
                <div class="dest-country">${esc(d.country)} · ${esc(scopeLabels[d.scope] || d.region)}</div>
                <h3 class="dest-name" style="font-size:1.48rem;letter-spacing:0.01em;">${d.icon} ${esc(d.name)}</h3>
              </div>
            </div>

            <div class="dest-body">
              <p class="dest-desc">${esc(d.description)}</p>

              <!-- Top Tourist Spots List Under Headline & Description -->
              <div class="dest-spots-section" style="margin:8px 0 10px;">
                <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--ink-muted);margin-bottom:6px;">
                  📍 Top Tourist Spots (${spotCount}):
                </div>
                <div class="dest-spots-chips">
                  ${spots.slice(0, 4).map((p) => `<span class="spot-pill" title="${esc(p.note)}">📍 ${esc(p.name)}</span>`).join('')}
                  ${spotCount > 4 ? `<span class="spot-pill" style="color:var(--teal);font-weight:700;">+${spotCount - 4} more</span>` : ''}
                </div>
              </div>

              <div class="dest-card-tags">
                ${d.styles.map((s) => `<span class="mini-tag">${esc(s)}</span>`).join('')}
                <span class="mini-tag" style="color:#fef08a;background:rgba(244,190,79,0.18);border-color:rgba(244,190,79,0.4);font-weight:700;">🎬 ${spotCount + 1} 4K Scenes</span>
              </div>

              <div class="dest-stats-row">
                <div>
                  <span class="dest-stat-label">Daily Est.</span>
                  <span class="dest-stat-val">${formatMoney(d.dailyUsd)}</span>
                </div>
                <div>
                  <span class="dest-stat-label">Travel Est.</span>
                  <span class="dest-stat-val">${formatMoney(d.flightUsd)}</span>
                </div>
                <div>
                  <span class="dest-stat-label">Safety</span>
                  <span class="dest-stat-val">${d.safety}/100</span>
                </div>
              </div>

              <div style="display:grid;grid-template-columns:1.2fr 1fr 0.85fr auto;gap:6px;padding-top:10px;margin-top:auto;border-top:1px solid var(--border-subtle);">
                <button type="button" class="btn btn-sm btn-primary" data-cinema-dest="${d.id}" style="font-weight:700;" title="Watch Cinematic 4K Reel">▶ Cinema</button>
                <button type="button" class="btn btn-sm btn-teal" data-guide-dest="${d.id}">Full Guide</button>
                <button type="button" class="btn btn-sm btn-outline" data-book-dest="${d.id}">Book</button>
                <button
                  type="button"
                  class="btn btn-sm btn-compare ${compared ? 'is-selected' : ''}"
                  data-compare-dest="${d.id}"
                  title="Compare side-by-side (up to 3)"
                >${compared ? '⚖ ✓' : '⚖'}</button>
              </div>
            </div>
          </article>
        `;
      })
      .join('');

    grid.querySelectorAll('[data-cinema-dest]').forEach((b) => {
      b.addEventListener('click', () => openCinemaTheater(b.dataset.cinemaDest, 0));
    });
    grid.querySelectorAll('[data-guide-dest]').forEach((b) => {
      b.addEventListener('click', () => openFullGuide(b.dataset.guideDest));
    });
    grid.querySelectorAll('[data-book-dest]').forEach((b) => {
      b.addEventListener('click', () => jumpToBooking(b.dataset.bookDest));
    });
    grid.querySelectorAll('[data-compare-dest]').forEach((b) => {
      b.addEventListener('click', () => toggleCompare(b.dataset.compareDest));
    });

    window.Miravoya.photos?.hydratePhotos(grid);
    window.Miravoya.weather?.hydrateCardBadges(grid);
  }

  /* ------------------------------------------------------------------------
     2A. Fullscreen 4K IMAX Cinematic Theater & Soundscape Studio
     ------------------------------------------------------------------------ */
  let cinemaAudioCtx = null;
  let cinemaAudioSource = null;
  let cinemaAudioGain = null;
  let cinemaAudioTimer = null;
  let cinemaProgressInterval = null;
  let cinemaIsPaused = false;
  let cinemaSoundEnabled = true;
  let cinemaCurrentDestId = null;
  let cinemaCurrentIndex = 0;
  let cinemaReel = [];

  function stopCinemaSound() {
    if (cinemaAudioSource) {
      try { cinemaAudioSource.stop(); } catch (_) {}
      cinemaAudioSource = null;
    }
    if (cinemaAudioTimer) {
      clearInterval(cinemaAudioTimer);
      cinemaAudioTimer = null;
    }
  }

  function playCinemaSound(type) {
    stopCinemaSound();
    if (!cinemaSoundEnabled) return;

    try {
      if (!cinemaAudioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        cinemaAudioCtx = new AudioContext();
      }
      if (cinemaAudioCtx.state === 'suspended') {
        cinemaAudioCtx.resume();
      }

      if (type === 'temple_bells') {
        const playChime = () => {
          if (!cinemaAudioCtx || !cinemaSoundEnabled) return;
          const now = cinemaAudioCtx.currentTime;
          [528, 1056, 1584].forEach((freq, idx) => {
            const osc = cinemaAudioCtx.createOscillator();
            const gain = cinemaAudioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq + idx * 2, now);
            gain.gain.setValueAtTime(0.06 / (idx + 1), now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.6);
            osc.connect(gain);
            gain.connect(cinemaAudioCtx.destination);
            osc.start(now);
            osc.stop(now + 3.8);
          });
        };
        playChime();
        cinemaAudioTimer = setInterval(playChime, 6000);
      } else {
        const bufferSize = cinemaAudioCtx.sampleRate * 2.5;
        const buffer = cinemaAudioCtx.createBuffer(1, bufferSize, cinemaAudioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i += 1) {
          const white = Math.random() * 2 - 1;
          b0 = 0.997 * b0 + white * 0.028;
          b1 = 0.985 * b1 + white * 0.032;
          b2 = 0.95 * b2 + white * 0.048;
          data[i] = (b0 + b1 + b2) * 0.45;
        }

        cinemaAudioSource = cinemaAudioCtx.createBufferSource();
        cinemaAudioSource.buffer = buffer;
        cinemaAudioSource.loop = true;

        const filter = cinemaAudioCtx.createBiquadFilter();
        cinemaAudioGain = cinemaAudioCtx.createGain();

        if (type === 'ocean') {
          filter.type = 'lowpass';
          filter.frequency.value = 460;
          cinemaAudioGain.gain.value = 0.18;
          const lfo = cinemaAudioCtx.createOscillator();
          const lfoGain = cinemaAudioCtx.createGain();
          lfo.frequency.value = 0.12;
          lfoGain.gain.value = 200;
          lfo.connect(lfoGain);
          lfoGain.connect(filter.frequency);
          lfo.start();
        } else {
          // mountain breeze
          filter.type = 'bandpass';
          filter.frequency.value = 520;
          filter.Q.value = 2.0;
          cinemaAudioGain.gain.value = 0.14;
        }

        cinemaAudioSource.connect(filter);
        filter.connect(cinemaAudioGain);
        cinemaAudioGain.connect(cinemaAudioCtx.destination);
        cinemaAudioSource.start();
      }
    } catch (_) {}
  }

  let cinemaOpenedFromGuide = false;

  function openCinemaTheater(destId, initialIndex = 0, fromGuide = false) {
    const backdrop = document.getElementById('cinema-backdrop');
    if (!backdrop) return;

    cinemaOpenedFromGuide = Boolean(fromGuide);
    cinemaCurrentDestId = destId;
    cinemaReel = window.Miravoya.photos?.getCinematicReel(destId) || [];
    if (!cinemaReel.length) {
      notify('No cinematic scenes found for this destination');
      return;
    }

    cinemaCurrentIndex = Math.max(0, Math.min(initialIndex, cinemaReel.length - 1));
    cinemaIsPaused = false;

    backdrop.hidden = false;
    backdrop.classList.add('is-open');

    const screenImg = document.getElementById('cinema-screen-img');
    const filmstripTray = document.querySelector('.cinema-filmstrip-tray');
    const navPrev = document.getElementById('cinema-prev-btn');
    const navNext = document.getElementById('cinema-next-btn');
    const cinemaOverlay = document.querySelector('.cinema-overlay');

    if (screenImg) screenImg.style.display = 'block';
    if (filmstripTray) filmstripTray.style.display = 'block';
    if (navPrev) navPrev.style.display = 'flex';
    if (navNext) navNext.style.display = 'flex';
    if (cinemaOverlay) cinemaOverlay.style.display = 'flex';

    const updateScene = (idx) => {
      cinemaCurrentIndex = idx;
      const scene = cinemaReel[idx];
      if (!scene) return;

      const imgEl = document.getElementById('cinema-screen-img');
      const tagEl = document.getElementById('cinema-scene-tag');
      const titleEl = document.getElementById('cinema-title');
      const descEl = document.getElementById('cinema-scene-desc');
      const gpsEl = document.getElementById('cinema-tele-gps');
      const lightEl = document.getElementById('cinema-tele-light');
      const aspectEl = document.getElementById('cinema-tele-aspect');
      const counterEl = document.getElementById('cinema-filmstrip-counter');
      const glowEl = document.getElementById('cinema-ambient-glow');
      const soundTag = document.getElementById('cinema-sound-tag');

      if (tagEl) tagEl.textContent = scene.tag || '🎬 4K Panoramic Horizon';
      if (titleEl) titleEl.textContent = scene.title || '';
      if (descEl) descEl.textContent = scene.desc || '';
      if (gpsEl) gpsEl.textContent = scene.gps ? `📍 ${scene.gps}` : '📍 Global Coordinates';
      if (lightEl) lightEl.textContent = `🌅 ${scene.lighting || 'Golden-Hour'}`;
      if (aspectEl) aspectEl.textContent = scene.aspect || '2.39:1 UHD Anamorphic';
      if (counterEl) counterEl.textContent = `Scene ${idx + 1} of ${cinemaReel.length}`;
      if (soundTag) soundTag.textContent = cinemaSoundEnabled ? `🔊 Sound: ${scene.sound.replace('_', ' ').toUpperCase()}` : '🔇 Sound: Muted';

      if (glowEl) {
        const colors = [
          'radial-gradient(circle, #f4be4f 0%, #0e7490 60%, transparent 80%)',
          'radial-gradient(circle, #38bdf8 0%, #1e1b4b 60%, transparent 80%)',
          'radial-gradient(circle, #fb923c 0%, #831843 60%, transparent 80%)',
          'radial-gradient(circle, #34d399 0%, #064e3b 60%, transparent 80%)'
        ];
        glowEl.style.background = colors[idx % colors.length];
      }

      if (imgEl) {
        imgEl.classList.remove('is-loaded', 'is-animating');
        imgEl.src = scene.url;
        imgEl.onload = () => {
          imgEl.classList.add('is-loaded', 'is-animating');
        };
        imgEl.onerror = () => {
          const fallback = window.Miravoya.photos?.fetchPhotoUrl(cinemaCurrentDestId);
          if (fallback && imgEl.src !== fallback) {
            imgEl.src = fallback;
          }
          imgEl.classList.add('is-loaded');
        };
      }

      playCinemaSound(scene.sound);

      const filmstrip = document.getElementById('cinema-filmstrip');
      if (filmstrip) {
        filmstrip.querySelectorAll('.cinema-film-thumb').forEach((thumb, tIdx) => {
          const isActive = tIdx === idx;
          thumb.classList.toggle('is-active', isActive);
          if (isActive) {
            thumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }
        });
      }

      resetProgressTimer();
    };

    const filmstrip = document.getElementById('cinema-filmstrip');
    if (filmstrip) {
      filmstrip.innerHTML = cinemaReel
        .map(
          (s, i) => `
        <div class="cinema-film-thumb ${i === cinemaCurrentIndex ? 'is-active' : ''}" data-thumb-idx="${i}" title="${esc(s.title)}">
          <img src="${esc(s.url)}" alt="${esc(s.title)}" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=500&q=80';" />
        </div>
      `
        )
        .join('');

      filmstrip.querySelectorAll('[data-thumb-idx]').forEach((th) => {
        th.addEventListener('click', () => {
          updateScene(Number(th.dataset.thumbIdx));
        });
      });
    }

    const resetProgressTimer = () => {
      clearInterval(cinemaProgressInterval);
      const bar = document.getElementById('cinema-progress-bar');
      if (!bar) return;
      bar.style.transition = 'none';
      bar.style.width = '0%';

      if (cinemaIsPaused) return;

      let elapsed = 0;
      const totalTime = 7000;
      const step = 50;
      bar.style.transition = `width ${totalTime}ms linear`;
      setTimeout(() => {
        if (!cinemaIsPaused && backdrop.classList.contains('is-open')) {
          bar.style.width = '100%';
        }
      }, 50);

      cinemaProgressInterval = setInterval(() => {
        if (cinemaIsPaused) return;
        elapsed += step;
        if (elapsed >= totalTime) {
          clearInterval(cinemaProgressInterval);
          updateScene((cinemaCurrentIndex + 1) % cinemaReel.length);
        }
      }, step);
    };

    document.getElementById('cinema-prev-btn').onclick = () => {
      updateScene((cinemaCurrentIndex - 1 + cinemaReel.length) % cinemaReel.length);
    };
    document.getElementById('cinema-next-btn').onclick = () => {
      updateScene((cinemaCurrentIndex + 1) % cinemaReel.length);
    };
    document.getElementById('cinema-close-btn').onclick = closeCinemaTheater;

    const playToggleBtn = document.getElementById('cinema-play-toggle');
    if (playToggleBtn) {
      playToggleBtn.textContent = cinemaIsPaused ? '▶ Play' : '⏸ Pause';
      playToggleBtn.onclick = () => {
        cinemaIsPaused = !cinemaIsPaused;
        playToggleBtn.textContent = cinemaIsPaused ? '▶ Play' : '⏸ Pause';
        resetProgressTimer();
      };
    }

    const soundToggleBtn = document.getElementById('cinema-sound-toggle');
    if (soundToggleBtn) {
      soundToggleBtn.textContent = cinemaSoundEnabled ? '🔊 Sound: On' : '🔇 Sound: Muted';
      soundToggleBtn.onclick = () => {
        cinemaSoundEnabled = !cinemaSoundEnabled;
        soundToggleBtn.textContent = cinemaSoundEnabled ? '🔊 Sound: On' : '🔇 Sound: Muted';
        const scene = cinemaReel[cinemaCurrentIndex];
        const soundTag = document.getElementById('cinema-sound-tag');
        if (soundTag) soundTag.textContent = cinemaSoundEnabled && scene ? `🔊 Sound: ${scene.sound.replace('_', ' ').toUpperCase()}` : '🔇 Sound: Muted';
        if (cinemaSoundEnabled && scene) {
          playCinemaSound(scene.sound);
        } else {
          stopCinemaSound();
        }
      };
    }

    backdrop.onclick = (e) => {
      if (e.target === backdrop) closeCinemaTheater();
    };

    updateScene(cinemaCurrentIndex);
  }

  function openCinemaForSpot(destId, spotName) {
    const reel = window.Miravoya.photos?.getCinematicReel(destId) || [];
    let foundIdx = 0;
    if (spotName && reel.length) {
      const low = spotName.toLowerCase().trim();
      const idx = reel.findIndex((s) => s.title && s.title.toLowerCase().trim() === low);
      if (idx !== -1) foundIdx = idx;
    }
    openCinemaTheater(destId, foundIdx);
  }

  function closeCinemaTheater() {
    const backdrop = document.getElementById('cinema-backdrop');
    if (!backdrop) return;
    backdrop.classList.remove('is-open');
    setTimeout(() => {
      backdrop.hidden = true;
      if (cinemaOpenedFromGuide) {
        document.getElementById('guide-backdrop')?.classList.add('is-open');
        cinemaOpenedFromGuide = false;
      }
    }, 320);
    clearInterval(cinemaProgressInterval);
    stopCinemaSound();
  }

  /* ------------------------------------------------------------------------
     2B. Full Destination Guide Modal (Attractions, Food, Routes & Pro Tip)
     ------------------------------------------------------------------------ */
  function openFullGuide(destId) {
    const d = DESTINATIONS.find((x) => x.id === destId);
    if (!d) return;

    const backdrop = document.getElementById('guide-backdrop');
    const heroEl = document.getElementById('guide-hero');
    heroEl.style.background = d.gradient;
    heroEl.classList.remove('has-photo');
    const heroPhoto = document.getElementById('guide-hero-photo');
    if (heroPhoto) {
      heroPhoto.classList.remove('is-loaded');
      heroPhoto.removeAttribute('src');
      heroPhoto.dataset.photoId = d.id;
      heroPhoto.alt = `${d.name}, ${d.country}`;
      window.TerraVoyage.photos?.hydratePhotos(heroEl);
    }
    document.getElementById('guide-badge').textContent = `${d.country.toUpperCase()} · ${d.code} · ${d.coords}`;
    document.getElementById('guide-title').textContent = `${d.icon} ${d.name}`;
    document.getElementById('guide-desc').textContent = d.description;

    document.getElementById('guide-metrics').innerHTML = `
      <div class="guide-metric-box">
        <span class="dest-stat-label">Best Time</span>
        <span class="dest-stat-val">${esc(d.bestSeason)}</span>
      </div>
      <div class="guide-metric-box">
        <span class="dest-stat-label">Ideal Stay</span>
        <span class="dest-stat-val">${esc(d.bestDays || '3–4 Days')}</span>
      </div>
      <div class="guide-metric-box">
        <span class="dest-stat-label">Daily Budget</span>
        <span class="dest-stat-val">${formatMoney(d.dailyUsd)}/day</span>
      </div>
      <div class="guide-metric-box">
        <span class="dest-stat-label">Weather & Safety</span>
        <span class="dest-stat-val">${esc(d.weather)} · ${d.safety}%</span>
      </div>
    `;

    const placesWrap = document.getElementById('guide-places');
    placesWrap.innerHTML = (d.topPlaces || [])
      .map(
        (p, idx) => `
      <div class="guide-place-item">
        <div class="guide-spot-photo" style="background:${d.gradient};">
          <img class="dest-photo-bg" data-spot-query="${esc(p.name)}" data-spot-city="${esc(d.name)}" data-photo-id="${d.id}" decoding="async" alt="${esc(p.name)}" />
        </div>
        <div class="guide-spot-body">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
            <div class="guide-place-name">${esc(p.name)}</div>
            <button type="button" class="mini-btn" style="width:auto;padding:0 8px;font-size:0.7rem;flex-shrink:0;" data-guide-spot-map="${idx}" title="Locate on Google Map">📍 Map</button>
          </div>
          <div class="guide-place-note">${esc(p.note)}</div>
        </div>
      </div>
    `
      )
      .join('');

    window.TerraVoyage.photos?.hydratePhotos(placesWrap);

    placesWrap.querySelectorAll('[data-guide-spot-map]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const spot = d.topPlaces[Number(btn.dataset.guideSpotMap)];
        if (spot) {
          backdrop.classList.remove('is-open');
          showSpotOnGoogleMap(spot.name, d);
        }
      });
    });

    document.getElementById('guide-food').innerHTML = (d.localFood || [])
      .map((f) => `<span class="mini-tag" style="padding:5px 12px;font-size:0.78rem;">🍽️ ${esc(f)}</span>`)
      .join('');

    document.getElementById('guide-reach').textContent = d.howToReach || d.flightHours;
    document.getElementById('guide-tip').textContent = `${d.proTip || d.highlight} (Entry: ${d.visa})`;

    const closeGuide = () => backdrop.classList.remove('is-open');

    const mapBtn = document.getElementById('guide-map-btn');
    if (mapBtn) {
      mapBtn.onclick = () => {
        closeGuide();
        showDestinationOnGoogleMap(d.id);
      };
    }

    document.getElementById('guide-book-btn').onclick = () => {
      closeGuide();
      jumpToBooking(d.id);
    };
    document.getElementById('guide-roadmap-btn').onclick = () => {
      closeGuide();
      plannerApi?.selectRoadmapDestination(d.id);
    };
    document.getElementById('guide-compare-btn').onclick = () => {
      toggleCompare(d.id);
      closeGuide();
      document.getElementById('compare-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    backdrop.classList.add('is-open');
  }

  /* ------------------------------------------------------------------------
     3. Side-by-Side Destination Comparator
     ------------------------------------------------------------------------ */
  function toggleCompare(id) {
    if (state.compareIds.includes(id)) {
      if (state.compareIds.length === 1) {
        notify('Keep at least 1 destination in the comparator');
        return;
      }
      state.compareIds = state.compareIds.filter((x) => x !== id);
    } else {
      if (state.compareIds.length >= 3) {
        state.compareIds = [...state.compareIds.slice(1), id];
        notify('Replaced oldest slot (max 3 compared)');
      } else {
        state.compareIds = [...state.compareIds, id];
      }
    }
    saveState();
    renderExplore();
    renderComparator();
  }

  function renderComparator() {
    const grid = document.getElementById('compare-grid');
    if (!grid) return;

    const chosen = state.compareIds.map((id) => DESTINATIONS.find((d) => d.id === id)).filter(Boolean);
    const minDaily = Math.min(...chosen.map((d) => d.dailyUsd));
    const maxDaily = Math.max(...chosen.map((d) => d.dailyUsd), 1);

    grid.innerHTML = chosen
      .map((d) => {
        const bestVal = chosen.length > 1 && d.dailyUsd === minDaily;
        const costPct = Math.round((d.dailyUsd / maxDaily) * 100);
        const wifiPct = Math.min(100, Math.round((d.wifiMbps / 220) * 100));
        return `
          <article class="compare-col ${bestVal ? 'is-best-value' : ''}">
            <div class="frame-photo-banner" style="background:${d.gradient};">
              <img class="dest-photo-bg" data-photo-id="${d.id}" loading="lazy" alt="${esc(d.name)}, ${esc(d.country)}" />
              <span class="frame-photo-overlay-badge">${esc(d.country)} · ${esc(d.code)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:start;gap:8px;">
              <div>
                <h3 style="margin:0;font-family:var(--font-serif);font-size:1.25rem;">${d.icon} ${esc(d.name)}</h3>
              </div>
              ${bestVal ? '<span style="font-size:0.68rem;font-family:var(--font-mono);font-weight:700;padding:3px 8px;border-radius:99px;background:var(--sage-soft);color:var(--sage);white-space:nowrap;">BEST VALUE</span>' : ''}
            </div>

            <div class="meter-row">
              <div class="meter-head"><span>Daily Budget</span><span>${formatMoney(d.dailyUsd)} / day</span></div>
              <div class="meter-track"><div class="meter-fill" style="width:${costPct}%;"></div></div>
            </div>

            <div class="meter-row">
              <div class="meter-head"><span>Safety Index</span><span>${d.safety} / 100</span></div>
              <div class="meter-track"><div class="meter-fill" style="width:${d.safety}%;background:var(--sage);"></div></div>
            </div>

            <div class="meter-row">
              <div class="meter-head"><span>Wi-Fi / Nomad Speed</span><span>${d.wifiMbps} Mbps</span></div>
              <div class="meter-track"><div class="meter-fill" style="width:${wifiPct}%;background:var(--teal);"></div></div>
            </div>

            <div style="font-size:0.82rem;color:var(--ink-secondary);display:flex;flex-direction:column;gap:6px;padding-top:8px;border-top:1px solid var(--border-subtle);">
              <div><strong>Travel Est:</strong> ${formatMoney(d.flightUsd)} (${esc(d.flightHours)})</div>
              <div><strong>Best Season:</strong> ${esc(d.bestSeason)} (${esc(d.bestDays || '3–4 Days')})</div>
              <div><strong>Weather:</strong> ${esc(d.weather)}</div>
              <div><strong>Entry / Visa:</strong> ${esc(d.visa)}</div>
              <div><strong>Signature:</strong> ${esc(d.highlight)}</div>
            </div>

            <div style="display:flex;gap:8px;margin-top:auto;">
              <button type="button" class="btn btn-sm btn-teal" style="flex:1;" data-cmp-guide="${d.id}">Full Guide</button>
              <button type="button" class="btn btn-sm btn-primary" data-cmp-book="${d.id}">Book</button>
              <button type="button" class="btn btn-sm" data-cmp-remove="${d.id}">✕</button>
            </div>
          </article>
        `;
      })
      .join('');

    grid.querySelectorAll('[data-cmp-guide]').forEach((b) => {
      b.addEventListener('click', () => openFullGuide(b.dataset.cmpGuide));
    });
    grid.querySelectorAll('[data-cmp-book]').forEach((b) => {
      b.addEventListener('click', () => jumpToBooking(b.dataset.cmpBook));
    });
    grid.querySelectorAll('[data-cmp-remove]').forEach((b) => {
      b.addEventListener('click', () => toggleCompare(b.dataset.cmpRemove));
    });

    window.TerraVoyage.photos?.hydratePhotos(grid);
    window.TerraVoyage.weather?.hydrateCardBadges(grid);
  }

  /* ------------------------------------------------------------------------
     4. Verified Multi-Modal Booking Studio + 3 Distinct Animated Tickets
        (Flights Boarding Pass | Stays RFID Keycard | Rail & Car e-Ticket)
     ------------------------------------------------------------------------ */
  function jumpToBooking(destId) {
    const sel = document.getElementById('book-dest');
    if (sel) sel.value = destId;
    renderBookingOffers();
    document.getElementById('book-section')?.scrollIntoView({ behavior: 'smooth' });
  }

  function nextDayIso(dateStr) {
    try {
      const d = new Date(`${dateStr}T12:00:00`);
      d.setDate(d.getDate() + 2);
      return d.toISOString().slice(0, 10);
    } catch (_) {
      return '2026-12-20';
    }
  }

  function launchOfficialPartner(partner, meta) {
    const overlay = document.getElementById('redirect-overlay');
    const iconEl = document.getElementById('redirect-icon');
    const titleEl = document.getElementById('redirect-title');
    const subEl = document.getElementById('redirect-sub');

    // Open immediately inside user gesture so browser never blocks popup
    window.open(partner.url, '_blank', 'noopener,noreferrer');

    if (overlay && iconEl && titleEl && subEl) {
      iconEl.textContent = partner.icon;
      titleEl.textContent = `Opening ${partner.name}...`;
      subEl.textContent = `${meta.origin} → ${meta.destName} · ${meta.date} · ${meta.travelers} Guest(s)`;
      overlay.classList.add('is-open');
      setTimeout(() => overlay.classList.remove('is-open'), 1150);
    }

    // Save trip plan shortcut in My Trips vault
    const entry = {
      ref: partner.name,
      origin: meta.origin,
      destName: meta.destName,
      destCode: meta.destCode,
      destCountry: meta.destCountry,
      provider: partner.tagline,
      date: meta.date,
      travelers: meta.travelers,
      cabin: meta.tierLabel,
      url: partner.url,
      type: state.bookingTab === 'flights' ? 'FLIGHT' : state.bookingTab === 'stays' ? 'STAY' : 'RAIL / CAR'
    };

    state.bookedTrips = [entry, ...state.bookedTrips].slice(0, 12);
    saveState();
    renderSavedTrips();
  }

  function renderAnimatedTicket(meta) {
    const stage = document.getElementById('ticket-stage');
    if (!stage) return;

    const originCode = meta.origin.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'MAA';

    if (state.bookingTab === 'flights') {
      stage.innerHTML = `
        <aside class="boarding-pass ticket-animated" id="active-tilt-pass" aria-label="Animated Flight Boarding Pass Preview">
          <div class="pass-top">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-family:var(--font-serif);font-size:1.08rem;font-weight:600;">✈️ Flight Boarding Pass</span>
              <span style="font-family:var(--font-mono);font-size:0.7rem;color:#f4be4f;">LIVE SEARCH READY</span>
            </div>

            <div class="pass-route">
              <div>
                <div class="airport-code">${esc(originCode)}</div>
                <div class="airport-city">${esc(meta.origin)}</div>
              </div>
              <div class="flight-fly-track" aria-hidden="true">
                <span class="flight-moving-jet">✈</span>
              </div>
              <div style="text-align:right;">
                <div class="airport-code">${esc(meta.destCode)}</div>
                <div class="airport-city">${esc(meta.destName)}</div>
              </div>
            </div>

            <div style="font-size:0.8rem;opacity:0.86;">Compare real fares on Google Flights, Skyscanner, Ixigo & MakeMyTrip</div>
          </div>

          <div class="pass-perforation" aria-hidden="true">
            <span class="pass-notch left"></span>
            <span class="pass-notch right"></span>
          </div>

          <div class="pass-bottom">
            <div class="pass-grid">
              <div>
                <div class="pass-k">Departure</div>
                <div class="pass-v">${esc(meta.date)}</div>
              </div>
              <div>
                <div class="pass-k">Cabin Class</div>
                <div class="pass-v">${esc(meta.tierLabel)}</div>
              </div>
              <div>
                <div class="pass-k">Passengers</div>
                <div class="pass-v">${meta.travelers} Pax</div>
              </div>
            </div>
            <div class="barcode-bars" aria-hidden="true"></div>
          </div>
        </aside>
      `;
    } else if (state.bookingTab === 'stays') {
      const stayTierKey = document.getElementById('book-cabin')?.value || 'economy';
      const stayBadgeSvg =
        stayTierKey === 'business'
          ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fde68a" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18h18"/><path d="M4 15l2-8 6 4 6-4 2 8H4z"/><circle cx="12" cy="5" r="1.2" fill="#fde68a"/></svg>`
          : stayTierKey === 'premium'
            ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fde68a" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v11"/><path d="M21 18v-5a3 3 0 0 0-3-3H3"/><path d="M3 14h18"/><circle cx="7.5" cy="10.5" r="1.6"/></svg>`
            : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fde68a" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="12" r="4"/><path d="M12 12h9"/><path d="M18 12v3"/><path d="M21 12v2"/></svg>`;

      stage.innerHTML = `
        <aside class="stay-keycard ticket-animated" id="active-tilt-pass" aria-label="Animated Hotel RFID Keycard Preview">
          <div class="rfid-chip-row">
            <div>
              <div style="font-family:var(--font-mono);font-size:0.68rem;letter-spacing:0.12em;color:#f4be4f;">DIGITAL HOTEL KEYCARD</div>
              <div style="font-family:var(--font-serif);font-size:1.38rem;font-weight:600;margin-top:2px;">🏨 ${esc(meta.destName)}</div>
              <div style="font-size:0.78rem;opacity:0.8;">${esc(meta.destCountry)}</div>
            </div>
            <div class="nfc-waves" aria-hidden="true">
              <span class="nfc-pulse"></span>
              <span class="nfc-pulse p2"></span>
              <span class="keycard-emblem">${stayBadgeSvg}</span>
            </div>
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;position:relative;z-index:2;padding:4px 0;">
            <div class="gold-chip" aria-hidden="true"></div>
            <div style="text-align:right;font-family:var(--font-mono);font-size:0.74rem;color:#fde68a;">
              <div>TAP TO CHECK IN</div>
              <div style="opacity:0.8;">${esc(meta.tierLabel)} STAY</div>
            </div>
          </div>

          <div class="pass-grid" style="position:relative;z-index:2;padding-top:12px;border-top:1px dashed rgba(244,190,79,0.35);">
            <div>
              <div class="pass-k">Check-In</div>
              <div class="pass-v">${esc(meta.date)}</div>
            </div>
            <div>
              <div class="pass-k">Check-Out</div>
              <div class="pass-v">${esc(meta.checkoutDate)}</div>
            </div>
            <div>
              <div class="pass-k">Guests</div>
              <div class="pass-v">${meta.travelers} Guest${meta.travelers > 1 ? 's' : ''}</div>
            </div>
          </div>

          <div style="position:relative;z-index:2;font-size:0.78rem;opacity:0.82;">
            Redirects directly to verified listings on Agoda, Booking.com, OYO & MakeMyTrip.
          </div>
        </aside>
      `;
    } else {
      stage.innerHTML = `
        <aside class="rail-ticket ticket-animated" id="active-tilt-pass" aria-label="Animated Rail and Car e-Ticket Preview">
          <div class="rail-header-strip">
            <span>🚆 EXPRESS RAIL & ROAD e-TICKET</span>
            <span style="color:#6ee7b7;">IRCTC · REDBUS · ROME2RIO</span>
          </div>

          <div class="rail-body">
            <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;">
              <div>
                <div style="font-size:0.7rem;opacity:0.72;font-family:var(--font-mono);">BOARDING FROM</div>
                <div style="font-family:var(--font-serif);font-size:1.35rem;font-weight:700;">${esc(meta.origin)}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:0.7rem;opacity:0.72;font-family:var(--font-mono);">ARRIVING AT</div>
                <div style="font-family:var(--font-serif);font-size:1.35rem;font-weight:700;">${esc(meta.destName)}</div>
              </div>
            </div>

            <div class="rail-track-anim" aria-hidden="true">
              <span class="rail-moving-train">🚆</span>
              <span class="rail-ties"></span>
            </div>

            <div class="pass-grid">
              <div>
                <div class="pass-k">Journey Date</div>
                <div class="pass-v">${esc(meta.date)}</div>
              </div>
              <div>
                <div class="pass-k">Quota / Tier</div>
                <div class="pass-v">${esc(meta.tierLabel)}</div>
              </div>
              <div>
                <div class="pass-k">Travelers</div>
                <div class="pass-v">${meta.travelers} Seat${meta.travelers > 1 ? 's' : ''}</div>
              </div>
            </div>
          </div>

          <div class="rail-stub-footer">
            <span>OFFICIAL PORTAL REDIRECT</span>
            <span style="color:#6ee7b7;">ZERO MARKUP</span>
          </div>
        </aside>
      `;
    }

    initBoardingPassTilt();

    // Sync Right-Side Pass Studio Frame Header
    const studioTitle = document.getElementById('ticket-studio-title');
    if (studioTitle) {
      studioTitle.textContent =
        state.bookingTab === 'flights'
          ? 'Animated Flight Boarding Pass'
          : state.bookingTab === 'stays'
            ? 'Digital Hotel RFID Keycard'
            : 'Express Rail & Road e-Ticket';
    }
  }

  function renderBookingOffers() {
    const originInput = document.getElementById('book-origin');
    const origin = (originInput?.value.trim() || 'Chennai');
    const destId = document.getElementById('book-dest').value;
    const dest = DESTINATIONS.find((d) => d.id === destId) || DESTINATIONS[0];
    const dateVal = document.getElementById('book-date').value || '2026-12-18';
    const checkoutDate = nextDayIso(dateVal);
    const travelers = Math.max(1, Number(document.getElementById('book-travelers').value) || 2);
    const cabin = document.getElementById('book-cabin').value;
    const tierMap = { economy: 'Economy / Budget', premium: 'Comfort / 3-4★', business: 'Business / 5★' };
    const tierLabel = tierMap[cabin] || 'Standard';

    // Update contextual labels
    const dateLbl = document.getElementById('book-date-label');
    if (dateLbl) dateLbl.textContent = state.bookingTab === 'stays' ? 'Check-In Date' : 'Departure Date';

    const destClean = dest.name.split('&')[0].split('(')[0].trim();
    const offerList = document.getElementById('offer-list');
    let partners = [];

    if (state.bookingTab === 'flights') {
      const gfQuery = `Flights from ${origin} to ${destClean} on ${dateVal}`;
      partners = [
        {
          name: 'Google Flights',
          icon: '✈️',
          badge: 'CHEAPEST CALENDAR',
          tagline: `Live direct & lowest-fare calendar: ${origin} → ${destClean} (${dest.code})`,
          url: `https://www.google.com/travel/flights?q=${encodeURIComponent(gfQuery)}`
        },
        {
          name: 'Skyscanner',
          icon: '🔍',
          badge: 'GLOBAL COMPARE',
          tagline: 'Compares 1,000+ budget & major airlines worldwide for lowest tickets',
          url: 'https://www.skyscanner.co.in/'
        },
        {
          name: 'Ixigo Flights',
          icon: '⚡',
          badge: 'INDIA FAVORITE',
          tagline: 'Fast Indian domestic & international cheap flight finder with fare alerts',
          url: 'https://www.ixigo.com/flights'
        },
        {
          name: 'MakeMyTrip Flights',
          icon: '🛫',
          badge: 'OFFICIAL PARTNER',
          tagline: 'Instant UPI / card flight checkout across India & global routes',
          url: 'https://www.makemytrip.com/flights/'
        }
      ];
    } else if (state.bookingTab === 'stays') {
      partners = [
        {
          name: 'Agoda',
          icon: '🏨',
          badge: 'BEST ASIA DEALS',
          tagline: `Verified hotels & resorts in ${destClean} · ${dateVal} · ${travelers} guest(s)`,
          url: `https://www.agoda.com/search?textToSearch=${encodeURIComponent(destClean)}&checkIn=${encodeURIComponent(dateVal)}&adults=${travelers}`
        },
        {
          name: 'Booking.com',
          icon: '🛏️',
          badge: 'FREE CANCELLATION',
          tagline: `Live rooms & guest-verified reviews in ${destClean}, ${dest.country}`,
          url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(`${destClean}, ${dest.country}`)}&checkin=${encodeURIComponent(dateVal)}&checkout=${encodeURIComponent(checkoutDate)}&group_adults=${travelers}`
        },
        {
          name: 'OYO Rooms',
          icon: '🔑',
          badge: 'BUDGET & QUICK',
          tagline: `Affordable standardized stays across ${destClean} & Indian cities`,
          url: `https://www.oyorooms.com/search/?location=${encodeURIComponent(destClean)}`
        },
        {
          name: 'MakeMyTrip Hotels',
          icon: '🏡',
          badge: 'RESORTS & VILLAS',
          tagline: `Homestays, hill resorts & boutique hotels in ${destClean}`,
          url: 'https://www.makemytrip.com/hotels/'
        }
      ];
    } else {
      partners = [
        {
          name: 'IRCTC Official Rail',
          icon: '🚆',
          badge: 'INDIAN RAILWAYS',
          tagline: `Official Indian Railways train search & e-Ticket booking (${origin} → ${destClean})`,
          url: 'https://www.irctc.co.in/nget/train-search'
        },
        {
          name: 'ConfirmTkt / Rail',
          icon: '🎫',
          badge: 'FAST SEAT FINDER',
          tagline: 'Quick train availability, alternate routes & live PNR status',
          url: 'https://www.confirmtkt.com/rbooking-d/'
        },
        {
          name: 'RedBus',
          icon: '🚌',
          badge: 'AC SLEEPER & VOLVO',
          tagline: `Direct intercity buses across Tamil Nadu & India to ${destClean}`,
          url: 'https://www.redbus.in/'
        },
        {
          name: 'Rome2Rio & Savaari',
          icon: '🚗',
          badge: 'DOOR-TO-DOOR',
          tagline: `Compare trains, buses & driving routes from ${origin} to ${destClean}`,
          url: `https://www.rome2rio.com/s/${encodeURIComponent(origin)}/${encodeURIComponent(destClean)}`
        }
      ];
    }

    const meta = {
      origin,
      destName: dest.name,
      destCode: dest.code,
      destCountry: dest.country,
      date: dateVal,
      checkoutDate,
      travelers,
      tierLabel
    };

    offerList.innerHTML = partners
      .map(
        (p, idx) => `
      <div class="partner-deal-card">
        <div style="min-width:0;flex:1;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <strong style="font-size:0.95rem;">${p.icon} ${esc(p.name)}</strong>
            <span class="verified-badge">✓ ${esc(p.badge)}</span>
          </div>
          <div style="font-size:0.78rem;color:var(--ink-secondary);margin-top:3px;">${esc(p.tagline)}</div>
        </div>
        <button type="button" class="btn btn-sm btn-primary" data-launch-partner="${idx}">
          Book on ${esc(p.name.split(' ')[0])} ↗
        </button>
      </div>
    `
      )
      .join('');

    offerList.querySelectorAll('[data-launch-partner]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const chosen = partners[Number(btn.dataset.launchPartner)];
        if (chosen) launchOfficialPartner(chosen, meta);
      });
    });

    renderAnimatedTicket(meta);
  }

  function renderSavedTrips() {
    const grid = document.getElementById('saved-trips-grid');
    const countEl = document.getElementById('trips-count');
    if (!grid) return;

    countEl.textContent = `${state.bookedTrips.length} saved`;

    if (!state.bookedTrips.length) {
      grid.innerHTML = `<div class="panel-card" style="grid-column:1/-1;color:var(--ink-secondary);text-align:center;">No saved trip links yet — pick a destination and click any official partner (Google Flights, Agoda, IRCTC, etc.) in the Booking Studio to save your plan here.</div>`;
      return;
    }

    grid.innerHTML = state.bookedTrips
      .map(
        (t, idx) => `
      <article class="saved-trip-card">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-family:var(--font-mono);font-size:0.72rem;font-weight:700;color:var(--teal);">${esc(t.type)} · ${esc(t.ref)}</span>
          <button type="button" class="mini-btn" data-del-trip="${idx}" title="Remove trip">✕</button>
        </div>
        <div style="font-family:var(--font-serif);font-size:1.18rem;font-weight:600;">${esc(t.origin)} → ${esc(t.destName)} (${esc(t.destCode)})</div>
        <div style="font-size:0.82rem;color:var(--ink-secondary);">${esc(t.date)} · ${t.travelers} Guest(s) · ${esc(t.cabin)}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:8px;border-top:1px solid var(--border-subtle);">
          <span style="font-size:0.74rem;color:var(--ink-muted);">Official booking link</span>
          ${t.url ? `<a href="${esc(t.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-teal">Open ${esc(t.ref)} ↗</a>` : ''}
        </div>
      </article>
    `
      )
      .join('');

    grid.querySelectorAll('[data-del-trip]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.bookedTrips.splice(Number(btn.dataset.delTrip), 1);
        saveState();
        renderSavedTrips();
      });
    });
  }

  /* ------------------------------------------------------------------------
     5. Living Atmosphere Themes, Circular Liquid Morph, Particles & Tilt
     ------------------------------------------------------------------------ */
  const THEME_META = {
    horizon: { icon: '🌅', title: 'Golden Horizon', sub: 'Sunlit Editorial Daylight' },
    aurora: { icon: '🌌', title: 'Aurora Borealis', sub: 'Nordic Midnight Northern Lights' },
    sahara: { icon: '🏜️', title: 'Sahara Dusk', sub: 'Desert Gold Velvet & Embers' },
    monaco: { icon: '👑', title: 'Monaco Grand Luxe', sub: 'Imperial Emerald & 24K Champagne Gold' },
    santorini: { icon: '👑', title: 'Monaco Grand Luxe', sub: 'Imperial Emerald & 24K Champagne Gold' },
    tokyo: { icon: '⚡', title: 'Tokyo Cyber Neon', sub: 'Midnight Obsidian & Laser Cyberpunk' },
    kyoto: { icon: '🌸', title: 'Kyoto Twilight', sub: 'Sakura Petals & Lantern Ink' }
  };

  let themeBannerTimer = null;

  function initThemeParticles() {
    const host = document.getElementById('theme-particles');
    if (!host || host.childElementCount > 0) return;
    const count = 14;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'theme-particle';
      const px = ((i * 7.3 + 4) % 94).toFixed(1);
      const py = ((i * 19.7 + 8) % 86).toFixed(1);
      const ps = (6 + (i % 5) * 2.2).toFixed(1);
      const pd = (8.5 + (i % 6) * 2.1).toFixed(1);
      const pdelay = (-1 * ((i * 1.35) % 10)).toFixed(2);
      const pdrift = ((i % 2 === 0 ? 1 : -1) * (24 + (i % 4) * 14)).toFixed(0);
      p.style.cssText = `--px:${px}%;--py:${py}%;--ps:${ps}px;--pd:${pd}s;--pdelay:${pdelay}s;--pdrift:${pdrift}px;`;
      frag.appendChild(p);
    }
    host.appendChild(frag);
  }

  function initAmbientCursorAura() {
    const aura = document.getElementById('ambient-cursor-aura');
    if (!aura || window.matchMedia?.('(pointer: coarse)').matches) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let isTracking = false;

    window.addEventListener('pointermove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!isTracking) {
        isTracking = true;
        requestAnimationFrame(renderAura);
      }
    }, { passive: true });

    function renderAura() {
      currentX += (targetX - currentX) * 0.14;
      currentY += (targetY - currentY) * 0.14;
      aura.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate3d(-50%, -50%, 0)`;

      if (Math.abs(targetX - currentX) > 0.5 || Math.abs(targetY - currentY) > 0.5) {
        requestAnimationFrame(renderAura);
      } else {
        isTracking = false;
      }
    }
  }

  function initClickSparkles() {
    window.addEventListener('pointerdown', (e) => {
      if (e.target.matches('input, select, textarea, option')) return;
      const spark = document.createElement('span');
      spark.className = 'click-spark-burst';
      spark.style.left = `${e.clientX}px`;
      spark.style.top = `${e.clientY}px`;
      document.body.appendChild(spark);
      setTimeout(() => spark.remove(), 650);
    }, { passive: true });
  }

  function showThemeStageBanner(themeKey) {
    const banner = document.getElementById('theme-stage-banner');
    const iconEl = document.getElementById('theme-stage-icon');
    const titleEl = document.getElementById('theme-stage-title');
    const subEl = document.getElementById('theme-stage-sub');
    const meta = THEME_META[themeKey];
    if (!banner || !meta) return;

    if (iconEl) {
      iconEl.textContent = meta.icon;
      iconEl.style.animation = 'none';
      void iconEl.offsetWidth;
      iconEl.style.animation = '';
    }
    if (titleEl) titleEl.textContent = meta.title;
    if (subEl) subEl.textContent = meta.sub;

    banner.classList.add('is-visible');
    clearTimeout(themeBannerTimer);
    themeBannerTimer = setTimeout(() => {
      banner.classList.remove('is-visible');
    }, 1850);
  }

  function applyTheme(triggerBtn) {
    const commitTheme = () => {
      document.documentElement.dataset.theme = state.theme;
      document.querySelectorAll('[data-set-theme]').forEach((btn) => {
        btn.classList.toggle('is-active', btn.dataset.setTheme === state.theme);
      });
    };

    if (!triggerBtn) {
      commitTheme();
      return;
    }

    const rect = triggerBtn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxRadius = Math.hypot(
      Math.max(cx, window.innerWidth - cx),
      Math.max(cy, window.innerHeight - cy)
    );

    // Fire GPU shockwave ring from the exact clicked theme button
    const wave = document.getElementById('theme-ripple-wave');
    if (wave) {
      wave.style.setProperty('--rx', `${cx}px`);
      wave.style.setProperty('--ry', `${cy}px`);
      wave.classList.remove('is-pulsing');
      void wave.offsetWidth;
      wave.classList.add('is-pulsing');
    }

    // Trigger hero light sheen sweep
    const heroCard = document.querySelector('.hero-card');
    if (heroCard) {
      heroCard.classList.remove('theme-morphing');
      void heroCard.offsetWidth;
      heroCard.classList.add('theme-morphing');
    }

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    // Native circular liquid View Transition when supported
    if (typeof document.startViewTransition === 'function' && !reducedMotion) {
      const transition = document.startViewTransition(() => {
        commitTheme();
      });
      transition.ready
        .then(() => {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${cx}px ${cy}px)`,
                `circle(${maxRadius}px at ${cx}px ${cy}px)`
              ]
            },
            {
              duration: 620,
              easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
              pseudoElement: '::view-transition-new(root)'
            }
          );
        })
        .catch(() => { });
    } else {
      commitTheme();
    }

    showThemeStageBanner(state.theme);
  }

  function initBoardingPassTilt() {
    const pass = document.getElementById('active-tilt-pass');
    if (!pass) return;
    pass.addEventListener('mousemove', (e) => {
      const rect = pass.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      pass.style.transform = `perspective(900px) rotateY(${(x * 7).toFixed(2)}deg) rotateX(${(-y * 7).toFixed(2)}deg)`;
    });
    pass.addEventListener('mouseleave', () => {
      pass.style.transform = '';
    });
  }

  function initTravelPreloaderAndScrollPlane() {
    const preloader = document.getElementById('travel-preloader');
    const statusEl = document.getElementById('preloader-status');
    if (preloader) {
      if (statusEl) {
        setTimeout(() => {
          statusEl.textContent = 'SYNCING 270+ ULTRA-HD LANDMARKS';
        }, 380);
        setTimeout(() => {
          statusEl.textContent = 'READY FOR DEPARTURE ✈';
        }, 780);
      }
      setTimeout(() => preloader.classList.add('is-done'), 1120);
    }

    const fill = document.getElementById('scroll-flight-fill');
    const plane = document.getElementById('scroll-flight-plane');
    if (fill && plane) {
      let rafId = null;
      const updateBar = () => {
        rafId = null;
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const pct = Math.min(100, Math.max(0, (window.scrollY / max) * 100));
        fill.style.width = `${pct.toFixed(2)}%`;
        plane.style.left = `${pct.toFixed(2)}%`;
      };
      const onScroll = () => {
        if (!rafId) rafId = requestAnimationFrame(updateBar);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      updateBar();
    }
  }

  function refreshAllMoney() {
    renderWorldMap(true);
    renderExplore();
    renderComparator();
    renderBookingOffers();
    renderSavedTrips();
    plannerApi?.refreshCurrencyDisplays();
    innovationsApi?.refreshCurrencyDisplays();
    extrasApi?.refreshCurrencyDisplays();
  }

  function initScrollReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.06 }
    );
    els.forEach((el) => io.observe(el));
  }

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme();

    // Populate Booking Destination Select grouped by TN / India / World
    const bookDest = document.getElementById('book-dest');
    const makeOpts = (scope) =>
      DESTINATIONS.filter((d) => d.scope === scope)
        .map((d) => `<option value="${d.id}">${d.icon} ${esc(d.name)} (${d.code})</option>`)
        .join('');
    bookDest.innerHTML = `
      <optgroup label="Tamil Nadu (TN)">${makeOpts('tn')}</optgroup>
      <optgroup label="India">${makeOpts('india')}</optgroup>
      <optgroup label="Other Countries">${makeOpts('world')}</optgroup>
    `;

    // Default booking origin to Chennai (MAA)
    const originInput = document.getElementById('book-origin');
    if (originInput && originInput.value === 'DEL') originInput.value = 'MAA';

    // Currency selector
    const curSel = document.getElementById('currency-select');
    curSel.value = state.currency;
    curSel.addEventListener('change', (e) => {
      state.currency = e.target.value;
      saveState();
      refreshAllMoney();
      notify(`Prices updated to ${state.currency}`);
    });

    // Google Maps Live GPS Tracking, Exact Pin Calibrator, Search & Map/Satellite/Hybrid Layer Controls
    document.getElementById('gmap-live-btn')?.addEventListener('click', () => {
      if (livePos && livePos.source === 'pinned') {
        liveGpsFollowing = true;
        state.mapCustomQuery = '';
        lastRenderedLivePos = null;
        renderWorldMap(false, true);
      } else {
        startLiveGpsTracking(false, true);
      }
    });

    const calDrawer = document.getElementById('gmap-calibrate-drawer');
    const calInput = document.getElementById('gmap-cal-input');
    const calResults = document.getElementById('gmap-cal-results');

    document.getElementById('map-fix-pin-btn')?.addEventListener('click', () => {
      if (!calDrawer) return;
      calDrawer.hidden = !calDrawer.hidden;
      if (!calDrawer.hidden) {
        if (calResults) calResults.innerHTML = '';
        calInput?.focus();
      }
    });

    document.getElementById('gmap-cal-close')?.addEventListener('click', () => {
      if (calDrawer) calDrawer.hidden = true;
    });

    document.getElementById('gmap-cal-rescan')?.addEventListener('click', () => {
      if (calDrawer) calDrawer.hidden = true;
      notify('📡 Clearing stale cache & scanning fresh high-accuracy GPS...');
      startLiveGpsTracking(false, true);
    });

    document.getElementById('gmap-cal-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const raw = (calInput?.value || '').trim();
      if (!raw) return;

      // 1. Direct lat, lng paste support (e.g. "13.0268, 80.0163" copied from Google Maps)
      const coordMatch = raw.match(/^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/);
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[2]);
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          applyExactPinnedLocation(lat, lng, '');
          return;
        }
      }

      // 2. Geocode exact street / building / college / area via OpenStreetMap Nominatim
      if (calResults) calResults.innerHTML = `<div style="font-size:0.74rem;opacity:0.8;">🔍 Finding exact coordinates for "${esc(raw)}"...</div>`;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=4&q=${encodeURIComponent(raw)}`
        );
        const matches = await res.json();
        if (!Array.isArray(matches) || !matches.length) {
          if (calResults) calResults.innerHTML = `<div style="font-size:0.74rem;color:#fca5a5;">No match found. Try adding your city name (e.g. "Tambaram, Chennai") or paste <code>lat, lng</code>.</div>`;
          return;
        }
        if (matches.length === 1) {
          const m = matches[0];
          const shortName = m.display_name.split(',').slice(0, 3).join(',').trim();
          applyExactPinnedLocation(parseFloat(m.lat), parseFloat(m.lon), shortName);
          return;
        }
        if (calResults) {
          calResults.innerHTML = matches
            .map(
              (m, idx) => `
              <button type="button" class="gmap-cal-item" data-cal-pick="${idx}">
                <span>📍 ${esc(m.display_name.split(',').slice(0, 4).join(','))}</span>
                <span style="color:#38bdf8;font-weight:700;white-space:nowrap;">Pin →</span>
              </button>
            `
            )
            .join('');
          calResults.querySelectorAll('[data-cal-pick]').forEach((b) => {
            b.addEventListener('click', () => {
              const m = matches[Number(b.dataset.calPick)];
              if (m) {
                const shortName = m.display_name.split(',').slice(0, 3).join(',').trim();
                applyExactPinnedLocation(parseFloat(m.lat), parseFloat(m.lon), shortName);
              }
            });
          });
        }
      } catch (_) {
        if (calResults) calResults.innerHTML = `<div style="font-size:0.74rem;color:#fca5a5;">Could not reach location search. Paste exact <code>lat, lng</code> coordinates instead.</div>`;
      }
    });

    document.getElementById('gmap-search-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = document.getElementById('gmap-search-input').value.trim();
      if (!val) return;
      liveGpsFollowing = false;
      state.mapCustomQuery = val;
      renderWorldMap();
      notify(`Loaded "${val}" on Google Maps`);
    });

    document.querySelectorAll('[data-gmap-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.mapMode = btn.dataset.gmapMode;
        lastRenderedLivePos = null;
        renderWorldMap();
      });
    });

    // Living Atmosphere Theme Switcher & Interactive Motion
    initThemeParticles();
    initAmbientCursorAura();
    initClickSparkles();
    document.querySelectorAll('[data-set-theme]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (state.theme === btn.dataset.setTheme) {
          showThemeStageBanner(state.theme);
          return;
        }
        state.theme = btn.dataset.setTheme;
        saveState();
        applyTheme(btn);
      });
    });

    document.getElementById('explore-search')?.addEventListener('input', (e) => {
      state.search = e.target.value;
      renderExplore();
    });

    // Guide Modal Close
    const guideBack = document.getElementById('guide-backdrop');
    document.getElementById('guide-close-btn')?.addEventListener('click', () => guideBack.classList.remove('is-open'));
    guideBack?.addEventListener('click', (e) => {
      if (e.target === guideBack) guideBack.classList.remove('is-open');
    });
    document.addEventListener('keydown', (e) => {
      const cinemaBack = document.getElementById('cinema-backdrop');
      if (cinemaBack && cinemaBack.classList.contains('is-open')) {
        if (e.key === 'Escape') {
          closeCinemaTheater();
          return;
        }
        if (e.key === 'ArrowRight') {
          document.getElementById('cinema-next-btn')?.click();
          return;
        }
        if (e.key === 'ArrowLeft') {
          document.getElementById('cinema-prev-btn')?.click();
          return;
        }
        if (e.key === ' ' || e.code === 'Space') {
          e.preventDefault();
          document.getElementById('cinema-play-toggle')?.click();
          return;
        }
      }
      if (e.key === 'Escape') guideBack?.classList.remove('is-open');
    });

    // Booking Studio tabs & inputs
    document.querySelectorAll('[data-book-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.bookingTab = btn.dataset.bookTab;
        document.querySelectorAll('[data-book-tab]').forEach((b) => b.classList.toggle('is-active', b === btn));
        renderBookingOffers();
      });
    });

    ['book-origin', 'book-dest', 'book-date', 'book-travelers', 'book-cabin'].forEach((id) => {
      document.getElementById(id)?.addEventListener('input', renderBookingOffers);
    });

    // Init Planner (Roadmap + Budget + Packing + Phrasebook/FX)
    plannerApi = initPlanner({
      formatMoney,
      esc,
      notify,
      getCurrencyCode: () => state.currency
    });

    // Init Exclusive Innovations (Trip DNA, Digital Passport, Heatmap, Soundscapes)
    innovationsApi = initInnovations({
      formatMoney,
      esc,
      notify,
      openFullGuide,
      selectRoadmap: (id) => plannerApi?.selectRoadmapDestination(id),
      jumpToBooking
    });

    // Init Power Travel Features (Road-Trip Fuel Calc, Bill Splitter, Polaroid Journal, Clocks)
    extrasApi = initPowerExtras({
      formatMoney,
      esc,
      notify,
      getCurrencySymbol: () => (CURRENCIES[state.currency] || CURRENCIES.INR).symbol,
      getCurrencyRate: () => (CURRENCIES[state.currency] || CURRENCIES.INR).rate
    });

    // Init Signature Weather & Trip Forecast Studio
    window.TerraVoyage.weather = window.TerraVoyage.initWeather?.({
      DESTINATIONS,
      esc,
      notify,
      formatMoney,
      jumpToBooking,
      selectRoadmap: (id) => plannerApi?.selectRoadmapDestination(id),
      openFullGuide
    });

    initTravelPreloaderAndScrollPlane();
    initInteractivePolish();
    initSpotlightCommandPalette();
    renderScopesAndCategories();
    initAutomaticLiveMap();
    renderExplore();
    renderComparator();
    renderBookingOffers();
    renderSavedTrips();
    initScrollReveal();
  });

  function initInteractivePolish() {
    // 1. Lightweight Delegated Cursor Spotlight Illumination (--mx, --my)
    document.addEventListener(
      'pointermove',
      (e) => {
        const card = e.target?.closest?.('.dest-card, .dna-card, .partner-deal-card');
        if (!card) return;
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${(e.clientX - rect.left).toFixed(1)}px`);
        card.style.setProperty('--my', `${(e.clientY - rect.top).toFixed(1)}px`);
      },
      { passive: true }
    );

    // 2. Tactile Click Ripple Burst on Interactive Buttons & Tabs
    document.addEventListener('pointerdown', (e) => {
      const btn = e.target?.closest?.('.btn, .tab-btn, .scope-tab, .month-pill');
      if (!btn || btn.disabled) return;
      const rect = btn.getBoundingClientRect();
      const ink = document.createElement('span');
      ink.className = 'btn-ripple-ink';
      ink.style.left = `${(e.clientX - rect.left).toFixed(1)}px`;
      ink.style.top = `${(e.clientY - rect.top).toFixed(1)}px`;
      btn.appendChild(ink);
      setTimeout(() => ink.remove(), 600);
    });

    // 3. Scroll-Spy Active Top Navbar Link Highlighting
    const navLinks = Array.from(document.querySelectorAll('.nav-links .nav-link[href^="#"]'));
    const sections = navLinks
      .map((a) => ({ link: a, el: document.querySelector(a.getAttribute('href')) }))
      .filter((x) => x.el);

    if ('IntersectionObserver' in window && sections.length) {
      const spy = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const id = `#${entry.target.id}`;
              navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === id));
            }
          });
        },
        { rootMargin: '-28% 0px -56% 0px', threshold: 0.01 }
      );
      sections.forEach((s) => spy.observe(s.el));
    }

    // 4. Floating Back-to-Top Jet FAB
    const topBtn = document.getElementById('back-to-top-btn');
    if (topBtn) {
      let ticking = false;
      const syncFab = () => {
        topBtn.classList.toggle('is-visible', window.scrollY > 420);
        ticking = false;
      };
      window.addEventListener(
        'scroll',
        () => {
          if (!ticking) {
            ticking = true;
            requestAnimationFrame(syncFab);
          }
        },
        { passive: true }
      );
      syncFab();
      topBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  /* ------------------------------------------------------------------------
     6. Universal ⌘K / Ctrl+K Travel Spotlight Command Palette
     ------------------------------------------------------------------------ */
  function initSpotlightCommandPalette() {
    const backdrop = document.getElementById('spotlight-backdrop');
    const input = document.getElementById('spotlight-input');
    const listEl = document.getElementById('spotlight-results');
    const openBtn = document.getElementById('spotlight-open-btn');
    if (!backdrop || !input || !listEl) return;

    let activeItems = [];
    let selectedIdx = 0;

    const allSpotsIndex = DESTINATIONS.flatMap((d) =>
      (d.topPlaces || []).map((p) => ({ spot: p, dest: d }))
    );

    const quickActions = [
      {
        icon: '🌤️',
        title: 'Open Destination Weather & Trip Planner',
        sub: 'Full day weather telemetry & start-to-end trip forecast planner',
        keywords: 'weather sky temperature rain golden hour sunrise sunset forecast trip days',
        run: () => {
          window.TerraVoyage.weather?.openWeatherModal(state.activeMapId || 'ooty-coonoor');
        }
      },
      {
        icon: '🛰️',
        title: 'Jump to Live GPS Map',
                sub: 'Center Google Map on your live location or calibrate pin',
                keywords: 'gps map location pin satellite',
                run: () => {
                  document.getElementById('google-map-stage')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              },
              {
                icon: '✈️',
                title: 'Open Official Booking Studio',
                sub: 'Flights, Stays & Rail/Car animated passes + official partners',
                keywords: 'book flight hotel stay train irctc agoda skyscanner',
                run: () => document.getElementById('book-section')?.scrollIntoView({ behavior: 'smooth' })
              },
              {
                icon: '🗓️',
                title: 'Open Smart Season Matrix',
                sub: '12-Month When-to-Go peak weather heatmap',
                keywords: 'season weather month heatmap matrix',
                run: () => document.getElementById('season-matrix-section')?.scrollIntoView({ behavior: 'smooth' })
              }
            ];

            const themeActions = Object.entries(THEME_META).map(([key, meta]) => ({
              icon: meta.icon,
              title: `Theme: ${meta.title}`,
              sub: meta.sub,
              keywords: `theme atmosphere color dark light ${key} ${meta.title} ${meta.sub}`,
              run: () => {
                const dot = document.querySelector(`[data-set-theme="${key}"]`);
                if (dot) dot.click();
              }
            }));

            function openSpotlight() {
              backdrop.classList.add('is-open');
              input.value = '';
              selectedIdx = 0;
              renderResults('');
              setTimeout(() => input.focus(), 40);
            }

            function closeSpotlight() {
              backdrop.classList.remove('is-open');
            }

            function executeItem(item) {
              if (!item) return;
              closeSpotlight();
              item.run();
            }

            function renderResults(rawQuery) {
              const q = rawQuery.trim().toLowerCase();
              activeItems = [];
              let html = '';

              const addGroup = (label, items) => {
                if (!items.length) return;
                html += `<div class="spotlight-group-label">${label}</div>`;
                items.forEach((item) => {
                  const idx = activeItems.length;
                  activeItems.push(item);
                  const thumbHtml = item.photoId
                    ? `<span class="spotlight-thumb" style="background:${item.gradient || 'var(--bg-subtle)'};"><img data-photo-id="${item.photoId}" ${item.spotQuery ? `data-spot-query="${esc(item.spotQuery)}"` : ''} alt="" /></span>`
                    : `<span class="spotlight-thumb">${item.icon}</span>`;
                  html += `
            <button type="button" class="spotlight-item ${idx === selectedIdx ? 'is-selected' : ''}" data-spot-idx="${idx}" role="option">
              ${thumbHtml}
              <div style="min-width:0;flex:1;">
                <div style="font-weight:700;font-size:0.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(item.title)}</div>
                <div style="font-size:0.74rem;color:var(--ink-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(item.sub)}</div>
              </div>
              <span style="font-family:var(--font-mono);font-size:0.66rem;color:var(--ink-muted);white-space:nowrap;">${esc(item.badge || 'OPEN ↵')}</span>
            </button>
          `;
                });
              };

              if (!q) {
                addGroup('⚡ Quick Actions', quickActions);
                addGroup('🎨 Living Atmosphere Themes', themeActions);
                addGroup(
                  '🌍 Featured Destinations',
                  DESTINATIONS.slice(0, 6).map((d) => ({
                    title: `${d.icon} ${d.name}`,
                    sub: `${d.country} · ${formatMoney(d.dailyUsd)}/day · Best ${d.bestSeason}`,
                    photoId: d.id,
                    gradient: d.gradient,
                    badge: 'GUIDE ↵',
                    run: () => openFullGuide(d.id)
                  }))
                );
              } else {
                const destMatches = DESTINATIONS.filter((d) =>
                  `${d.name} ${d.country} ${d.region} ${d.code} ${d.styles.join(' ')}`.toLowerCase().includes(q)
                )
                  .slice(0, 6)
                  .map((d) => ({
                    title: `${d.icon} ${d.name}`,
                    sub: `${d.country} · ${formatMoney(d.dailyUsd)}/day · ${d.bestSeason}`,
                    photoId: d.id,
                    gradient: d.gradient,
                    badge: '6 SPOTS ↵',
                    run: () => openFullGuide(d.id)
                  }));

                const spotMatches = allSpotsIndex
                  .filter(({ spot, dest }) => `${spot.name} ${spot.note} ${dest.name}`.toLowerCase().includes(q))
                  .slice(0, 6)
                  .map(({ spot, dest }) => ({
                    title: `📍 ${spot.name}`,
                    sub: `${dest.name}, ${dest.country} · ${spot.note}`,
                    photoId: dest.id,
                    spotQuery: spot.name,
                    gradient: dest.gradient,
                    badge: 'MAP ↵',
                    run: () => showSpotOnGoogleMap(spot.name, dest)
                  }));

                const actionMatches = [...quickActions, ...themeActions].filter((a) =>
                  `${a.title} ${a.sub} ${a.keywords}`.toLowerCase().includes(q)
                );

                addGroup('🏙️ Destinations', destMatches);
                addGroup('📍 Tourist Spots', spotMatches);
                addGroup('⚡ Actions & Themes', actionMatches.slice(0, 5));

                if (!activeItems.length) {
                  html = `<div style="padding:28px;text-align:center;color:var(--ink-muted);font-size:0.86rem;">No places, spots, or themes matched "<strong>${esc(rawQuery)}</strong>".</div>`;
                }
              }

              listEl.innerHTML = html;
              window.TerraVoyage.photos?.hydratePhotos(listEl);

              listEl.querySelectorAll('[data-spot-idx]').forEach((btn) => {
                btn.addEventListener('click', () => executeItem(activeItems[Number(btn.dataset.spotIdx)]));
                btn.addEventListener('mouseenter', () => {
                  selectedIdx = Number(btn.dataset.spotIdx);
                  listEl.querySelectorAll('.spotlight-item').forEach((el, i) => el.classList.toggle('is-selected', i === selectedIdx));
                });
              });
            }

            openBtn?.addEventListener('click', openSpotlight);
            backdrop.addEventListener('click', (e) => {
              if (e.target === backdrop) closeSpotlight();
            });

            input.addEventListener('input', () => {
              selectedIdx = 0;
              renderResults(input.value);
            });

            input.addEventListener('keydown', (e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (activeItems.length) {
                  selectedIdx = (selectedIdx + 1) % activeItems.length;
                  listEl.querySelectorAll('.spotlight-item').forEach((el, i) => el.classList.toggle('is-selected', i === selectedIdx));
                  listEl.querySelector('.spotlight-item.is-selected')?.scrollIntoView({ block: 'nearest' });
                }
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (activeItems.length) {
                  selectedIdx = (selectedIdx - 1 + activeItems.length) % activeItems.length;
                  listEl.querySelectorAll('.spotlight-item').forEach((el, i) => el.classList.toggle('is-selected', i === selectedIdx));
                  listEl.querySelector('.spotlight-item.is-selected')?.scrollIntoView({ block: 'nearest' });
                }
              } else if (e.key === 'Enter') {
                e.preventDefault();
                executeItem(activeItems[selectedIdx]);
              } else if (e.key === 'Escape') {
                closeSpotlight();
              }
            });

            // Global ⌘K / Ctrl+K / '/' shortcut
            document.addEventListener('keydown', (e) => {
              const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
              const inField = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '');
              if (isCmdK) {
                e.preventDefault();
                if (backdrop.classList.contains('is-open')) closeSpotlight();
                else openSpotlight();
              } else if (e.key === '/' && !inField && !backdrop.classList.contains('is-open')) {
                e.preventDefault();
                openSpotlight();
              } else if (e.key === 'Escape' && backdrop.classList.contains('is-open')) {
                closeSpotlight();
              }
            });
          }
}) ();
