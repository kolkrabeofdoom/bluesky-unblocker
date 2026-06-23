// Application State
const state = {
    session: null,       // { did, accessJwt, handle, displayName, avatar, serverUrl }
    blockedUsers: [],    // Array of { did, handle, displayName, avatar, rkey, status, selected }
    repoRkeys: new Set(),// Set of rkeys that actually exist in the PDS repository
    isProcessing: false,
    isPaused: false,
    abortController: null,
    queue: [],           // Queue of user DIDs remaining to unblock
    runTotal: 0,         // Total to unblock in current run
    stats: {
        total: 0,
        selected: 0,
        success: 0,
        error: 0
    },
    isDryRun: false,
    activeWorker: null
};

// UI Elements
const DOM = {
    loginSection: document.getElementById('login-section'),
    workspaceSection: document.getElementById('workspace-section'),
    loginForm: document.getElementById('login-form'),
    serverUrlInput: document.getElementById('server-url'),
    identifierInput: document.getElementById('identifier'),
    passwordInput: document.getElementById('password'),
    togglePasswordBtn: document.getElementById('toggle-password'),
    btnLogin: document.getElementById('btn-login'),
    loginError: document.getElementById('login-error'),
    
    userAvatar: document.getElementById('user-avatar'),
    userAvatarPlaceholder: document.getElementById('user-avatar-placeholder'),
    userDisplayName: document.getElementById('user-display-name'),
    userHandle: document.getElementById('user-handle'),
    btnLogout: document.getElementById('btn-logout'),
    
    statTotal: document.getElementById('stat-total'),
    statSelected: document.getElementById('stat-selected'),
    statSuccess: document.getElementById('stat-success'),
    statError: document.getElementById('stat-error'),
    progressContainer: document.getElementById('progress-container'),
    progressBar: document.getElementById('progress-bar'),
    progressText: document.getElementById('progress-text'),
    executionControls: document.getElementById('execution-controls'),
    btnPause: document.getElementById('btn-pause'),
    btnResume: document.getElementById('btn-resume'),
    btnCancel: document.getElementById('btn-cancel'),
    finishedControls: document.getElementById('finished-controls'),
    btnRescanFinished: document.getElementById('btn-rescan-finished'),
    chkDryRun: document.getElementById('chk-dry-run'),
    
    searchInput: document.getElementById('search-input'),
    selectSort: document.getElementById('select-sort'),
    chkFilterInactive: document.getElementById('chk-filter-inactive'),
    btnSelectAll: document.getElementById('btn-select-all'),
    btnSelect24h: document.getElementById('btn-select-24h'),
    btnSelect48h: document.getElementById('btn-select-48h'),
    btnSelectPhantoms: document.getElementById('btn-select-phantoms'),
    inputCustomTime: document.getElementById('input-custom-time'),
    selectCustomUnit: document.getElementById('select-custom-unit'),
    btnSelectCustom: document.getElementById('btn-select-custom'),
    btnDeselectAll: document.getElementById('btn-deselect-all'),
    btnUnblockSelected: document.getElementById('btn-unblock-selected'),
    btnUnblockAll: document.getElementById('btn-unblock-all'),
    btnMuteSelected: document.getElementById('btn-mute-selected'),
    visibleCountBadge: document.getElementById('visible-count-badge'),
    btnRescan: document.getElementById('btn-rescan'),
    
    btnExportJson: document.getElementById('btn-export-json'),
    btnImportJson: document.getElementById('btn-import-json'),
    inputImportFile: document.getElementById('input-import-file'),
    
    loadingBlocks: document.getElementById('loading-blocks'),
    loadingCursorText: document.getElementById('loading-cursor-text'),
    emptyBlocks: document.getElementById('empty-blocks'),
    blockListGrid: document.getElementById('block-list-grid'),
    
    logTerminal: document.getElementById('log-terminal'),
    btnClearLogs: document.getElementById('btn-clear-logs')
};

// --- UTILITIES ---

// Log message to virtual terminal
function log(message, type = 'info') {
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${time}] ${message}`;
    DOM.logTerminal.appendChild(entry);
    DOM.logTerminal.scrollTop = DOM.logTerminal.scrollHeight;
}

// Format error messages nicely
function getErrorMessage(error) {
    if (error && error.message) {
        return error.message;
    }
    return String(error);
}

// Helper for making API calls with AbortController
async function apiFetch(url, options = {}, customHeaders = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...customHeaders
    };
    
    if (state.session && state.session.accessJwt) {
        headers['Authorization'] = `Bearer ${state.session.accessJwt}`;
    }
    
    const fetchOptions = {
        ...options,
        headers,
    };
    
    if (state.abortController) {
        fetchOptions.signal = state.abortController.signal;
    }

    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
        let errData;
        try {
            errData = await response.json();
        } catch (_) {
            throw new Error(`HTTP-Fehler! Status: ${response.status}`);
        }
        throw new Error(errData.message || errData.error || `Fehler ${response.status}`);
    }
    
    // Some endpoints return empty body on success (like deleteRecord)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
        return null;
    }
    
    try {
        return await response.json();
    } catch (_) {
        return null;
    }
}

// Parse record key (rkey) from AT-URI (at://did:plc:xxx/collection/rkey)
function parseRkey(atUri) {
    if (!atUri) return null;
    const parts = atUri.split('/');
    return parts[parts.length - 1];
}

// --- UI UPDATERS ---

// Toggle password visibility
DOM.togglePasswordBtn.addEventListener('click', () => {
    const isPassword = DOM.passwordInput.getAttribute('type') === 'password';
    DOM.passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    const icon = DOM.togglePasswordBtn.querySelector('svg');
    if (isPassword) {
        icon.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`;
    } else {
        icon.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
    }
});

