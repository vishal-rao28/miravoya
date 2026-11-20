/* ==========================================================================
   MIRAVOYA — DevTools & Source Inspection Guard
   Protects website from unauthorized inspecting, right-clicks, and source viewing.
   
   HOW TO INSPECT AS THE AUTHORIZED OWNER:
   - Visit with secret parameter: http://localhost:8000/?dev=miravoya
     (This permanently unlocks inspection for your browser on your machine!)
   - To lock it back: http://localhost:8000/?dev=lock
   ========================================================================== */

(function () {
  const DEV_KEY = 'miravoya_dev_authorized';

  // 1. Check URL parameters for secret developer passkey
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const devParam = urlParams.get('dev');

    if (devParam === 'miravoya' || devParam === 'admin') {
      localStorage.setItem(DEV_KEY, 'true');
      // Clean query string from address bar without reloading
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
      console.info('%c[Miravoya Security] 🔓 Developer Mode UNLOCKED. You can inspect freely.', 'color:#0e7490;font-weight:bold;font-size:14px;');
    } else if (devParam === 'lock') {
      localStorage.removeItem(DEV_KEY);
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
      console.info('%c[Miravoya Security] 🔒 Developer Mode LOCKED.', 'color:#d95d39;font-weight:bold;');
    }
  } catch (_) { }

  const isAuthorized = localStorage.getItem(DEV_KEY) === 'true';

  // Expose helper methods to window
  window.Miravoya = window.Miravoya || window.TerraVoyage || {};
  window.TerraVoyage = window.Miravoya;
  window.Miravoya.isDevAuthorized = () => localStorage.getItem(DEV_KEY) === 'true';
  window.Miravoya.unlockDev = () => {
    localStorage.setItem(DEV_KEY, 'true');
    alert('🔓 Developer Mode Unlocked for you! You can now inspect.');
    location.reload();
  };
  window.Miravoya.lockDev = () => {
    localStorage.removeItem(DEV_KEY);
    alert('🔒 Developer Mode Locked.');
    location.reload();
  };

  // If you are the authorized developer, allow everything!
  if (isAuthorized) {
    return;
  }

  // 2. Block right-click context menu (Inspect Element)
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    showBlockedToast();
    return false;
  }, { capture: true });

  // 3. Block Developer Keyboard Shortcuts
  window.addEventListener('keydown', function (e) {
    const key = e.key ? e.key.toUpperCase() : '';
    const code = e.keyCode || e.which;

    // F12
    if (key === 'F12' || code === 123) {
      e.preventDefault();
      e.stopPropagation();
      showBlockedToast();
      return false;
    }

    // Ctrl+Shift+I / Cmd+Option+I (DevTools Inspect)
    // Ctrl+Shift+J / Cmd+Option+J (DevTools Console)
    // Ctrl+Shift+C / Cmd+Option+C (Element Inspector)
    if ((e.ctrlKey || e.metaKey) && (e.shiftKey || e.altKey)) {
      if (['I', 'J', 'C', 'K'].includes(key) || [73, 74, 67, 75].includes(code)) {
        e.preventDefault();
        e.stopPropagation();
        showBlockedToast();
        return false;
      }
    }

    // Ctrl+U / Cmd+U (View Source)
    // Ctrl+S / Cmd+S (Save Page)
    if ((e.ctrlKey || e.metaKey) && (key === 'U' || key === 'S' || code === 85 || code === 83)) {
      e.preventDefault();
      e.stopPropagation();
      showBlockedToast();
      return false;
    }
  }, { capture: true });

  // 4. Subtle notification when blocked
  let toastThrottle = 0;
  function showBlockedToast() {
    const now = Date.now();
    if (now - toastThrottle < 2000) return;
    toastThrottle = now;

    const el = document.getElementById('toast');
    if (el) {
      el.textContent = '🔒 Inspection is restricted.';
      el.classList.add('is-visible');
      setTimeout(() => el.classList.remove('is-visible'), 2000);
    }
  }

  // 5. DevTools open detector
  let devtoolsOpen = false;
  setInterval(function () {
    if (localStorage.getItem(DEV_KEY) === 'true') return;
    const widthDiff = window.outerWidth - window.innerWidth > 160;
    const heightDiff = window.outerHeight - window.innerHeight > 160;
    if (widthDiff || heightDiff) {
      if (!devtoolsOpen) {
        devtoolsOpen = true;
        console.clear();
      }
    } else {
      devtoolsOpen = false;
    }
  }, 1000);
})();
