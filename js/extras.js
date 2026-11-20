/* ==========================================================================
   TERRAVOYAGE — Power Travel Features Suite
   1. Road-Trip Distance, Fuel & Toll Estimator + Google Maps Directions
   2. Group Expense Tracker & "Who Owes Whom" Smart Bill Splitter
   3. Polaroid Travel Memory Journal (Local Photo Upload + Notes)
   4. Live World Clocks, Trip Takeoff Countdown & Global Emergency SOS
   ========================================================================== */

window.TerraVoyage = window.TerraVoyage || {};

window.TerraVoyage.initPowerExtras = function initPowerExtras(helpers) {
  const { DESTINATIONS } = window.TerraVoyage;
  const { esc, notify, formatMoney, getCurrencySymbol, getCurrencyRate } = helpers;

  const SPLIT_KEY = 'terravoyage_split_v3';
  const JOURNAL_KEY = 'terravoyage_journal_v1';
  const COUNTDOWN_KEY = 'terravoyage_countdown_v1';
  let currentRoadTripTotalInr = 0;
  let currentRoadTripData = null;

  function toBase64Utf8(str) {
    try {
      return btoa(String.fromCharCode(...new TextEncoder().encode(str)));
    } catch (_) {
      return btoa(unescape(encodeURIComponent(str)));
    }
  }

  function fromBase64Utf8(b64) {
    try {
      const binary = atob(decodeURIComponent(b64));
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    } catch (_) {
      return decodeURIComponent(escape(atob(decodeURIComponent(b64))));
    }
  }

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  /* ------------------------------------------------------------------------
     1. Road-Trip Distance, Fuel & Toll Estimator (Tamil Nadu & India Only)
     ------------------------------------------------------------------------ */
  function initRoadTripCalc() {
    const originSel = document.getElementById('road-origin');
    const destSel = document.getElementById('road-dest');
    const fuelStateName = document.getElementById('road-fuel-state-name');
    const fuelActiveTag = document.getElementById('road-fuel-active-tag');
    const btnPetrol = document.getElementById('btn-fuel-petrol');
    const btnDiesel = document.getElementById('btn-fuel-diesel');
    const btnEv = document.getElementById('btn-fuel-ev');
    const btnCng = document.getElementById('btn-fuel-cng');
    const petrolVal = document.getElementById('road-petrol-val');
    const dieselVal = document.getElementById('road-diesel-val');
    const evVal = document.getElementById('road-ev-val');
    const cngVal = document.getElementById('road-cng-val');
    const customFuelPriceInput = document.getElementById('road-fuel-custom-price');
    const fuelUnitBadge = document.getElementById('road-fuel-unit-badge');
    const vehicleSel = document.getElementById('road-vehicle');
    const mileageInput = document.getElementById('road-mileage');
    const mileageBadge = document.getElementById('road-mileage-badge');
    const distInput = document.getElementById('road-km');
    const friendsInput = document.getElementById('road-friends');
    const roundTripCb = document.getElementById('road-roundtrip');
    const tollModeSel = document.getElementById('road-toll-mode');
    const tollRateBadge = document.getElementById('road-toll-rate-badge');
    const customTollWrap = document.getElementById('road-custom-toll-wrap');
    const customTollInput = document.getElementById('road-custom-toll');
    const tollTag = document.getElementById('road-toll-tag');
    const breakdownEl = document.getElementById('road-breakdown');
    const outEl = document.getElementById('road-output');
    const gmapsBtn = document.getElementById('road-gmaps-link');

    if (!originSel || !destSel || !outEl) return;

    // Exact, Verified Real-World Fuel Prices for ALL Tamil Nadu and Indian Places (₹)
    const EXACT_PLACE_RATES = {
      // --- TAMIL NADU CITIES & DESTINATIONS ---
      'chennai': { name: 'Chennai', region: 'Tamil Nadu (Capital)', petrol: 100.85, diesel: 92.44, ev: 8.50, cng: 84.50 },
      'coimbatore': { name: 'Coimbatore', region: 'Tamil Nadu (West)', petrol: 101.38, diesel: 92.98, ev: 8.50, cng: 84.50 },
      'coimbatore-adiyogi': { name: 'Coimbatore & Adiyogi', region: 'Tamil Nadu (West)', petrol: 101.38, diesel: 92.98, ev: 8.50, cng: 84.50 },
      'madurai': { name: 'Madurai', region: 'Tamil Nadu (South Central)', petrol: 101.20, diesel: 92.80, ev: 8.50, cng: 84.50 },
      'trichy': { name: 'Tiruchirappalli (Trichy)', region: 'Tamil Nadu (Central)', petrol: 101.05, diesel: 92.65, ev: 8.50, cng: 84.50 },
      'salem': { name: 'Salem', region: 'Tamil Nadu (Steel City)', petrol: 101.00, diesel: 92.60, ev: 8.50, cng: 84.50 },
      'tirunelveli': { name: 'Tirunelveli', region: 'Tamil Nadu (Deep South)', petrol: 101.55, diesel: 93.15, ev: 8.50, cng: 84.50 },
      'ooty-coonoor': { name: 'Ooty & Coonoor', region: 'Nilgiris Hills, TN', petrol: 101.90, diesel: 93.45, ev: 8.50, cng: 84.50 },
      'kodaikanal': { name: 'Kodaikanal', region: 'Dindigul Hills, TN', petrol: 101.75, diesel: 93.30, ev: 8.50, cng: 84.50 },
      'mahabalipuram': { name: 'Mahabalipuram & ECR', region: 'Chengalpattu Coast, TN', petrol: 100.95, diesel: 92.54, ev: 8.50, cng: 84.50 },
      'rameswaram': { name: 'Rameswaram & Dhanushkodi', region: 'Ramanathapuram, TN', petrol: 101.65, diesel: 93.25, ev: 8.50, cng: 84.50 },
      'kanyakumari': { name: 'Kanyakumari', region: 'Tamil Nadu (Cape Comorin)', petrol: 101.85, diesel: 93.42, ev: 8.50, cng: 84.50 },
      'thanjavur-chettinad': { name: 'Thanjavur & Chettinad', region: 'Delta & Sivaganga, TN', petrol: 101.15, diesel: 92.75, ev: 8.50, cng: 84.50 },
      'yercaud-hogenakkal': { name: 'Yercaud & Hogenakkal', region: 'Salem / Dharmapuri, TN', petrol: 101.25, diesel: 92.85, ev: 8.50, cng: 84.50 },
      'pondicherry': { name: 'Pondicherry (Puducherry)', region: 'Puducherry UT (Tax-Saver)', petrol: 96.20, diesel: 86.40, ev: 7.50, cng: 82.00 },
      'valparai-pollachi': { name: 'Valparai & Pollachi', region: 'Anamalai Hills, TN', petrol: 101.48, diesel: 93.08, ev: 8.50, cng: 84.50 },
      'tiruvannamalai-gingee': { name: 'Tiruvannamalai & Gingee', region: 'Tiruvannamalai, TN', petrol: 101.20, diesel: 92.80, ev: 8.50, cng: 84.50 },
      'courtallam-meghamalai': { name: 'Courtallam & Meghamalai', region: 'Tenkasi / Theni, TN', petrol: 101.60, diesel: 93.20, ev: 8.50, cng: 84.50 },
      'kolli-hills-trichy': { name: 'Kolli Hills & Trichy', region: 'Namakkal Ghats, TN', petrol: 101.10, diesel: 92.70, ev: 8.50, cng: 84.50 },

      // --- OTHER INCREDIBLE INDIA DESTINATIONS & HUBS ---
      'bengaluru': { name: 'Bengaluru', region: 'Karnataka (Capital)', petrol: 102.92, diesel: 88.99, ev: 8.00, cng: 82.50 },
      'coorg-hampi': { name: 'Coorg & Hampi', region: 'Karnataka (Hills & Ruins)', petrol: 103.15, diesel: 89.20, ev: 8.00, cng: 82.50 },
      'mysuru-chikmagalur': { name: 'Mysuru & Chikmagalur', region: 'Karnataka (Coffee Hills)', petrol: 103.05, diesel: 89.10, ev: 8.00, cng: 82.50 },
      'kochi': { name: 'Kochi', region: 'Kerala (Coast)', petrol: 105.78, diesel: 94.77, ev: 8.50, cng: 85.00 },
      'kerala-munnar': { name: 'Munnar & Alleppey', region: 'Kerala (High Ranges)', petrol: 105.78, diesel: 94.77, ev: 8.50, cng: 85.00 },
      'goa': { name: 'Goa', region: 'Goa (Panaji / Coastal)', petrol: 96.60, diesel: 88.35, ev: 7.50, cng: 80.00 },
      'hyderabad': { name: 'Hyderabad', region: 'Telangana', petrol: 107.41, diesel: 95.65, ev: 8.50, cng: 88.00 },
      'mumbai': { name: 'Mumbai', region: 'Maharashtra', petrol: 103.44, diesel: 89.97, ev: 9.00, cng: 86.00 },
      'mumbai-lonavala': { name: 'Mumbai & Lonavala', region: 'Maharashtra (Sahyadris)', petrol: 103.44, diesel: 89.97, ev: 9.00, cng: 86.00 },
      'delhi': { name: 'New Delhi (NCR)', region: 'Delhi National Capital', petrol: 94.77, diesel: 87.67, ev: 7.00, cng: 75.09 },
      'agra-delhi': { name: 'Agra & New Delhi', region: 'Delhi / UP Golden Triangle', petrol: 94.77, diesel: 87.67, ev: 7.00, cng: 75.09 },
      'rajasthan-jaipur': { name: 'Jaipur & Udaipur', region: 'Rajasthan (Mewar)', petrol: 104.88, diesel: 90.36, ev: 8.50, cng: 84.00 },
      'ladakh-manali': { name: 'Leh, Ladakh & Manali', region: 'Himachal / Ladakh Trans-Himalayas', petrol: 99.30, diesel: 84.60, ev: 7.50, cng: 81.00 },
      'shimla-kasol': { name: 'Shimla, Kasol & Spiti', region: 'Himachal Pradesh', petrol: 95.80, diesel: 86.50, ev: 7.50, cng: 81.00 },
      'kashmir': { name: 'Kashmir (Srinagar & Gulmarg)', region: 'Jammu & Kashmir Valley', petrol: 99.30, diesel: 84.60, ev: 7.50, cng: 81.00 },
      'varanasi-rishikesh': { name: 'Varanasi & Rishikesh', region: 'UP / Uttarakhand Holy Corridors', petrol: 94.70, diesel: 87.80, ev: 8.00, cng: 79.50 },
      'meghalaya': { name: 'Meghalaya (Shillong & Dawki)', region: 'North-East (Cloud Abode)', petrol: 96.35, diesel: 86.80, ev: 8.00, cng: 84.00 },
      'darjeeling-sikkim': { name: 'Darjeeling & Sikkim', region: 'Eastern Himalayas', petrol: 101.40, diesel: 89.50, ev: 8.00, cng: 84.00 }
    };

    // Major Departure Cities (Tamil Nadu & India Only)
    const ORIGINS = [
      { id: 'Chennai', name: 'Chennai, TN', key: 'chennai', lat: 13.08, lon: 80.27 },
      { id: 'Coimbatore', name: 'Coimbatore, TN', key: 'coimbatore', lat: 11.01, lon: 76.95 },
      { id: 'Madurai', name: 'Madurai, TN', key: 'madurai', lat: 9.92, lon: 78.11 },
      { id: 'Trichy', name: 'Tiruchirappalli (Trichy), TN', key: 'trichy', lat: 10.79, lon: 78.70 },
      { id: 'Salem', name: 'Salem, TN', key: 'salem', lat: 11.66, lon: 78.14 },
      { id: 'Tirunelveli', name: 'Tirunelveli, TN', key: 'tirunelveli', lat: 8.71, lon: 77.75 },
      { id: 'Pondicherry', name: 'Puducherry (UT)', key: 'pondicherry', lat: 11.94, lon: 79.80 },
      { id: 'Bengaluru', name: 'Bengaluru, KA', key: 'bengaluru', lat: 12.97, lon: 77.59 },
      { id: 'Kochi', name: 'Kochi, KL', key: 'kochi', lat: 9.93, lon: 76.26 },
      { id: 'Hyderabad', name: 'Hyderabad, TS', key: 'hyderabad', lat: 17.38, lon: 78.48 },
      { id: 'Mumbai', name: 'Mumbai, MH', key: 'mumbai', lat: 19.07, lon: 72.87 },
      { id: 'Delhi', name: 'New Delhi (NCR)', key: 'delhi', lat: 28.61, lon: 77.20 }
    ];

    // Strictly filter out other countries (No world destinations)
    const roadDests = DESTINATIONS.filter((d) => d.scope === 'tn' || d.scope === 'india');
    const tnDests = roadDests.filter((d) => d.scope === 'tn');
    const inDests = roadDests.filter((d) => d.scope === 'india');

    // Populate Origin dropdown with exact petrol & diesel prices displayed
    originSel.innerHTML = ORIGINS.map((o) => {
      const p = EXACT_PLACE_RATES[o.key] || { petrol: 100.85, diesel: 92.44 };
      return `<option value="${o.id}">${o.name} — Petrol: ₹${p.petrol.toFixed(2)} · Diesel: ₹${p.diesel.toFixed(2)}</option>`;
    }).join('');

    // Populate Destination dropdown with exact petrol & diesel prices displayed
    const makeDestOpt = (d) => {
      const p = EXACT_PLACE_RATES[d.id] || { petrol: 100.85, diesel: 92.44 };
      return `<option value="${d.id}">${d.icon} ${esc(d.name)} — Petrol: ₹${p.petrol.toFixed(2)} · Diesel: ₹${p.diesel.toFixed(2)}</option>`;
    };

    destSel.innerHTML = `
      <optgroup label="🛕 Tamil Nadu (TN) Road Trips">
        ${tnDests.map(makeDestOpt).join('')}
      </optgroup>
      <optgroup label="🇮🇳 Other Incredible India Road Trips">
        ${inDests.map(makeDestOpt).join('')}
      </optgroup>
    `;

    // Populate All Places Exact Fuel Price Table
    const fuelPlacesTbody = document.getElementById('fuel-places-tbody');
    if (fuelPlacesTbody) {
      fuelPlacesTbody.innerHTML = Object.entries(EXACT_PLACE_RATES).map(([key, data]) => `
        <tr data-place-id="${key}">
          <td><strong>${data.name}</strong></td>
          <td><span style="font-size:0.75rem;opacity:0.85;">${data.region}</span></td>
          <td style="font-family:var(--font-mono);font-weight:700;color:var(--terracotta);">₹${data.petrol.toFixed(2)} / L</td>
          <td style="font-family:var(--font-mono);font-weight:700;color:var(--ink-secondary);">₹${data.diesel.toFixed(2)} / L</td>
          <td><button type="button" class="fuel-select-btn" data-place-dest="${key}">Select ➔</button></td>
        </tr>
      `).join('');

      fuelPlacesTbody.querySelectorAll('.fuel-select-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const targetKey = btn.getAttribute('data-place-dest');
          const option = destSel.querySelector(`option[value="${targetKey}"]`);
          if (option) {
            destSel.value = targetKey;
            syncDistanceFromSelection();
          } else {
            const matchOrig = ORIGINS.find((o) => o.key === targetKey);
            if (matchOrig) {
              originSel.value = matchOrig.id;
              syncDistanceFromSelection();
            }
          }
        });
      });
    }

    // Map destination IDs to state fuel price zones
    function getDestStateKey(dest) {
      if (!dest) return 'tn';
      if (dest.scope === 'tn') {
        return dest.id === 'pondicherry' ? 'py' : 'tn';
      }
      const id = String(dest.id || '').toLowerCase();
      if (id.includes('kerala') || id.includes('munnar')) return 'kl';
      if (id.includes('goa')) return 'ga';
      if (id.includes('coorg') || id.includes('mysuru') || id.includes('hampi')) return 'ka';
      if (id.includes('mumbai') || id.includes('lonavala')) return 'mh';
      if (id.includes('jaipur') || id.includes('rajasthan')) return 'rj';
      if (id.includes('ladakh') || id.includes('kashmir') || id.includes('shimla') || id.includes('kasol')) return 'hp';
      if (id.includes('delhi') || id.includes('agra')) return 'dl';
      if (id.includes('varanasi') || id.includes('rishikesh')) return 'up';
      return 'default';
    }

    // Vehicle Configurations with Fuel Defaults & NHAI Toll Rates
    const VEHICLES = {
      car: { label: 'Hatchback / Sedan', defaultFuel: 'petrol', kmpl: 17, tollPer100KmInr: 160, avgKmh: 66, unit: 'km/L', tollLabel: '~₹160 / 100 km' },
      suv: { label: 'SUV / 7-Seater', defaultFuel: 'diesel', kmpl: 12, tollPer100KmInr: 193, avgKmh: 64, unit: 'km/L', tollLabel: '~₹193 / 100 km' },
      bike: { label: 'Bike / Cruiser', defaultFuel: 'petrol', kmpl: 38, tollPer100KmInr: 0, avgKmh: 58, unit: 'km/L', tollLabel: '₹0 (Toll-Free)' },
      ev: { label: 'Electric Vehicle (EV)', defaultFuel: 'ev', kmpl: 8, tollPer100KmInr: 160, avgKmh: 65, unit: 'km/kWh', tollLabel: '~₹160 / 100 km' },
      cng: { label: 'CNG Car', defaultFuel: 'cng', kmpl: 24, tollPer100KmInr: 160, avgKmh: 62, unit: 'km/kg', tollLabel: '~₹160 / 100 km' },
      custom: { label: 'Custom Vehicle', defaultFuel: 'petrol', kmpl: 16, tollPer100KmInr: 160, avgKmh: 65, unit: 'km/L', tollLabel: '~₹160 / 100 km' }
    };

    let activeFuelType = 'petrol';

    function parseLatLon(coordStr) {
      const m = String(coordStr).match(/([\d.]+)°\s*([NS]),\s*([\d.]+)°\s*([EW])/);
      if (!m) return { lat: 11.4, lon: 76.7 };
      return {
        lat: parseFloat(m[1]) * (m[2] === 'S' ? -1 : 1),
        lon: parseFloat(m[3]) * (m[4] === 'W' ? -1 : 1)
      };
    }

    function haversineRoadKm(lat1, lon1, lat2, lon2) {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
      const straight = 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return Math.max(25, Math.round(straight * 1.24)); // highway route curvature factor
    }

    // Fetch the exact place fuel object for currently selected places
    function getSelectedPlacesFuel() {
      const orig = ORIGINS.find((o) => o.id === originSel.value) || ORIGINS[0];
      const dest = roadDests.find((d) => d.id === destSel.value) || roadDests[0];
      const origRates = EXACT_PLACE_RATES[orig.key] || { name: orig.name, region: 'Tamil Nadu', petrol: 100.85, diesel: 92.44, ev: 8.50, cng: 84.50 };
      const destRates = EXACT_PLACE_RATES[dest.id] || origRates;
      return { orig, dest, origRates, destRates };
    }

    // Refresh fuel rate cards and active button price
    function syncFuelRates() {
      const { orig, dest, origRates, destRates } = getSelectedPlacesFuel();
      if (fuelStateName) {
        fuelStateName.textContent = `${orig.name} (Petrol ₹${origRates.petrol.toFixed(2)} · Diesel ₹${origRates.diesel.toFixed(2)}) ➔ ${dest.name} (Petrol ₹${destRates.petrol.toFixed(2)} · Diesel ₹${destRates.diesel.toFixed(2)})`;
      }
      if (petrolVal) petrolVal.textContent = `₹${origRates.petrol.toFixed(2)}/L`;
      if (dieselVal) dieselVal.textContent = `₹${origRates.diesel.toFixed(2)}/L`;
      if (evVal) evVal.textContent = `₹${origRates.ev.toFixed(2)}/kWh`;
      if (cngVal) cngVal.textContent = `₹${origRates.cng.toFixed(2)}/kg`;

      // Set active custom price to match active fuel type in this place
      if (customFuelPriceInput) {
        customFuelPriceInput.value = String(origRates[activeFuelType] || origRates.petrol);
      }
      updateFuelTypeUi();

      if (fuelPlacesTbody) {
        fuelPlacesTbody.querySelectorAll('tr').forEach((tr) => {
          tr.classList.toggle('is-selected', tr.getAttribute('data-place-id') === dest.id);
        });
      }
    }

    function updateFuelTypeUi() {
      const { origRates } = getSelectedPlacesFuel();
      const btns = [
        { el: btnPetrol, type: 'petrol', unit: '₹ / Liter', label: `Petrol ₹${origRates.petrol.toFixed(2)}/L` },
        { el: btnDiesel, type: 'diesel', unit: '₹ / Liter', label: `Diesel ₹${origRates.diesel.toFixed(2)}/L` },
        { el: btnEv, type: 'ev', unit: '₹ / kWh', label: `EV Charging ₹${origRates.ev.toFixed(2)}/kWh` },
        { el: btnCng, type: 'cng', unit: '₹ / kg', label: `CNG ₹${origRates.cng.toFixed(2)}/kg` }
      ];

      btns.forEach((b) => {
        if (b.el) {
          b.el.classList.toggle('is-active', activeFuelType === b.type);
        }
      });

      const current = btns.find((b) => b.type === activeFuelType) || btns[0];
      if (fuelUnitBadge) fuelUnitBadge.textContent = current.unit;
      if (fuelActiveTag) fuelActiveTag.textContent = `Selected: ${current.label}`;
    }

    function setFuelType(type) {
      activeFuelType = type;
      const { origRates } = getSelectedPlacesFuel();
      if (customFuelPriceInput) {
        customFuelPriceInput.value = String(origRates[type] || origRates.petrol);
      }
      updateFuelTypeUi();
      renderRoadTrip();
    }

    [btnPetrol, btnDiesel, btnEv, btnCng].forEach((btn) => {
      if (btn) {
        btn.addEventListener('click', () => {
          setFuelType(btn.getAttribute('data-fuel-type'));
        });
      }
    });

    function syncDistanceFromSelection() {
      const orig = ORIGINS.find((o) => o.id === originSel.value) || ORIGINS[0];
      const dest = roadDests.find((d) => d.id === destSel.value) || roadDests[0];
      const dCoord = parseLatLon(dest.coords);
      distInput.value = String(haversineRoadKm(orig.lat, orig.lon, dCoord.lat, dCoord.lon));
      syncFuelRates();
      renderRoadTrip();
    }

    function onVehicleChange() {
      const v = VEHICLES[vehicleSel.value] || VEHICLES.car;
      activeFuelType = v.defaultFuel || 'petrol';
      if (mileageInput && vehicleSel.value !== 'custom') {
        mileageInput.value = String(v.kmpl);
      }
      if (mileageBadge) {
        mileageBadge.textContent = `${mileageInput ? mileageInput.value : v.kmpl} ${v.unit}`;
      }
      if (tollRateBadge) {
        tollRateBadge.textContent = v.tollLabel;
      }
      if (tollModeSel && vehicleSel.value === 'bike') {
        tollModeSel.value = 'none';
        if (customTollWrap) customTollWrap.style.display = 'none';
      }
      syncFuelRates();
      renderRoadTrip();
    }

    function onTollModeChange() {
      const mode = tollModeSel ? tollModeSel.value : 'auto';
      if (customTollWrap) {
        customTollWrap.style.display = mode === 'custom' ? 'block' : 'none';
      }
      renderRoadTrip();
    }

    // Main Live Computation Engine: Immediately increases or decreases amounts
    function renderRoadTrip() {
      const { orig, dest, origRates, destRates } = getSelectedPlacesFuel();
      const v = VEHICLES[vehicleSel.value] || VEHICLES.car;
      const oneWayKm = Math.max(5, Number(distInput.value) || 200);
      const isRoundTrip = roundTripCb ? roundTripCb.checked : true;
      const totalKm = isRoundTrip ? oneWayKm * 2 : oneWayKm;
      const friends = Math.max(1, Number(friendsInput.value) || 1);

      // 1. Live Mileage from manual input
      const userMileage = Math.max(0.1, parseFloat(mileageInput ? mileageInput.value : v.kmpl) || v.kmpl);
      if (mileageBadge) {
        mileageBadge.textContent = `${userMileage} ${v.unit}`;
      }

      // 2. Exact Fuel Price per Liter / Unit in INR
      const defaultPrice = origRates[activeFuelType] || origRates.petrol;
      const fuelPriceInr = Math.max(0.1, parseFloat(customFuelPriceInput ? customFuelPriceInput.value : defaultPrice) || defaultPrice);

      // Fuel Volume (Liters, kWh, or kg)
      const fuelVolume = totalKm / userMileage;
      const fuelCostInr = fuelVolume * fuelPriceInr;

      // 3. Toll Calculation (NHAI FASTag Highway distance math vs Custom vs None)
      const tollMode = tollModeSel ? tollModeSel.value : 'auto';
      let tollInr = 0;
      let tollSummary = '';

      if (tollMode === 'none' || v.tollPer100KmInr === 0) {
        tollInr = 0;
        tollSummary = v.tollPer100KmInr === 0 ? 'Two-Wheelers: ₹0 Toll on National Highways' : 'No Tolls route selected (₹0)';
      } else if (tollMode === 'custom') {
        tollInr = customTollInput ? Math.max(0, parseFloat(customTollInput.value) || 0) : 0;
        tollSummary = `Custom user toll: ₹${Math.round(tollInr).toLocaleString('en-IN')}`;
      } else {
        // Auto Distance-Based NHAI calculation: (totalKm / 100) * tollPer100Km
        tollInr = Math.round((totalKm / 100) * v.tollPer100KmInr);
        tollSummary = `FASTag (~₹${tollInr.toLocaleString('en-IN')} for ${totalKm} km @ ${v.tollLabel})`;
      }

      if (tollTag) {
        tollTag.textContent = tollSummary;
      }

      // 4. Totals and Split Math
      const totalTripInr = fuelCostInr + tollInr;
      currentRoadTripTotalInr = totalTripInr;
      currentRoadTripData = {
        origin: originSel?.value || 'Origin',
        destination: destSel?.value || 'Destination',
        oneWayKm: oneWayKm,
        totalKm: totalKm,
        isRoundTrip: isRoundTrip,
        fuelType: activeFuelType,
        fuelCostInr: Math.round(fuelCostInr),
        tollCostInr: Math.round(tollInr),
        totalInr: Math.round(totalTripInr),
        vehicle: v.name
      };
      const syncRoadTripTag = document.getElementById('sync-roadtrip-cost-tag');
      if (syncRoadTripTag) {
        syncRoadTripTag.textContent = `₹${Math.round(totalTripInr).toLocaleString('en-IN')}`;
      }
      const perFriendInr = totalTripInr / friends;

      // Currency conversion support (USD internally, rendered via formatMoney or direct INR)
      const inrRate = 84;
      const fuelUsd = fuelCostInr / inrRate;
      const tollUsd = tollInr / inrRate;
      const totalUsd = totalTripInr / inrRate;
      const perFriendUsd = perFriendInr / inrRate;

      // Drive time estimate
      const driveHrs = oneWayKm / v.avgKmh;
      const hrs = Math.floor(driveHrs);
      const mins = Math.round((driveHrs - hrs) * 60);

      const fuelUnitLabel = activeFuelType === 'ev' ? 'kWh' : activeFuelType === 'cng' ? 'kg' : 'Liters';

      outEl.innerHTML = `
        <div class="road-stat-box"><span>Total Road Distance</span><strong>${totalKm.toLocaleString('en-IN')} km ${isRoundTrip ? '(Round Trip)' : '(One-Way)'}</strong></div>
        <div class="road-stat-box"><span>One-Way Drive Time</span><strong>${hrs}h ${mins}m</strong></div>
        <div class="road-stat-box"><span>Fuel: ${fuelVolume.toFixed(1)} ${fuelUnitLabel} (@ ₹${fuelPriceInr.toFixed(2)})</span><strong>${formatMoney(fuelUsd)}</strong></div>
        <div class="road-stat-box"><span>Highway FASTag Tolls</span><strong>${formatMoney(tollUsd)}</strong></div>
        <div class="road-stat-box"><span>Total Trip Cost</span><strong>${formatMoney(totalUsd)}</strong></div>
        <div class="road-stat-box is-accent"><span>Per Person Share (÷${friends})</span><strong>${formatMoney(perFriendUsd)}</strong></div>
      `;

      if (breakdownEl) {
        breakdownEl.innerHTML = `
          <div style="display:flex;flex-direction:column;gap:5px;">
            <div><strong>⛽ Exact Fuel Math:</strong> ${totalKm} km ÷ <strong>${userMileage} ${v.unit}</strong> = <strong>${fuelVolume.toFixed(1)} ${fuelUnitLabel}</strong> × <strong>₹${fuelPriceInr.toFixed(2)}/${activeFuelType === 'ev' ? 'kWh' : activeFuelType === 'cng' ? 'kg' : 'L'}</strong> (${activeFuelType.toUpperCase()} in ${orig.name}) = <strong>₹${Math.round(fuelCostInr).toLocaleString('en-IN')}</strong> (${formatMoney(fuelUsd)})</div>
            <div><strong>🛣️ Highway Toll Math:</strong> ${tollMode === 'auto' ? `Distance proportional: (${totalKm} km ÷ 100) × ${v.tollLabel} = <strong>₹${Math.round(tollInr).toLocaleString('en-IN')}</strong> (${formatMoney(tollUsd)})` : `${tollSummary} = <strong>₹${Math.round(tollInr).toLocaleString('en-IN')}</strong> (${formatMoney(tollUsd)})`}</div>
            <div><strong>👥 Group Settlement:</strong> ₹${Math.round(totalTripInr).toLocaleString('en-IN')} total ÷ ${friends} friends = <strong>₹${Math.round(perFriendInr).toLocaleString('en-IN')} per person</strong></div>
            <div style="font-size:0.75rem;opacity:0.85;margin-top:2px;">📍 <em>Route Comparison:</em> ${orig.name} Petrol ₹${origRates.petrol.toFixed(2)}/L · Diesel ₹${origRates.diesel.toFixed(2)}/L ➔ ${dest.name} Petrol ₹${destRates.petrol.toFixed(2)}/L · Diesel ₹${destRates.diesel.toFixed(2)}/L</div>
          </div>
        `;
      }

      gmapsBtn.href = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(orig.name)}&destination=${encodeURIComponent(dest.name + ', India')}&travelmode=driving`;
    }

    // Attach immediate real-time listeners for instant recalculations
    originSel.addEventListener('change', syncDistanceFromSelection);
    destSel.addEventListener('change', syncDistanceFromSelection);
    vehicleSel.addEventListener('change', onVehicleChange);

    if (customFuelPriceInput) {
      customFuelPriceInput.addEventListener('input', renderRoadTrip);
      customFuelPriceInput.addEventListener('change', renderRoadTrip);
    }

    if (mileageInput) {
      mileageInput.addEventListener('input', renderRoadTrip);
      mileageInput.addEventListener('change', renderRoadTrip);
    }

    if (distInput) {
      distInput.addEventListener('input', renderRoadTrip);
      distInput.addEventListener('change', renderRoadTrip);
    }

    if (friendsInput) {
      friendsInput.addEventListener('input', renderRoadTrip);
      friendsInput.addEventListener('change', renderRoadTrip);
    }

    if (roundTripCb) {
      roundTripCb.addEventListener('change', renderRoadTrip);
    }

    if (tollModeSel) {
      tollModeSel.addEventListener('change', onTollModeChange);
    }

    if (customTollInput) {
      customTollInput.addEventListener('input', renderRoadTrip);
      customTollInput.addEventListener('change', renderRoadTrip);
    }

    // Smooth navigation and highlight when clicking from top nav
    document.querySelectorAll('a[href="#power-tools-section"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const sec = document.getElementById('power-tools-section');
        if (sec) {
          e.preventDefault();
          sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
          sec.classList.remove('is-spotlight-active');
          void sec.offsetWidth; // trigger reflow
          sec.classList.add('is-spotlight-active');
          setTimeout(() => sec.classList.remove('is-spotlight-active'), 2500);
        }
      });
    });

    syncDistanceFromSelection();
    return renderRoadTrip;
  }

  /* ------------------------------------------------------------------------
     2. Group Expense Tracker & "Who Owes Whom" Smart Bill Splitter
     ------------------------------------------------------------------------ */
  function initBillSplitter() {
    const SPLIT_STORAGE_KEY = 'terravoyage_split_v4';
    const defaultData = {
      members: [],
      expenses: []
    };

    let splitState = loadJson(SPLIT_STORAGE_KEY, defaultData);
    if (!Array.isArray(splitState.members)) splitState.members = [];
    if (!Array.isArray(splitState.expenses)) splitState.expenses = [];

    const memberChips = document.getElementById('split-members-chips');
    const memberCountBadge = document.getElementById('split-member-count');
    const memberInput = document.getElementById('split-member-input');
    const memberForm = document.getElementById('split-member-form');
    const paidBySel = document.getElementById('split-paid-by');
    const expForm = document.getElementById('split-expense-form');
    const expTitleInput = document.getElementById('split-exp-title');
    const expAmtInput = document.getElementById('split-exp-amt');
    const expListEl = document.getElementById('split-expense-list');
    const settleEl = document.getElementById('split-settlements');
    const balancesEl = document.getElementById('split-balances-container');
    const totalBadge = document.getElementById('split-total-badge');
    const curSym = document.getElementById('split-cur-symbol');
    const resetBtn = document.getElementById('btn-split-reset');
    const syncRoadTripBtn = document.getElementById('btn-sync-roadtrip-fuel');
    const participantsWrap = document.getElementById('split-participants-wrap');
    const participantsList = document.getElementById('split-participants-list');
    const toggleAllParticipantsBtn = document.getElementById('btn-toggle-all-participants');
    const quickTags = document.querySelectorAll('.tag-quick-fill');

    if (!memberChips || !paidBySel) return;

    function saveSplit() {
      try {
        localStorage.setItem(SPLIT_STORAGE_KEY, JSON.stringify(splitState));
      } catch (_) {}
    }

    // Mathematical Net Balance & Settlement Engine
    function computeBalances() {
      const members = splitState.members;
      const bal = {};
      members.forEach((m) => { bal[m] = 0; });

      splitState.expenses.forEach((e) => {
        const amt = Number(e.amountUsd) || 0;
        if (amt <= 0) return;

        // Credit the payer
        if (bal[e.paidBy] !== undefined) {
          bal[e.paidBy] += amt;
        }

        // Determine who shares this expense
        let targets = Array.isArray(e.participants) && e.participants.length
          ? e.participants.filter((p) => members.includes(p))
          : [...members];

        if (targets.length === 0) targets = [...members];

        if (targets.length > 0) {
          const share = amt / targets.length;
          targets.forEach((p) => {
            if (bal[p] !== undefined) {
              bal[p] -= share;
            }
          });
        }
      });

      return bal;
    }

    function computeSettlements(bal) {
      const debtors = [];
      const creditors = [];

      Object.entries(bal).forEach(([name, amount]) => {
        if (amount < -0.01) {
          debtors.push({ name, amt: -amount });
        } else if (amount > 0.01) {
          creditors.push({ name, amt: amount });
        }
      });

      // Sort descending to optimize minimal transactions
      debtors.sort((a, b) => b.amt - a.amt);
      creditors.sort((a, b) => b.amt - a.amt);

      const transfers = [];
      let i = 0;
      let j = 0;

      while (i < debtors.length && j < creditors.length) {
        const pay = Math.min(debtors[i].amt, creditors[j].amt);
        if (pay > 0.01) {
          transfers.push({ from: debtors[i].name, to: creditors[j].name, usd: pay });
        }
        debtors[i].amt -= pay;
        creditors[j].amt -= pay;

        if (debtors[i].amt < 0.01) i += 1;
        if (creditors[j].amt < 0.01) j += 1;
      }

      return transfers;
    }

    function renderParticipantsCheckboxes() {
      if (!participantsWrap || !participantsList) return;
      if (splitState.members.length > 1) {
        participantsWrap.style.display = 'block';
        participantsList.innerHTML = splitState.members
          .map(
            (m) => `
          <label class="split-checkbox-label">
            <input type="checkbox" name="split_participant" value="${esc(m)}" checked />
            <span>${esc(m)}</span>
          </label>
        `
          )
          .join('');
      } else {
        participantsWrap.style.display = 'none';
        participantsList.innerHTML = '';
      }
    }

    function renderSplit() {
      const members = splitState.members;

      // 1. Render Member Count Badge
      if (memberCountBadge) {
        memberCountBadge.textContent = `${members.length} Friend${members.length === 1 ? '' : 's'}`;
      }

      // 2. Render Member Chips with UNCONDITIONAL ✕ Button
      if (members.length === 0) {
        memberChips.innerHTML = `<span style="font-size:0.75rem;color:var(--ink-muted);font-style:italic;">No friends added yet. Type a friend's name above to start!</span>`;
      } else {
        memberChips.innerHTML = members
          .map(
            (m) => `
          <span class="member-chip">
            <span class="chip-name">${esc(m)}</span>
            <button type="button" class="chip-cross-btn" data-rm-member="${esc(m)}" title="Remove ${esc(m)}" aria-label="Remove ${esc(m)}">✕</button>
          </span>
        `
          )
          .join('');
      }

      // Attach Remove Listeners to ✕ buttons
      memberChips.querySelectorAll('[data-rm-member]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const name = btn.dataset.rmMember;
          splitState.members = splitState.members.filter((x) => x !== name);
          // Remove expenses paid by this person, or update participants
          splitState.expenses = splitState.expenses.filter((e) => e.paidBy !== name);
          splitState.expenses.forEach((e) => {
            if (Array.isArray(e.participants)) {
              e.participants = e.participants.filter((p) => p !== name);
            }
          });
          // Remove any expenses that have zero participants left
          splitState.expenses = splitState.expenses.filter(
            (e) => !Array.isArray(e.participants) || e.participants.length > 0
          );
          saveSplit();
          renderSplit();
          renderParticipantsCheckboxes();
          notify(`Removed "${name}" from trip group`);
        });
      });

      // 3. Render "Paid by" dropdown
      if (members.length === 0) {
        paidBySel.innerHTML = `<option value="">(Add friends first)</option>`;
        paidBySel.disabled = true;
      } else {
        paidBySel.disabled = false;
        const currentVal = paidBySel.value;
        paidBySel.innerHTML = members
          .map((m) => `<option value="${esc(m)}">${esc(m)}</option>`)
          .join('');
        if (members.includes(currentVal)) {
          paidBySel.value = currentVal;
        }
      }

      // 4. Update Currency Symbol
      if (curSym) {
        curSym.textContent = getCurrencySymbol();
      }

      // 5. Total Expenses Badge
      const totalUsd = splitState.expenses.reduce((s, e) => s + (Number(e.amountUsd) || 0), 0);
      if (totalBadge) {
        totalBadge.textContent = `Total: ${formatMoney(totalUsd)}`;
      }

      // 6. Compute Balances and Settlements
      const bal = computeBalances();
      const transfers = computeSettlements(bal);

      // 7. Render Net Balances Grid
      if (balancesEl) {
        if (members.length > 0 && splitState.expenses.length > 0) {
          balancesEl.innerHTML = `
            <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:var(--ink-secondary);margin-bottom:6px;">
              📊 Net Member Balances:
            </div>
            <div class="balance-grid">
              ${members
                .map((m) => {
                  const b = bal[m] || 0;
                  const isCreditor = b > 0.01;
                  const isDebtor = b < -0.01;
                  const cls = isCreditor ? 'is-creditor' : isDebtor ? 'is-debtor' : '';
                  const label = isCreditor
                    ? `gets back +${formatMoney(b)}`
                    : isDebtor
                    ? `owes ${formatMoney(Math.abs(b))}`
                    : `settled`;
                  return `
                    <div class="balance-card ${cls}">
                      <div class="b-name">${esc(m)}</div>
                      <div class="b-amt">${label}</div>
                    </div>
                  `;
                })
                .join('')}
            </div>
          `;
        } else {
          balancesEl.innerHTML = '';
        }
      }

      // 8. Render Expense List
      if (expListEl) {
        expListEl.innerHTML = splitState.expenses.length
          ? splitState.expenses
              .map((e, idx) => {
                const participantsText =
                  Array.isArray(e.participants) && e.participants.length && e.participants.length < members.length
                    ? ` · Split with: ${e.participants.map(esc).join(', ')}`
                    : members.length > 1
                    ? ` · Split with all (${members.length})`
                    : '';
                return `
              <div class="split-row">
                <div style="min-width:0;flex:1;">
                  <strong style="font-size:0.84rem;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(e.title)}</strong>
                  <span style="display:block;font-size:0.72rem;color:var(--ink-muted);">
                    Paid by <strong>${esc(e.paidBy)}</strong>${participantsText}
                  </span>
                </div>
                <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                  <strong style="font-family:var(--font-mono);color:var(--terracotta);font-size:0.85rem;">${formatMoney(e.amountUsd)}</strong>
                  <button type="button" class="mini-btn" data-del-exp="${idx}" aria-label="Delete expense" title="Delete expense">✕</button>
                </div>
              </div>
            `;
              })
              .join('')
          : `<div style="font-size:0.82rem;color:var(--ink-muted);text-align:center;padding:12px;background:var(--bg-subtle);border-radius:var(--radius-xs);">No expenses logged yet. Add your first group expense above!</div>`;

        expListEl.querySelectorAll('[data-del-exp]').forEach((btn) => {
          btn.addEventListener('click', () => {
            const idx = Number(btn.dataset.delExp);
            const deleted = splitState.expenses.splice(idx, 1);
            saveSplit();
            renderSplit();
            if (deleted.length) notify(`Deleted "${deleted[0].title}"`);
          });
        });
      }

      // 9. Render Settlement Pills
      if (settleEl) {
        if (members.length < 2 || splitState.expenses.length === 0) {
          settleEl.innerHTML = `<div class="settle-pill">✅ Everyone is completely settled up!</div>`;
        } else if (transfers.length === 0) {
          settleEl.innerHTML = `<div class="settle-pill">✅ All shared costs are completely balanced! No pending dues.</div>`;
        } else {
          settleEl.innerHTML = transfers
            .map(
              (t) => `
            <div class="settle-pill">
              💸 <strong>${esc(t.from)}</strong> pays <strong>${esc(t.to)}</strong>
              <span style="margin-left:auto;font-family:var(--font-mono);font-weight:800;color:var(--terracotta);">${formatMoney(t.usd)}</span>
            </div>
          `
            )
            .join('');
        }
      }
    }

    // Event: Add Friend
    memberForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = (memberInput?.value || '').trim();
      if (!name) return;
      if (splitState.members.some((m) => m.toLowerCase() === name.toLowerCase())) {
        notify(`"${name}" is already in the trip group!`);
        return;
      }
      splitState.members.push(name);
      if (memberInput) {
        memberInput.value = '';
        memberInput.focus();
      }
      saveSplit();
      renderSplit();
      renderParticipantsCheckboxes();
      notify(`Added "${name}" to trip group`);
    });

    // Event: Quick Fill Category Tags
    quickTags.forEach((btn) => {
      btn.addEventListener('click', () => {
        const title = btn.dataset.title;
        if (expTitleInput) {
          expTitleInput.value = title;
        }
        if (expAmtInput) {
          expAmtInput.focus();
        }
      });
    });

    // Event: 1-Click Sync Road-Trip Fuel & Toll Expense
    if (syncRoadTripBtn) {
      syncRoadTripBtn.addEventListener('click', () => {
        if (splitState.members.length === 0) {
          notify('Please add at least one friend first!');
          if (memberInput) memberInput.focus();
          return;
        }
        if (!currentRoadTripTotalInr || currentRoadTripTotalInr <= 0) {
          notify('Road trip cost is ₹0. Please check distance in the calculator.');
          return;
        }
        if (expTitleInput) {
          expTitleInput.value = '🚗 Road-Trip Fuel & Tolls';
        }
        if (expAmtInput) {
          const amtInActiveCurrency = Math.round((currentRoadTripTotalInr / 84) * getCurrencyRate());
          expAmtInput.value = amtInActiveCurrency;
          expAmtInput.focus();
        }
        notify(`Copied fuel & toll expense! Tap "+ Add Expense" to log.`);
      });
    }

    // Event: Toggle All Participants
    if (toggleAllParticipantsBtn) {
      toggleAllParticipantsBtn.addEventListener('click', () => {
        const cbs = participantsList.querySelectorAll('input[name="split_participant"]');
        const anyUnchecked = Array.from(cbs).some((cb) => !cb.checked);
        cbs.forEach((cb) => { cb.checked = anyUnchecked; });
        toggleAllParticipantsBtn.textContent = anyUnchecked ? 'Deselect All' : 'Select All';
      });
    }

    // Event: Reset All Expenses & Friends
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (splitState.members.length === 0 && splitState.expenses.length === 0) {
          notify('Group bill splitter is already empty!');
          return;
        }
        splitState = { members: [], expenses: [] };
        try {
          localStorage.removeItem(SPLIT_STORAGE_KEY);
          localStorage.removeItem('terravoyage_split_v3');
          localStorage.removeItem('terravoyage_split_v2');
          localStorage.removeItem('terravoyage_split_v1');
        } catch (_) {}
        saveSplit();
        renderSplit();
        renderParticipantsCheckboxes();
        notify('Reset bill splitter to fresh empty state');
      });
    }

    // Event: Add Expense
    expForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (splitState.members.length === 0) {
        notify('Please add at least one trip friend first!');
        if (memberInput) memberInput.focus();
        return;
      }
      const title = (expTitleInput?.value || '').trim();
      const paidBy = paidBySel.value;
      const rawAmt = parseFloat(expAmtInput?.value);

      if (!title) {
        notify('Please enter an expense description');
        return;
      }
      if (!(rawAmt > 0)) {
        notify('Please enter a valid amount');
        return;
      }

      // Collect participants
      let participants = [];
      if (splitState.members.length > 1 && participantsList) {
        const checked = Array.from(
          participantsList.querySelectorAll('input[name="split_participant"]:checked')
        ).map((cb) => cb.value);

        if (checked.length === 0) {
          notify('Please select at least one person to split this expense with!');
          return;
        }
        participants = checked;
      } else {
        participants = [...splitState.members];
      }

      // Convert active currency to USD base
      const usd = rawAmt / getCurrencyRate();
      splitState.expenses.unshift({
        id: Date.now(),
        title,
        paidBy,
        amountUsd: usd,
        participants
      });

      if (expTitleInput) expTitleInput.value = '';
      if (expAmtInput) expAmtInput.value = '';

      saveSplit();
      renderSplit();
      notify(`Logged "${title}" (${formatMoney(usd)})`);
    });

    renderSplit();
    renderParticipantsCheckboxes();

    // ------------------------------------------------------------------------
    // ZERO-COST SMART SHARING, WHATSAPP & PDF EXPORT ENGINE
    // ------------------------------------------------------------------------

    // 1. Shareable Link Generator (Encodes complete trip & bill state into URL)
    const btnShareLink = document.getElementById('btn-split-share-link');
    if (btnShareLink) {
      btnShareLink.addEventListener('click', () => {
        if (splitState.members.length === 0 && splitState.expenses.length === 0) {
          notify('Add your trip friends and expenses first to generate a share link!');
          return;
        }

        const payload = {
          v: 1,
          members: splitState.members,
          expenses: splitState.expenses,
          roadTrip: currentRoadTripData,
          t: Date.now()
        };

        const b64 = toBase64Utf8(JSON.stringify(payload));
        const shareUrl = `${window.location.origin}${window.location.pathname}?split=${encodeURIComponent(b64)}#road-trip-section`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(shareUrl).then(() => {
            notify('🔗 Share link copied to clipboard! Anyone opening it will see this exact trip.');
          }).catch(() => {
            prompt('Copy your shareable trip link:', shareUrl);
          });
        } else {
          prompt('Copy your shareable trip link:', shareUrl);
        }
      });
    }

    // 2. WhatsApp Group Settlement Generator
    const btnWhatsApp = document.getElementById('btn-split-whatsapp');
    if (btnWhatsApp) {
      btnWhatsApp.addEventListener('click', () => {
        if (splitState.members.length === 0 && splitState.expenses.length === 0) {
          notify('Add trip friends and expenses first to share on WhatsApp!');
          return;
        }

        const totalUsd = splitState.expenses.reduce((s, e) => s + (Number(e.amountUsd) || 0), 0);
        const bal = computeBalances();
        const settlements = computeSettlements(bal);

        // Build share link for the message
        const payload = {
          v: 1,
          members: splitState.members,
          expenses: splitState.expenses,
          roadTrip: currentRoadTripData,
          t: Date.now()
        };
        const b64 = toBase64Utf8(JSON.stringify(payload));
        const shareUrl = `${window.location.origin}${window.location.pathname}?split=${encodeURIComponent(b64)}#road-trip-section`;

        const lines = [
          '🚗 *Miravoya · Road Trip & Group Bill Split*',
          ''
        ];

        if (currentRoadTripData && currentRoadTripData.origin && currentRoadTripData.destination) {
          lines.push(`📍 *Route:* ${currentRoadTripData.origin} ➔ ${currentRoadTripData.destination} (${currentRoadTripData.distanceKm || currentRoadTripData.oneWayKm} km)`);
          if (currentRoadTripData.totalInr) {
            lines.push(`⛽ *Est. Fuel & Toll:* ₹${currentRoadTripData.totalInr.toLocaleString('en-IN')}`);
          }
          lines.push('');
        }

        lines.push(`💰 *Total Expenses Logged:* ${formatMoney(totalUsd)}`);
        lines.push(`👥 *Trip Friends (${splitState.members.length}):* ${splitState.members.join(', ')}`);
        lines.push('');

        if (splitState.expenses.length > 0) {
          lines.push('📋 *Recent Expenses:*');
          splitState.expenses.slice(0, 8).forEach((e) => {
            lines.push(`• ${e.title}: ${formatMoney(e.amountUsd)} (Paid by ${e.paidBy})`);
          });
          if (splitState.expenses.length > 8) {
            lines.push(`  ...and ${splitState.expenses.length - 8} more`);
          }
          lines.push('');
        }

        if (settlements.length > 0) {
          lines.push('🤝 *Final Settlement (Who Owes Whom):*');
          settlements.forEach((s) => {
            lines.push(`✅ ${s.from} pays ${s.to} ${formatMoney(s.usd)}`);
          });
        } else if (splitState.members.length > 1) {
          lines.push('✅ *Everyone is completely settled up!*');
        }
        lines.push('');
        lines.push('🔗 *View & Edit this Trip Live:*');
        lines.push(shareUrl);

        const waText = encodeURIComponent(lines.join('\n'));
        window.open(`https://api.whatsapp.com/send?text=${waText}`, '_blank');
        notify('Opening WhatsApp with trip summary...');
      });
    }

    // 3. Print / PDF Statement Generator
    const btnExportPdf = document.getElementById('btn-split-export-pdf');
    if (btnExportPdf) {
      btnExportPdf.addEventListener('click', () => {
        if (splitState.members.length === 0 && splitState.expenses.length === 0) {
          notify('Add your trip friends and expenses first to export a statement!');
          return;
        }

        const printContainer = document.getElementById('print-statement-container');
        if (!printContainer) return;

        const totalUsd = splitState.expenses.reduce((s, e) => s + (Number(e.amountUsd) || 0), 0);
        const bal = computeBalances();
        const settlements = computeSettlements(bal);
        const perPersonUsd = splitState.members.length > 0 ? totalUsd / splitState.members.length : 0;
        const curSymbol = getCurrencySymbol();
        const dateStr = new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        const paidMap = {};
        splitState.members.forEach((m) => { paidMap[m] = 0; });
        splitState.expenses.forEach((e) => {
          if (paidMap[e.paidBy] !== undefined) {
            paidMap[e.paidBy] += (Number(e.amountUsd) || 0);
          }
        });

        let roadTripHtml = '';
        if (currentRoadTripData && currentRoadTripData.origin && currentRoadTripData.destination) {
          roadTripHtml = `
            <div style="background:#f8fafc;padding:12px 16px;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:16px;">
              <div style="font-weight:700;color:#0e7490;font-size:13px;text-transform:uppercase;margin-bottom:4px;">🚗 Road-Trip Route Telemetry</div>
              <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;font-size:12px;">
                <span><strong>Route:</strong> ${esc(currentRoadTripData.origin)} ➔ ${esc(currentRoadTripData.destination)}</span>
                <span><strong>Distance:</strong> ${(currentRoadTripData.distanceKm || currentRoadTripData.oneWayKm)} km</span>
                <span><strong>Est. Fuel & Tolls:</strong> ₹${(currentRoadTripData.totalInr || 0).toLocaleString('en-IN')}</span>
                <span><strong>Vehicle:</strong> ${esc(currentRoadTripData.vehicle || 'Standard Car')}</span>
              </div>
            </div>
          `;
        }

        const settlementsHtml = settlements.length
          ? settlements.map((s) => `
              <div style="padding:8px 12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;font-size:13px;">
                <span><strong style="color:#15803d;">[ ] Pay:</strong> <strong>${esc(s.from)}</strong> pays <strong>${esc(s.to)}</strong></span>
                <span style="font-weight:800;font-family:monospace;color:#166534;">${formatMoney(s.usd)}</span>
              </div>
            `).join('')
          : `<div style="padding:10px;background:#f0fdf4;color:#166534;border-radius:6px;font-size:13px;">✓ Everyone is completely settled up! No transfers needed.</div>`;

        const balancesHtml = splitState.members.map((m) => {
          const net = bal[m] || 0;
          const paid = paidMap[m] || 0;
          const share = paid - net;
          const isCreditor = net > 0.01;
          const isDebtor = net < -0.01;
          const statusColor = isCreditor ? '#15803d' : isDebtor ? '#b91c1c' : '#64748b';
          const statusText = isCreditor ? `Gets Back +${formatMoney(net)}` : isDebtor ? `Owes -${formatMoney(Math.abs(net))}` : 'Settled (₹0)';
          return `
            <tr style="border-bottom:1px solid #e2e8f0;font-size:12px;">
              <td style="padding:8px;font-weight:600;">${esc(m)}</td>
              <td style="padding:8px;text-align:right;">${formatMoney(paid)}</td>
              <td style="padding:8px;text-align:right;">${formatMoney(share)}</td>
              <td style="padding:8px;text-align:right;font-weight:700;color:${statusColor};">${statusText}</td>
            </tr>
          `;
        }).join('');

        const expensesHtml = splitState.expenses.map((e, idx) => {
          const participantsStr = Array.isArray(e.participants) && e.participants.length && e.participants.length < splitState.members.length
            ? e.participants.join(', ')
            : 'All Members';
          return `
            <tr style="border-bottom:1px solid #e2e8f0;font-size:12px;">
              <td style="padding:8px;color:#64748b;">${idx + 1}</td>
              <td style="padding:8px;font-weight:600;">${esc(e.title)}</td>
              <td style="padding:8px;">${esc(e.paidBy)}</td>
              <td style="padding:8px;color:#64748b;font-size:11px;">${esc(participantsStr)}</td>
              <td style="padding:8px;text-align:right;font-weight:700;">${formatMoney(e.amountUsd)}</td>
            </tr>
          `;
        }).join('');

        printContainer.innerHTML = `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;max-width:850px;margin:0 auto;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0e7490;padding-bottom:12px;margin-bottom:16px;">
              <div>
                <h1 style="font-size:24px;margin:0;color:#0e7490;letter-spacing:-0.02em;">Miravoya Global Travel Studio</h1>
                <p style="font-size:13px;color:#475569;margin:4px 0 0;">Official Trip Expense &amp; Group Settlement Audit</p>
              </div>
              <div style="text-align:right;font-size:12px;color:#64748b;">
                <div><strong>Statement Date:</strong> ${dateStr}</div>
                <div><strong>Currency:</strong> ${curSymbol}</div>
              </div>
            </div>

            ${roadTripHtml}

            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px;">
              <div style="background:#f1f5f9;padding:10px;border-radius:6px;border:1px solid #e2e8f0;text-align:center;">
                <div style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:700;">Total Trip Spend</div>
                <div style="font-size:18px;font-weight:800;color:#0f172a;margin-top:2px;">${formatMoney(totalUsd)}</div>
              </div>
              <div style="background:#f1f5f9;padding:10px;border-radius:6px;border:1px solid #e2e8f0;text-align:center;">
                <div style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:700;">Per-Person Share</div>
                <div style="font-size:18px;font-weight:800;color:#0e7490;margin-top:2px;">${formatMoney(perPersonUsd)}</div>
              </div>
              <div style="background:#f1f5f9;padding:10px;border-radius:6px;border:1px solid #e2e8f0;text-align:center;">
                <div style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:700;">Trip Friends</div>
                <div style="font-size:18px;font-weight:800;color:#0f172a;margin-top:2px;">${splitState.members.length}</div>
              </div>
              <div style="background:#f1f5f9;padding:10px;border-radius:6px;border:1px solid #e2e8f0;text-align:center;">
                <div style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:700;">Expenses Logged</div>
                <div style="font-size:18px;font-weight:800;color:#0f172a;margin-top:2px;">${splitState.expenses.length}</div>
              </div>
            </div>

            <div style="margin-bottom:20px;" class="print-page-avoid">
              <h2 style="font-size:15px;margin:0 0 8px;color:#0f172a;text-transform:uppercase;letter-spacing:0.04em;">🤝 Final Settlement Action Items (Who Pays Whom)</h2>
              <div>${settlementsHtml}</div>
            </div>

            <div style="margin-bottom:20px;" class="print-page-avoid">
              <h2 style="font-size:15px;margin:0 0 8px;color:#0f172a;text-transform:uppercase;letter-spacing:0.04em;">👥 Member Net Balances</h2>
              <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;">
                <thead>
                  <tr style="background:#f8fafc;border-bottom:2px solid #cbd5e1;font-size:11px;text-transform:uppercase;color:#475569;">
                    <th style="padding:8px;text-align:left;">Member</th>
                    <th style="padding:8px;text-align:right;">Total Paid</th>
                    <th style="padding:8px;text-align:right;">Share of Costs</th>
                    <th style="padding:8px;text-align:right;">Net Settlement Status</th>
                  </tr>
                </thead>
                <tbody>${balancesHtml}</tbody>
              </table>
            </div>

            <div style="margin-bottom:24px;">
              <h2 style="font-size:15px;margin:0 0 8px;color:#0f172a;text-transform:uppercase;letter-spacing:0.04em;">📋 Itemized Expense Audit Trail</h2>
              <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;">
                <thead>
                  <tr style="background:#f8fafc;border-bottom:2px solid #cbd5e1;font-size:11px;text-transform:uppercase;color:#475569;">
                    <th style="padding:8px;text-align:left;">#</th>
                    <th style="padding:8px;text-align:left;">Expense Description</th>
                    <th style="padding:8px;text-align:left;">Paid By</th>
                    <th style="padding:8px;text-align:left;">Split With</th>
                    <th style="padding:8px;text-align:right;">Amount</th>
                  </tr>
                </thead>
                <tbody>${expensesHtml}</tbody>
              </table>
            </div>

            <div style="border-top:1px solid #cbd5e1;padding-top:10px;text-align:center;font-size:11px;color:#94a3b8;">
              Generated via Miravoya Travel Studio · Verified Zero-Cost Client Architecture · Official Settlement Record.
            </div>
          </div>
        `;

        window.print();
      });
    }

    // 4. Download JSON Backup
    const btnBackupJson = document.getElementById('btn-split-backup-json');
    if (btnBackupJson) {
      btnBackupJson.addEventListener('click', () => {
        if (splitState.members.length === 0 && splitState.expenses.length === 0) {
          notify('Splitter is empty. Add friends and expenses before backing up.');
          return;
        }

        const data = {
          app: 'Miravoya',
          version: '1.0',
          exportedAt: new Date().toISOString(),
          members: splitState.members,
          expenses: splitState.expenses,
          roadTrip: currentRoadTripData
        };

        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `miravoya-trip-split-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        notify('💾 Downloaded trip JSON backup file!');
      });
    }

    // 5. Restore from JSON Backup File
    const fileImportJson = document.getElementById('split-import-file-input');
    if (fileImportJson) {
      fileImportJson.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result);
            if (Array.isArray(data.members) && Array.isArray(data.expenses)) {
              splitState = {
                members: data.members,
                expenses: data.expenses
              };
              if (data.roadTrip) currentRoadTripData = data.roadTrip;
              saveSplit();
              renderSplit();
              renderParticipantsCheckboxes();
              notify(`📂 Successfully restored ${data.expenses.length} expenses for ${data.members.length} friends!`);
            } else {
              notify('Invalid trip JSON format. Please upload a valid Miravoya backup.');
            }
          } catch (err) {
            notify('Error reading JSON file: ' + err.message);
          }
        };
        reader.readAsText(file);
        fileImportJson.value = '';
      });
    }

    // 6. Check URL parameter on load to unpack shared trip state
    function checkUrlImport() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const encoded = urlParams.get('split') || urlParams.get('trip');
        if (!encoded) return;

        const jsonStr = fromBase64Utf8(encoded);
        const imported = JSON.parse(jsonStr);

        if (imported && (Array.isArray(imported.members) || Array.isArray(imported.expenses))) {
          splitState = {
            members: Array.isArray(imported.members) ? imported.members : [],
            expenses: Array.isArray(imported.expenses) ? imported.expenses : []
          };
          saveSplit();
          renderSplit();
          renderParticipantsCheckboxes();

          if (imported.roadTrip && typeof imported.roadTrip === 'object') {
            currentRoadTripData = imported.roadTrip;
          }

          // Clean up the URL query parameters
          const cleanUrl = window.location.pathname + '#road-trip-section';
          window.history.replaceState({}, document.title, cleanUrl);

          setTimeout(() => {
            document.getElementById('bill-splitter-card')?.scrollIntoView({ behavior: 'smooth' });
            notify(`✅ Loaded shared trip (${splitState.members.length} friends, ${splitState.expenses.length} expenses) from link!`);
          }, 450);
        }
      } catch (err) {
        console.warn('Could not parse shared trip link:', err);
      }
    }

    checkUrlImport();

    return () => {
      renderSplit();
    };
  }

  /* ------------------------------------------------------------------------
     3. Polaroid Travel Memory Journal (Local Notes + Photo Attachment)
     ------------------------------------------------------------------------ */
  function initPolaroidJournal() {
    const defaultMemories = [
      {
        id: 1,
        place: 'Ooty Nilgiri Toy Train',
        photoId: 'ooty-coonoor',
        mood: '🌟 Unforgettable',
        note: 'Misty tea valleys rolling past the blue wooden train window with hot masala chai at Coonoor station.',
        date: '2026-10-12',
        gradient: 'linear-gradient(135deg, #14532d, #0f766e)',
        photo: null
      },
      {
        id: 2,
        place: 'Rameswaram & Dhanushkodi',
        photoId: 'rameswaram',
        mood: '🔥 Epic',
        note: 'Standing between two roaring turquoise oceans with endless wind and golden evening light.',
        date: '2026-09-24',
        gradient: 'linear-gradient(135deg, #0284c7, #0f766e)',
        photo: null
      }
    ];

    let memories = loadJson(JOURNAL_KEY, defaultMemories);
    const grid = document.getElementById('polaroid-grid');
    const form = document.getElementById('journal-form');
    const photoInput = document.getElementById('journal-photo');
    if (!grid || !form) return;

    function saveJournal() {
      try {
        localStorage.setItem(JOURNAL_KEY, JSON.stringify(memories.slice(0, 12)));
      } catch (_) {
        notify('Photo too large for browser storage — saved text memory instead');
      }
    }

    function renderJournal() {
      if (!memories.length) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--ink-muted);padding:20px;">Add your first travel memory or upload a trip photo!</div>`;
        return;
      }

      grid.innerHTML = memories
        .map((m, idx) => {
          const rot = idx % 2 === 0 ? '-1.2deg' : '1.2deg';
          return `
            <article class="polaroid-card" style="--p-rot:${rot};">
              <div class="polaroid-media" style="background:${m.gradient};">
                ${
                  m.photo
                    ? `<img src="${m.photo}" alt="${esc(m.place)}" />`
                    : m.photoId
                      ? `<img class="dest-photo-bg" data-photo-id="${esc(m.photoId)}" loading="lazy" alt="${esc(m.place)}" /><span style="font-size:2.4rem;">📸</span>`
                      : `<span style="font-size:2.4rem;">📸</span>`
                }
                <button type="button" class="polaroid-del" data-del-mem="${idx}" title="Delete memory">✕</button>
              </div>
              <div class="polaroid-caption">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
                  <strong style="font-family:var(--font-serif);font-size:1rem;">${esc(m.place)}</strong>
                  <span style="font-size:0.7rem;color:var(--ink-muted);font-family:var(--font-mono);">${esc(m.date)}</span>
                </div>
                <div style="font-size:0.74rem;color:var(--terracotta);font-weight:700;margin:2px 0 4px;">${esc(m.mood)}</div>
                <p style="margin:0;font-size:0.8rem;color:var(--ink-secondary);">${esc(m.note)}</p>
              </div>
            </article>
          `;
        })
        .join('');

      grid.querySelectorAll('[data-del-mem]').forEach((btn) => {
        btn.addEventListener('click', () => {
          memories.splice(Number(btn.dataset.delMem), 1);
          saveJournal();
          renderJournal();
        });
      });

      window.TerraVoyage.photos?.hydratePhotos(grid);
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const place = document.getElementById('journal-place').value.trim();
      const mood = document.getElementById('journal-mood').value;
      const note = document.getElementById('journal-note').value.trim();
      if (!place || !note) return;

      const file = photoInput?.files?.[0];
      const gradients = [
        'linear-gradient(135deg, #0e5a6d, #d95d39)',
        'linear-gradient(135deg, #4338ca, #be123c)',
        'linear-gradient(135deg, #065f46, #0284c7)',
        'linear-gradient(135deg, #b45309, #991b1b)'
      ];

      const addMemory = (photoData) => {
        memories.unshift({
          id: Date.now(),
          place,
          mood,
          note,
          date: new Date().toISOString().slice(0, 10),
          gradient: gradients[memories.length % gradients.length],
          photo: photoData || null
        });
        saveJournal();
        form.reset();
        renderJournal();
        notify(`Saved Polaroid memory for ${place}!`);
      };

      if (file) {
        // Resize cleanly on canvas so localStorage stays fast & light
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const c = document.createElement('canvas');
            const scale = Math.min(1, 520 / img.width);
            c.width = Math.round(img.width * scale);
            c.height = Math.round(img.height * scale);
            c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
            addMemory(c.toDataURL('image/jpeg', 0.72));
          };
          img.src = String(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        addMemory(null);
      }
    });

    renderJournal();
  }

  /* ------------------------------------------------------------------------
     4. Live World Clocks + Trip Takeoff Countdown + Emergency SOS Strip
     ------------------------------------------------------------------------ */
  function initClocksAndCountdown() {
    const clocksEl = document.getElementById('world-clocks-grid');
    const targetInput = document.getElementById('countdown-date-input');
    const labelInput = document.getElementById('countdown-trip-label');
    const displayEl = document.getElementById('countdown-display');

    const ZONES = [
      { city: 'Chennai / India', tz: 'Asia/Kolkata', flag: '🇮🇳' },
      { city: 'Dubai', tz: 'Asia/Dubai', flag: '🇦🇪' },
      { city: 'Tokyo / Kyoto', tz: 'Asia/Tokyo', flag: '🇯🇵' },
      { city: 'Paris / Alps', tz: 'Europe/Paris', flag: '🇫🇷' },
      { city: 'London', tz: 'Europe/London', flag: '🇬🇧' },
      { city: 'Queenstown', tz: 'Pacific/Auckland', flag: '🇳🇿' }
    ];

    function tickClocks() {
      if (!clocksEl) return;
      const now = new Date();
      clocksEl.innerHTML = ZONES.map((z) => {
        let timeStr = '--:--';
        try {
          timeStr = now.toLocaleTimeString('en-US', { timeZone: z.tz, hour: '2-digit', minute: '2-digit', hour12: true });
        } catch (_) {}
        return `
          <div class="clock-chip">
            <span>${z.flag} ${esc(z.city)}</span>
            <strong>${esc(timeStr)}</strong>
          </div>
        `;
      }).join('');
    }

    let cdState = loadJson(COUNTDOWN_KEY, {
      trip: 'Ooty & Madurai Road Trip',
      date: '2026-12-25'
    });

    if (targetInput && labelInput) {
      targetInput.value = cdState.date;
      labelInput.value = cdState.trip;

      const saveCd = () => {
        cdState = { trip: labelInput.value.trim() || 'Next Adventure', date: targetInput.value || '2026-12-25' };
        try {
          localStorage.setItem(COUNTDOWN_KEY, JSON.stringify(cdState));
        } catch (_) {}
        tickCountdown();
      };

      targetInput.addEventListener('change', saveCd);
      labelInput.addEventListener('input', saveCd);
    }

    function tickCountdown() {
      if (!displayEl) return;
      const target = new Date(`${cdState.date}T08:00:00`).getTime();
      const diff = target - Date.now();
      if (Number.isNaN(diff) || diff <= 0) {
        displayEl.innerHTML = `<span class="cd-unit"><strong>✈️</strong><span>It’s Travel Day!</span></span>`;
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hrs = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      displayEl.innerHTML = `
        <span class="cd-unit"><strong>${days}</strong><span>Days</span></span>
        <span class="cd-unit"><strong>${String(hrs).padStart(2, '0')}</strong><span>Hours</span></span>
        <span class="cd-unit"><strong>${String(mins).padStart(2, '0')}</strong><span>Mins</span></span>
        <span class="cd-unit"><strong>${String(secs).padStart(2, '0')}</strong><span>Secs</span></span>
      `;
    }

    tickClocks();
    tickCountdown();
    setInterval(tickClocks, 15000);
    setInterval(tickCountdown, 1000);
  }

  const refreshRoad = initRoadTripCalc();
  const refreshSplit = initBillSplitter();
  initPolaroidJournal();
  initClocksAndCountdown();

  return {
    refreshCurrencyDisplays() {
      if (refreshRoad) refreshRoad();
      if (refreshSplit) refreshSplit();
    }
  };
};