// Update global stats display
function updateStats() {
    state.stats.total = state.blockedUsers.length;
    state.stats.selected = state.blockedUsers.filter(u => u.selected && u.status !== 'unblocked').length;
    state.stats.success = state.blockedUsers.filter(u => u.status === 'unblocked').length;
    state.stats.error = state.blockedUsers.filter(u => u.status === 'error').length;
    
    DOM.statTotal.textContent = state.stats.total;
    DOM.statSelected.textContent = state.stats.selected;
    DOM.statSuccess.textContent = state.stats.success;
    DOM.statError.textContent = state.stats.error;
    
    // Update progress bar
    if (state.isProcessing) {
        const processed = state.stats.success + state.stats.error;
        const totalToProcess = processed + state.queue.length;
        const percentage = totalToProcess > 0 ? (processed / totalToProcess) * 100 : 0;
        
        DOM.progressBar.style.width = `${percentage}%`;
        DOM.progressText.textContent = `Verarbeitet: ${processed} / ${totalToProcess} (${Math.round(percentage)}%)`;
    }
}

// Render the block list grid
function renderBlocklist() {
    const query = DOM.searchInput.value.toLowerCase().trim();
    const showOnlyInactive = DOM.chkFilterInactive.checked;
    DOM.blockListGrid.innerHTML = '';
    
    const filtered = state.blockedUsers.filter(user => {
        const handleMatch = user.handle.toLowerCase().includes(query);
        const nameMatch = (user.displayName || '').toLowerCase().includes(query);
        if (!(handleMatch || nameMatch)) return false;
        
        if (showOnlyInactive) {
            const isInvalid = user.handle === 'handle.invalid' || !user.displayName || user.handle.toLowerCase().includes('invalid');
            return isInvalid;
        }
        return true;
    });
    
    // Sort blocklist
    const sortVal = DOM.selectSort.value;
    filtered.sort((a, b) => {
        if (sortVal === 'date-desc') {
            const dateA = a.indexedAt ? new Date(a.indexedAt) : new Date(0);
            const dateB = b.indexedAt ? new Date(b.indexedAt) : new Date(0);
            return dateB - dateA;
        } else if (sortVal === 'date-asc') {
            const dateA = a.indexedAt ? new Date(a.indexedAt) : new Date(0);
            const dateB = b.indexedAt ? new Date(b.indexedAt) : new Date(0);
            return dateA - dateB;
        } else if (sortVal === 'name-asc') {
            const nameA = (a.displayName || a.handle).toLowerCase();
            const nameB = (b.displayName || b.handle).toLowerCase();
            return nameA.localeCompare(nameB);
        } else if (sortVal === 'name-desc') {
            const nameA = (a.displayName || a.handle).toLowerCase();
            const nameB = (b.displayName || b.handle).toLowerCase();
            return nameB.localeCompare(nameA);
        }
        return 0;
    });
    
    DOM.visibleCountBadge.textContent = `${filtered.length} von ${state.blockedUsers.length} geladen`;
    
    if (filtered.length === 0) {
        DOM.blockListGrid.classList.add('hidden');
        if (state.blockedUsers.length > 0) {
            // Searched but no results
            DOM.emptyBlocks.classList.remove('hidden');
            DOM.emptyBlocks.querySelector('p').textContent = 'Keine Konten entsprechen deiner Suche.';
        } else {
            // Truly empty blocklist
            DOM.emptyBlocks.classList.remove('hidden');
            DOM.emptyBlocks.querySelector('p').textContent = 'Keine blockierten Konten gefunden!';
        }
        return;
    }
    
    DOM.emptyBlocks.classList.add('hidden');
    DOM.blockListGrid.classList.remove('hidden');
    
    filtered.forEach(user => {
        const isPhantom = !state.repoRkeys.has(user.rkey);
        const card = document.createElement('div');
        card.className = `block-item fade-in ${user.status} ${isPhantom ? 'phantom' : ''}`;
        card.id = `block-card-${user.did.replace(':', '_')}`;
        
        // Disable checkbox if already unblocked or currently unblocking
        const isInteractive = user.status === 'blocked' && !state.isProcessing;
        const disabledAttr = isInteractive ? '' : 'disabled';
        
        let statusLabel = 'Blockiert';
        let badgeClass = 'block-status-badge';
        if (user.status === 'processing') statusLabel = 'Löst...';
        if (user.status === 'unblocked') statusLabel = 'Entfernt';
        if (user.status === 'error') statusLabel = 'Fehler';
        if (user.status === 'blocked' && isPhantom) {
            statusLabel = '👻 Phantom';
            badgeClass = 'block-status-badge phantom';
        }
        
        const avatarSrc = user.avatar || '';
        const avatarEl = avatarSrc 
            ? `<img src="${avatarSrc}" alt="Avatar" class="block-avatar" onerror="this.src=''; this.className='avatar-placeholder'">`
            : `<div class="block-avatar avatar-placeholder"></div>`;
            
        const blockDate = user.indexedAt ? new Date(user.indexedAt).toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'Unbekannt';
            
        card.innerHTML = `
            <label class="checkbox-container">
                <input type="checkbox" ${user.selected ? 'checked' : ''} ${disabledAttr} data-did="${user.did}">
                <span class="checkmark"></span>
            </label>
            ${avatarEl}
            <div class="block-user-details">
                <div class="block-name" title="${user.displayName || user.handle}">${user.displayName || user.handle}</div>
                <div class="block-handle">
                    <a href="https://bsky.app/profile/${user.handle}" target="_blank" rel="noopener noreferrer">@${user.handle}</a>
                </div>
                <div class="block-date" style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">Blockiert am ${blockDate}</div>
            </div>
            <span class="${badgeClass}">${statusLabel}</span>
        `;
        
        // Event listener for checkbox
        const checkbox = card.querySelector('input[type="checkbox"]');
        if (isInteractive) {
            checkbox.addEventListener('change', (e) => {
                user.selected = e.target.checked;
                updateStats();
            });
        }
        
        DOM.blockListGrid.appendChild(card);
    });
}

