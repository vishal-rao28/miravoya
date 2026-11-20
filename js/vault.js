/* ==========================================================================
   MIRAVOYA — Master Travel Vault & Explorer Profile Sync Engine
   Universal zero-cloud backup, restore, cross-device sync & offline monitoring.
   ========================================================================== */

window.Miravoya = window.Miravoya || window.TerraVoyage || {};
window.TerraVoyage = window.TerraVoyage || window.Miravoya;

window.Miravoya.initVault = function initVault(helpers = {}) {
  const { notify = (msg) => console.log(msg) } = helpers;

  const STORAGE_KEYS = {
    STATE: 'terravoyage_state_v2',
    ROADMAP: 'terravoyage_roadmap_v1',
    PACKING: 'terravoyage_packing_v1',
    SPLIT: 'terravoyage_split_v4',
    JOURNAL: 'terravoyage_journal_v1',
    COUNTDOWN: 'terravoyage_countdown_v1'
  };

  function readJson(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJson(key, data) {
    try {
      if (data === null || data === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(data));
      }
      return true;
    } catch (err) {
      console.warn(`[Miravoya Vault] Failed to write key ${key}:`, err);
      return false;
    }
  }

  // 1. Compute Live Explorer Profile Stats & Rank
  function computeProfileStats() {
    const state = readJson(STORAGE_KEYS.STATE, {}) || {};
    const roadmaps = readJson(STORAGE_KEYS.ROADMAP, {}) || {};
    const packing = readJson(STORAGE_KEYS.PACKING, {}) || {};
    const split = readJson(STORAGE_KEYS.SPLIT, {}) || {};
    const journal = readJson(STORAGE_KEYS.JOURNAL, []) || [];
    const countdown = readJson(STORAGE_KEYS.COUNTDOWN, null);

    const bookedCount = Array.isArray(state.bookedTrips) ? state.bookedTrips.length : 0;
    const roadmapCount = Object.keys(roadmaps).length;
    
    let packedItemsCount = 0;
    if (packing.checked && typeof packing.checked === 'object') {
      packedItemsCount = Object.values(packing.checked).filter(Boolean).length;
    }
    const customItemsCount = Array.isArray(packing.custom) ? packing.custom.length : 0;
    const totalGearScore = packedItemsCount + customItemsCount;

    const expenseCount = Array.isArray(split.expenses) ? split.expenses.length : 0;
    const friendCount = Array.isArray(split.members) ? split.members.length : 0;
    const memoriesCount = Array.isArray(journal) ? journal.length : 0;

    // Explorer Experience Score (XP)
    const xp = (bookedCount * 60) + (roadmapCount * 40) + (totalGearScore * 10) + (expenseCount * 25) + (memoriesCount * 35);

    let rankTitle = '🌱 Curious Nomad';
    let rankLevel = 1;
    let nextLevelXp = 150;
    let rankBadge = '🥉 Level 1';

    if (xp >= 600) {
      rankTitle = '👑 Grand Globetrotter (Elite)';
      rankLevel = 4;
      nextLevelXp = 1000;
      rankBadge = '💎 Elite Level 4';
    } else if (xp >= 300) {
      rankTitle = '✈️ Jetset Navigator';
      rankLevel = 3;
      nextLevelXp = 600;
      rankBadge = '🥇 Level 3';
    } else if (xp >= 120) {
      rankTitle = '🧭 Wayfinder Explorer';
      rankLevel = 2;
      nextLevelXp = 300;
      rankBadge = '🥈 Level 2';
    }

    const progressPct = Math.min(100, Math.round((xp / nextLevelXp) * 100));

    return {
      xp,
      rankTitle,
      rankLevel,
      rankBadge,
      nextLevelXp,
      progressPct,
      bookedCount,
      roadmapCount,
      totalGearScore,
      expenseCount,
      friendCount,
      memoriesCount,
      hasCountdown: Boolean(countdown && countdown.targetDate)
    };
  }

  // 2. Generate Universal Vault Export Payload
  function generateVaultPayload() {
    return {
      brand: 'Miravoya',
      generator: 'Miravoya Global Travel Studio — Master Travel Vault',
      version: '1.1',
      exportedAt: new Date().toISOString(),
      vault: {
        state: readJson(STORAGE_KEYS.STATE, {}),
        roadmaps: readJson(STORAGE_KEYS.ROADMAP, {}),
        packing: readJson(STORAGE_KEYS.PACKING, {}),
        split: readJson(STORAGE_KEYS.SPLIT, {}),
        journal: readJson(STORAGE_KEYS.JOURNAL, []),
        countdown: readJson(STORAGE_KEYS.COUNTDOWN, null)
      }
    };
  }

  // 3. Export to JSON File Download
  function exportVaultToJsonFile() {
    try {
      const payload = generateVaultPayload();
      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateTag = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `miravoya-travel-vault-${dateTag}.json`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 500);

      notify('💼 Master Travel Vault downloaded! All roadmaps, trips & memories secured.');
    } catch (err) {
      console.error(err);
      notify('Export failed — check browser file permissions.');
    }
  }

  // 4. Copy Portable Encoded Vault Token
  function copyVaultToken() {
    try {
      const payload = generateVaultPayload();
      const jsonStr = JSON.stringify(payload);
      // UTF-8 safe Base64 encoding
      const token = btoa(encodeURIComponent(jsonStr));
      navigator.clipboard.writeText(token).then(() => {
        notify('📋 Vault sync code copied! You can paste this on another device or browser.');
      }).catch(() => {
        notify('Clipboard write blocked — you can download JSON backup file instead.');
      });
    } catch (err) {
      console.error(err);
      notify('Failed to generate sync code.');
    }
  }

  // 5. Restore Vault from Raw Payload (supports object or parsed JSON)
  function restoreVaultPayload(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid vault file format.');
    }

    const vault = data.vault || data;
    let restoredKeys = 0;

    if (vault.state && typeof vault.state === 'object') {
      writeJson(STORAGE_KEYS.STATE, vault.state);
      restoredKeys += 1;
    }
    if (vault.roadmaps && typeof vault.roadmaps === 'object') {
      writeJson(STORAGE_KEYS.ROADMAP, vault.roadmaps);
      restoredKeys += 1;
    }
    if (vault.packing && typeof vault.packing === 'object') {
      writeJson(STORAGE_KEYS.PACKING, vault.packing);
      restoredKeys += 1;
    }
    if (vault.split && typeof vault.split === 'object') {
      writeJson(STORAGE_KEYS.SPLIT, vault.split);
      restoredKeys += 1;
    }
    if (Array.isArray(vault.journal)) {
      writeJson(STORAGE_KEYS.JOURNAL, vault.journal);
      restoredKeys += 1;
    }
    if (vault.countdown && typeof vault.countdown === 'object') {
      writeJson(STORAGE_KEYS.COUNTDOWN, vault.countdown);
      restoredKeys += 1;
    }

    if (restoredKeys === 0) {
      throw new Error('No compatible Miravoya travel data found in this file.');
    }

    notify(`✅ Travel Vault successfully restored! (${restoredKeys} travel databases synced)`);
    updateVaultStatsUi();

    // Trigger soft refresh of active modules or full reload after short toast
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  }

  // 6. Restore from Text Token / Code
  function restoreFromToken(tokenStr) {
    try {
      const cleaned = String(tokenStr || '').trim();
      if (!cleaned) {
        notify('Please paste a valid Miravoya vault sync code.');
        return;
      }
      let jsonStr = '';
      if (cleaned.startsWith('{')) {
        jsonStr = cleaned;
      } else {
        jsonStr = decodeURIComponent(atob(cleaned));
      }
      const parsed = JSON.parse(jsonStr);
      restoreVaultPayload(parsed);
    } catch (err) {
      console.error(err);
      notify('❌ Invalid or corrupted vault sync code. Please check and retry.');
    }
  }

  // 7. Load Curated "Dream Vacation" Sample Profile
  function loadSampleDreamVacation() {
    const samplePayload = {
      brand: 'Miravoya',
      version: '1.1',
      vault: {
        state: {
          theme: 'horizon',
          currency: 'INR',
          compareIds: ['ooty-coonoor', 'kerala-munnar', 'kyoto'],
          bookingTab: 'flights',
          bookedTrips: [
            {
              id: 'trip-demo-1',
              title: 'Tokyo & Kyoto 7-Day Autumn Sakura Expedition',
              type: 'flight',
              flightCode: 'JL-754',
              origin: 'Chennai (MAA)',
              dest: 'Tokyo Haneda (HND)',
              passengers: 2,
              date: '2027-03-24',
              classTier: 'Premium Boutique',
              status: 'Confirmed Boarding Pass',
              priceFormatted: '₹1,18,400'
            },
            {
              id: 'trip-demo-2',
              title: 'Nilgiri Heritage Tea Bungalow & Toy Train Retreat',
              type: 'hotel',
              dest: 'Ooty & Coonoor, Tamil Nadu',
              rooms: 1,
              nights: 3,
              date: '2026-12-25',
              classTier: 'Mountain Villa',
              status: 'Confirmed Stay',
              priceFormatted: '₹24,500'
            }
          ]
        },
        roadmaps: {
          'ooty-coonoor': [
            { day: 1, title: 'Historic Nilgiri Mountain Toy Train from Mettupalayam up to Coonoor through misty gorges.' },
            { day: 2, title: 'Trek through tea estate paths to Dolphin’s Nose viewpoint & Catherine Falls.' },
            { day: 3, title: 'Quiet twilight boat row on Ooty Lake and handcrafted artisanal chocolate tasting in town.' }
          ],
          'kyoto': [
            { day: 1, title: 'Sunrise pilgrimage through 10,000 vermilion torii gates at Fushimi Inari Taisha.' },
            { day: 2, title: 'Emerald bamboo walkway in Arashiyama & zen moss gardens of Tenryu-ji temple.' },
            { day: 3, title: 'Evening stroll through lantern-lit historic Gion & 400-year Nishiki foodie market.' }
          ]
        },
        packing: {
          kit: 'mountain',
          checked: {
            'Warm windbreaker / fleece jacket': true,
            'Comfortable hiking / walking boots': true,
            'High-capacity power bank & cables': true,
            'Passport / Gov ID + digital copies': true,
            'Mirrorless camera / extra SD cards': true,
            'Thermal base layers': true
          },
          custom: [
            'Compact binoculars for mountain wildlife',
            'Ceramic travel thermos for hot Nilgiri chai'
          ]
        },
        split: {
          members: ['Arun (You)', 'Priya', 'Karthik', 'Divya'],
          expenses: [
            {
              id: 101,
              title: 'Heritage Tea Estate Bungalow (3 Nights)',
              amountUsd: 24500,
              paidBy: 'Arun (You)',
              splitWith: ['Arun (You)', 'Priya', 'Karthik', 'Divya'],
              date: '2026-12-25'
            },
            {
              id: 102,
              title: 'Fuel & Highway Tolls (Chennai to Ooty)',
              amountUsd: 5800,
              paidBy: 'Karthik',
              splitWith: ['Arun (You)', 'Priya', 'Karthik', 'Divya'],
              date: '2026-12-25'
            },
            {
              id: 103,
              title: 'Nilgiri Mountain Railway First Class Tickets',
              amountUsd: 3200,
              paidBy: 'Priya',
              splitWith: ['Arun (You)', 'Priya', 'Karthik', 'Divya'],
              date: '2026-12-26'
            },
            {
              id: 104,
              title: 'Chettinad Dinner Feast & Hot Filter Coffee',
              amountUsd: 4100,
              paidBy: 'Divya',
              splitWith: ['Arun (You)', 'Priya', 'Karthik', 'Divya'],
              date: '2026-12-26'
            }
          ]
        },
        journal: [
          {
            id: 1,
            place: 'Ooty Nilgiri Toy Train',
            photoId: 'ooty-coonoor',
            mood: '🌟 Unforgettable',
            note: 'Misty tea valleys rolling past the wooden carriage window with steaming hot ginger cardamom chai at Coonoor.',
            date: '2026-10-12',
            gradient: 'linear-gradient(135deg, #14532d, #0f766e)',
            photo: null
          },
          {
            id: 2,
            place: 'Kyoto Bamboo Grove & Gion',
            photoId: 'kyoto',
            mood: '🔥 Epic Adventure',
            note: 'Early morning bamboo canopy bathed in autumn mist followed by evening wooden tea houses in historic Gion.',
            date: '2026-11-04',
            gradient: 'linear-gradient(135deg, #831843, #701a75)',
            photo: null
          },
          {
            id: 3,
            place: 'Rameswaram & Dhanushkodi',
            photoId: 'rameswaram',
            mood: '😌 Peaceful Escape',
            note: 'Standing between two turquoise oceans where the bay meets the deep sea under golden twilight breezes.',
            date: '2026-09-24',
            gradient: 'linear-gradient(135deg, #0284c7, #0f766e)',
            photo: null
          }
        ],
        countdown: {
          title: 'Nilgiri Heritage Tea & Mountain Retreat',
          targetDate: '2026-12-25'
        }
      }
    };

    restoreVaultPayload(samplePayload);
  }

  // 8. Safe Vault Data Reset
  function resetAllVaultData() {
    if (!confirm('Are you sure you want to reset your local Miravoya data? All custom roadmaps, packing ticks, and split bills will be cleared.')) {
      return;
    }
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    notify('🔄 Vault reset to clean slate. Reloading studio...');
    setTimeout(() => window.location.reload(), 900);
  }

  // 9. Update UI Modal Stats
  function updateVaultStatsUi() {
    const stats = computeProfileStats();

    const rankTitleEl = document.getElementById('vault-rank-title');
    const rankBadgeEl = document.getElementById('vault-rank-badge');
    const xpValEl = document.getElementById('vault-xp-val');
    const progressBarEl = document.getElementById('vault-progress-fill');
    const statTripsEl = document.getElementById('vault-stat-trips');
    const statRoadmapsEl = document.getElementById('vault-stat-roadmaps');
    const statGearEl = document.getElementById('vault-stat-gear');
    const statExpensesEl = document.getElementById('vault-stat-expenses');
    const statMemoriesEl = document.getElementById('vault-stat-memories');

    if (rankTitleEl) rankTitleEl.textContent = stats.rankTitle;
    if (rankBadgeEl) rankBadgeEl.textContent = stats.rankBadge;
    if (xpValEl) xpValEl.textContent = `${stats.xp} XP`;
    if (progressBarEl) progressBarEl.style.width = `${stats.progressPct}%`;
    if (statTripsEl) statTripsEl.textContent = stats.bookedCount;
    if (statRoadmapsEl) statRoadmapsEl.textContent = stats.roadmapCount;
    if (statGearEl) statGearEl.textContent = stats.totalGearScore;
    if (statExpensesEl) statExpensesEl.textContent = stats.expenseCount;
    if (statMemoriesEl) statMemoriesEl.textContent = stats.memoriesCount;
  }

  // 10. Live Network Status Monitoring (PWA / Offline detection)
  function initNetworkSyncBadge() {
    const badge = document.getElementById('vault-sync-indicator');
    const textEl = document.getElementById('sync-status-text');

    function updateStatus() {
      const isOnline = navigator.onLine;
      if (!badge) return;
      if (isOnline) {
        badge.classList.remove('offline');
        badge.classList.add('online');
        if (textEl) textEl.textContent = 'Live Synced';
        badge.title = 'Miravoya Online & Vault Synced · Service Worker PWA Active';
      } else {
        badge.classList.remove('online');
        badge.classList.add('offline');
        if (textEl) textEl.textContent = 'Offline Ready';
        badge.title = 'Offline Mode Active · All Roadmaps, Vault & Guides work offline';
        notify('⚡ You are currently offline. Miravoya is running in offline PWA vault mode.');
      }
    }

    window.addEventListener('online', () => {
      updateStatus();
      notify('🌐 Internet reconnected! Live sync active.');
    });
    window.addEventListener('offline', updateStatus);
    updateStatus();
  }

  // 11. Modal Event Bindings
  function bindVaultModal() {
    const backdrop = document.getElementById('vault-backdrop');
    const openBtns = [
      document.getElementById('open-vault-btn'),
      document.getElementById('nav-vault-link')
    ].filter(Boolean);
    const closeBtn = document.getElementById('vault-close-btn');

    const exportBtn = document.getElementById('vault-export-btn');
    const copyTokenBtn = document.getElementById('vault-copy-token-btn');
    const fileInput = document.getElementById('vault-file-input');
    const pasteCodeInput = document.getElementById('vault-paste-token');
    const restoreCodeBtn = document.getElementById('vault-restore-code-btn');
    const loadDemoBtn = document.getElementById('vault-load-demo-btn');
    const resetBtn = document.getElementById('vault-reset-btn');
    const dropZone = document.getElementById('vault-drop-zone');

    function openModal() {
      updateVaultStatsUi();
      backdrop?.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      backdrop?.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    openBtns.forEach((btn) => btn.addEventListener('click', openModal));
    closeBtn?.addEventListener('click', closeModal);

    backdrop?.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && backdrop?.classList.contains('is-open')) {
        closeModal();
      }
    });

    exportBtn?.addEventListener('click', exportVaultToJsonFile);
    copyTokenBtn?.addEventListener('click', copyVaultToken);
    loadDemoBtn?.addEventListener('click', loadSampleDreamVacation);
    resetBtn?.addEventListener('click', resetAllVaultData);

    restoreCodeBtn?.addEventListener('click', () => {
      restoreFromToken(pasteCodeInput?.value);
    });

    // File Input change
    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target.result);
          restoreVaultPayload(parsed);
        } catch (err) {
          notify('❌ Failed to read JSON file. Please check file format.');
        }
      };
      reader.readAsText(file);
    });

    // Drag and Drop
    if (dropZone) {
      ['dragenter', 'dragover'].forEach((eventName) => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropZone.classList.add('drag-active');
        });
      });

      ['dragleave', 'drop'].forEach((eventName) => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropZone.classList.remove('drag-active');
        });
      });

      dropZone.addEventListener('drop', (e) => {
        const file = e.dataTransfer?.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const parsed = JSON.parse(evt.target.result);
            restoreVaultPayload(parsed);
          } catch (err) {
            notify('❌ Failed to parse dropped JSON file.');
          }
        };
        reader.readAsText(file);
      });
    }
  }

  initNetworkSyncBadge();
  bindVaultModal();
  updateVaultStatsUi();

  return {
    openVault: () => {
      const backdrop = document.getElementById('vault-backdrop');
      updateVaultStatsUi();
      backdrop?.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    },
    exportVault: exportVaultToJsonFile,
    copyToken: copyVaultToken,
    loadDemo: loadSampleDreamVacation,
    resetVault: resetAllVaultData,
    refreshStats: updateVaultStatsUi
  };
};