// Handle action buttons disabled state
function setActionButtonsDisabled(disabled) {
    DOM.btnSelectAll.disabled = disabled;
    DOM.btnSelect24h.disabled = disabled;
    DOM.btnSelect48h.disabled = disabled;
    DOM.btnSelectPhantoms.disabled = disabled;
    DOM.btnSelectCustom.disabled = disabled;
    DOM.inputCustomTime.disabled = disabled;
    DOM.selectCustomUnit.disabled = disabled;
    DOM.btnDeselectAll.disabled = disabled;
    DOM.btnUnblockSelected.disabled = disabled;
    DOM.btnUnblockAll.disabled = disabled;
    DOM.btnMuteSelected.disabled = disabled;
    DOM.searchInput.disabled = disabled;
    DOM.selectSort.disabled = disabled;
    DOM.chkFilterInactive.disabled = disabled;
    DOM.btnRescan.disabled = disabled;
    DOM.btnExportJson.disabled = disabled;
    DOM.btnImportJson.disabled = disabled;
    DOM.chkDryRun.disabled = disabled;
    
    // Also disable individual checkboxes in DOM
    const checkboxes = DOM.blockListGrid.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => cb.disabled = disabled);
}

// --- LOGGING OUT ---
DOM.btnLogout.addEventListener('click', logout);

function logout() {
    log('Verbindung getrennt.', 'system');
    state.session = null;
    state.blockedUsers = [];
    state.isProcessing = false;
    state.isPaused = false;
    if (state.abortController) {
        state.abortController.abort();
    }
    
    DOM.workspaceSection.classList.add('hidden');
    DOM.loginSection.classList.remove('hidden');
    DOM.finishedControls.classList.add('hidden');
    DOM.identifierInput.value = '';
    DOM.passwordInput.value = '';
    DOM.loginError.classList.add('hidden');
    
    // Clear list
    DOM.blockListGrid.innerHTML = '';
}

// --- LOGIN HANDLER ---
DOM.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    let serverUrl = DOM.serverUrlInput.value.trim() || 'https://bsky.social';
    if (!/^https?:\/\//i.test(serverUrl)) {
        serverUrl = 'https://' + serverUrl;
    }
    const identifier = DOM.identifierInput.value.trim();
    const password = DOM.passwordInput.value.trim();
    
    DOM.btnLogin.disabled = true;
    DOM.btnLogin.querySelector('span').classList.add('hidden');
    DOM.btnLogin.querySelector('.spinner').classList.remove('hidden');
    DOM.loginError.classList.add('hidden');
    
    log(`Verbinde mit ${serverUrl}...`, 'system');
    
    try {
        state.abortController = new AbortController();
        
        // 1. Create Session
        const sessionData = await apiFetch(`${serverUrl}/xrpc/com.atproto.server.createSession`, {
            method: 'POST',
            body: JSON.stringify({ identifier, password })
        });
        
        state.session = {
            serverUrl,
            did: sessionData.did,
            accessJwt: sessionData.accessJwt,
            handle: sessionData.handle,
            displayName: sessionData.handle, // Fallback
            avatar: ''
        };
        
        log(`Erfolgreich angemeldet als ${sessionData.handle}`, 'success');
        
        // 2. Load User Profile details (for avatar/name in header)
        try {
            const profileData = await apiFetch(`${serverUrl}/xrpc/app.bsky.actor.getProfile?actor=${sessionData.did}`);
            state.session.displayName = profileData.displayName || sessionData.handle;
            state.session.avatar = profileData.avatar || '';
        } catch (profileError) {
            log('Profilinformationen konnten nicht vollständig geladen werden, verwende Standardwerte.', 'warning');
        }
        
        // Update user profile card
        DOM.userDisplayName.textContent = state.session.displayName;
        DOM.userHandle.textContent = `@${state.session.handle}`;
        if (state.session.avatar) {
            DOM.userAvatar.src = state.session.avatar;
            DOM.userAvatar.classList.remove('hidden');
            DOM.userAvatarPlaceholder.classList.add('hidden');
        } else {
            DOM.userAvatar.classList.add('hidden');
            DOM.userAvatarPlaceholder.classList.remove('hidden');
        }
        
        // Switch section
        DOM.loginSection.classList.add('hidden');
        DOM.workspaceSection.classList.remove('hidden');
        
        // Load Blocklist
        await fetchAllBlocks();
        
    } catch (err) {
        log(`Verbindungsfehler: ${getErrorMessage(err)}`, 'error');
        DOM.loginError.textContent = `Verbindung fehlgeschlagen: ${getErrorMessage(err)}`;
        DOM.loginError.classList.remove('hidden');
    } finally {
        DOM.btnLogin.disabled = false;
        DOM.btnLogin.querySelector('span').classList.remove('hidden');
        DOM.btnLogin.querySelector('.spinner').classList.add('hidden');
        state.abortController = null;
    }
});

// Fetch all existing block rkeys in the repo to identify phantom blocks
async function fetchRepoBlockRkeys() {
    state.repoRkeys = new Set();
    let cursor = '';
    let pageCount = 1;
    
    try {
        do {
            let url = `${state.session.serverUrl}/xrpc/com.atproto.repo.listRecords?repo=${state.session.did}&collection=app.bsky.graph.block&limit=100`;
            if (cursor) {
                url += `&cursor=${encodeURIComponent(cursor)}`;
            }
            
            const data = await apiFetch(url);
            const records = data.records || [];
            
            records.forEach(r => {
                const rkey = r.uri.split('/').pop();
                state.repoRkeys.add(rkey);
            });
            
            cursor = data.cursor;
            pageCount++;
            
            if (pageCount > 150) break; // safety break
            
        } while (cursor);
        
        log(`Repository-Abgleich abgeschlossen. ${state.repoRkeys.size} aktive Block-Einträge im Repo gefunden.`, 'info');
    } catch (err) {
        log(`Warnung beim Repository-Abgleich: ${getErrorMessage(err)}. Einige Blocks könnten unvollständig gelöscht werden.`, 'warning');
    }
}

// --- FETCH BLOCKS ---
async function fetchAllBlocks() {
    DOM.loadingBlocks.classList.remove('hidden');
    DOM.emptyBlocks.classList.add('hidden');
    DOM.blockListGrid.classList.add('hidden');
    setActionButtonsDisabled(true);
    
    state.blockedUsers = [];
    updateStats();
    
    log('Rufe blockierte Konten ab...', 'system');
    
    let cursor = '';
    let pageCount = 1;
    
    try {
        state.abortController = new AbortController();
        
        do {
            DOM.loadingCursorText.textContent = `Hole Seite ${pageCount}...`;
            let url = `${state.session.serverUrl}/xrpc/app.bsky.graph.getBlocks?limit=100`;
            if (cursor) {
                url += `&cursor=${encodeURIComponent(cursor)}`;
            }
            
            const data = await apiFetch(url);
            const blocks = data.blocks || [];
            
            log(`Seite ${pageCount}: ${blocks.length} Block(s) geladen.`, 'info');
            
            blocks.forEach(block => {
                const rkey = parseRkey(block.viewer?.blocking);
                state.blockedUsers.push({
                    did: block.did,
                    handle: block.handle,
                    displayName: block.displayName || block.handle,
                    avatar: block.avatar || '',
                    rkey: rkey,
                    indexedAt: block.indexedAt, // Save the timestamp!
                    status: 'blocked',
                    selected: false // Default to unselected
                });
            });
            
            cursor = data.cursor;
            pageCount++;
            
            // Safety break just in case
            if (pageCount > 100) {
                log('Warnung: Zu viele Block-Seiten geladen. Suche wurde abgebrochen.', 'warning');
                break;
            }
            
        } while (cursor);
        
        log(`Blockliste vollständig geladen. Gesamt: ${state.blockedUsers.length} blockierte Konten.`, 'success');
        
        DOM.loadingCursorText.textContent = `Gleiche Repository ab (Suche nach Phantom-Blocks)...`;
        await fetchRepoBlockRkeys();
        
    } catch (err) {
        log(`Fehler beim Laden der Blockliste: ${getErrorMessage(err)}`, 'error');
    } finally {
        DOM.loadingBlocks.classList.add('hidden');
        state.abortController = null;
        updateStats();
        renderBlocklist();
        setActionButtonsDisabled(false);
    }
}

// --- SEARCH & SELECTION CONTROLS ---

DOM.searchInput.addEventListener('input', () => {
    renderBlocklist();
});

DOM.selectSort.addEventListener('change', () => {
    renderBlocklist();
});

DOM.chkFilterInactive.addEventListener('change', () => {
    renderBlocklist();
});

DOM.chkDryRun.addEventListener('change', () => {
    state.isDryRun = DOM.chkDryRun.checked;
    if (state.isDryRun) {
        log('Simulationsmodus (Dry-Run) aktiviert. Schreibzugriffe werden nur simuliert.', 'warning');
    } else {
        log('Simulationsmodus deaktiviert. Aktionen werden direkt ausgeführt.', 'info');
    }
});

DOM.btnSelectAll.addEventListener('click', () => {
    // Select all visible (filtered) accounts
    const query = DOM.searchInput.value.toLowerCase().trim();
    state.blockedUsers.forEach(user => {
        if (user.status === 'blocked') {
            const handleMatch = user.handle.toLowerCase().includes(query);
            const nameMatch = (user.displayName || '').toLowerCase().includes(query);
            if (handleMatch || nameMatch) {
                user.selected = true;
            }
        }
    });
    updateStats();
    renderBlocklist();
    log('Alle angezeigten Konten markiert.', 'info');
});

DOM.btnSelect24h.addEventListener('click', () => selectBlocksByTimeframe(24));
DOM.btnSelect48h.addEventListener('click', () => selectBlocksByTimeframe(48));
DOM.btnSelectPhantoms.addEventListener('click', () => {
    let count = 0;
    state.blockedUsers.forEach(user => {
        const isPhantom = !state.repoRkeys.has(user.rkey);
        if (user.status === 'blocked' && isPhantom) {
            user.selected = true;
            count++;
        } else {
            user.selected = false;
        }
    });
    updateStats();
    renderBlocklist();
    log(`Es wurden ${count} Phantom-Blocks ausgewählt.`, 'info');
});
DOM.btnSelectCustom.addEventListener('click', () => {
    const value = parseInt(DOM.inputCustomTime.value, 10);
    const unit = DOM.selectCustomUnit.value;
    if (isNaN(value) || value <= 0) {
        alert('Bitte gib eine gültige Zahl ein.');
        return;
    }
    const hours = unit === 'h' ? value : value * 24;
    selectBlocksByTimeframe(hours);
});

function selectBlocksByTimeframe(hours) {
    const now = new Date();
    let count = 0;
    state.blockedUsers.forEach(user => {
        if (user.status === 'blocked' && user.indexedAt) {
            const blockTime = new Date(user.indexedAt);
            const diffHours = (now - blockTime) / (1000 * 60 * 60);
            if (diffHours <= hours) {
                user.selected = true;
                count++;
            } else {
                user.selected = false;
            }
        } else {
            user.selected = false;
        }
    });
    updateStats();
    renderBlocklist();
    
    let timeText = '';
    if (hours % 24 === 0) {
        const days = hours / 24;
        timeText = days === 1 ? 'letzten 24 Stunden (1 Tag)' : `letzten ${days} Tagen`;
    } else {
        timeText = hours === 1 ? 'letzten Stunde' : `letzten ${hours} Stunden`;
    }
    log(`Es wurden ${count} Konten aus den ${timeText} ausgewählt.`, 'info');
}

DOM.btnDeselectAll.addEventListener('click', () => {
    state.blockedUsers.forEach(user => {
        user.selected = false;
    });
    updateStats();
    renderBlocklist();
    log('Auswahl vollständig aufgehoben.', 'info');
});

// --- UNBLOCK EXECUTION ---

DOM.btnUnblockSelected.addEventListener('click', () => {
    const listToUnblock = state.blockedUsers.filter(u => u.selected && u.status !== 'unblocked');
    if (listToUnblock.length === 0) {
        alert('Bitte wähle mindestens ein Konto aus der Liste aus!');
        return;
    }
    startUnblockingFlow(listToUnblock);
});

DOM.btnUnblockAll.addEventListener('click', () => {
    const listToUnblock = state.blockedUsers.filter(u => u.status !== 'unblocked');
    if (listToUnblock.length === 0) {
        alert('Keine blockierten Konten zum Entfernen vorhanden!');
        return;
    }
    
    const confirmMessage = `Bist du sicher, dass du ALLE ${listToUnblock.length} Blocks auf einmal aufheben möchtest? Dies kann nicht rückgängig gemacht werden.`;
    if (confirm(confirmMessage)) {
        startUnblockingFlow(listToUnblock);
    }
});

DOM.btnMuteSelected.addEventListener('click', () => {
    const listToMute = state.blockedUsers.filter(u => u.selected && u.status !== 'unblocked');
    if (listToMute.length === 0) {
        alert('Bitte wähle mindestens ein Konto aus der Liste aus!');
        return;
    }
    
    const confirmMessage = `Möchtest du die ${listToMute.length} ausgewählten Accounts stummschalten und gleichzeitig entblocken?`;
    if (confirm(confirmMessage)) {
        startMutingFlow(listToMute);
    }
});

// Start the muting flow (convert blocks to mute)
function startMutingFlow(users) {
    state.queue = users.map(u => u.did);
    state.runTotal = users.length;
    state.isProcessing = true;
    state.isPaused = false;
    state.activeWorker = processMuteQueue;
    
    // UI state adjustments
    setActionButtonsDisabled(true);
    DOM.progressContainer.classList.remove('hidden');
    DOM.executionControls.classList.remove('hidden');
    DOM.finishedControls.classList.add('hidden');
    DOM.btnPause.classList.remove('hidden');
    DOM.btnResume.classList.add('hidden');
    DOM.btnCancel.disabled = false;
    
    log(`Starte die Umwandlung von ${state.queue.length} Blocks in Stummschaltung...`, 'system');
    updateStats();
    renderBlocklist();
    
    state.abortController = new AbortController();
    
    // Start processing queue with muting worker
    processMuteQueue();
}

async function processMuteQueue() {
    const CONCURRENCY = 4;
    const THROTTLE_DELAY = 100;
    const workers = [];
    
    const worker = async () => {
        while (state.queue.length > 0 && state.isProcessing && !state.isPaused) {
            const currentDid = state.queue.shift();
            if (!currentDid) continue;
            
            const user = state.blockedUsers.find(u => u.did === currentDid);
            if (!user) continue;
            
            user.status = 'processing';
            updateUserCardUI(user);
            updateStats();
            
            try {
                await new Promise(resolve => setTimeout(resolve, THROTTLE_DELAY));
                
                if (!state.isProcessing || state.isPaused) {
                    state.queue.unshift(currentDid);
                    user.status = 'blocked';
                    updateUserCardUI(user);
                    updateStats();
                    break;
                }
                
                if (state.isDryRun) {
                    log(`[Dry-Run] Würde @${user.handle} stummschalten und Block aufheben.`, 'success');
                    user.status = 'unblocked';
                    user.selected = false;
                } else {
                    // 1. Mute actor
                    log(`Mute @${user.handle}...`, 'info');
                    await apiFetch(`${state.session.serverUrl}/xrpc/com.atproto.graph.muteActor`, {
                        method: 'POST',
                        body: JSON.stringify({ actor: currentDid })
                    });
                    
                    // 2. Unblock (check if phantom first)
                    const isPhantom = !state.repoRkeys.has(user.rkey);
                    if (isPhantom) {
                        log(`Phantom-Block für @${user.handle} wird materialisiert...`, 'info');
                        await apiFetch(`${state.session.serverUrl}/xrpc/com.atproto.repo.putRecord`, {
                            method: 'POST',
                            body: JSON.stringify({
                                repo: state.session.did,
                                collection: 'app.bsky.graph.block',
                                rkey: user.rkey,
                                record: {
                                    $type: 'app.bsky.graph.block',
                                    subject: user.did,
                                    createdAt: new Date().toISOString()
                                }
                            })
                        });
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }
                    
                    // Delete the block record from repo
                    await apiFetch(`${state.session.serverUrl}/xrpc/com.atproto.repo.deleteRecord`, {
                        method: 'POST',
                        body: JSON.stringify({
                            repo: state.session.did,
                            collection: 'app.bsky.graph.block',
                            rkey: user.rkey
                        })
                    });
                    
                    // Verification
                    let isDeleted = false;
                    const MAX_RETRIES = 3;
                    for (let retry = 1; retry <= MAX_RETRIES; retry++) {
                        await new Promise(resolve => setTimeout(resolve, retry * 250));
                        try {
                            await apiFetch(`${state.session.serverUrl}/xrpc/com.atproto.repo.getRecord?repo=${state.session.did}&collection=app.bsky.graph.block&rkey=${user.rkey}`);
                            isDeleted = false;
                        } catch (getErr) {
                            const errStr = getErr.message.toLowerCase();
                            if (errStr.includes('not found') || errStr.includes('could not locate') || errStr.includes('fehler 400') || errStr.includes('fehler 404') || errStr.includes('does not exist')) {
                                isDeleted = true;
                                break;
                            }
                        }
                    }
                    
                    if (!isDeleted) {
                        throw new Error('Verifizierung fehlgeschlagen: Block existiert weiterhin.');
                    }
                    
                    user.status = 'unblocked';
                    user.selected = false;
                    log(`Erfolgreich stummgeschaltet und Block aufgehoben: @${user.handle}`, 'success');
                }
            } catch (err) {
                user.status = 'error';
                log(`Fehler bei @${user.handle} (Mute/Unblock): ${getErrorMessage(err)}`, 'error');
            }
            
            updateUserCardUI(user);
            updateStats();
        }
    };
    
    for (let i = 0; i < Math.min(CONCURRENCY, state.queue.length); i++) {
        workers.push(worker());
    }
    
    await Promise.all(workers);
    
    if (state.queue.length === 0 && state.isProcessing && !state.isPaused) {
        log('Umwandlung in Stummschaltung abgeschlossen!', 'success');
        finishUnblockingFlow();
    }
}

// Start the unblocking flow
function startUnblockingFlow(users) {
    state.queue = users.map(u => u.did);
    state.runTotal = users.length;
    state.isProcessing = true;
    state.isPaused = false;
    state.activeWorker = processQueue;
    
    // UI state adjustments
    setActionButtonsDisabled(true);
    DOM.progressContainer.classList.remove('hidden');
    DOM.executionControls.classList.remove('hidden');
    DOM.finishedControls.classList.add('hidden');
    DOM.btnPause.classList.remove('hidden');
    DOM.btnResume.classList.add('hidden');
    DOM.btnCancel.disabled = false;
    
    log(`Starte das Aufheben von ${state.queue.length} Blocks...`, 'system');
    updateStats();
    renderBlocklist(); // Redraw to update disabled elements
    
    state.abortController = new AbortController();
    
    // Start processing queue
    processQueue();
}

// Process the unblocking queue in batches (concurrency of 3-5 requests)
async function processQueue() {
    const CONCURRENCY = 4; // Number of concurrent requests
    const THROTTLE_DELAY = 100; // ms delay between requests to be rate-limit safe
    
    const workers = [];
    
    const worker = async () => {
        while (state.queue.length > 0 && state.isProcessing && !state.isPaused) {
            const currentDid = state.queue.shift();
            if (!currentDid) continue;
            
            const user = state.blockedUsers.find(u => u.did === currentDid);
            if (!user) continue;
            
            // Set individual status to processing
            user.status = 'processing';
            updateUserCardUI(user);
            updateStats();
            
            try {
                // Throttle slightly
                await new Promise(resolve => setTimeout(resolve, THROTTLE_DELAY));
                
                if (!state.isProcessing || state.isPaused) {
                    // Push back if cancelled/paused mid-loop
                    state.queue.unshift(currentDid);
                    user.status = 'blocked';
                    updateUserCardUI(user);
                    updateStats();
                    break;
                }
                
                if (state.isDryRun) {
                    user.status = 'unblocked';
                    user.selected = false;
                    const progressText = `[${state.runTotal - state.queue.length}/${state.runTotal}]`;
                    log(`[Dry-Run] ${progressText} Würde @${user.handle} entblocken und verifizieren.`, 'success');
                } else {
                    // Check if it is a phantom block (exists on AppView/Relay but not in PDS repo)
                    const isPhantom = !state.repoRkeys.has(user.rkey);
                    if (isPhantom) {
                        log(`Phantom-Block für @${user.handle} wird materialisiert...`, 'info');
                        await apiFetch(`${state.session.serverUrl}/xrpc/com.atproto.repo.putRecord`, {
                            method: 'POST',
                            body: JSON.stringify({
                                repo: state.session.did,
                                collection: 'app.bsky.graph.block',
                                rkey: user.rkey,
                                record: {
                                    $type: 'app.bsky.graph.block',
                                    subject: user.did,
                                    createdAt: new Date().toISOString()
                                }
                            })
                        });
                        // Wait a moment for PDS db indexing/firehose queuing
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }
                    
                    // Execute unblock API call
                    await apiFetch(`${state.session.serverUrl}/xrpc/com.atproto.repo.deleteRecord`, {
                        method: 'POST',
                        body: JSON.stringify({
                            repo: state.session.did,
                            collection: 'app.bsky.graph.block',
                            rkey: user.rkey
                        })
                    });
                    
                    // Verification check: Verify on the PDS that the record is really gone!
                    let isDeleted = false;
                    const MAX_RETRIES = 3;
                    for (let retry = 1; retry <= MAX_RETRIES; retry++) {
                        // Wait a moment before checking (250ms, 500ms, 750ms) to allow PDS database indexing
                        await new Promise(resolve => setTimeout(resolve, retry * 250));
                        
                        try {
                            // Try to get the record. If it throws an error (e.g. record not found), then it is successfully deleted.
                            await apiFetch(`${state.session.serverUrl}/xrpc/com.atproto.repo.getRecord?repo=${state.session.did}&collection=app.bsky.graph.block&rkey=${user.rkey}`);
                            // If no error is thrown, the record still exists!
                            isDeleted = false;
                        } catch (getErr) {
                            const errStr = getErr.message.toLowerCase();
                            if (errStr.includes('not found') || errStr.includes('could not locate') || errStr.includes('fehler 400') || errStr.includes('fehler 404') || errStr.includes('does not exist')) {
                                isDeleted = true;
                                break; // Successfully verified deletion!
                            } else {
                                // Some other network error, we can log a warning and retry
                                log(`Verifizierungs-Warnung bei @${user.handle} (Versuch ${retry}): ${getErr.message}`, 'warning');
                            }
                        }
                    }
                    
                    if (!isDeleted) {
                        throw new Error('Verifizierung fehlgeschlagen: Der Block-Eintrag existiert nach dem Löschen weiterhin auf dem PDS.');
                    }
                    
                    // Success
                    user.status = 'unblocked';
                    user.selected = false; // clear selection
                    const progressText = `[${state.runTotal - state.queue.length}/${state.runTotal}]`;
                    log(`${progressText} Erfolgreich unblocked und PDS-Löschung verifiziert: @${user.handle}`, 'success');
                }
                
            } catch (err) {
                // Error
                user.status = 'error';
                const progressText = `[${state.runTotal - state.queue.length}/${state.runTotal}]`;
                log(`${progressText} Fehler bei @${user.handle}: ${getErrorMessage(err)}`, 'error');
            }
            
            updateUserCardUI(user);
            updateStats();
        }
    };
    
    // Spawn workers
    for (let i = 0; i < Math.min(CONCURRENCY, state.queue.length); i++) {
        workers.push(worker());
    }
    
    // Wait for all workers to finish
    await Promise.all(workers);
    
    // Check final status
    if (state.queue.length === 0 && state.isProcessing && !state.isPaused) {
        log('Alle unblock-Vorgänge abgeschlossen!', 'success');
        finishUnblockingFlow();
    }
}

// Update specific element in DOM without rebuilding the full grid
function updateUserCardUI(user) {
    const safeId = user.did.replace(':', '_');
    const card = document.getElementById(`block-card-${safeId}`);
    if (card) {
        const isPhantom = !state.repoRkeys.has(user.rkey);
        card.className = `block-item fade-in ${user.status} ${isPhantom ? 'phantom' : ''}`;
        
        const badge = card.querySelector('.block-status-badge');
        if (badge) {
            let statusLabel = 'Blockiert';
            badge.className = 'block-status-badge';
            if (user.status === 'processing') statusLabel = 'Löst...';
            if (user.status === 'unblocked') statusLabel = 'Entfernt';
            if (user.status === 'error') statusLabel = 'Fehler';
            if (user.status === 'blocked' && isPhantom) {
                statusLabel = '👻 Phantom';
                badge.className = 'block-status-badge phantom';
            }
            badge.textContent = statusLabel;
        }
        
        const checkbox = card.querySelector('input[type="checkbox"]');
        if (checkbox) {
            checkbox.checked = user.selected;
            checkbox.disabled = !(!state.isProcessing && user.status === 'blocked');
        }
    }
}

// Complete the unblocking process and restore controls
function finishUnblockingFlow() {
    state.isProcessing = false;
    state.isPaused = false;
    state.queue = [];
    state.abortController = null;
    
    DOM.progressContainer.classList.add('hidden');
    DOM.executionControls.classList.add('hidden');
    DOM.finishedControls.classList.remove('hidden');
    
    setActionButtonsDisabled(false);
    updateStats();
    renderBlocklist();
    
    log('Alle Löschungen wurden erfolgreich auf deinem PDS-Server durchgeführt und verifiziert.', 'success');
    log('⚠️ WICHTIG: Falls dein PDS-Server (z.B. eine eigene PDS-Instanz) verzögert mit dem Bluesky-Relay synchronisiert, kann es eine Weile dauern, bis unblockierte Profile in der offiziellen App (bsky.app) als entblockt angezeigt werden.', 'warning');
}

// Pause Execution
DOM.btnPause.addEventListener('click', () => {
    if (!state.isProcessing || state.isPaused) return;
    
    state.isPaused = true;
    log('Ausführung pausiert. Aktuelle API-Aufrufe werden beendet...', 'warning');
    
    DOM.btnPause.classList.add('hidden');
    DOM.btnResume.classList.remove('hidden');
});

// Resume Execution
DOM.btnResume.addEventListener('click', () => {
    if (!state.isProcessing || !state.isPaused) return;
    
    state.isPaused = false;
    log('Ausführung fortgesetzt...', 'system');
    
    DOM.btnPause.classList.remove('hidden');
    DOM.btnResume.classList.add('hidden');
    
    // Spawn workers again
    processQueue();
});

// Cancel/Abort Execution
DOM.btnCancel.addEventListener('click', () => {
    const confirmCancel = confirm('Möchtest du den gesamten Unblock-Vorgang abbrechen? Bereits aufgehobene Blocks werden nicht wiederhergestellt.');
    if (!confirmCancel) return;
    
    log('Unblock-Vorgang abgebrochen.', 'warning');
    
    // Cancel any active fetches
    if (state.abortController) {
        state.abortController.abort();
    }
    
    // Reset queue and any active 'processing' items back to 'blocked'
    state.queue = [];
    state.blockedUsers.forEach(u => {
        if (u.status === 'processing') {
            u.status = 'blocked';
        }
    });
    
    finishUnblockingFlow();
});

// Clear Logs Console
DOM.btnClearLogs.addEventListener('click', () => {
    DOM.logTerminal.innerHTML = '<div class="log-entry system">[System] Protokoll geleert.</div>';
});

// JSON Backup Export
DOM.btnExportJson.addEventListener('click', () => {
    if (state.blockedUsers.length === 0) {
        alert('Keine blockierten Konten zum Exportieren vorhanden.');
        return;
    }
    
    const dataToExport = state.blockedUsers.map(u => ({
        did: u.did,
        handle: u.handle,
        displayName: u.displayName,
        rkey: u.rkey,
        indexedAt: u.indexedAt
    }));
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const handle = state.session ? state.session.handle : 'bluesky';
    const date = new Date().toISOString().split('T')[0];
    
    a.href = url;
    a.download = `bluesky-blocklist-${handle}-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    log(`Blockliste mit ${dataToExport.length} Konten erfolgreich exportiert.`, 'success');
});

// JSON Backup Import
DOM.btnImportJson.addEventListener('click', () => {
    DOM.inputImportFile.click();
});

DOM.inputImportFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
        try {
            const imported = JSON.parse(evt.target.result);
            if (!Array.isArray(imported)) {
                throw new Error('Ungültiges Dateiformat. Backup muss ein JSON-Array sein.');
            }
            
            // Validate entries
            const validEntries = imported.filter(u => u && typeof u === 'object' && u.did);
            if (validEntries.length === 0) {
                throw new Error('Keine gültigen Block-Einträge gefunden.');
            }
            
            log(`Backup geladen: ${validEntries.length} Einträge gefunden.`, 'info');
            
            // Check which ones are missing
            const currentDids = new Set(state.blockedUsers.filter(u => u.status !== 'unblocked').map(u => u.did));
            const missing = validEntries.filter(u => !currentDids.has(u.did));
            
            if (missing.length === 0) {
                alert(`Alle ${validEntries.length} Konten aus dem Backup sind bereits blockiert! Keine Aktion erforderlich.`);
                log('Import-Abgleich abgeschlossen: Keine fehlenden Blocks gefunden.', 'info');
                return;
            }
            
            const confirmMsg = `Backup enthält ${validEntries.length} Konten. Davon fehlen ${missing.length} auf deinem Account.\n\nMöchtest du diese ${missing.length} Konten jetzt wieder blockieren (wiederherstellen)?`;
            if (confirm(confirmMsg)) {
                await startRestoringFlow(missing);
            }
            
        } catch (err) {
            alert(`Fehler beim Importieren: ${err.message}`);
            log(`Fehler beim Backup-Import: ${err.message}`, 'error');
        } finally {
            DOM.inputImportFile.value = '';
        }
    };
    reader.readAsText(file);
});

// Start the block restoring flow
async function startRestoringFlow(usersToRestore) {
    state.queue = usersToRestore.map(u => u.did);
    state.runTotal = usersToRestore.length;
    state.isProcessing = true;
    state.isPaused = false;
    
    // UI state adjustments
    setActionButtonsDisabled(true);
    DOM.progressContainer.classList.remove('hidden');
    DOM.executionControls.classList.remove('hidden');
    DOM.btnPause.classList.remove('hidden');
    DOM.btnResume.classList.add('hidden');
    DOM.btnCancel.disabled = false;
    
    log(`Starte die Wiederherstellung von ${state.queue.length} Blocks...`, 'system');
    updateStats();
    
    state.abortController = new AbortController();
    
    const CONCURRENCY = 4;
    const THROTTLE_DELAY = 100;
    const workers = [];
    
    const worker = async () => {
        while (state.queue.length > 0 && state.isProcessing && !state.isPaused) {
            const currentDid = state.queue.shift();
            if (!currentDid) continue;
            
            const user = usersToRestore.find(u => u.did === currentDid);
            if (!user) continue;
            
            log(`Stelle Block für ${user.handle || currentDid} wieder her...`, 'info');
            
            try {
                await new Promise(resolve => setTimeout(resolve, THROTTLE_DELAY));
                
                if (!state.isProcessing || state.isPaused) {
                    state.queue.unshift(currentDid);
                    break;
                }
                
                if (state.isDryRun) {
                    log(`[Dry-Run] Würde Block für ${user.handle || currentDid} wiederherstellen.`, 'success');
                    continue;
                }
                
                await apiFetch(`${state.session.serverUrl}/xrpc/com.atproto.repo.createRecord`, {
                    method: 'POST',
                    body: JSON.stringify({
                        repo: state.session.did,
                        collection: 'app.bsky.graph.block',
                        record: {
                            $type: 'app.bsky.graph.block',
                            subject: currentDid,
                            createdAt: new Date().toISOString()
                        }
                    })
                });
                
                log(`Erfolgreich wiederhergestellt: ${user.handle || currentDid}`, 'success');
            } catch (err) {
                log(`Fehler beim Wiederherstellen von ${user.handle || currentDid}: ${getErrorMessage(err)}`, 'error');
            }
            
            updateStats();
        }
    };
    
    for (let i = 0; i < Math.min(CONCURRENCY, state.queue.length); i++) {
        workers.push(worker());
    }
    
    await Promise.all(workers);
    
    if (state.queue.length === 0 && state.isProcessing && !state.isPaused) {
        log('Wiederherstellung abgeschlossen!', 'success');
        state.isProcessing = false;
        DOM.progressContainer.classList.add('hidden');
        DOM.executionControls.classList.add('hidden');
        setActionButtonsDisabled(false);
        await fetchAllBlocks();
    }
}

// Rescan Blocklist Handlers
DOM.btnRescan.addEventListener('click', () => {
    if (state.isProcessing) return;
    fetchAllBlocks();
});

DOM.btnRescanFinished.addEventListener('click', () => {
    if (state.isProcessing) return;
    DOM.finishedControls.classList.add('hidden');
    fetchAllBlocks();
});
