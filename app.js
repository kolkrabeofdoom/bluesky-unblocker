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
    activeWorker: null,
    whitelist: new Set(), // Set of DIDs that are whitelisted and protected
    savedProfiles: [],    // List of saved profiles for Multi-Account manager
    // Follower Copier Feature additions
    myFollows: new Set(),       // Set of DIDs followed by logged-in user
    myFollowers: new Set(),     // Set of DIDs following the logged-in user
    myFollowsRkeys: new Map(),  // Map of DID -> follow record key (rkey)
    myFollowsLoaded: false,
    myFollowersLoaded: false,
    targetFollowers: [],        // Loaded target followers: [{ did, handle, displayName, avatar, relation, status, selected }]
    targetCursor: '',           // Pagination cursor for target followers
    isFetchingFollowers: false,
    followQueue: [],            // Queue of DIDs to follow
    followRunTotal: 0,
    isFollowProcessing: false,
    isFollowPaused: false,
    
    // Advanced Follower Tools Additions
    followerMode: 'copy',       // 'copy' (Follower kopieren) or 'clean' (Unfollow-Cleaner)
    detailedProfilesMap: new Map(), // Map of DID -> detailed profile object

    // Four New Tabs State
    overlapFollowers: [],        // [{ did, handle, displayName, avatar, relation, status, selected, targetsFollowed: [] }]
    ghostFollowers: [],          // [{ did, handle, displayName, avatar, relation, status, selected }]
    authorPosts: [],             // [{ uri, cid, text, createdAt }]
    selectedPostReplies: [],     // [{ did, handle, displayName, avatar, relation, status, selected, replyText, isSpam }]
    userLists: [],               // [{ uri, rkey, name, purpose, description }]
    selectedListMembers: [],     // [{ did, handle, displayName, avatar, relation, status, selected, rkey }]

    // C.T.H.U.L.H.U. v1.3.0 Additions
    timelineActors: [],          // [{ did, handle, displayName, avatar, relation, status, selected, postsCount, repostCount, quoteCount }]
    actionHistory: []            // [{ id, type, description, timestamp, targets: [] }]
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
    
    savedProfilesContainer: document.getElementById('saved-profiles-container'),
    savedProfilesList: document.getElementById('saved-profiles-list'),
    chkSaveProfile: document.getElementById('chk-save-profile'),
    
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
    
    btnToggleAnalysis: document.getElementById('btn-toggle-analysis'),
    analysisArrow: document.getElementById('analysis-arrow'),
    analysisContent: document.getElementById('analysis-content'),
    chartContainer: document.getElementById('chart-container'),
    
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
    btnCleanInactives: document.getElementById('btn-clean-inactives'),
    visibleCountBadge: document.getElementById('visible-count-badge'),
    btnRescan: document.getElementById('btn-rescan'),
    
    btnExportJson: document.getElementById('btn-export-json'),
    btnImportJson: document.getElementById('btn-import-json'),
    inputImportFile: document.getElementById('input-import-file'),
    
    btnExportList: document.getElementById('btn-export-list'),
    btnImportList: document.getElementById('btn-import-list'),
    
    loadingBlocks: document.getElementById('loading-blocks'),
    loadingCursorText: document.getElementById('loading-cursor-text'),
    emptyBlocks: document.getElementById('empty-blocks'),
    blockListGrid: document.getElementById('block-list-grid'),
    
    logTerminal: document.getElementById('log-terminal'),
    btnClearLogs: document.getElementById('btn-clear-logs'),
    
    // Follower Copier UI additions
    tabBtnBlocklist: document.getElementById('tab-btn-blocklist'),
    tabBtnFollowers: document.getElementById('tab-btn-followers'),
    tabBlocklist: document.getElementById('tab-blocklist'),
    tabFollowers: document.getElementById('tab-followers'),
    
    targetIdentifierInput: document.getElementById('target-identifier'),
    btnLoadTarget: document.getElementById('btn-load-target'),
    followersTargetForm: document.getElementById('followers-target-form'),
    ownDataStatusText: document.getElementById('own-data-status-text'),
    btnReloadOwnData: document.getElementById('btn-reload-own-data'),
    
    statTargetLoaded: document.getElementById('stat-target-loaded'),
    statTargetSelected: document.getElementById('stat-target-selected'),
    statTargetMutual: document.getElementById('stat-target-mutual'),
    statTargetBlocked: document.getElementById('stat-target-blocked'),
    
    followProgressContainer: document.getElementById('follow-progress-container'),
    followProgressBar: document.getElementById('follow-progress-bar'),
    followProgressText: document.getElementById('follow-progress-text'),
    followExecutionControls: document.getElementById('follow-execution-controls'),
    btnFollowPause: document.getElementById('btn-follow-pause'),
    btnFollowResume: document.getElementById('btn-follow-resume'),
    btnFollowCancel: document.getElementById('btn-follow-cancel'),
    
    followerSearchInput: document.getElementById('follower-search-input'),
    selectRelationshipFilter: document.getElementById('select-relationship-filter'),
    btnFollowerSelectAll: document.getElementById('btn-follower-select-all'),
    btnFollowerDeselectAll: document.getElementById('btn-follower-deselect-all'),
    btnFollowSelected: document.getElementById('btn-follow-selected'),
    
    followerVisibleCountBadge: document.getElementById('follower-visible-count-badge'),
    btnLoadMoreTarget: document.getElementById('btn-load-more-target'),
    btnLoadAllTarget: document.getElementById('btn-load-all-target'),
    loadingFollowers: document.getElementById('loading-followers'),
    loadingFollowersCursorText: document.getElementById('loading-followers-cursor-text'),
    emptyFollowers: document.getElementById('empty-followers'),
    followerListGrid: document.getElementById('follower-list-grid'),
    
    // Advanced Follower Tools UI Additions
    btnModeCopy: document.getElementById('btn-mode-copy'),
    btnModeClean: document.getElementById('btn-mode-clean'),
    followersTargetFormWrapper: document.getElementById('followers-target-form-wrapper'),
    unfollowCleanerWrapper: document.getElementById('unfollow-cleaner-wrapper'),
    btnAnalyzeUnfollow: document.getElementById('btn-analyze-unfollow'),
    labelStatMutual: document.getElementById('label-stat-mutual'),
    labelStatBlocked: document.getElementById('label-stat-blocked'),
    selectQualityFilter: document.getElementById('select-quality-filter'),
    btnUnfollowSelected: document.getElementById('btn-unfollow-selected'),
    btnFollowerExportCsv: document.getElementById('btn-follower-export-csv'),
    btnFollowerExportJson: document.getElementById('btn-follower-export-json'),
    btnFollowerImportCustom: document.getElementById('btn-follower-import-custom'),
    inputFollowerImportFile: document.getElementById('input-follower-import-file'),
    inputNewListName: document.getElementById('input-new-list-name'),
    btnFollowerAddToList: document.getElementById('btn-follower-add-to-list'),
    followersControlTitle: document.getElementById('followers-control-title'),
    followerListTitle: document.getElementById('follower-list-title'),
    emptyFollowersText: document.getElementById('empty-followers-text'),

    // Tab Buttons
    tabBtnOverlap: document.getElementById('tab-btn-overlap'),
    tabBtnGhosts: document.getElementById('tab-btn-ghosts'),
    tabBtnInteractions: document.getElementById('tab-btn-interactions'),
    tabBtnLists: document.getElementById('tab-btn-lists'),

    // Tab Content Panels
    tabOverlap: document.getElementById('tab-overlap'),
    tabGhosts: document.getElementById('tab-ghosts'),
    tabInteractions: document.getElementById('tab-interactions'),
    tabLists: document.getElementById('tab-lists'),

    // Overlap Analyzer elements
    overlapForm: document.getElementById('overlap-form'),
    overlapTarget1: document.getElementById('overlap-target-1'),
    overlapTarget2: document.getElementById('overlap-target-2'),
    overlapTarget3: document.getElementById('overlap-target-3'),
    btnLoadOverlap: document.getElementById('btn-load-overlap'),
    statOverlapLoaded: document.getElementById('stat-overlap-loaded'),
    statOverlapSelected: document.getElementById('stat-overlap-selected'),
    overlapProgressContainer: document.getElementById('overlap-progress-container'),
    overlapProgressBar: document.getElementById('overlap-progress-bar'),
    overlapProgressText: document.getElementById('overlap-progress-text'),
    overlapSearchInput: document.getElementById('overlap-search-input'),
    btnOverlapSelectAll: document.getElementById('btn-overlap-select-all'),
    btnOverlapDeselectAll: document.getElementById('btn-overlap-deselect-all'),
    btnOverlapFollowSelected: document.getElementById('btn-overlap-follow-selected'),
    overlapVisibleCountBadge: document.getElementById('overlap-visible-count-badge'),
    loadingOverlap: document.getElementById('loading-overlap'),
    emptyOverlap: document.getElementById('empty-overlap'),
    overlapListGrid: document.getElementById('overlap-list-grid'),

    // Ghost Auditor elements
    btnAnalyzeGhosts: document.getElementById('btn-analyze-ghosts'),
    statGhostsBots: document.getElementById('stat-ghosts-bots'),
    statGhostsInactive: document.getElementById('stat-ghosts-inactive'),
    statGhostsSelected: document.getElementById('stat-ghosts-selected'),
    ghostsProgressContainer: document.getElementById('ghosts-progress-container'),
    ghostsProgressBar: document.getElementById('ghosts-progress-bar'),
    ghostsProgressText: document.getElementById('ghosts-progress-text'),
    btnGhostsSelectAll: document.getElementById('btn-ghosts-select-all'),
    btnGhostsDeselectAll: document.getElementById('btn-ghosts-deselect-all'),
    btnGhostsSoftblockSelected: document.getElementById('btn-ghosts-softblock-selected'),
    ghostsVisibleCountBadge: document.getElementById('ghosts-visible-count-badge'),
    loadingGhosts: document.getElementById('loading-ghosts'),
    emptyGhosts: document.getElementById('empty-ghosts'),
    ghostsListGrid: document.getElementById('ghosts-list-grid'),

    // Interaction Auditor elements
    selectUserPosts: document.getElementById('select-user-posts'),
    btnLoadReplies: document.getElementById('btn-load-replies'),
    statInteractSpam: document.getElementById('stat-interact-spam'),
    statInteractPotential: document.getElementById('stat-interact-potential'),
    statInteractSelected: document.getElementById('stat-interact-selected'),
    selectInteractionFilter: document.getElementById('select-interaction-filter'),
    btnInteractSelectAll: document.getElementById('btn-interact-select-all'),
    btnInteractDeselectAll: document.getElementById('btn-interact-deselect-all'),
    btnInteractBlockSelected: document.getElementById('btn-interact-block-selected'),
    btnInteractFollowSelected: document.getElementById('btn-interact-follow-selected'),
    interactVisibleCountBadge: document.getElementById('interact-visible-count-badge'),
    loadingInteractions: document.getElementById('loading-interactions'),
    emptyInteractions: document.getElementById('empty-interactions'),
    interactionsListGrid: document.getElementById('interactions-list-grid'),

    // List Manager elements
    selectUserListsPrimary: document.getElementById('select-user-lists-primary'),
    btnLoadListMembers: document.getElementById('btn-load-list-members'),
    statListsMembersCount: document.getElementById('stat-lists-members-count'),
    statListsSelected: document.getElementById('stat-lists-selected'),
    inputCloneListName: document.getElementById('input-clone-list-name'),
    btnListsClone: document.getElementById('btn-lists-clone'),
    selectUserListsSecondary: document.getElementById('select-user-lists-secondary'),
    inputMergeListName: document.getElementById('input-merge-list-name'),
    btnListsMerge: document.getElementById('btn-lists-merge'),
    listMembersTitle: document.getElementById('list-members-title'),
    listsVisibleCountBadge: document.getElementById('lists-visible-count-badge'),
    loadingLists: document.getElementById('loading-lists'),
    emptyLists: document.getElementById('empty-lists'),
    listsListGrid: document.getElementById('lists-list-grid'),

    // Tab buttons
    tabBtnTimeline: document.getElementById('tab-btn-timeline'),
    tabBtnHistory: document.getElementById('tab-btn-history'),

    // Tab content panels
    tabTimeline: document.getElementById('tab-timeline'),
    tabHistory: document.getElementById('tab-history'),

    // Geister-Auditor zombie stats
    statGhostsZombies: document.getElementById('stat-ghosts-zombies'),

    // Timeline Sifter UI Elements
    selectFeedSource: document.getElementById('select-feed-source'),
    btnAnalyzeFeed: document.getElementById('btn-analyze-feed'),
    statTimelineReposts: document.getElementById('stat-timeline-reposts'),
    statTimelineHeavyReposters: document.getElementById('stat-timeline-heavy-reposters'),
    statTimelineSelected: document.getElementById('stat-timeline-selected'),
    selectTimelineFilter: document.getElementById('select-timeline-filter'),
    btnTimelineSelectAll: document.getElementById('btn-timeline-select-all'),
    btnTimelineDeselectAll: document.getElementById('btn-timeline-deselect-all'),
    btnTimelineMuteSelected: document.getElementById('btn-timeline-mute-selected'),
    timelineVisibleCountBadge: document.getElementById('timeline-visible-count-badge'),
    loadingTimeline: document.getElementById('loading-timeline'),
    emptyTimeline: document.getElementById('empty-timeline'),
    timelineListGrid: document.getElementById('timeline-list-grid'),

    // Whitelist & Action History UI Elements
    btnGenerateSmartWhitelist: document.getElementById('btn-generate-smart-whitelist'),
    addWhitelistForm: document.getElementById('add-whitelist-form'),
    inputWhitelistActor: document.getElementById('input-whitelist-actor'),
    whitelistEmptyState: document.getElementById('whitelist-empty-state'),
    whitelistItemsList: document.getElementById('whitelist-items-list'),
    historyEmptyState: document.getElementById('history-empty-state'),
    undoHistoryList: document.getElementById('undo-history-list')
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
        const isWhitelisted = state.whitelist && state.whitelist.has(user.did);
        const card = document.createElement('div');
        card.className = `block-item fade-in ${user.status} ${isPhantom ? 'phantom' : ''} ${isWhitelisted ? 'whitelisted' : ''}`;
        card.id = `block-card-${user.did.replace(':', '_')}`;
        
        // Disable checkbox if already unblocked, currently unblocking, or whitelisted
        const isInteractive = user.status === 'blocked' && !state.isProcessing && !isWhitelisted;
        const disabledAttr = isInteractive ? '' : 'disabled';
        
        let statusLabel = 'Blockiert';
        let badgeClass = 'block-status-badge';
        if (user.status === 'processing') statusLabel = 'Löst...';
        if (user.status === 'unblocked') statusLabel = 'Entfernt';
        if (user.status === 'error') statusLabel = 'Fehler';
        if (user.status === 'blocked') {
            if (isWhitelisted) {
                statusLabel = '🛡️ Geschützt';
                badgeClass = 'block-status-badge protected';
            } else if (isPhantom) {
                statusLabel = '👻 Phantom';
                badgeClass = 'block-status-badge phantom';
            }
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
                <input type="checkbox" ${user.selected && !isWhitelisted ? 'checked' : ''} ${disabledAttr} data-did="${user.did}">
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
            <div style="display: flex; align-items: center; gap: 8px;">
                <button type="button" class="btn-whitelist-toggle ${isWhitelisted ? 'active' : ''}" data-did="${user.did}" title="${isWhitelisted ? 'Schutz aufheben (Whitelist)' : 'Schutz aktivieren (Whitelist)'}" ${state.isProcessing ? 'disabled' : ''}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="${isWhitelisted ? '#60a5fa' : 'none'}" stroke="${isWhitelisted ? '#60a5fa' : 'currentColor'}" stroke-width="2" style="vertical-align: middle;">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                </button>
                <span class="${badgeClass}">${statusLabel}</span>
            </div>
        `;
        
        // Event listener for checkbox
        const checkbox = card.querySelector('input[type="checkbox"]');
        if (isInteractive) {
            checkbox.addEventListener('change', (e) => {
                user.selected = e.target.checked;
                updateStats();
            });
        }

        // Event listener for whitelist toggle
        const whitelistToggleBtn = card.querySelector('.btn-whitelist-toggle');
        if (whitelistToggleBtn) {
            whitelistToggleBtn.addEventListener('click', () => {
                if (state.isProcessing) return;
                toggleWhitelist(user.did, user.handle);
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
    DOM.btnCleanInactives.disabled = disabled;
    DOM.searchInput.disabled = disabled;
    DOM.selectSort.disabled = disabled;
    DOM.chkFilterInactive.disabled = disabled;
    DOM.btnRescan.disabled = disabled;
    DOM.btnExportJson.disabled = disabled;
    DOM.btnImportJson.disabled = disabled;
    DOM.btnExportList.disabled = disabled;
    DOM.btnImportList.disabled = disabled;
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
    state.whitelist = new Set();
    state.isProcessing = false;
    state.isPaused = false;
    if (state.abortController) {
        state.abortController.abort();
    }
    
    // Clear follower copier state
    state.myFollows = new Set();
    state.myFollowers = new Set();
    state.myFollowsLoaded = false;
    state.myFollowersLoaded = false;
    state.targetFollowers = [];
    state.targetCursor = '';
    state.isFetchingFollowers = false;
    state.followQueue = [];
    state.isFollowProcessing = false;
    state.isFollowPaused = false;
    
    DOM.targetIdentifierInput.value = '';
    DOM.ownDataStatusText.textContent = 'Nicht geladen';
    DOM.followerSearchInput.value = '';
    DOM.selectRelationshipFilter.value = 'all';
    DOM.followerListGrid.innerHTML = '';
    DOM.emptyFollowers.classList.remove('hidden');
    DOM.emptyFollowers.querySelector('p').textContent = 'Gib einen Ziel-Account ein und klicke auf "Follower laden".';
    if (DOM.btnLoadMoreTarget) DOM.btnLoadMoreTarget.classList.add('hidden');
    if (DOM.btnLoadAllTarget) DOM.btnLoadAllTarget.classList.add('hidden');
    
    // Switch to blocklist tab by default for next login
    switchTab('blocklist');
    
    DOM.workspaceSection.classList.add('hidden');
    DOM.loginSection.classList.remove('hidden');
    DOM.finishedControls.classList.add('hidden');
    DOM.identifierInput.value = '';
    DOM.passwordInput.value = '';
    DOM.loginError.classList.add('hidden');
    
    // Clear analysis panel state
    DOM.analysisContent.classList.add('hidden');
    DOM.analysisArrow.style.transform = 'rotate(0deg)';
    DOM.chartContainer.innerHTML = '<div class="info-text-small" style="color: var(--text-muted);">Keine Daten zum Analysieren geladen.</div>';
    
    // Clear list
    DOM.blockListGrid.innerHTML = '';
    
    // Refresh saved profiles widget visibility
    renderSavedProfilesWidget();
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
        
        // Save profile locally if selected
        saveProfileOnLogin(serverUrl, identifier, password, {
            did: sessionData.did,
            displayName: state.session.displayName,
            avatar: state.session.avatar
        });

        // Load whitelist from localStorage
        try {
            state.whitelist = new Set(JSON.parse(localStorage.getItem('unblocker_whitelist_' + sessionData.did) || '[]'));
        } catch (_) {
            state.whitelist = new Set();
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
        if (DOM.analysisContent && !DOM.analysisContent.classList.contains('hidden')) {
            generateBlocklistChart();
        }
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
    // Select all visible (filtered) accounts, skipping whitelisted
    const query = DOM.searchInput.value.toLowerCase().trim();
    const showOnlyInactive = DOM.chkFilterInactive.checked;
    let count = 0;
    state.blockedUsers.forEach(user => {
        const isWhitelisted = state.whitelist && state.whitelist.has(user.did);
        if (isWhitelisted) {
            user.selected = false;
            return;
        }
        if (user.status === 'blocked') {
            const handleMatch = user.handle.toLowerCase().includes(query);
            const nameMatch = (user.displayName || '').toLowerCase().includes(query);
            if (handleMatch || nameMatch) {
                if (showOnlyInactive) {
                    const isInvalid = user.handle === 'handle.invalid' || !user.displayName || user.handle.toLowerCase().includes('invalid');
                    if (isInvalid) {
                        user.selected = true;
                        count++;
                    } else {
                        user.selected = false;
                    }
                } else {
                    user.selected = true;
                    count++;
                }
            }
        }
    });
    updateStats();
    renderBlocklist();
    log(`Alle angezeigten Konten markiert (${count} markiert, geschützte übersprungen).`, 'info');
});

DOM.btnSelect24h.addEventListener('click', () => selectBlocksByTimeframe(24));
DOM.btnSelect48h.addEventListener('click', () => selectBlocksByTimeframe(48));
DOM.btnSelectPhantoms.addEventListener('click', () => {
    let count = 0;
    state.blockedUsers.forEach(user => {
        const isPhantom = !state.repoRkeys.has(user.rkey);
        const isWhitelisted = state.whitelist && state.whitelist.has(user.did);
        if (user.status === 'blocked' && isPhantom && !isWhitelisted) {
            user.selected = true;
            count++;
        } else {
            user.selected = false;
        }
    });
    updateStats();
    renderBlocklist();
    log(`Es wurden ${count} Phantom-Blocks ausgewählt (geschützte übersprungen).`, 'info');
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
        const isWhitelisted = state.whitelist && state.whitelist.has(user.did);
        if (isWhitelisted) {
            user.selected = false;
            return;
        }
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
    log(`Es wurden ${count} Konten aus den ${timeText} ausgewählt (geschützte übersprungen).`, 'info');
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
    const listToUnblock = state.blockedUsers.filter(u => u.status !== 'unblocked' && !state.whitelist.has(u.did));
    if (listToUnblock.length === 0) {
        alert('Keine blockierten Konten zum Entfernen vorhanden (oder alle geschützten wurden übersprungen)!');
        return;
    }
    
    const totalBlocked = state.blockedUsers.filter(u => u.status !== 'unblocked').length;
    const skipped = totalBlocked - listToUnblock.length;
    const skipMsg = skipped > 0 ? `\n(Achtung: ${skipped} geschützte Konten auf der Whitelist werden übersprungen)` : '';
    
    const confirmMessage = `Bist du sicher, dass du ${listToUnblock.length} Blocks auf einmal aufheben möchtest?${skipMsg}\nDies kann nicht rückgängig gemacht werden.`;
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
    state.currentUnblockAction = { description: 'Block-Entferner: Entblockt: ' + users.map(u => '@' + u.handle).join(', '), targets: users.map(u => ({ did: u.did, handle: u.handle })) };
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
        if (state.currentUnblockAction) {
            addActionToHistory('unblock', state.currentUnblockAction.description, state.currentUnblockAction.targets);
            state.currentUnblockAction = null;
        }
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

// Whitelist toggle function
function toggleWhitelist(did, handle) {
    if (state.whitelist.has(did)) {
        state.whitelist.delete(did);
        log(`Schutz aufgehoben für @${handle}`, 'info');
    } else {
        state.whitelist.add(did);
        // If selected, deselect
        const user = state.blockedUsers.find(u => u.did === did);
        if (user) {
            user.selected = false;
        }
        log(`Schutz aktiviert für @${handle} (kann nicht mehr im Bulk entblockt werden)`, 'success');
    }
    
    // Save to localStorage
    if (state.session) {
        localStorage.setItem('unblocker_whitelist_' + state.session.did, JSON.stringify([...state.whitelist]));
    }
    
    updateStats();
    renderBlocklist();
}

// Inactives auto-clean handler
DOM.btnCleanInactives.addEventListener('click', () => {
    const listToClean = state.blockedUsers.filter(u => {
        const isInactive = u.handle === 'handle.invalid' || !u.displayName || u.handle.toLowerCase().includes('invalid');
        const isWhitelisted = state.whitelist.has(u.did);
        return isInactive && u.status !== 'unblocked' && !isWhitelisted;
    });
    
    if (listToClean.length === 0) {
        alert('Keine inaktiven oder gelöschten Accounts zum Bereinigen gefunden (oder alle geschützten wurden übersprungen).');
        return;
    }
    
    const confirmMessage = `Es wurden ${listToClean.length} inaktive oder gelöschte Accounts (z.B. mit 'handle.invalid') gefunden.\n\nMöchtest du diese ${listToClean.length} Blocks jetzt aufheben?`;
    if (confirm(confirmMessage)) {
        startUnblockingFlow(listToClean);
    }
});

// Collapsible Block-Analyse panel toggle
DOM.btnToggleAnalysis.addEventListener('click', () => {
    const isHidden = DOM.analysisContent.classList.toggle('hidden');
    DOM.analysisArrow.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
    if (!isHidden) {
        generateBlocklistChart();
    }
});

// SVG Chart Generation
function generateBlocklistChart() {
    const container = DOM.chartContainer;
    if (!container) return;
    
    const monthlyCounts = {};
    let hasDates = false;
    
    state.blockedUsers.forEach(user => {
        if (user.indexedAt) {
            const date = new Date(user.indexedAt);
            if (!isNaN(date.getTime())) {
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                monthlyCounts[key] = (monthlyCounts[key] || 0) + 1;
                hasDates = true;
            }
        }
    });
    
    if (!hasDates) {
        container.innerHTML = `<div class="info-text-small" style="color: var(--text-muted); text-align: center; width: 100%;">Keine zeitlichen Daten in den Blocks gefunden (Relay liefert keine Indizierungsdaten).</div>`;
        return;
    }
    
    const sortedKeys = Object.keys(monthlyCounts).sort();
    const chartKeys = sortedKeys.slice(-10); // Keep last 10 months
    
    const data = chartKeys.map(key => ({
        label: key.split('-')[1] + '/' + key.split('-')[0].slice(-2), // MM/YY
        fullLabel: key,
        value: monthlyCounts[key]
    }));
    
    const maxVal = Math.max(...data.map(d => d.value), 0);
    if (maxVal === 0) {
        container.innerHTML = `<div class="info-text-small" style="color: var(--text-muted); text-align: center; width: 100%;">Keine ausreichenden Blockdaten für eine Analyse vorhanden.</div>`;
        return;
    }
    
    const width = container.clientWidth || 380;
    const height = 160;
    const paddingLeft = 30;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 25;
    
    const chartW = width - paddingLeft - paddingRight;
    const chartH = height - paddingTop - paddingBottom;
    
    const barWidth = Math.min(25, (chartW / data.length) * 0.6);
    const gap = (chartW / data.length) - barWidth;
    
    // Draw Y axes ticks
    const yTicks = 4;
    let yTickElements = '';
    for (let i = 0; i <= yTicks; i++) {
        const val = Math.round((maxVal / yTicks) * i);
        const y = paddingTop + chartH - (chartH / yTicks) * i;
        yTickElements += `
            <line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" class="chart-grid-line" />
            <text x="${paddingLeft - 8}" y="${y + 3}" text-anchor="end" class="chart-label">${val}</text>
        `;
    }
    
    // Draw bars & X labels
    let barsHtml = '';
    data.forEach((d, idx) => {
        const barH = (d.value / maxVal) * chartH;
        const x = paddingLeft + idx * (barWidth + gap) + gap / 2;
        const y = paddingTop + chartH - barH;
        
        barsHtml += `
            <g class="chart-bar-group" data-value="${d.value}" data-label="${d.fullLabel}">
                <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="3" class="chart-bar" />
                <text x="${x + barWidth / 2}" y="${height - paddingBottom + 12}" text-anchor="middle" class="chart-label">${d.label}</text>
            </g>
        `;
    });
    
    const svgHtml = `
        <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" style="overflow: visible;">
            <defs>
                <linearGradient id="barGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="var(--primary)" stop-opacity="1" />
                    <stop offset="100%" stop-color="var(--primary-glow)" stop-opacity="0.3" />
                </linearGradient>
            </defs>
            
            <!-- Grid Lines & Y ticks -->
            ${yTickElements}
            
            <!-- X Axis Line -->
            <line x1="${paddingLeft}" y1="${paddingTop + chartH}" x2="${width - paddingRight}" y2="${paddingTop + chartH}" class="chart-axis-line" />
            
            <!-- Bars & X Labels -->
            ${barsHtml}
        </svg>
        <div id="chart-tooltip" class="chart-tooltip hidden"></div>
    `;
    
    container.innerHTML = svgHtml;
    
    const tooltip = container.querySelector('#chart-tooltip');
    const barGroups = container.querySelectorAll('.chart-bar-group');
    
    barGroups.forEach(group => {
        group.addEventListener('mouseenter', (e) => {
            const val = group.getAttribute('data-value');
            const dateLabel = group.getAttribute('data-label');
            const rect = group.querySelector('rect');
            
            tooltip.innerHTML = `<strong>${val} Blocks</strong><br>${dateLabel}`;
            tooltip.classList.remove('hidden');
            
            const containerRect = container.getBoundingClientRect();
            const rectBounds = rect.getBoundingClientRect();
            
            const tooltipX = rectBounds.left - containerRect.left + rectBounds.width / 2;
            const tooltipY = rectBounds.top - containerRect.top - 40;
            
            tooltip.style.left = `${tooltipX}px`;
            tooltip.style.top = `${tooltipY}px`;
            tooltip.style.transform = 'translateX(-50%)';
        });
        
        group.addEventListener('mouseleave', () => {
            tooltip.classList.add('hidden');
        });
    });
}

// Multi-Account Saved Profiles Logic
function loadSavedProfiles() {
    try {
        state.savedProfiles = JSON.parse(localStorage.getItem('unblocker_saved_profiles') || '[]');
    } catch (_) {
        state.savedProfiles = [];
    }
    renderSavedProfilesWidget();
}

function renderSavedProfilesWidget() {
    const list = DOM.savedProfilesList;
    if (!list) return;
    
    if (state.savedProfiles.length === 0) {
        DOM.savedProfilesContainer.classList.add('hidden');
        return;
    }
    
    DOM.savedProfilesContainer.classList.remove('hidden');
    list.innerHTML = '';
    
    state.savedProfiles.forEach((profile, index) => {
        const item = document.createElement('div');
        item.className = 'saved-profile-item';
        
        const avatarSrc = profile.avatar || '';
        const avatarEl = avatarSrc 
            ? `<img src="${avatarSrc}" class="saved-profile-avatar" alt="Avatar">`
            : `<div class="saved-profile-avatar avatar-placeholder" style="width:36px; height:36px; margin-bottom:6px;"></div>`;
            
        item.innerHTML = `
            <button type="button" class="saved-profile-remove" title="Profil löschen" data-index="${index}">×</button>
            ${avatarEl}
            <div class="saved-profile-name">${profile.displayName}</div>
            <div class="saved-profile-handle">@${profile.handle}</div>
        `;
        
        item.addEventListener('click', (e) => {
            if (e.target.classList.contains('saved-profile-remove')) return;
            
            DOM.serverUrlInput.value = profile.serverUrl || 'https://bsky.social';
            DOM.identifierInput.value = profile.handle;
            DOM.passwordInput.value = profile.password || '';
            
            DOM.loginForm.dispatchEvent(new Event('submit'));
        });
        
        item.querySelector('.saved-profile-remove').addEventListener('click', (e) => {
            e.stopPropagation();
            state.savedProfiles.splice(index, 1);
            localStorage.setItem('unblocker_saved_profiles', JSON.stringify(state.savedProfiles));
            renderSavedProfilesWidget();
        });
        
        list.appendChild(item);
    });
}

function saveProfileOnLogin(serverUrl, handle, password, profileData) {
    const chkSave = document.getElementById('chk-save-profile');
    if (!chkSave || !chkSave.checked) return;
    
    const newProfile = {
        did: profileData.did,
        handle: handle,
        displayName: profileData.displayName || handle,
        avatar: profileData.avatar || '',
        serverUrl: serverUrl,
        password: password
    };
    
    state.savedProfiles = state.savedProfiles.filter(p => p.did !== newProfile.did);
    state.savedProfiles.unshift(newProfile);
    state.savedProfiles = state.savedProfiles.slice(0, 5); // Limit 5
    
    localStorage.setItem('unblocker_saved_profiles', JSON.stringify(state.savedProfiles));
    renderSavedProfilesWidget();
}

// Mute-List Export & Import logic
DOM.btnExportList.addEventListener('click', async () => {
    const listToExport = state.blockedUsers.filter(u => u.selected && u.status !== 'unblocked');
    if (listToExport.length === 0) {
        alert('Bitte wähle mindestens ein Konto aus der Liste aus!');
        return;
    }
    
    const listName = prompt('Gib einen Namen für die Mute-Liste ein:', 'Blockliste Export');
    if (!listName) return;
    
    const listDesc = prompt('Gib eine Beschreibung für die Mute-Liste ein (optional):', 'Exportierte Liste aus C.T.H.U.L.H.U.');
    
    log(`Erstelle Mute-Liste "${listName}" auf Bluesky...`, 'system');
    
    try {
        if (state.isDryRun) {
            log(`[Dry-Run] Würde Mute-Liste "${listName}" mit ${listToExport.length} Konten erstellen.`, 'success');
            return;
        }
        
        const listRecord = {
            $type: 'app.bsky.graph.list',
            name: listName,
            purpose: 'app.bsky.graph.defs#modlist',
            description: listDesc || '',
            createdAt: new Date().toISOString()
        };
        
        const createListRes = await apiFetch(`${state.session.serverUrl}/xrpc/com.atproto.repo.createRecord`, {
            method: 'POST',
            body: JSON.stringify({
                repo: state.session.did,
                collection: 'app.bsky.graph.list',
                record: listRecord
            })
        });
        
        const listUri = createListRes.uri;
        log(`Mute-Liste auf Bluesky angelegt: ${listUri}`, 'success');
        
        log(`Füge ${listToExport.length} Konten der Mute-Liste hinzu...`, 'info');
        
        const CONCURRENCY = 4;
        const THROTTLE_DELAY = 100;
        const queue = [...listToExport];
        const workers = [];
        
        const worker = async () => {
            while (queue.length > 0) {
                const user = queue.shift();
                if (!user) continue;
                
                try {
                    await new Promise(resolve => setTimeout(resolve, THROTTLE_DELAY));
                    await apiFetch(`${state.session.serverUrl}/xrpc/com.atproto.repo.createRecord`, {
                        method: 'POST',
                        body: JSON.stringify({
                            repo: state.session.did,
                            collection: 'app.bsky.graph.listitem',
                            record: {
                                $type: 'app.bsky.graph.listitem',
                                subject: user.did,
                                list: listUri,
                                createdAt: new Date().toISOString()
                            }
                        })
                    });
                    log(`Hinzugefügt zur Liste: @${user.handle}`, 'success');
                } catch (err) {
                    log(`Fehler bei @${user.handle} (Mute-Liste): ${getErrorMessage(err)}`, 'error');
                }
            }
        };
        
        for (let i = 0; i < Math.min(CONCURRENCY, queue.length); i++) {
            workers.push(worker());
        }
        
        await Promise.all(workers);
        log(`Mute-Liste erfolgreich fertiggestellt!`, 'success');
        alert(`Mute-Liste "${listName}" wurde erfolgreich mit ${listToExport.length} Konten auf Bluesky erstellt!`);
        
    } catch (err) {
        log(`Fehler beim Erstellen der Liste: ${getErrorMessage(err)}`, 'error');
        alert(`Fehler beim Erstellen der Mute-Liste: ${getErrorMessage(err)}`);
    }
});

DOM.btnImportList.addEventListener('click', async () => {
    let listInput = prompt('Gib den Link oder die AT-URI einer Bluesky-Liste ein:\n(z.B. at://did:plc:xxx/app.bsky.graph.list/rkey oder die URL aus der App)');
    if (!listInput) return;
    
    let listUri = '';
    
    const urlMatch = listInput.match(/\/profile\/([^\/]+)\/lists\/([^\/]+)/i);
    if (urlMatch) {
        const profileHandleOrDid = urlMatch[1];
        const rkey = urlMatch[2];
        log(`Löse Profil ${profileHandleOrDid} für Listenauflösung auf...`, 'info');
        try {
            const actorProfile = await apiFetch(`${state.session.serverUrl}/xrpc/app.bsky.actor.getProfile?actor=${profileHandleOrDid}`);
            listUri = `at://${actorProfile.did}/app.bsky.graph.list/${rkey}`;
        } catch (err) {
            alert(`Fehler beim Auflösen des Listen-Profils: ${getErrorMessage(err)}`);
            return;
        }
    } else if (listInput.startsWith('at://')) {
        listUri = listInput;
    } else {
        alert('Ungültiges Format! Bitte gib eine gültige AT-URI oder Bluesky-Listen-URL ein.');
        return;
    }
    
    log(`Lade Konten aus Liste: ${listUri}...`, 'system');
    
    try {
        const listData = await apiFetch(`${state.session.serverUrl}/xrpc/app.bsky.graph.getList?list=${listUri}&limit=100`);
        const listItems = listData.items || [];
        
        if (listItems.length === 0) {
            log('Keine Einträge in der geladenen Liste gefunden.', 'warning');
            alert('Die geladene Liste ist leer.');
            return;
        }
        
        log(`Liste geladen: "${listData.list.name}" mit ${listItems.length} Konten.`, 'success');
        
        const listDids = new Set(listItems.map(item => item.subject.did));
        let matchedCount = 0;
        
        state.blockedUsers.forEach(user => {
            const isWhitelisted = state.whitelist.has(user.did);
            if (listDids.has(user.did) && user.status === 'blocked' && !isWhitelisted) {
                user.selected = true;
                matchedCount++;
            }
        });
        
        updateStats();
        renderBlocklist();
        
        const currentDids = new Set(state.blockedUsers.map(u => u.did));
        const missingDids = listItems.filter(item => !currentDids.has(item.subject.did)).map(item => ({
            did: item.subject.did,
            handle: item.subject.handle,
            displayName: item.subject.displayName || item.subject.handle
        }));
        
        let alertMsg = `Liste "${listData.list.name}" importiert.\n- ${matchedCount} Konten wurden in deiner Blockliste markiert.`;
        
        if (missingDids.length > 0) {
            alertMsg += `\n- Es gibt ${missingDids.length} Konten in dieser Liste, die du aktuell NICHT blockierst.`;
            if (confirm(`${alertMsg}\n\nMöchtest du diese ${missingDids.length} Konten jetzt blockieren?`)) {
                await startRestoringFlow(missingDids);
            }
        } else {
            alert(alertMsg);
        }
        
    } catch (err) {
        log(`Fehler beim Laden der Liste: ${getErrorMessage(err)}`, 'error');
        alert(`Fehler beim Importieren der Liste: ${getErrorMessage(err)}`);
    }
});

// --- FOLLOWER COPIER FEATURE LOGIC ---

function setupTabs() {
    DOM.tabBtnBlocklist.addEventListener('click', () => switchTab('blocklist'));
    DOM.tabBtnFollowers.addEventListener('click', () => switchTab('followers'));
    DOM.tabBtnOverlap.addEventListener('click', () => switchTab('overlap'));
    DOM.tabBtnGhosts.addEventListener('click', () => switchTab('ghosts'));
    DOM.tabBtnInteractions.addEventListener('click', () => switchTab('interactions'));
    DOM.tabBtnLists.addEventListener('click', () => switchTab('lists'));
    DOM.tabBtnTimeline.addEventListener('click', () => switchTab('timeline'));
    DOM.tabBtnHistory.addEventListener('click', () => switchTab('history'));
}

function switchTab(tabId) {
    const tabs = ['blocklist', 'followers', 'overlap', 'ghosts', 'interactions', 'lists', 'timeline', 'history'];
    
    tabs.forEach(t => {
        const btnName = 'tabBtn' + t.charAt(0).toUpperCase() + t.slice(1);
        const panelName = 'tab' + t.charAt(0).toUpperCase() + t.slice(1);
        const btn = DOM[btnName];
        const panel = DOM[panelName];
        
        if (btn && panel) {
            if (t === tabId) {
                btn.classList.add('active');
                panel.classList.remove('hidden');
            } else {
                btn.classList.remove('active');
                panel.classList.add('hidden');
            }
        }
    });
    
    // Auto load own data if not loaded (for all tabs except blocklist)
    if (tabId !== 'blocklist' && tabId !== 'history') {
        if (!state.myFollowsLoaded || !state.myFollowersLoaded) {
            fetchMyFollowsAndFollowers();
        }
    }
    
    // Tab-specific auto-loading
    if (tabId === 'interactions') {
        if (state.authorPosts.length === 0) {
            fetchMyRecentPosts();
        }
    } else if (tabId === 'lists') {
        if (state.userLists.length === 0) {
            fetchMyLists();
        }
    } else if (tabId === 'timeline') {
        if (state.timelineActors.length === 0) {
            fetchTimelineFeed();
        }
    } else if (tabId === 'history') {
        renderWhitelist();
        renderActionHistory();
    }
}

async function fetchMyFollowsAndFollowers() {
    if (!state.session) return;
    DOM.btnReloadOwnData.disabled = true;
    DOM.ownDataStatusText.textContent = 'Lade...';
    log('Lade eigene Follows & Follower für den Abgleich...', 'system');
    
    // MOCK MODE check
    if (state.session && state.session.did === 'did:plc:testuser123') {
        await new Promise(resolve => setTimeout(resolve, 500)); // simulate delay
        state.myFollows = new Set(['did:plc:protected1', 'did:plc:regular3', 'did:plc:target1']);
        state.myFollowers = new Set(['did:plc:regular3', 'did:plc:target2']);
        state.myFollowsRkeys = new Map([
            ['did:plc:protected1', 'rkey-follow-protected1'],
            ['did:plc:regular3', 'rkey-follow-regular3'],
            ['did:plc:target1', 'rkey-follow-target1']
        ]);
        state.myFollowsLoaded = true;
        state.myFollowersLoaded = true;
        DOM.ownDataStatusText.innerHTML = `Bereit (👥 ${state.myFollowers.size} / 👤 ${state.myFollows.size})`;
        log('Mock-eigene Follows & Follower geladen.', 'success');
        DOM.btnReloadOwnData.disabled = false;
        if (state.targetFollowers.length > 0) {
            recalculateRelationships();
            renderTargetFollowers();
        }
        return;
    }
    
    try {
        state.myFollows = new Set();
        state.myFollowers = new Set();
        state.myFollowsRkeys = new Map();
        
        // 1. Fetch Follows
        let cursor = '';
        let page = 1;
        do {
            let url = `${state.session.serverUrl}/xrpc/app.bsky.graph.getFollows?actor=${state.session.did}&limit=100`;
            if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
            const data = await apiFetch(url);
            const follows = data.follows || [];
            follows.forEach(f => {
                state.myFollows.add(f.did);
                if (f.viewer && f.viewer.following) {
                    const rkey = parseRkey(f.viewer.following);
                    if (rkey) state.myFollowsRkeys.set(f.did, rkey);
                }
            });
            cursor = data.cursor;
            page++;
            if (page > 200) break; // safety limit (20k accounts followed)
        } while (cursor);
        state.myFollowsLoaded = true;
        log(`Eigene Follows geladen: ${state.myFollows.size} Accounts.`, 'success');
        
        // 2. Fetch Followers
        cursor = '';
        page = 1;
        do {
            let url = `${state.session.serverUrl}/xrpc/app.bsky.graph.getFollowers?actor=${state.session.did}&limit=100`;
            if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
            const data = await apiFetch(url);
            const followers = data.followers || [];
            followers.forEach(f => state.myFollowers.add(f.did));
            cursor = data.cursor;
            page++;
            if (page > 200) break; // safety limit (20k followers)
        } while (cursor);
        state.myFollowersLoaded = true;
        log(`Eigene Follower geladen: ${state.myFollowers.size} Accounts.`, 'success');
        
        DOM.ownDataStatusText.innerHTML = `Bereit (👥 ${state.myFollowers.size} / 👤 ${state.myFollows.size})`;
        
        // Re-evaluate target followers relationship if loaded
        if (state.targetFollowers.length > 0) {
            recalculateRelationships();
            renderTargetFollowers();
        }
    } catch (err) {
        log(`Fehler beim Laden der eigenen Follow-Daten: ${getErrorMessage(err)}`, 'error');
        DOM.ownDataStatusText.textContent = 'Fehler beim Laden';
    } finally {
        DOM.btnReloadOwnData.disabled = false;
    }
}

async function fetchTargetFollowers(append = false) {
    const target = DOM.targetIdentifierInput.value.trim();
    if (!target) return;
    
    if (!append) {
        state.targetFollowers = [];
        state.targetCursor = '';
        DOM.followerListGrid.innerHTML = '';
        DOM.btnLoadTarget.disabled = true;
        DOM.btnLoadTarget.querySelector('span').classList.add('hidden');
        DOM.btnLoadTarget.querySelector('.spinner').classList.remove('hidden');
        DOM.loadingFollowers.classList.remove('hidden');
        DOM.emptyFollowers.classList.add('hidden');
        DOM.followerListGrid.classList.add('hidden');
        DOM.btnLoadMoreTarget.classList.add('hidden');
        DOM.btnLoadAllTarget.classList.add('hidden');
    }
    
    // MOCK MODE check
    if (state.session && state.session.did === 'did:plc:testuser123') {
        await new Promise(resolve => setTimeout(resolve, 800)); // simulate latency
        
        const mockFollowers = [
            { did: 'did:plc:protected1', handle: 'protected-user.bsky.social', displayName: 'Protected Account 🛡️', avatar: '' },
            { did: 'did:plc:regular3', handle: 'regular-troll.bsky.social', displayName: 'Regular Troll', avatar: '' },
            { did: 'did:plc:target1', handle: 'target-following.bsky.social', displayName: 'Target Following', avatar: '' },
            { did: 'did:plc:target2', handle: 'target-follower.bsky.social', displayName: 'Target Follower', avatar: '' },
            { did: 'did:plc:target3', handle: 'target-none.bsky.social', displayName: 'Target None', avatar: '' },
            { did: 'did:plc:target4', handle: 'target-none2.bsky.social', displayName: 'Target None 2', avatar: '' }
        ];
        
        const blockedDids = new Set(state.blockedUsers.filter(u => u.status !== 'unblocked').map(u => u.did));
        
        mockFollowers.forEach(f => {
            let relation = 'none';
            if (blockedDids.has(f.did)) {
                relation = 'blocked';
            } else if (state.myFollows.has(f.did) && state.myFollowers.has(f.did)) {
                relation = 'mutual';
            } else if (state.myFollows.has(f.did)) {
                relation = 'following';
            } else if (state.myFollowers.has(f.did)) {
                relation = 'follower';
            }
            
            if (!state.targetFollowers.some(existing => existing.did === f.did)) {
                state.targetFollowers.push({
                    did: f.did,
                    handle: f.handle,
                    displayName: f.displayName || f.handle,
                    avatar: f.avatar || '',
                    relation: relation,
                    status: 'idle',
                    selected: relation !== 'following' && relation !== 'mutual' && relation !== 'blocked'
                });
            }
        });
        
        await enrichFollowersWithProfiles(state.targetFollowers);
        updateFollowerStats();
        renderTargetFollowers();
        
        DOM.btnLoadTarget.disabled = false;
        DOM.btnLoadTarget.querySelector('span').classList.remove('hidden');
        DOM.btnLoadTarget.querySelector('.spinner').classList.add('hidden');
        DOM.loadingFollowers.classList.add('hidden');
        log(`Mock-Follower für @${target} erfolgreich geladen.`, 'success');
        return;
    }
    
    DOM.loadingFollowersCursorText.textContent = `Hole Seite...`;
    log(`Hole Follower von @${target}...`, 'system');
    
    try {
        let url = `${state.session.serverUrl}/xrpc/app.bsky.graph.getFollowers?actor=${encodeURIComponent(target)}&limit=100`;
        if (state.targetCursor) {
            url += `&cursor=${encodeURIComponent(state.targetCursor)}`;
        }
        
        const data = await apiFetch(url);
        const followers = data.followers || [];
        state.targetCursor = data.cursor || '';
        
        log(`Es wurden ${followers.length} Follower von @${target} geladen.`, 'info');
        
        const blockedDids = new Set(state.blockedUsers.filter(u => u.status !== 'unblocked').map(u => u.did));
        
        const newItems = [];
        followers.forEach(f => {
            let relation = 'none';
            if (blockedDids.has(f.did)) {
                relation = 'blocked';
            } else if (state.myFollows.has(f.did) && state.myFollowers.has(f.did)) {
                relation = 'mutual';
            } else if (state.myFollows.has(f.did)) {
                relation = 'following';
            } else if (state.myFollowers.has(f.did)) {
                relation = 'follower';
            }
            
            if (!state.targetFollowers.some(existing => existing.did === f.did)) {
                const item = {
                    did: f.did,
                    handle: f.handle,
                    displayName: f.displayName || f.handle,
                    avatar: f.avatar || '',
                    relation: relation,
                    status: 'idle',
                    selected: relation !== 'following' && relation !== 'mutual' && relation !== 'blocked'
                };
                state.targetFollowers.push(item);
                newItems.push(item);
            }
        });
        
        updateFollowerStats();
        renderTargetFollowers();
        
        // Load detailed profiles for the newly loaded items
        if (newItems.length > 0) {
            await enrichFollowersWithProfiles(newItems);
        }
        
        if (state.targetCursor) {
            DOM.btnLoadMoreTarget.classList.remove('hidden');
            DOM.btnLoadAllTarget.classList.remove('hidden');
        } else {
            DOM.btnLoadMoreTarget.classList.add('hidden');
            DOM.btnLoadAllTarget.classList.add('hidden');
            log(`Alle Follower von @${target} wurden vollständig geladen.`, 'success');
        }
    } catch (err) {
        log(`Fehler beim Laden der Follower von @${target}: ${getErrorMessage(err)}`, 'error');
        if (!append) {
            DOM.emptyFollowers.classList.remove('hidden');
            DOM.emptyFollowers.querySelector('p').textContent = `Fehler beim Laden: ${getErrorMessage(err)}`;
        }
    } finally {
        DOM.btnLoadTarget.disabled = false;
        DOM.btnLoadTarget.querySelector('span').classList.remove('hidden');
        DOM.btnLoadTarget.querySelector('.spinner').classList.add('hidden');
        DOM.loadingFollowers.classList.add('hidden');
    }
}

async function fetchDetailedProfiles(dids) {
    if (dids.length === 0) return [];
    
    const chunks = [];
    for (let i = 0; i < dids.length; i += 25) {
        chunks.push(dids.slice(i, i + 25));
    }
    
    const allProfiles = [];
    for (const chunk of chunks) {
        try {
            let url = `${state.session.serverUrl}/xrpc/app.bsky.actor.getProfiles?`;
            url += chunk.map(did => `actors=${encodeURIComponent(did)}`).join('&');
            const data = await apiFetch(url);
            if (data && data.profiles) {
                allProfiles.push(...data.profiles);
            }
            await new Promise(resolve => setTimeout(resolve, 100)); // minor throttle
        } catch (err) {
            log(`Warnung bei Batch-Profilabruf: ${getErrorMessage(err)}`, 'warning');
        }
    }
    return allProfiles;
}

async function enrichFollowersWithProfiles(newFollowers) {
    if (newFollowers.length === 0) return;
    
    // MOCK check
    if (state.session && state.session.did === 'did:plc:testuser123') {
        const mockProfilesDetail = [
            { did: 'did:plc:protected1', description: 'Software developer and retro computing enthusiast. Protect me!', postsCount: 150, followersCount: 1200, followsCount: 800 },
            { did: 'did:plc:regular3', description: 'Just posting random stuff. Sarcasm included.', postsCount: 5, followersCount: 10, followsCount: 50 },
            { did: 'did:plc:target1', description: 'Official account of Target Following.', postsCount: 4200, followersCount: 99000, followsCount: 1500 },
            { did: 'did:plc:target2', description: 'Follower profile test.', postsCount: 12, followersCount: 5, followsCount: 100 },
            { did: 'did:plc:target3', description: '', postsCount: 0, followersCount: 0, followsCount: 2500 }, // spambot (0 posts, high follows ratio)
            { did: 'did:plc:target4', description: 'Inactive account.', postsCount: 0, followersCount: 3, followsCount: 9 } // inactive
        ];
        
        mockProfilesDetail.forEach(p => {
            state.detailedProfilesMap.set(p.did, p);
        });
        
        renderTargetFollowers();
        return;
    }
    
    const dids = newFollowers.map(f => f.did);
    log(`Lade Details für ${dids.length} Profile...`, 'info');
    try {
        const profiles = await fetchDetailedProfiles(dids);
        profiles.forEach(p => {
            state.detailedProfilesMap.set(p.did, {
                did: p.did,
                description: p.description || '',
                postsCount: p.postsCount || 0,
                followersCount: p.followersCount || 0,
                followsCount: p.followsCount || 0
            });
        });
        log(`Details für ${profiles.length} Profile geladen.`, 'success');
        renderTargetFollowers();
    } catch (err) {
        log(`Warnung beim Laden der Profildetails: ${getErrorMessage(err)}`, 'warning');
    }
}

async function fetchMyFollowsDetailed() {
    state.targetFollowers = [];
    state.targetCursor = '';
    DOM.followerListGrid.innerHTML = '';
    
    DOM.btnAnalyzeUnfollow.disabled = true;
    DOM.btnAnalyzeUnfollow.querySelector('span').classList.add('hidden');
    DOM.btnAnalyzeUnfollow.querySelector('.spinner').classList.remove('hidden');
    DOM.loadingFollowers.classList.remove('hidden');
    DOM.emptyFollowers.classList.add('hidden');
    DOM.followerListGrid.classList.add('hidden');
    
    log('Analysiere deine eigenen Abonnements...', 'system');
    
    try {
        if (!state.myFollowsLoaded || !state.myFollowersLoaded) {
            await fetchMyFollowsAndFollowers();
        }
        
        // MOCK check
        if (state.session && state.session.did === 'did:plc:testuser123') {
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const mockFollows = [
                { did: 'did:plc:protected1', handle: 'protected-user.bsky.social', displayName: 'Protected Account 🛡️', avatar: '' },
                { did: 'did:plc:regular3', handle: 'regular-troll.bsky.social', displayName: 'Regular Troll', avatar: '' },
                { did: 'did:plc:target1', handle: 'target-following.bsky.social', displayName: 'Target Following', avatar: '' },
                { did: 'did:plc:target3', handle: 'target-none.bsky.social', displayName: 'Target None', avatar: '' }
            ];
            
            mockFollows.forEach(f => {
                let relation = 'following';
                if (state.myFollowers.has(f.did)) {
                    relation = 'mutual';
                }
                
                state.targetFollowers.push({
                    did: f.did,
                    handle: f.handle,
                    displayName: f.displayName || f.handle,
                    avatar: f.avatar || '',
                    relation: relation,
                    status: 'idle',
                    selected: relation !== 'mutual' // pre-select non-mutuals for unfollowing
                });
            });
            
            await enrichFollowersWithProfiles(state.targetFollowers);
            updateFollowerStats();
            renderTargetFollowers();
            log('Eigene Abonnements geladen (Mock-Modus).', 'success');
            return;
        }
        
        let cursor = '';
        let page = 1;
        const loadedFollows = [];
        
        do {
            DOM.loadingFollowersCursorText.textContent = `Hole Seite ${page} der Abonnements...`;
            let url = `${state.session.serverUrl}/xrpc/app.bsky.graph.getFollows?actor=${state.session.did}&limit=100`;
            if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
            
            const data = await apiFetch(url);
            const follows = data.follows || [];
            
            follows.forEach(f => {
                let relation = 'following';
                if (state.myFollowers.has(f.did)) {
                    relation = 'mutual';
                }
                
                const item = {
                    did: f.did,
                    handle: f.handle,
                    displayName: f.displayName || f.handle,
                    avatar: f.avatar || '',
                    relation: relation,
                    status: 'idle',
                    selected: relation !== 'mutual'
                };
                
                if (!state.targetFollowers.some(existing => existing.did === f.did)) {
                    state.targetFollowers.push(item);
                    loadedFollows.push(item);
                }
            });
            
            cursor = data.cursor;
            page++;
            if (page > 100) break; // safety break
            
            updateFollowerStats();
            renderTargetFollowers();
            
        } while (cursor);
        
        log(`Abonnements geladen: ${state.targetFollowers.length} Accounts.`, 'success');
        
        // Enrich detailed profiles in batches of 25 (first 200)
        const toEnrich = state.targetFollowers.slice(0, 200);
        if (toEnrich.length > 0) {
            await enrichFollowersWithProfiles(toEnrich);
        }
        
    } catch (err) {
        log(`Fehler bei der Analyse der Abonnements: ${getErrorMessage(err)}`, 'error');
        DOM.emptyFollowers.classList.remove('hidden');
        DOM.emptyFollowers.querySelector('p').textContent = `Fehler beim Laden: ${getErrorMessage(err)}`;
    } finally {
        DOM.btnAnalyzeUnfollow.disabled = false;
        DOM.btnAnalyzeUnfollow.querySelector('span').classList.remove('hidden');
        DOM.btnAnalyzeUnfollow.querySelector('.spinner').classList.add('hidden');
        DOM.loadingFollowers.classList.add('hidden');
    }
}

async function loadAllTargetFollowers() {
    DOM.btnLoadAllTarget.disabled = true;
    DOM.btnLoadMoreTarget.disabled = true;
    
    log('Lade alle verbleibenden Follower automatisch... Dies kann einen Moment dauern.', 'system');
    while (state.targetCursor) {
        await fetchTargetFollowers(true);
        // Delay to prevent hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    DOM.btnLoadAllTarget.disabled = false;
    DOM.btnLoadMoreTarget.disabled = false;
}

function updateFollowerStats() {
    const loadedCount = state.targetFollowers.length;
    const filtered = getFilteredTargetFollowers();
    
    if (state.followerMode === 'copy') {
        const selectedCount = filtered.filter(f => f.selected && f.relation !== 'following' && f.relation !== 'mutual' && f.relation !== 'blocked' && f.status !== 'followed').length;
        const mutualCount = state.targetFollowers.filter(f => f.relation === 'mutual' || f.status === 'followed').length;
        const blockedCount = state.targetFollowers.filter(f => f.relation === 'blocked').length;
        
        DOM.statTargetLoaded.textContent = loadedCount;
        DOM.statTargetSelected.textContent = selectedCount;
        DOM.statTargetMutual.textContent = mutualCount;
        DOM.statTargetBlocked.textContent = blockedCount;
    } else {
        // Cleaner mode: show mutual backfollows vs non-mutuals
        const selectedCount = filtered.filter(f => f.selected && f.status !== 'unfollowed').length;
        const backfollowsCount = state.targetFollowers.filter(f => f.relation === 'mutual').length;
        const nonMutualsCount = state.targetFollowers.filter(f => f.relation === 'following').length;
        
        DOM.statTargetLoaded.textContent = loadedCount;
        DOM.statTargetSelected.textContent = selectedCount;
        DOM.statTargetMutual.textContent = backfollowsCount;
        DOM.statTargetBlocked.textContent = nonMutualsCount;
    }
}

function recalculateRelationships() {
    const blockedDids = new Set(state.blockedUsers.filter(u => u.status !== 'unblocked').map(u => u.did));
    state.targetFollowers.forEach(f => {
        if (blockedDids.has(f.did)) {
            f.relation = 'blocked';
        } else if (state.myFollows.has(f.did) && state.myFollowers.has(f.did)) {
            f.relation = 'mutual';
        } else if (state.myFollows.has(f.did)) {
            f.relation = 'following';
        } else if (state.myFollowers.has(f.did)) {
            f.relation = 'follower';
        } else {
            f.relation = 'none';
        }
    });
    updateFollowerStats();
}

function getFilteredTargetFollowers() {
    const query = DOM.followerSearchInput.value.toLowerCase().trim();
    const filterRel = DOM.selectRelationshipFilter.value;
    const filterQuality = DOM.selectQualityFilter.value;
    
    return state.targetFollowers.filter(f => {
        const matchesSearch = f.handle.toLowerCase().includes(query) || (f.displayName || '').toLowerCase().includes(query);
        if (!matchesSearch) return false;
        
        // 1. Relationship filter
        let matchesRel = true;
        if (filterRel === 'all') matchesRel = true;
        else if (filterRel === 'not-following') matchesRel = (f.relation === 'none' || f.relation === 'follower') && f.status !== 'followed';
        else if (filterRel === 'following') matchesRel = f.relation === 'following' || f.relation === 'mutual' || f.status === 'followed';
        else if (filterRel === 'mutual') matchesRel = f.relation === 'mutual' || (f.relation === 'follower' && f.status === 'followed');
        else if (filterRel === 'blocked') matchesRel = f.relation === 'blocked';
        
        if (!matchesRel) return false;
        
        // 2. Quality filter
        if (filterQuality === 'all') return true;
        
        const details = state.detailedProfilesMap.get(f.did);
        if (!details) return false; // Hide from quality filters if details not loaded
        
        const isBot = (details.postsCount === 0 && !f.avatar && !details.description) || 
                      (details.followsCount > 500 && details.followersCount < 50 && (details.followsCount / Math.max(1, details.followersCount)) > 5);
        const isActive = details.postsCount > 0;
        const isInactive = details.postsCount === 0;
        
        if (filterQuality === 'active') return isActive;
        if (filterQuality === 'inactive') return isInactive;
        if (filterQuality === 'spambot') return isBot;
        
        return true;
    });
}

function renderTargetFollowers() {
    const filtered = getFilteredTargetFollowers();
    DOM.followerListGrid.innerHTML = '';
    
    DOM.followerVisibleCountBadge.textContent = `${filtered.length} von ${state.targetFollowers.length} angezeigt`;
    
    if (filtered.length === 0) {
        DOM.followerListGrid.classList.add('hidden');
        DOM.emptyFollowers.classList.remove('hidden');
        if (state.targetFollowers.length > 0) {
            DOM.emptyFollowers.querySelector('p').textContent = 'Keine Profile entsprechen deiner Filterung.';
        } else {
            DOM.emptyFollowers.querySelector('p').textContent = state.followerMode === 'copy' 
                ? 'Gib einen Ziel-Account ein und klicke auf "Follower laden".'
                : 'Klicke auf "Eigene Follows analysieren", um deine Abonnements zu laden.';
        }
        return;
    }
    
    DOM.emptyFollowers.classList.add('hidden');
    DOM.followerListGrid.classList.remove('hidden');
    
    filtered.forEach(user => {
        const card = document.createElement('div');
        
        // Build card classes
        let statusClass = user.status;
        if (user.status === 'followed') statusClass = 'success';
        if (user.status === 'unfollowed') statusClass = 'inactive';
        card.className = `block-item fade-in ${statusClass} ${user.relation === 'blocked' ? 'error' : ''}`;
        card.id = `follower-card-${user.did.replace(':', '_')}`;
        
        let relationLabel = 'Keine';
        let badgeClass = 'block-status-badge none';
        
        if (user.relation === 'blocked') {
            relationLabel = 'Blockiert';
            badgeClass = 'block-status-badge blocked';
        } else if (user.relation === 'mutual') {
            relationLabel = 'Mutual';
            badgeClass = 'block-status-badge mutual';
        } else if (user.relation === 'following') {
            relationLabel = state.followerMode === 'clean' ? 'Abonniert' : 'Folge ich';
            badgeClass = 'block-status-badge following';
        } else if (user.relation === 'follower') {
            relationLabel = 'Folgt mir';
            badgeClass = 'block-status-badge follower';
        }
        
        if (user.status === 'processing') {
            relationLabel = state.followerMode === 'clean' ? 'Entfolge...' : 'Folge...';
            badgeClass = 'block-status-badge processing';
        } else if (user.status === 'followed') {
            relationLabel = user.relation === 'follower' ? 'Mutual 👥' : 'Gefolgt ✓';
            badgeClass = 'block-status-badge mutual';
        } else if (user.status === 'unfollowed') {
            relationLabel = 'Entfolgt ✓';
            badgeClass = 'block-status-badge none';
        } else if (user.status === 'error') {
            relationLabel = 'Fehler';
            badgeClass = 'block-status-badge error';
        }
        
        const avatarSrc = user.avatar || '';
        const avatarEl = avatarSrc 
            ? `<img src="${avatarSrc}" alt="Avatar" class="block-avatar" onerror="this.src=''; this.className='avatar-placeholder'">`
            : `<div class="block-avatar avatar-placeholder"></div>`;
            
        // Interactive state check
        let isInteractive = false;
        if (state.followerMode === 'copy') {
            isInteractive = user.relation !== 'following' && user.relation !== 'mutual' && user.relation !== 'blocked' && user.status !== 'followed' && !state.isFollowProcessing;
        } else {
            isInteractive = user.status !== 'unfollowed' && !state.isFollowProcessing;
        }
        
        const disabledAttr = isInteractive ? '' : 'disabled';
        
        // Enrich details
        const details = state.detailedProfilesMap.get(user.did);
        let bioHtml = '';
        let statsHtml = '';
        let qualityBadgeHtml = '';
        
        if (details) {
            const isBot = (details.postsCount === 0 && !user.avatar && !details.description) || 
                          (details.followsCount > 500 && details.followersCount < 50 && (details.followsCount / Math.max(1, details.followersCount)) > 5);
            if (isBot) {
                qualityBadgeHtml = `<span class="block-status-badge spambot" title="Verdacht auf Spam-Bot">⚠️ Bot?</span>`;
            } else if (details.postsCount === 0) {
                qualityBadgeHtml = `<span class="block-status-badge inactive" title="Inaktiver Account (0 Posts)">💤 Inaktiv</span>`;
            }
            
            if (details.description) {
                bioHtml = `<div class="follower-bio" title="${details.description}">${details.description}</div>`;
            }
            statsHtml = `
                <div class="follower-stats">
                    <span>📝 ${details.postsCount} Posts</span>
                    <span>👤 ${details.followersCount} Follower</span>
                </div>
            `;
        }
        
        card.innerHTML = `
            <label class="checkbox-container">
                <input type="checkbox" ${user.selected && isInteractive ? 'checked' : ''} ${disabledAttr} data-did="${user.did}">
                <span class="checkmark"></span>
            </label>
            ${avatarEl}
            <div class="follower-item-detail">
                <div class="block-name" title="${user.displayName || user.handle}">${user.displayName || user.handle}</div>
                <div class="block-handle">
                    <a href="https://bsky.app/profile/${user.handle}" target="_blank" rel="noopener noreferrer">@${user.handle}</a>
                </div>
                ${bioHtml}
                ${statsHtml}
            </div>
            <div style="display: flex; align-items: center; gap: 8px; flex-direction: column; justify-content: center; flex-shrink: 0;">
                <span class="${badgeClass}">${relationLabel}</span>
                ${qualityBadgeHtml}
            </div>
        `;
        
        const checkbox = card.querySelector('input[type="checkbox"]');
        if (isInteractive) {
            checkbox.addEventListener('change', (e) => {
                user.selected = e.target.checked;
                updateFollowerStats();
            });
        }
        
        DOM.followerListGrid.appendChild(card);
    });
}

function startFollowingFlow() {
    const listToFollow = state.targetFollowers.filter(f => f.selected && f.relation !== 'following' && f.relation !== 'mutual' && f.relation !== 'blocked' && f.status !== 'followed');
    
    if (listToFollow.length === 0) {
        alert('Bitte wähle mindestens ein Profil zum Folgen aus!');
        return;
    }
    
    // Bypass confirm dialog in mock/test mode
    if (state.session && state.session.did !== 'did:plc:testuser123') {
        const confirmMsg = `Bist du sicher, dass du den ${listToFollow.length} ausgewählten Accounts automatisiert folgen möchtest?`;
        if (!confirm(confirmMsg)) return;
    }
    
    state.currentFollowAction = { type: 'follow', description: 'Follower-Kopierer: Gefolgt: ' + listToFollow.map(u => '@' + u.handle).join(', '), targets: listToFollow.map(u => ({ did: u.did, handle: u.handle })) };
    
    state.followQueue = listToFollow.map(u => u.did);
    state.followRunTotal = listToFollow.length;
    state.isFollowProcessing = true;
    state.isFollowPaused = false;
    
    setFollowButtonsDisabled(true);
    DOM.followProgressContainer.classList.remove('hidden');
    DOM.followExecutionControls.classList.remove('hidden');
    DOM.btnFollowPause.classList.remove('hidden');
    DOM.btnFollowResume.classList.add('hidden');
    DOM.btnFollowCancel.disabled = false;
    
    log(`Starte automatisiertes Folgen für ${state.followQueue.length} Accounts...`, 'system');
    updateFollowProgress();
    renderTargetFollowers();
    
    processFollowQueue();
}

function startUnfollowingFlow() {
    const listToUnfollow = state.targetFollowers.filter(f => f.selected && f.status !== 'unfollowed');
    
    if (listToUnfollow.length === 0) {
        alert('Bitte wähle mindestens ein Profil zum Entfolgen aus!');
        return;
    }
    
    // Bypass confirm dialog in mock/test mode
    if (state.session && state.session.did !== 'did:plc:testuser123') {
        const confirmMsg = `Bist du sicher, dass du den ${listToUnfollow.length} ausgewählten Accounts entfolgen möchtest?`;
        if (!confirm(confirmMsg)) return;
    }
    
    state.currentFollowAction = { type: 'unfollow', description: 'Follower-Cleaner: Entfolgt: ' + listToUnfollow.map(u => '@' + u.handle).join(', '), targets: listToUnfollow.map(u => ({ did: u.did, handle: u.handle })) };
    
    state.followQueue = listToUnfollow.map(u => u.did);
    state.followRunTotal = listToUnfollow.length;
    state.isFollowProcessing = true;
    state.isFollowPaused = false;
    
    setFollowButtonsDisabled(true);
    DOM.followProgressContainer.classList.remove('hidden');
    DOM.followExecutionControls.classList.remove('hidden');
    DOM.btnFollowPause.classList.remove('hidden');
    DOM.btnFollowResume.classList.add('hidden');
    DOM.btnFollowCancel.disabled = false;
    
    log(`Starte automatisiertes Entfolgen für ${state.followQueue.length} Accounts...`, 'system');
    updateFollowProgress();
    renderTargetFollowers();
    
    processUnfollowQueue();
}

function updateFollowProgress() {
    const processed = state.followRunTotal - state.followQueue.length;
    const percentage = state.followRunTotal > 0 ? (processed / state.followRunTotal) * 100 : 0;
    
    DOM.followProgressBar.style.width = `${percentage}%`;
    DOM.followProgressText.textContent = `Aktion: ${processed} / ${state.followRunTotal} (${Math.round(percentage)}%)`;
}

function setFollowButtonsDisabled(disabled) {
    DOM.btnFollowSelected.disabled = disabled;
    DOM.btnUnfollowSelected.disabled = disabled;
    DOM.btnLoadTarget.disabled = disabled;
    DOM.btnLoadMoreTarget.disabled = disabled;
    DOM.btnLoadAllTarget.disabled = disabled;
    DOM.btnReloadOwnData.disabled = disabled;
    DOM.btnAnalyzeUnfollow.disabled = disabled;
    DOM.targetIdentifierInput.disabled = disabled;
    DOM.followerSearchInput.disabled = disabled;
    DOM.selectRelationshipFilter.disabled = disabled;
    DOM.selectQualityFilter.disabled = disabled;
    DOM.btnFollowerSelectAll.disabled = disabled;
    DOM.btnFollowerDeselectAll.disabled = disabled;
    DOM.btnFollowerExportCsv.disabled = disabled;
    DOM.btnFollowerExportJson.disabled = disabled;
    DOM.btnFollowerImportCustom.disabled = disabled;
    DOM.btnFollowerAddToList.disabled = disabled;
    DOM.inputNewListName.disabled = disabled;
    
    const checkboxes = DOM.followerListGrid.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => cb.disabled = disabled);
}

async function processFollowQueue() {
    const CONCURRENCY = 4;
    const THROTTLE_DELAY = 100;
    const workers = [];
    
    const worker = async () => {
        while (state.followQueue.length > 0 && state.isFollowProcessing && !state.isFollowPaused) {
            const currentDid = state.followQueue.shift();
            if (!currentDid) continue;
            
            const user = state.targetFollowers.find(u => u.did === currentDid);
            if (!user) continue;
            
            user.status = 'processing';
            updateFollowerCardUI(user);
            updateFollowProgress();
            
            try {
                await new Promise(resolve => setTimeout(resolve, THROTTLE_DELAY));
                
                if (!state.isFollowProcessing || state.isFollowPaused) {
                    state.followQueue.unshift(currentDid);
                    user.status = 'idle';
                    updateFollowerCardUI(user);
                    updateFollowProgress();
                    break;
                }
                
                if (state.isDryRun || (state.session && state.session.did === 'did:plc:testuser123')) {
                    const isMock = state.session && state.session.did === 'did:plc:testuser123';
                    log(`${isMock ? '[Mock]' : '[Dry-Run]'} Würde @${user.handle} folgen.`, 'success');
                    if (isMock) {
                        await new Promise(resolve => setTimeout(resolve, 300));
                    }
                    user.status = 'followed';
                    user.selected = false;
                    state.myFollows.add(user.did);
                } else {
                    log(`Folge @${user.handle}...`, 'info');
                    await apiFetch(`${state.session.serverUrl}/xrpc/com.atproto.repo.createRecord`, {
                        method: 'POST',
                        body: JSON.stringify({
                            repo: state.session.did,
                            collection: 'app.bsky.graph.follow',
                            record: {
                                $type: 'app.bsky.graph.follow',
                                subject: currentDid,
                                createdAt: new Date().toISOString()
                            }
                        })
                    });
                    
                    user.status = 'followed';
                    user.selected = false;
                    state.myFollows.add(user.did); // Add to local follows set
                    log(`Erfolgreich gefolgt: @${user.handle}`, 'success');
                }
            } catch (err) {
                user.status = 'error';
                log(`Fehler beim Folgen von @${user.handle}: ${getErrorMessage(err)}`, 'error');
            }
            
            updateFollowerCardUI(user);
            updateFollowProgress();
        }
    };
    
    for (let i = 0; i < Math.min(CONCURRENCY, state.followQueue.length); i++) {
        workers.push(worker());
    }
    
    await Promise.all(workers);
    
    if (state.followQueue.length === 0 && state.isFollowProcessing && !state.isFollowPaused) {
        log('Abonnement-Aktionen abgeschlossen!', 'success');
        if (state.currentFollowAction) {
            addActionToHistory(state.currentFollowAction.type, state.currentFollowAction.description, state.currentFollowAction.targets);
            state.currentFollowAction = null;
        }
        finishFollowingFlow();
    }
}

async function processUnfollowQueue() {
    const CONCURRENCY = 4;
    const THROTTLE_DELAY = 100;
    const workers = [];
    
    const worker = async () => {
        while (state.followQueue.length > 0 && state.isFollowProcessing && !state.isFollowPaused) {
            const currentDid = state.followQueue.shift();
            if (!currentDid) continue;
            
            const user = state.targetFollowers.find(u => u.did === currentDid);
            if (!user) continue;
            
            user.status = 'processing';
            updateFollowerCardUI(user);
            updateFollowProgress();
            
            try {
                await new Promise(resolve => setTimeout(resolve, THROTTLE_DELAY));
                
                if (!state.isFollowProcessing || state.isFollowPaused) {
                    state.followQueue.unshift(currentDid);
                    user.status = 'idle';
                    updateFollowerCardUI(user);
                    updateFollowProgress();
                    break;
                }
                
                if (state.isDryRun || (state.session && state.session.did === 'did:plc:testuser123')) {
                    const isMock = state.session && state.session.did === 'did:plc:testuser123';
                    log(`${isMock ? '[Mock]' : '[Dry-Run]'} Würde @${user.handle} entfolgen.`, 'success');
                    if (isMock) {
                        await new Promise(resolve => setTimeout(resolve, 300));
                    }
                    user.status = 'unfollowed';
                    user.selected = false;
                    state.myFollows.delete(user.did);
                    state.myFollowsRkeys.delete(user.did);
                } else {
                    const rkey = state.myFollowsRkeys.get(user.did);
                    if (!rkey) {
                        throw new Error(`Follow-Record-Schlüssel für @${user.handle} nicht gefunden. Lade deine Daten neu.`);
                    }
                    
                    log(`Entfolge @${user.handle}...`, 'info');
                    await apiFetch(`${state.session.serverUrl}/xrpc/com.atproto.repo.deleteRecord`, {
                        method: 'POST',
                        body: JSON.stringify({
                            repo: state.session.did,
                            collection: 'app.bsky.graph.follow',
                            rkey: rkey
                        })
                    });
                    
                    user.status = 'unfollowed';
                    user.selected = false;
                    state.myFollows.delete(user.did);
                    state.myFollowsRkeys.delete(user.did);
                    log(`Erfolgreich entfolgt: @${user.handle}`, 'success');
                }
            } catch (err) {
                user.status = 'error';
                log(`Fehler beim Entfolgen von @${user.handle}: ${getErrorMessage(err)}`, 'error');
            }
            
            updateFollowerCardUI(user);
            updateFollowProgress();
        }
    };
    
    for (let i = 0; i < Math.min(CONCURRENCY, state.followQueue.length); i++) {
        workers.push(worker());
    }
    
    await Promise.all(workers);
    
    if (state.followQueue.length === 0 && state.isFollowProcessing && !state.isFollowPaused) {
        log('Abonnements-Bereinigung abgeschlossen!', 'success');
        if (state.currentFollowAction) {
            addActionToHistory(state.currentFollowAction.type, state.currentFollowAction.description, state.currentFollowAction.targets);
            state.currentFollowAction = null;
        }
        finishFollowingFlow();
    }
}

function updateFollowerCardUI(user) {
    const card = document.getElementById(`follower-card-${user.did.replace(':', '_')}`);
    if (card) {
        let relationLabel = 'Keine';
        let badgeClass = 'block-status-badge none';
        
        if (user.relation === 'blocked') {
            relationLabel = 'Blockiert';
            badgeClass = 'block-status-badge blocked';
        } else if (user.relation === 'mutual') {
            relationLabel = 'Mutual';
            badgeClass = 'block-status-badge mutual';
        } else if (user.relation === 'following') {
            relationLabel = state.followerMode === 'clean' ? 'Abonniert' : 'Folge ich';
            badgeClass = 'block-status-badge following';
        } else if (user.relation === 'follower') {
            relationLabel = 'Folgt mir';
            badgeClass = 'block-status-badge follower';
        }
        
        if (user.status === 'processing') {
            relationLabel = state.followerMode === 'clean' ? 'Entfolge...' : 'Folge...';
            badgeClass = 'block-status-badge processing';
            card.className = 'block-item fade-in processing';
        } else if (user.status === 'followed') {
            relationLabel = user.relation === 'follower' ? 'Mutual 👥' : 'Gefolgt ✓';
            badgeClass = 'block-status-badge mutual';
            card.className = 'block-item fade-in success';
        } else if (user.status === 'unfollowed') {
            relationLabel = 'Entfolgt ✓';
            badgeClass = 'block-status-badge none';
            card.className = 'block-item fade-in inactive';
        } else if (user.status === 'error') {
            relationLabel = 'Fehler';
            badgeClass = 'block-status-badge error';
            card.className = 'block-item fade-in error';
        } else {
            let statusClass = user.status;
            if (user.status === 'unfollowed') statusClass = 'inactive';
            card.className = `block-item fade-in ${statusClass} ${user.relation === 'blocked' ? 'error' : ''}`;
        }
        
        const badge = card.querySelector('.block-status-badge');
        if (badge) {
            badge.className = badgeClass;
            badge.textContent = relationLabel;
        }
        
        const checkbox = card.querySelector('input[type="checkbox"]');
        if (checkbox) {
            checkbox.checked = user.selected;
            let isInteractive = false;
            if (state.followerMode === 'copy') {
                isInteractive = user.relation !== 'following' && user.relation !== 'mutual' && user.relation !== 'blocked' && user.status !== 'followed' && !state.isFollowProcessing;
            } else {
                isInteractive = user.status !== 'unfollowed' && !state.isFollowProcessing;
            }
            checkbox.disabled = !isInteractive;
        }
    }
}

function finishFollowingFlow() {
    state.isFollowProcessing = false;
    state.isFollowPaused = false;
    state.followQueue = [];
    
    DOM.followProgressContainer.classList.add('hidden');
    DOM.followExecutionControls.classList.add('hidden');
    
    setFollowButtonsDisabled(false);
    recalculateRelationships();
    renderTargetFollowers();
}

function exportFollowersCSV() {
    if (state.targetFollowers.length === 0) {
        alert('Keine geladenen Accounts zum Exportieren vorhanden.');
        return;
    }
    
    let csvContent = 'DID,Handle,Name,Beziehung,Posts,Followers,Bio\n';
    
    state.targetFollowers.forEach(f => {
        const details = state.detailedProfilesMap.get(f.did) || {};
        const name = (f.displayName || f.handle).replace(/"/g, '""');
        const relation = f.relation;
        const posts = details.postsCount || 0;
        const followers = details.followersCount || 0;
        const bio = (details.description || '').replace(/"/g, '""').replace(/\r?\n/g, ' ');
        
        csvContent += `"${f.did}","${f.handle}","${name}","${relation}",${posts},${followers},"${bio}"\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bluesky-follower-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    log('Follower-Liste erfolgreich als CSV exportiert.', 'success');
}

function exportFollowersJSON() {
    if (state.targetFollowers.length === 0) {
        alert('Keine geladenen Accounts zum Exportieren vorhanden.');
        return;
    }
    
    const dataToExport = state.targetFollowers.map(f => {
        const details = state.detailedProfilesMap.get(f.did) || {};
        return {
            did: f.did,
            handle: f.handle,
            displayName: f.displayName,
            avatar: f.avatar,
            relation: f.relation,
            description: details.description || '',
            postsCount: details.postsCount || 0,
            followersCount: details.followersCount || 0,
            followsCount: details.followsCount || 0
        };
    });
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bluesky-follower-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    log('Follower-Liste erfolgreich als JSON exportiert.', 'success');
}

async function handleFollowerImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
        try {
            const content = evt.target.result;
            let importedUsers = [];
            
            if (file.name.endsWith('.json')) {
                const parsed = JSON.parse(content);
                if (Array.isArray(parsed)) {
                    parsed.forEach(p => {
                        if (p.did || p.handle) {
                            importedUsers.push({
                                did: p.did || '',
                                handle: p.handle || '',
                                displayName: p.displayName || p.handle || '',
                                avatar: p.avatar || '',
                                relation: p.relation || 'none',
                                status: 'idle',
                                selected: true,
                                postsCount: p.postsCount || 0,
                                followersCount: p.followersCount || 0,
                                followsCount: p.followsCount || 0,
                                description: p.description || ''
                            });
                        }
                    });
                }
            } else if (file.name.endsWith('.csv')) {
                const lines = content.split(/\r?\n/);
                if (lines.length > 1) {
                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (!line) continue;
                        
                        const parts = [];
                        let inQuotes = false;
                        let current = '';
                        for (let c = 0; c < line.length; c++) {
                            const char = line[c];
                            if (char === '"') {
                                if (inQuotes && line[c + 1] === '"') {
                                    current += '"';
                                    c++;
                                } else {
                                    inQuotes = !inQuotes;
                                }
                            } else if (char === ',' && !inQuotes) {
                                parts.push(current.trim());
                                current = '';
                            } else {
                                current += char;
                            }
                        }
                        parts.push(current.trim());
                        
                        if (parts.length >= 2) {
                            const did = parts[0] || '';
                            const handle = parts[1] || '';
                            const displayName = parts[2] || handle || '';
                            const relation = parts[3] || 'none';
                            const postsCount = parseInt(parts[4]) || 0;
                            const followersCount = parseInt(parts[5]) || 0;
                            const description = parts[6] || '';
                            
                            importedUsers.push({
                                did: did,
                                handle: handle,
                                displayName: displayName,
                                avatar: '',
                                relation: relation,
                                status: 'idle',
                                selected: true,
                                postsCount: postsCount,
                                followersCount: followersCount,
                                followsCount: 0,
                                description: description
                            });
                        }
                    }
                }
            } else {
                const lines = content.split(/\r?\n/);
                for (let line of lines) {
                    line = line.trim();
                    if (!line) continue;
                    
                    let did = '';
                    let handle = '';
                    if (line.startsWith('did:')) {
                        did = line;
                    } else {
                        handle = line.replace(/^@/, '');
                    }
                    
                    importedUsers.push({
                        did: did,
                        handle: handle || did,
                        displayName: handle || did,
                        avatar: '',
                        relation: 'none',
                        status: 'idle',
                        selected: true,
                        postsCount: 0,
                        followersCount: 0,
                        followsCount: 0,
                        description: ''
                    });
                }
            }
            
            if (importedUsers.length === 0) {
                alert('Keine gültigen Accounts im importierten File gefunden.');
                return;
            }
            
            log(`Importiere ${importedUsers.length} Profile...`, 'system');
            
            let resolvedCount = 0;
            const updatedFollowers = [];
            
            for (const user of importedUsers) {
                if (!user.did) {
                    if (state.session && state.session.did !== 'did:plc:testuser123') {
                        try {
                            const res = await apiFetch(`${state.session.serverUrl}/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(user.handle)}`);
                            user.did = res.did;
                        } catch (err) {
                            log(`Konnte Handle @${user.handle} nicht auflösen: ${getErrorMessage(err)}`, 'warning');
                            continue;
                        }
                    } else {
                        user.did = `did:plc:imported_${user.handle.replace(/\./g, '_')}`;
                    }
                }
                
                let relation = 'none';
                if (state.blockedUsers.some(u => u.did === user.did && u.status !== 'unblocked')) {
                    relation = 'blocked';
                } else if (state.myFollows.has(user.did) && state.myFollowers.has(user.did)) {
                    relation = 'mutual';
                } else if (state.myFollows.has(user.did)) {
                    relation = 'following';
                } else if (state.myFollowers.has(user.did)) {
                    relation = 'follower';
                }
                
                user.relation = relation;
                
                if (state.followerMode === 'copy') {
                    user.selected = relation !== 'following' && relation !== 'mutual' && relation !== 'blocked';
                } else {
                    user.selected = relation === 'following' || relation === 'mutual';
                }
                
                state.detailedProfilesMap.set(user.did, {
                    did: user.did,
                    description: user.description || '',
                    postsCount: user.postsCount || 0,
                    followersCount: user.followersCount || 0,
                    followsCount: user.followsCount || 0
                });
                
                updatedFollowers.push(user);
                resolvedCount++;
            }
            
            state.targetFollowers = updatedFollowers;
            state.targetCursor = '';
            
            updateFollowerStats();
            renderTargetFollowers();
            
            DOM.emptyFollowers.classList.add('hidden');
            DOM.followerListGrid.classList.remove('hidden');
            
            log(`${resolvedCount} Profile erfolgreich importiert!`, 'success');
            alert(`${resolvedCount} Profile wurden erfolgreich importiert und in die Liste geladen.`);
            
        } catch (err) {
            log(`Fehler beim Parsen der Import-Datei: ${err.message}`, 'error');
            alert(`Fehler beim Parsen: ${err.message}`);
        } finally {
            DOM.inputFollowerImportFile.value = '';
        }
    };
    reader.readAsText(file);
}

function importFollowersCustom() {
    DOM.inputFollowerImportFile.click();
}

async function addSelectedToList() {
    const listName = DOM.inputNewListName.value.trim();
    if (!listName) {
        alert('Bitte gib einen Namen für die neue Liste ein.');
        return;
    }
    
    const listToExport = state.targetFollowers.filter(f => f.selected && f.relation !== 'blocked');
    if (listToExport.length === 0) {
        alert('Bitte wähle mindestens einen Account aus der Liste aus!');
        return;
    }
    
    log(`Erstelle Benutzerliste "${listName}" auf Bluesky...`, 'system');
    
    try {
        if (state.isDryRun || (state.session && state.session.did === 'did:plc:testuser123')) {
            const isMock = state.session && state.session.did === 'did:plc:testuser123';
            log(`${isMock ? '[Mock]' : '[Dry-Run]'} Würde Liste "${listName}" mit ${listToExport.length} Mitgliedern erstellen.`, 'success');
            alert(`${isMock ? '[Mock]' : '[Dry-Run]'} Liste "${listName}" erfolgreich erstellt.`);
            DOM.inputNewListName.value = '';
            return;
        }
        
        const createListRes = await apiFetch(`${state.session.serverUrl}/xrpc/com.atproto.repo.createRecord`, {
            method: 'POST',
            body: JSON.stringify({
                repo: state.session.did,
                collection: 'app.bsky.graph.list',
                record: {
                    $type: 'app.bsky.graph.list',
                    name: listName,
                    purpose: 'app.bsky.graph.defs#curatelist',
                    description: 'Erstellt mit C.T.H.U.L.H.U.',
                    createdAt: new Date().toISOString()
                }
            })
        });
        
        const listUri = createListRes.uri;
        log(`Liste auf Bluesky erstellt: ${listUri}`, 'success');
        
        log(`Füge ${listToExport.length} Mitglieder zur Liste hinzu...`, 'info');
        
        const CONCURRENCY = 4;
        const THROTTLE_DELAY = 100;
        const queue = [...listToExport];
        const workers = [];
        
        const worker = async () => {
            while (queue.length > 0) {
                const user = queue.shift();
                if (!user) continue;
                
                try {
                    await new Promise(resolve => setTimeout(resolve, THROTTLE_DELAY));
                    await apiFetch(`${state.session.serverUrl}/xrpc/com.atproto.repo.createRecord`, {
                        method: 'POST',
                        body: JSON.stringify({
                            repo: state.session.did,
                            collection: 'app.bsky.graph.listitem',
                            record: {
                                $type: 'app.bsky.graph.listitem',
                                subject: user.did,
                                list: listUri,
                                createdAt: new Date().toISOString()
                            }
                        })
                    });
                    log(`Mitglied hinzugefügt: @${user.handle}`, 'success');
                } catch (err) {
                    log(`Fehler bei @${user.handle} (Liste): ${getErrorMessage(err)}`, 'error');
                }
            }
        };
        
        for (let i = 0; i < Math.min(CONCURRENCY, queue.length); i++) {
            workers.push(worker());
        }
        
        await Promise.all(workers);
        log(`Liste erfolgreich erstellt und gefüllt!`, 'success');
        alert(`Liste "${listName}" wurde erfolgreich mit ${listToExport.length} Mitgliedern auf Bluesky angelegt!`);
        DOM.inputNewListName.value = '';
    } catch (err) {
        log(`Fehler beim Erstellen der Liste: ${getErrorMessage(err)}`, 'error');
        alert(`Fehler: ${getErrorMessage(err)}`);
    }
}

function switchFollowerMode(mode) {
    if (state.isFollowProcessing) {
        alert('Aktion läuft gerade, bitte warten oder abbrechen.');
        return;
    }
    
    state.followerMode = mode;
    state.targetFollowers = [];
    state.targetCursor = '';
    DOM.followerListGrid.innerHTML = '';
    
    if (mode === 'copy') {
        DOM.btnModeCopy.classList.add('active');
        DOM.btnModeClean.classList.remove('active');
        DOM.followersTargetFormWrapper.classList.remove('hidden');
        DOM.unfollowCleanerWrapper.classList.add('hidden');
        DOM.followersControlTitle.textContent = 'Ziel-Account & Status';
        DOM.followerListTitle.textContent = 'Follower des Ziel-Accounts';
        DOM.emptyFollowersText.textContent = 'Gib einen Ziel-Account ein und klicke auf "Follower laden".';
        DOM.labelStatMutual.textContent = 'Mutuals';
        DOM.labelStatBlocked.textContent = 'Blockiert';
        DOM.btnFollowSelected.classList.remove('hidden');
        DOM.btnUnfollowSelected.classList.add('hidden');
        DOM.followActionInfo.textContent = 'Markiere die Accounts in der Liste, denen du folgen möchtest, und klicke auf "Markierten Accounts folgen".';
    } else {
        DOM.btnModeCopy.classList.remove('active');
        DOM.btnModeClean.classList.add('active');
        DOM.followersTargetFormWrapper.classList.add('hidden');
        DOM.unfollowCleanerWrapper.classList.remove('hidden');
        DOM.followersControlTitle.textContent = 'Eigene Follows & Status';
        DOM.followerListTitle.textContent = 'Eigene abonniert-Liste';
        DOM.emptyFollowersText.textContent = 'Klicke auf "Eigene Follows analysieren", um deine Abonnements zu laden.';
        DOM.labelStatMutual.textContent = 'Backfollows';
        DOM.labelStatBlocked.textContent = 'Non-Mutuals';
        DOM.btnFollowSelected.classList.add('hidden');
        DOM.btnUnfollowSelected.classList.remove('hidden');
        DOM.followActionInfo.textContent = 'Markiere die Accounts in der Liste, denen du entfolgen möchtest, und klicke auf "Markierten Accounts entfolgen".';
    }
    
    updateFollowerStats();
    DOM.emptyFollowers.classList.remove('hidden');
    DOM.followerListGrid.classList.add('hidden');
    if (DOM.btnLoadMoreTarget) DOM.btnLoadMoreTarget.classList.add('hidden');
    if (DOM.btnLoadAllTarget) DOM.btnLoadAllTarget.classList.add('hidden');
}

function initFollowerCopier() {
    setupTabs();
    
    DOM.btnReloadOwnData.addEventListener('click', fetchMyFollowsAndFollowers);
    
    DOM.followersTargetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        fetchTargetFollowers(false);
    });
    
    DOM.btnLoadMoreTarget.addEventListener('click', () => {
        fetchTargetFollowers(true);
    });
    
    DOM.btnLoadAllTarget.addEventListener('click', loadAllTargetFollowers);
    
    DOM.followerSearchInput.addEventListener('input', renderTargetFollowers);
    DOM.selectRelationshipFilter.addEventListener('change', renderTargetFollowers);
    DOM.selectQualityFilter.addEventListener('change', renderTargetFollowers);
    
    DOM.btnFollowerSelectAll.addEventListener('click', () => {
        const filtered = getFilteredTargetFollowers();
        filtered.forEach(f => {
            if (state.followerMode === 'copy') {
                if (f.relation !== 'following' && f.relation !== 'mutual' && f.relation !== 'blocked' && f.status !== 'followed') {
                    f.selected = true;
                }
            } else {
                if (f.status !== 'unfollowed') {
                    f.selected = true;
                }
            }
        });
        updateFollowerStats();
        renderTargetFollowers();
    });
    
    DOM.btnFollowerDeselectAll.addEventListener('click', () => {
        state.targetFollowers.forEach(f => f.selected = false);
        updateFollowerStats();
        renderTargetFollowers();
    });
    
    DOM.btnFollowSelected.addEventListener('click', startFollowingFlow);
    DOM.btnUnfollowSelected.addEventListener('click', startUnfollowingFlow);
    DOM.btnModeCopy.addEventListener('click', () => switchFollowerMode('copy'));
    DOM.btnModeClean.addEventListener('click', () => switchFollowerMode('clean'));
    DOM.btnAnalyzeUnfollow.addEventListener('click', fetchMyFollowsDetailed);
    
    DOM.btnFollowerExportCsv.addEventListener('click', exportFollowersCSV);
    DOM.btnFollowerExportJson.addEventListener('click', exportFollowersJSON);
    DOM.btnFollowerImportCustom.addEventListener('click', importFollowersCustom);
    DOM.inputFollowerImportFile.addEventListener('change', handleFollowerImport);
    DOM.btnFollowerAddToList.addEventListener('click', addSelectedToList);
    
    // Follow controls event listeners
    DOM.btnFollowPause.addEventListener('click', () => {
        if (!state.isFollowProcessing || state.isFollowPaused) return;
        state.isFollowPaused = true;
        log('Aktion pausiert. Aktuelle Abrufe werden beendet...', 'warning');
        DOM.btnFollowPause.classList.add('hidden');
        DOM.btnFollowResume.classList.remove('hidden');
    });

    DOM.btnFollowResume.addEventListener('click', () => {
        if (!state.isFollowProcessing || !state.isFollowPaused) return;
        state.isFollowPaused = false;
        log('Aktion fortgesetzt...', 'system');
        DOM.btnFollowPause.classList.remove('hidden');
        DOM.btnFollowResume.classList.add('hidden');
        if (state.followerMode === 'clean') {
            processUnfollowQueue();
        } else {
            processFollowQueue();
        }
    });

    DOM.btnFollowCancel.addEventListener('click', () => {
        if (confirm('Möchtest du den Vorgang abbrechen? Bereits durchgeführte Änderungen bleiben erhalten.')) {
            log('Aktion abgebrochen.', 'warning');
            state.followQueue = [];
            state.targetFollowers.forEach(f => {
                if (f.status === 'processing') {
                    f.status = 'idle';
                }
            });
            finishFollowingFlow();
        }
    });
    
    initNewTabs();
}

function initNewTabs() {
    initOverlapTab();
    initGhostsTab();
    initInteractionsTab();
    initListsTab();
}

// --- TAB 3: OVERLAP ANALYZER LOGIC ---

function initOverlapTab() {
    DOM.overlapForm.addEventListener('submit', (e) => {
        e.preventDefault();
        fetchOverlapFollowers();
    });
    
    DOM.btnOverlapSelectAll.addEventListener('click', () => {
        const filtered = getFilteredOverlapFollowers();
        filtered.forEach(f => {
            if (f.relation !== 'following' && f.relation !== 'mutual' && f.relation !== 'blocked' && f.status !== 'followed') {
                f.selected = true;
            }
        });
        updateOverlapStats();
        renderOverlapFollowers();
    });
    
    DOM.btnOverlapDeselectAll.addEventListener('click', () => {
        state.overlapFollowers.forEach(f => f.selected = false);
        updateOverlapStats();
        renderOverlapFollowers();
    });
    
    DOM.btnOverlapFollowSelected.addEventListener('click', startOverlapFollowFlow);
    DOM.overlapSearchInput.addEventListener('input', renderOverlapFollowers);
}

async function fetchOverlapFollowers() {
    const handle1 = DOM.overlapTarget1.value.trim();
    const handle2 = DOM.overlapTarget2.value.trim();
    const handle3 = DOM.overlapTarget3.value.trim();
    
    if (!handle1 || !handle2) {
        alert('Bitte gib mindestens zwei Ziel-Accounts an!');
        return;
    }
    
    DOM.btnLoadOverlap.disabled = true;
    DOM.btnLoadOverlap.querySelector('.spinner').classList.remove('hidden');
    DOM.loadingOverlap.classList.remove('hidden');
    DOM.emptyOverlap.classList.add('hidden');
    DOM.overlapListGrid.classList.add('hidden');
    
    log('Berechne Schnittmenge der Follower...', 'system');
    
    try {
        let did1, did2, did3;
        
        // Mock Mode Check
        const isMock = state.session && state.session.did === 'did:plc:testuser123';
        if (isMock) {
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const mockOverlap = [
                { did: 'did:plc:protected1', handle: 'protected-user.bsky.social', displayName: 'Protected Account 🛡️', relation: 'blocked', targets: [handle1, handle2] },
                { did: 'did:plc:regular3', handle: 'regular-troll.bsky.social', displayName: 'Regular Troll', relation: 'mutual', targets: [handle1, handle2] },
                { did: 'did:plc:target1', handle: 'target-following.bsky.social', displayName: 'Target Following', relation: 'following', targets: [handle1, handle2] },
                { did: 'did:plc:target3', handle: 'target-none.bsky.social', displayName: 'Target None', relation: 'none', targets: [handle1, handle2] },
                { did: 'did:plc:target4', handle: 'target-none2.bsky.social', displayName: 'Target None 2', relation: 'none', targets: [handle1, handle2] }
            ];
            
            state.overlapFollowers = mockOverlap.map(f => ({
                did: f.did,
                handle: f.handle,
                displayName: f.displayName,
                avatar: '',
                relation: f.relation,
                status: 'idle',
                selected: f.relation === 'none',
                targetsFollowed: f.targets
            }));
            
            state.overlapFollowers.forEach(f => {
                if (!state.detailedProfilesMap.has(f.did)) {
                    state.detailedProfilesMap.set(f.did, {
                        did: f.did,
                        description: f.did === 'did:plc:target3' ? '' : 'Mocked intersection profile description.',
                        postsCount: f.did === 'did:plc:target3' || f.did === 'did:plc:target4' ? 0 : 50,
                        followersCount: 15,
                        followsCount: f.did === 'did:plc:target3' ? 1500 : 10
                    });
                }
            });
            
        } else {
            // Live Mode handle resolve
            did1 = await resolveHandleOrDid(handle1);
            did2 = await resolveHandleOrDid(handle2);
            if (handle3) did3 = await resolveHandleOrDid(handle3);
            
            log(`Hole Follower von @${handle1}...`, 'info');
            const followers1 = await getActorFollowersList(did1);
            log(`Hole Follower von @${handle2}...`, 'info');
            const followers2 = await getActorFollowersList(did2);
            
            let intersectedDids = followers1.filter(did => followers2.includes(did));
            
            if (handle3 && did3) {
                log(`Hole Follower von @${handle3}...`, 'info');
                const followers3 = await getActorFollowersList(did3);
                intersectedDids = intersectedDids.filter(did => followers3.includes(did));
            }
            
            log(`Schnittmenge berechnet: ${intersectedDids.length} gemeinsame Profile.`, 'success');
            
            if (intersectedDids.length === 0) {
                state.overlapFollowers = [];
            } else {
                const profiles = await fetchDetailedProfiles(intersectedDids.slice(0, 100)); // Cap at 100
                
                const blockedDids = new Set(state.blockedUsers.filter(u => u.status !== 'unblocked').map(u => u.did));
                
                state.overlapFollowers = profiles.map(p => {
                    let relation = 'none';
                    if (blockedDids.has(p.did)) relation = 'blocked';
                    else if (state.myFollows.has(p.did) && state.myFollowers.has(p.did)) relation = 'mutual';
                    else if (state.myFollows.has(p.did)) relation = 'following';
                    else if (state.myFollowers.has(p.did)) relation = 'follower';
                    
                    state.detailedProfilesMap.set(p.did, {
                        did: p.did,
                        description: p.description || '',
                        postsCount: p.postsCount || 0,
                        followersCount: p.followersCount || 0,
                        followsCount: p.followsCount || 0
                    });
                    
                    const targets = [handle1, handle2];
                    if (handle3) targets.push(handle3);
                    
                    return {
                        did: p.did,
                        handle: p.handle,
                        displayName: p.displayName || p.handle,
                        avatar: p.avatar || '',
                        relation: relation,
                        status: 'idle',
                        selected: relation !== 'following' && relation !== 'mutual' && relation !== 'blocked',
                        targetsFollowed: targets
                    };
                });
            }
        }
        
        updateOverlapStats();
        renderOverlapFollowers();
        
    } catch (err) {
        log(`Fehler bei Überlappungs-Abfrage: ${getErrorMessage(err)}`, 'error');
        alert(`Fehler: ${getErrorMessage(err)}`);
    } finally {
        DOM.btnLoadOverlap.disabled = false;
        DOM.btnLoadOverlap.querySelector('.spinner').classList.add('hidden');
        DOM.loadingOverlap.classList.add('hidden');
    }
}

async function resolveHandleOrDid(actor) {
    if (actor.startsWith('did:')) return actor;
    const res = await apiFetch(`${state.session.serverUrl}/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(actor)}`);
    return res.did;
}

async function getActorFollowersList(did) {
    let cursor = '';
    const followers = [];
    let page = 1;
    do {
        let url = `${state.session.serverUrl}/xrpc/app.bsky.graph.getFollowers?actor=${did}&limit=100`;
        if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
        const res = await apiFetch(url);
        if (res.followers) {
            res.followers.forEach(f => followers.push(f.did));
        }
        cursor = res.cursor;
        page++;
        if (page > 15) break; // limit to 1500 per target
    } while (cursor);
    return followers;
}

function getFilteredOverlapFollowers() {
    const query = DOM.overlapSearchInput.value.toLowerCase().trim();
    return state.overlapFollowers.filter(f => 
        f.handle.toLowerCase().includes(query) || (f.displayName || '').toLowerCase().includes(query)
    );
}

function updateOverlapStats() {
    const total = state.overlapFollowers.length;
    const selected = state.overlapFollowers.filter(f => f.selected).length;
    DOM.statOverlapLoaded.textContent = total;
    DOM.statOverlapSelected.textContent = selected;
}

function renderOverlapFollowers() {
    DOM.overlapListGrid.innerHTML = '';
    const filtered = getFilteredOverlapFollowers();
    DOM.overlapVisibleCountBadge.textContent = `${filtered.length} von ${state.overlapFollowers.length} angezeigt`;
    
    if (filtered.length === 0) {
        DOM.overlapListGrid.classList.add('hidden');
        DOM.emptyOverlap.classList.remove('hidden');
        if (state.overlapFollowers.length > 0) {
            DOM.emptyOverlap.querySelector('p').textContent = 'Keine Profile entsprechen deiner Filterung.';
        } else {
            DOM.emptyOverlap.querySelector('p').textContent = 'Gib mindestens zwei Ziel-Accounts ein und klicke auf "Schnittmenge laden".';
        }
        return;
    }
    
    DOM.emptyOverlap.classList.add('hidden');
    DOM.overlapListGrid.classList.remove('hidden');
    
    filtered.forEach(user => {
        const card = document.createElement('div');
        let statusClass = user.status;
        if (user.status === 'followed') statusClass = 'success';
        card.className = `block-item fade-in ${statusClass} ${user.relation === 'blocked' ? 'error' : ''}`;
        
        let relationLabel = 'Keine';
        let badgeClass = 'block-status-badge none';
        if (user.relation === 'blocked') {
            relationLabel = 'Blockiert';
            badgeClass = 'block-status-badge blocked';
        } else if (user.relation === 'mutual') {
            relationLabel = 'Mutual';
            badgeClass = 'block-status-badge mutual';
        } else if (user.relation === 'following') {
            relationLabel = 'Folge ich';
            badgeClass = 'block-status-badge following';
        } else if (user.relation === 'follower') {
            relationLabel = 'Folgt mir';
            badgeClass = 'block-status-badge follower';
        }
        
        if (user.status === 'processing') {
            relationLabel = 'Folge...';
            badgeClass = 'block-status-badge processing';
        } else if (user.status === 'followed') {
            relationLabel = 'Gefolgt ✓';
            badgeClass = 'block-status-badge mutual';
        }
        
        const avatarSrc = user.avatar || '';
        const avatarEl = avatarSrc 
            ? `<img src="${avatarSrc}" alt="Avatar" class="block-avatar" onerror="this.src=''; this.className='avatar-placeholder'">`
            : `<div class="block-avatar avatar-placeholder"></div>`;
            
        const isInteractive = user.relation !== 'following' && user.relation !== 'mutual' && user.relation !== 'blocked' && user.status !== 'followed';
        
        const details = state.detailedProfilesMap.get(user.did) || {};
        const bioHtml = details.description ? `<div class="follower-bio" title="${details.description}">${details.description}</div>` : '';
        const statsHtml = `
            <div class="follower-stats">
                <span>📝 ${details.postsCount || 0} Posts</span>
                <span>👤 ${details.followersCount || 0} Follower</span>
            </div>
        `;
        
        const targetString = user.targetsFollowed.map(t => `@${t.split('.')[0]}`).join(' & ');
        const targetBadge = `<span class="block-status-badge" style="background: rgba(139, 92, 246, 0.15); color: #c084fc; border-color: rgba(139, 92, 246, 0.3); margin-top: 3px;">👥 Folgt ${targetString}</span>`;
        
        card.innerHTML = `
            <label class="checkbox-container">
                <input type="checkbox" ${user.selected && isInteractive ? 'checked' : ''} ${isInteractive ? '' : 'disabled'} data-did="${user.did}">
                <span class="checkmark"></span>
            </label>
            ${avatarEl}
            <div class="follower-item-detail">
                <div class="block-name" title="${user.displayName}">${user.displayName}</div>
                <div class="block-handle">
                    <a href="https://bsky.app/profile/${user.handle}" target="_blank" rel="noopener noreferrer">@${user.handle}</a>
                </div>
                ${bioHtml}
                ${statsHtml}
                <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                    <span class="${badgeClass}">${relationLabel}</span>
                    ${targetBadge}
                </div>
            </div>
        `;
        
        const cb = card.querySelector('input[type="checkbox"]');
        if (cb) {
            cb.addEventListener('change', () => {
                user.selected = cb.checked;
                updateOverlapStats();
            });
        }
        
        DOM.overlapListGrid.appendChild(card);
    });
}

function startOverlapFollowFlow() {
    const list = state.overlapFollowers.filter(f => f.selected && f.status !== 'followed');
    if (list.length === 0) {
        alert('Bitte wähle mindestens ein Profil aus!');
        return;
    }
    
    state.followQueue = list.map(u => u.did);
    state.followRunTotal = list.length;
    
    DOM.overlapProgressContainer.classList.remove('hidden');
    updateOverlapFollowProgress();
    
    processOverlapFollowQueue();
}

function updateOverlapFollowProgress() {
    const processed = state.followRunTotal - state.followQueue.length;
    const percentage = state.followRunTotal > 0 ? (processed / state.followRunTotal) * 100 : 0;
    DOM.overlapProgressBar.style.width = `${percentage}%`;
    DOM.overlapProgressText.textContent = `Folge: ${processed} / ${state.followRunTotal} (${Math.round(percentage)}%)`;
}

async function processOverlapFollowQueue() {
    const CONCURRENCY = 4;
    const THROTTLE_DELAY = 100;
    
    const worker = async () => {
        while (state.followQueue.length > 0) {
            const currentDid = state.followQueue.shift();
            if (!currentDid) continue;
            
            const user = state.overlapFollowers.find(u => u.did === currentDid);
            if (!user) continue;
            
            user.status = 'processing';
            renderOverlapFollowers();
            updateOverlapFollowProgress();
            
            try {
                await new Promise(resolve => setTimeout(resolve, THROTTLE_DELAY));
                
                const isMock = state.session && state.session.did === 'did:plc:testuser123';
                if (isMock) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                    log(`[Mock] Gefolgt: @${user.handle}`, 'success');
                } else {
                    await apiFetch(`${state.session.serverUrl}/xrpc/com.atproto.repo.createRecord`, {
                        method: 'POST',
                        body: JSON.stringify({
                            repo: state.session.did,
                            collection: 'app.bsky.graph.follow',
                            record: {
                                $type: 'app.bsky.graph.follow',
                                subject: currentDid,
                                createdAt: new Date().toISOString()
                            }
                        })
                    });
                    log(`Erfolgreich gefolgt: @${user.handle}`, 'success');
                }
                user.status = 'followed';
                user.selected = false;
                state.myFollows.add(user.did);
                
            } catch (err) {
                user.status = 'error';
                log(`Fehler beim Folgen von @${user.handle}: ${getErrorMessage(err)}`, 'error');
            }
            renderOverlapFollowers();
            updateOverlapFollowProgress();
        }
    };
    
    const workers = [];
    for (let i = 0; i < Math.min(CONCURRENCY, state.followQueue.length); i++) {
        workers.push(worker());
    }
    await Promise.all(workers);
    
    DOM.overlapProgressContainer.classList.add('hidden');
    recalculateRelationships();
    renderOverlapFollowers();
}

// --- TAB 4: GHOST AUDITOR LOGIC ---

function initGhostsTab() {
    DOM.btnAnalyzeGhosts.addEventListener('click', runGhostsAudit);
    
    DOM.btnGhostsSelectAll.addEventListener('click', () => {
        state.ghostFollowers.forEach(f => {
            if (f.status !== 'unfollowed') {
                f.selected = true;
            }
        });
        updateGhostsStats();
        renderGhostFollowers();
    });
    
    DOM.btnGhostsDeselectAll.addEventListener('click', () => {
        state.ghostFollowers.forEach(f => f.selected = false);
        updateGhostsStats();
        renderGhostFollowers();
    });
    
    DOM.btnGhostsSoftblockSelected.addEventListener('click', startSoftBlockingFlow);
}

async function runGhostsAudit() {
    DOM.btnAnalyzeGhosts.disabled = true;
    DOM.btnAnalyzeGhosts.querySelector('.spinner').classList.remove('hidden');
    DOM.loadingGhosts.classList.remove('hidden');
    DOM.emptyGhosts.classList.add('hidden');
    DOM.ghostsListGrid.classList.add('hidden');
    
    log('Starte Follower-Audit...', 'system');
    
    try {
        state.ghostFollowers = [];
        
        const isMock = state.session && state.session.did === 'did:plc:testuser123';
        if (isMock) {
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const mockAudited = [
                { did: 'did:plc:regular3', handle: 'regular-troll.bsky.social', displayName: 'Regular Troll', relation: 'mutual' },
                { did: 'did:plc:target2', handle: 'target-follower.bsky.social', displayName: 'Target Follower', relation: 'follower' },
                { did: 'did:plc:target3', handle: 'target-none.bsky.social', displayName: 'Target None (Bot)', relation: 'follower' },
                { did: 'did:plc:target4', handle: 'target-none2.bsky.social', displayName: 'Target None 2 (Inactive)', relation: 'follower' },
                { did: 'did:plc:zombie1', handle: 'zombie-spammer.bsky.social', displayName: 'Zombie Spammer', relation: 'follower' }
            ];
            
            state.ghostFollowers = mockAudited.map(f => {
                let posts = 45;
                let followers = 5;
                let follows = 10;
                let desc = 'Follower Bio';
                
                if (f.did === 'did:plc:target3') {
                    posts = 0;
                    followers = 5;
                    follows = 2000;
                    desc = '';
                } else if (f.did === 'did:plc:target4') {
                    posts = 0;
                    followers = 5;
                    follows = 10;
                    desc = 'Inactive Bio';
                } else if (f.did === 'did:plc:zombie1') {
                    posts = 15;
                    followers = 12;
                    follows = 650;
                    desc = 'Ehemals inaktiv, folgt nun in kurzer Zeit massenhaft Profilen.';
                }
                
                const details = {
                    did: f.did,
                    description: desc,
                    postsCount: posts,
                    followersCount: followers,
                    followsCount: follows
                };
                state.detailedProfilesMap.set(f.did, details);
                
                return {
                    did: f.did,
                    handle: f.handle,
                    displayName: f.displayName,
                    avatar: '',
                    relation: f.relation,
                    status: 'idle',
                    selected: f.did === 'did:plc:target3' || f.did === 'did:plc:target4' || f.did === 'did:plc:zombie1'
                };
            });
            
        } else {
            log('Rufe deine Follower-Liste ab...', 'info');
            const followerDids = [];
            let cursor = '';
            let page = 1;
            do {
                let url = `${state.session.serverUrl}/xrpc/app.bsky.graph.getFollowers?actor=${state.session.did}&limit=100`;
                if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
                const data = await apiFetch(url);
                if (data.followers) {
                    data.followers.forEach(f => {
                        followerDids.push(f.did);
                        if (!state.detailedProfilesMap.has(f.did)) {
                            state.detailedProfilesMap.set(f.did, {
                                did: f.did,
                                description: f.description || '',
                                postsCount: 0,
                                followersCount: 0,
                                followsCount: 0
                            });
                        }
                    });
                }
                cursor = data.cursor;
                page++;
                if (page > 30) break; // limit to 3000
            } while (cursor);
            
            log(`${followerDids.length} Follower gefunden. Lade Profildetails...`, 'info');
            
            const profiles = await fetchDetailedProfiles(followerDids.slice(0, 100)); // Limit to first 100
            
            profiles.forEach(p => {
                state.detailedProfilesMap.set(p.did, {
                    did: p.did,
                    description: p.description || '',
                    postsCount: p.postsCount || 0,
                    followersCount: p.followersCount || 0,
                    followsCount: p.followsCount || 0
                });
            });
            
            const blockedDids = new Set(state.blockedUsers.filter(u => u.status !== 'unblocked').map(u => u.did));
            
            followerDids.slice(0, 100).forEach(did => {
                const profile = profiles.find(p => p.did === did);
                if (!profile) return;
                
                let relation = 'follower';
                if (blockedDids.has(did)) relation = 'blocked';
                else if (state.myFollows.has(did)) relation = 'mutual';
                
                state.ghostFollowers.push({
                    did: did,
                    handle: profile.handle,
                    displayName: profile.displayName || profile.handle,
                    avatar: profile.avatar || '',
                    relation: relation,
                    status: 'idle',
                    selected: false
                });
            });
        }
        
        updateGhostsStats();
        renderGhostFollowers();
        log('Follower-Audit abgeschlossen.', 'success');
        
    } catch (err) {
        log(`Fehler bei Follower-Audit: ${getErrorMessage(err)}`, 'error');
        alert(`Fehler: ${getErrorMessage(err)}`);
    } finally {
        DOM.btnAnalyzeGhosts.disabled = false;
        DOM.btnAnalyzeGhosts.querySelector('.spinner').classList.add('hidden');
        DOM.loadingGhosts.classList.add('hidden');
    }
}

function updateGhostsStats() {
    let bots = 0;
    let zombies = 0;
    let inactive = 0;
    let selected = 0;
    
    state.ghostFollowers.forEach(f => {
        const details = state.detailedProfilesMap.get(f.did);
        if (details) {
            const isBot = (details.postsCount === 0 && !f.avatar && !details.description) || 
                          (details.followsCount > 500 && details.followersCount < 50 && (details.followsCount / Math.max(1, details.followersCount)) > 5);
            const isZombie = !isBot && details.postsCount > 0 && details.followsCount > 500 && details.followersCount < 30 && (details.followsCount / Math.max(1, details.followersCount)) > 8;
            
            if (isBot) bots++;
            else if (isZombie) zombies++;
            else if (details.postsCount === 0) inactive++;
        }
        if (f.selected) selected++;
    });
    
    DOM.statGhostsBots.textContent = bots;
    DOM.statGhostsZombies.textContent = zombies;
    DOM.statGhostsInactive.textContent = inactive;
    DOM.statGhostsSelected.textContent = selected;
}

function renderGhostFollowers() {
    DOM.ghostsListGrid.innerHTML = '';
    DOM.ghostsVisibleCountBadge.textContent = `${state.ghostFollowers.length} geladen`;
    
    if (state.ghostFollowers.length === 0) {
        DOM.ghostsListGrid.classList.add('hidden');
        DOM.emptyGhosts.classList.remove('hidden');
        return;
    }
    
    DOM.emptyGhosts.classList.add('hidden');
    DOM.ghostsListGrid.classList.remove('hidden');
    
    state.ghostFollowers.forEach(user => {
        const card = document.createElement('div');
        let statusClass = user.status;
        if (user.status === 'unfollowed') statusClass = 'inactive';
        card.className = `block-item fade-in ${statusClass}`;
        
        let relationLabel = 'Folgt dir';
        let badgeClass = 'block-status-badge follower';
        if (user.relation === 'mutual') {
            relationLabel = 'Mutual';
            badgeClass = 'block-status-badge mutual';
        }
        
        if (user.status === 'processing') {
            relationLabel = 'Soft-Block...';
            badgeClass = 'block-status-badge processing';
        } else if (user.status === 'unfollowed') {
            relationLabel = 'Bereinigt ✓';
            badgeClass = 'block-status-badge none';
        }
        
        const details = state.detailedProfilesMap.get(user.did) || {};
        let qualityBadgeHtml = '';
        
        const isBot = (details.postsCount === 0 && !user.avatar && !details.description) || 
                      (details.followsCount > 500 && details.followersCount < 50 && (details.followsCount / Math.max(1, details.followersCount)) > 5);
        const isZombie = !isBot && details.postsCount > 0 && details.followsCount > 500 && details.followersCount < 30 && (details.followsCount / Math.max(1, details.followersCount)) > 8;
        
        if (isBot) {
            qualityBadgeHtml = `<span class="block-status-badge spambot" title="Verdacht auf Spam-Bot">⚠️ Bot?</span>`;
        } else if (isZombie) {
            qualityBadgeHtml = `<span class="block-status-badge zombie" title="Zombie-Verdacht (inaktiv gewesen, jetzt Massen-Folgen)">🧟 Zombie?</span>`;
        } else if (details.postsCount === 0) {
            qualityBadgeHtml = `<span class="block-status-badge inactive" title="Inaktiv">💤 Inaktiv</span>`;
        }
        
        const bioHtml = details.description ? `<div class="follower-bio" title="${details.description}">${details.description}</div>` : '';
        const statsHtml = `
            <div class="follower-stats">
                <span>📝 ${details.postsCount || 0} Posts</span>
                <span>👤 ${details.followersCount || 0} Follower</span>
            </div>
        `;
        
        const avatarSrc = user.avatar || '';
        const avatarEl = avatarSrc 
            ? `<img src="${avatarSrc}" alt="Avatar" class="block-avatar" onerror="this.src=''; this.className='avatar-placeholder'">`
            : `<div class="block-avatar avatar-placeholder"></div>`;
            
        const isInteractive = user.status !== 'unfollowed';
        
        card.innerHTML = `
            <label class="checkbox-container">
                <input type="checkbox" ${user.selected && isInteractive ? 'checked' : ''} ${isInteractive ? '' : 'disabled'} data-did="${user.did}">
                <span class="checkmark"></span>
            </label>
            ${avatarEl}
            <div class="follower-item-detail">
                <div class="block-name" title="${user.displayName}">${user.displayName}</div>
                <div class="block-handle">
                    <a href="https://bsky.app/profile/${user.handle}" target="_blank" rel="noopener noreferrer">@${user.handle}</a>
                </div>
                ${bioHtml}
                ${statsHtml}
                <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                    <span class="${badgeClass}">${relationLabel}</span>
                    ${qualityBadgeHtml}
                </div>
            </div>
        `;
        
        const cb = card.querySelector('input[type="checkbox"]');
        if (cb) {
            cb.addEventListener('change', () => {
                user.selected = cb.checked;
                updateGhostsStats();
            });
        }
        
        DOM.ghostsListGrid.appendChild(card);
    });
}

function startSoftBlockingFlow() {
    const list = state.ghostFollowers.filter(f => f.selected && f.status !== 'unfollowed');
    if (list.length === 0) {
        alert('Bitte wähle mindestens ein Profil aus!');
        return;
    }
    
    if (state.session && state.session.did !== 'did:plc:testuser123') {
        if (!confirm(`Bist du sicher, dass du ${list.length} Accounts per Soft-Block entfernen möchtest? (Die Konten folgen dir danach nicht mehr)`)) {
            return;
        }
    }
    
    state.currentFollowAction = { type: 'softblock', description: 'Geister-Auditor: Soft-Block: ' + list.map(u => '@' + u.handle).join(', '), targets: list.map(u => ({ did: u.did, handle: u.handle })) };
    
    state.followQueue = list.map(u => u.did);
    state.followRunTotal = list.length;
    
    DOM.ghostsProgressContainer.classList.remove('hidden');
    updateGhostsProgress();
    
    processSoftBlockQueue();
}

function updateGhostsProgress() {
    const processed = state.followRunTotal - state.followQueue.length;
    const percentage = state.followRunTotal > 0 ? (processed / state.followRunTotal) * 100 : 0;
    DOM.ghostsProgressBar.style.width = `${percentage}%`;
    DOM.ghostsProgressText.textContent = `Bereinige: ${processed} / ${state.followRunTotal} (${Math.round(percentage)}%)`;
}

async function processSoftBlockQueue() {
    const THROTTLE_DELAY = 150;
    
    while (state.followQueue.length > 0) {
        const currentDid = state.followQueue.shift();
        if (!currentDid) continue;
        
        const user = state.ghostFollowers.find(u => u.did === currentDid);
        if (!user) continue;
        
        user.status = 'processing';
        renderGhostFollowers();
        updateGhostsProgress();
        
        try {
            await new Promise(resolve => setTimeout(resolve, THROTTLE_DELAY));
            
            const isMock = state.session && state.session.did === 'did:plc:testuser123';
            if (isMock) {
                await new Promise(resolve => setTimeout(resolve, 300));
                log(`[Mock] Soft-Block durchgeführt für: @${user.handle}`, 'success');
            } else {
                log(`Blockiere @${user.handle}...`, 'info');
                const blockRes = await apiFetch(`${state.session.serverUrl}/xrpc/com.atproto.repo.createRecord`, {
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
                
                const rkey = blockRes.uri.split('/').pop();
                await new Promise(resolve => setTimeout(resolve, 200));
                
                log(`Entblocke @${user.handle} sofort wieder...`, 'info');
                await apiFetch(`${state.session.serverUrl}/xrpc/com.atproto.repo.deleteRecord`, {
                    method: 'POST',
                    body: JSON.stringify({
                        repo: state.session.did,
                        collection: 'app.bsky.graph.block',
                        rkey: rkey
                    })
                });
                
                log(`Soft-Block erfolgreich für @${user.handle}`, 'success');
            }
            
            user.status = 'unfollowed';
            user.selected = false;
            state.myFollowers.delete(user.did);
            
        } catch (err) {
            user.status = 'error';
            log(`Fehler bei Soft-Block von @${user.handle}: ${getErrorMessage(err)}`, 'error');
        }
        
        renderGhostFollowers();
        updateGhostsProgress();
    }
    
    DOM.ghostsProgressContainer.classList.add('hidden');
    if (state.currentFollowAction) {
        addActionToHistory(state.currentFollowAction.type, state.currentFollowAction.description, state.currentFollowAction.targets);
        state.currentFollowAction = null;
    }
    updateGhostsStats();
}

// --- TAB 5: INTERACTION AUDITOR LOGIC ---

function initInteractionsTab() {
    DOM.btnLoadReplies.addEventListener('click', fetchPostReplies);
    DOM.selectInteractionFilter.addEventListener('change', renderInteractionReplies);
    
    DOM.btnInteractSelectAll.addEventListener('click', () => {
        const filtered = getFilteredReplies();
        filtered.forEach(r => {
            if (r.status !== 'blocked' && r.status !== 'followed') {
                r.selected = true;
            }
        });
        updateInteractStats();
        renderInteractionReplies();
    });
    
    DOM.btnInteractDeselectAll.addEventListener('click', () => {
        state.selectedPostReplies.forEach(r => r.selected = false);
        updateInteractStats();
        renderInteractionReplies();
    });
    
    DOM.btnInteractBlockSelected.addEventListener('click', () => runBulkInteractionAction('block'));
    DOM.btnInteractFollowSelected.addEventListener('click', () => runBulkInteractionAction('follow'));
}

async function fetchMyRecentPosts() {
    if (!state.session) return;
    
    DOM.selectUserPosts.innerHTML = '<option value="" disabled selected>Beiträge werden geladen...</option>';
    
    try {
        const isMock = state.session && state.session.did === 'did:plc:testuser123';
        if (isMock) {
            state.authorPosts = [
                { uri: 'at://did:plc:testuser123/app.bsky.feed.post/post1', text: 'C.T.H.U.L.H.U. v1.1.0 Release! 🚀 #bluesky', createdAt: '2026-06-24T06:00:00.000Z' },
                { uri: 'at://did:plc:testuser123/app.bsky.feed.post/post2', text: 'Wie findet ihr die neuen Reinigungs-Features?', createdAt: '2026-06-23T15:30:00.000Z' }
            ];
        } else {
            const res = await apiFetch(`${state.session.serverUrl}/xrpc/app.bsky.feed.getAuthorFeed?actor=${state.session.did}&limit=15`);
            const feed = res.feed || [];
            state.authorPosts = feed
                .filter(item => item.post && item.post.author.did === state.session.did)
                .map(item => ({
                    uri: item.post.uri,
                    cid: item.post.cid,
                    text: item.post.record.text || '',
                    createdAt: item.post.record.createdAt
                }));
        }
        
        DOM.selectUserPosts.innerHTML = '';
        if (state.authorPosts.length === 0) {
            DOM.selectUserPosts.innerHTML = '<option value="" disabled>Keine eigenen Beiträge gefunden</option>';
            return;
        }
        
        state.authorPosts.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.uri;
            const date = new Date(p.createdAt).toLocaleDateString();
            const textPreview = p.text.length > 50 ? p.text.substring(0, 50) + '...' : p.text;
            opt.textContent = `[${date}] ${textPreview}`;
            DOM.selectUserPosts.appendChild(opt);
        });
        
    } catch (err) {
        log(`Fehler beim Laden deiner Beiträge: ${getErrorMessage(err)}`, 'warning');
        DOM.selectUserPosts.innerHTML = '<option value="" disabled>Fehler beim Laden</option>';
    }
}

async function fetchPostReplies() {
    const postUri = DOM.selectUserPosts.value;
    if (!postUri) {
        alert('Bitte wähle zuerst einen Beitrag aus!');
        return;
    }
    
    DOM.btnLoadReplies.disabled = true;
    DOM.btnLoadReplies.querySelector('.spinner').classList.remove('hidden');
    DOM.loadingInteractions.classList.remove('hidden');
    DOM.emptyInteractions.classList.add('hidden');
    DOM.interactionsListGrid.classList.add('hidden');
    
    log('Lade Kommentare des Beitrags...', 'system');
    
    try {
        state.selectedPostReplies = [];
        
        const isMock = state.session && state.session.did === 'did:plc:testuser123';
        if (isMock) {
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const mockReplies = [
                { did: 'did:plc:regular3', handle: 'regular-troll.bsky.social', displayName: 'Regular Troll', text: 'Sehr cooles Tool, gefällt mir richtig gut! 🌟', relation: 'mutual' },
                { did: 'did:plc:target3', handle: 'target-none.bsky.social', displayName: 'Target None (Bot)', text: 'Earn $5000 daily! Simple tasks. Click telegram link in bio or DM me on whatsapp +12345!', relation: 'none' },
                { did: 'did:plc:target1', handle: 'target-following.bsky.social', displayName: 'Target Following', text: 'Kann ich das auch lokal hosten?', relation: 'following' }
            ];
            
            state.selectedPostReplies = mockReplies.map(r => {
                const spamRegex = /(whatsapp|telegram|dm me|money|crypto|invest|earn|whatsapp me|\+1)/i;
                const isSpam = spamRegex.test(r.text);
                
                if (!state.detailedProfilesMap.has(r.did)) {
                    state.detailedProfilesMap.set(r.did, {
                        did: r.did,
                        description: isSpam ? '' : 'User Bio description.',
                        postsCount: isSpam ? 0 : 120,
                        followersCount: 15,
                        followsCount: isSpam ? 1800 : 100
                    });
                }
                
                return {
                    did: r.did,
                    handle: r.handle,
                    displayName: r.displayName || r.handle,
                    avatar: '',
                    relation: r.relation,
                    status: 'idle',
                    selected: isSpam,
                    replyText: r.text,
                    isSpam: isSpam
                };
            });
            
        } else {
            const res = await apiFetch(`${state.session.serverUrl}/xrpc/app.bsky.feed.getPostThread?uri=${encodeURIComponent(postUri)}`);
            const thread = res.thread || {};
            const replies = thread.replies || [];
            
            const replyActors = [];
            
            const extractReplies = (items) => {
                items.forEach(reply => {
                    if (reply.post && reply.post.author) {
                        const actor = reply.post.author;
                        const text = reply.post.record ? (reply.post.record.text || '') : '';
                        
                        const spamRegex = /(whatsapp|telegram|dm me|money|crypto|invest|earn|whatsapp me|\+1)/i;
                        const isSpam = spamRegex.test(text);
                        
                        replyActors.push({
                            did: actor.did,
                            handle: actor.handle,
                            displayName: actor.displayName || actor.handle,
                            avatar: actor.avatar || '',
                            text: text,
                            isSpam: isSpam
                        });
                    }
                    if (reply.replies && reply.replies.length > 0) {
                        extractReplies(reply.replies);
                    }
                });
            };
            
            extractReplies(replies);
            
            log(`${replyActors.length} Kommentare extrahiert. Lade Details...`, 'info');
            
            const uniqueDids = [...new Set(replyActors.map(r => r.did))];
            const profiles = await fetchDetailedProfiles(uniqueDids.slice(0, 100));
            
            profiles.forEach(p => {
                state.detailedProfilesMap.set(p.did, {
                    did: p.did,
                    description: p.description || '',
                    postsCount: p.postsCount || 0,
                    followersCount: p.followersCount || 0,
                    followsCount: p.followsCount || 0
                });
            });
            
            const blockedDids = new Set(state.blockedUsers.filter(u => u.status !== 'unblocked').map(u => u.did));
            
            replyActors.forEach(actor => {
                const profile = profiles.find(p => p.did === actor.did);
                if (!profile) return;
                
                let relation = 'none';
                if (blockedDids.has(actor.did)) relation = 'blocked';
                else if (state.myFollows.has(actor.did) && state.myFollowers.has(actor.did)) relation = 'mutual';
                else if (state.myFollows.has(actor.did)) relation = 'following';
                else if (state.myFollowers.has(actor.did)) relation = 'follower';
                
                state.selectedPostReplies.push({
                    did: actor.did,
                    handle: actor.handle,
                    displayName: actor.displayName,
                    avatar: actor.avatar,
                    relation: relation,
                    status: 'idle',
                    selected: actor.isSpam,
                    replyText: actor.text,
                    isSpam: actor.isSpam
                });
            });
        }
        
        updateInteractStats();
        renderInteractionReplies();
        log('Kommentare erfolgreich geladen und analysiert.', 'success');
        
    } catch (err) {
        log(`Fehler bei Kommentar-Abruf: ${getErrorMessage(err)}`, 'error');
        alert(`Fehler: ${getErrorMessage(err)}`);
    } finally {
        DOM.btnLoadReplies.disabled = false;
        DOM.btnLoadReplies.querySelector('.spinner').classList.add('hidden');
        DOM.loadingInteractions.classList.add('hidden');
    }
}

function getFilteredReplies() {
    const filter = DOM.selectInteractionFilter.value;
    return state.selectedPostReplies.filter(r => {
        if (filter === 'spam') return r.isSpam;
        if (filter === 'non-follow') return r.relation === 'none' || r.relation === 'follower';
        return true;
    });
}

function updateInteractStats() {
    let spam = 0;
    let potential = 0;
    let selected = 0;
    
    state.selectedPostReplies.forEach(r => {
        if (r.isSpam) spam++;
        if (r.relation === 'none' || r.relation === 'follower') potential++;
        if (r.selected) selected++;
    });
    
    DOM.statInteractSpam.textContent = spam;
    DOM.statInteractPotential.textContent = potential;
    DOM.statInteractSelected.textContent = selected;
}

function renderInteractionReplies() {
    DOM.interactionsListGrid.innerHTML = '';
    const filtered = getFilteredReplies();
    DOM.interactVisibleCountBadge.textContent = `${filtered.length} von ${state.selectedPostReplies.length} angezeigt`;
    
    if (filtered.length === 0) {
        DOM.interactionsListGrid.classList.add('hidden');
        DOM.emptyInteractions.classList.remove('hidden');
        return;
    }
    
    DOM.emptyInteractions.classList.add('hidden');
    DOM.interactionsListGrid.classList.remove('hidden');
    
    filtered.forEach((user, index) => {
        const card = document.createElement('div');
        let statusClass = user.status;
        if (user.status === 'blocked') statusClass = 'error';
        if (user.status === 'followed') statusClass = 'success';
        card.className = `block-item fade-in ${statusClass}`;
        
        let relationLabel = 'Keine';
        let badgeClass = 'block-status-badge none';
        if (user.relation === 'blocked') {
            relationLabel = 'Blockiert';
            badgeClass = 'block-status-badge blocked';
        } else if (user.relation === 'mutual') {
            relationLabel = 'Mutual';
            badgeClass = 'block-status-badge mutual';
        } else if (user.relation === 'following') {
            relationLabel = 'Folge ich';
            badgeClass = 'block-status-badge following';
        } else if (user.relation === 'follower') {
            relationLabel = 'Folgt mir';
            badgeClass = 'block-status-badge follower';
        }
        
        if (user.status === 'processing') {
            relationLabel = 'Aktion...';
            badgeClass = 'block-status-badge processing';
        }
        
        const details = state.detailedProfilesMap.get(user.did) || {};
        let spamBadge = user.isSpam ? `<span class="block-status-badge spambot" style="margin-top: 3px;">👻 Spam-Verdacht</span>` : '';
        
        const avatarSrc = user.avatar || '';
        const avatarEl = avatarSrc 
            ? `<img src="${avatarSrc}" alt="Avatar" class="block-avatar" onerror="this.src=''; this.className='avatar-placeholder'">`
            : `<div class="block-avatar avatar-placeholder"></div>`;
            
        const isInteractive = user.status !== 'blocked' && user.status !== 'followed';
        
        card.innerHTML = `
            <label class="checkbox-container">
                <input type="checkbox" ${user.selected && isInteractive ? 'checked' : ''} ${isInteractive ? '' : 'disabled'} data-index="${index}">
                <span class="checkmark"></span>
            </label>
            ${avatarEl}
            <div class="follower-item-detail">
                <div class="block-name" title="${user.displayName}">${user.displayName}</div>
                <div class="block-handle">
                    <a href="https://bsky.app/profile/${user.handle}" target="_blank" rel="noopener noreferrer">@${user.handle}</a>
                </div>
                <div style="font-size: 0.8rem; background: rgba(0,0,0,0.2); padding: 8px; border-radius: var(--radius-sm); margin: 5px 0; border: 1px dashed var(--card-border); color: var(--text-primary); max-height: 80px; overflow-y: auto;">
                    "${user.replyText}"
                </div>
                <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                    <span class="${badgeClass}">${relationLabel}</span>
                    ${spamBadge}
                </div>
            </div>
        `;
        
        const cb = card.querySelector('input[type="checkbox"]');
        if (cb) {
            cb.addEventListener('change', () => {
                user.selected = cb.checked;
                updateInteractStats();
            });
        }
        
        DOM.interactionsListGrid.appendChild(card);
    });
}

async function runBulkInteractionAction(actionType) {
    const list = state.selectedPostReplies.filter(r => r.selected && r.status !== 'blocked' && r.status !== 'followed');
    if (list.length === 0) {
        alert('Bitte wähle mindestens einen Kommentar aus!');
        return;
    }
    
    if (actionType === 'block') {
        if (state.session && state.session.did !== 'did:plc:testuser123') {
            if (!confirm(`Bist du sicher, dass du ${list.length} Accounts blockieren möchtest?`)) return;
        }
        
        log(`Blockiere ${list.length} Accounts in der Warteschlange...`, 'system');
        
        for (const item of list) {
            item.status = 'processing';
            renderInteractionReplies();
            try {
                const isMock = state.session && state.session.did === 'did:plc:testuser123';
                if (isMock) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                    log(`[Mock] Blockiert: @${item.handle}`, 'success');
                } else {
                    await apiFetch(`${state.session.serverUrl}/xrpc/com.atproto.repo.createRecord`, {
                        method: 'POST',
                        body: JSON.stringify({
                            repo: state.session.did,
                            collection: 'app.bsky.graph.block',
                            record: {
                                $type: 'app.bsky.graph.block',
                                subject: item.did,
                                createdAt: new Date().toISOString()
                            }
                        })
                    });
                    log(`Erfolgreich blockiert: @${item.handle}`, 'success');
                }
                item.status = 'blocked';
                item.selected = false;
                
            } catch (err) {
                item.status = 'error';
                log(`Fehler beim Blockieren von @${item.handle}: ${getErrorMessage(err)}`, 'error');
            }
        }
        
    } else {
        log(`Folge ${list.length} Accounts in der Warteschlange...`, 'system');
        
        for (const item of list) {
            item.status = 'processing';
            renderInteractionReplies();
            try {
                const isMock = state.session && state.session.did === 'did:plc:testuser123';
                if (isMock) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                    log(`[Mock] Gefolgt: @${item.handle}`, 'success');
                } else {
                    await apiFetch(`${state.session.serverUrl}/xrpc/com.atproto.repo.createRecord`, {
                        method: 'POST',
                        body: JSON.stringify({
                            repo: state.session.did,
                            collection: 'app.bsky.graph.follow',
                            record: {
                                $type: 'app.bsky.graph.follow',
                                subject: item.did,
                                createdAt: new Date().toISOString()
                            }
                        })
                    });
                    log(`Erfolgreich gefolgt: @${item.handle}`, 'success');
                }
                item.status = 'followed';
                item.selected = false;
                state.myFollows.add(item.did);
                
            } catch (err) {
                item.status = 'error';
                log(`Fehler beim Folgen von @${item.handle}: ${getErrorMessage(err)}`, 'error');
            }
        }
    }
    
    recalculateRelationships();
    updateInteractStats();
    renderInteractionReplies();
}

// --- TAB 6: LIST MANAGER LOGIC ---

function initListsTab() {
    DOM.btnLoadListMembers.addEventListener('click', fetchListMembers);
    DOM.btnListsClone.addEventListener('click', cloneSelectedList);
    DOM.btnListsMerge.addEventListener('click', mergeSelectedLists);
}

async function fetchMyLists() {
    if (!state.session) return;
    
    DOM.selectUserListsPrimary.innerHTML = '<option value="" disabled selected>Listen werden geladen...</option>';
    DOM.selectUserListsSecondary.innerHTML = '<option value="" disabled selected>Wähle zweite Liste...</option>';
    
    try {
        const isMock = state.session && state.session.did === 'did:plc:testuser123';
        if (isMock) {
            state.userLists = [
                { uri: 'at://did:plc:testuser123/app.bsky.graph.list/list1', rkey: 'list1', name: '👥 Meine White-List' },
                { uri: 'at://did:plc:testuser123/app.bsky.graph.list/list2', rkey: 'list2', name: '🚫 Krypto-Bots blockieren' }
            ];
        } else {
            const res = await apiFetch(`${state.session.serverUrl}/xrpc/app.bsky.graph.getLists?actor=${state.session.did}&limit=30`);
            const lists = res.lists || [];
            state.userLists = lists.map(l => ({
                uri: l.uri,
                rkey: l.uri.split('/').pop(),
                name: l.name,
                purpose: l.purpose,
                description: l.description || ''
            }));
        }
        
        DOM.selectUserListsPrimary.innerHTML = '';
        DOM.selectUserListsSecondary.innerHTML = '<option value="" disabled selected>Wähle zweite Liste...</option>';
        
        if (state.userLists.length === 0) {
            DOM.selectUserListsPrimary.innerHTML = '<option value="" disabled>Keine Listen auf deinem Konto gefunden</option>';
            return;
        }
        
        state.userLists.forEach(l => {
            const opt1 = document.createElement('option');
            opt1.value = l.uri;
            opt1.textContent = l.name;
            DOM.selectUserListsPrimary.appendChild(opt1);
            
            const opt2 = document.createElement('option');
            opt2.value = l.uri;
            opt2.textContent = l.name;
            DOM.selectUserListsSecondary.appendChild(opt2);
        });
        
    } catch (err) {
        log(`Fehler beim Laden deiner Listen: ${getErrorMessage(err)}`, 'warning');
        DOM.selectUserListsPrimary.innerHTML = '<option value="" disabled>Fehler beim Laden</option>';
    }
}

async function fetchListMembers() {
    const listUri = DOM.selectUserListsPrimary.value;
    if (!listUri) {
        alert('Bitte wähle zuerst eine primäre Liste aus!');
        return;
    }
    
    DOM.btnLoadListMembers.disabled = true;
    DOM.loadingLists.classList.remove('hidden');
    DOM.emptyLists.classList.add('hidden');
    DOM.listsListGrid.classList.add('hidden');
    
    const selectedList = state.userLists.find(l => l.uri === listUri);
    DOM.listMembersTitle.textContent = selectedList ? `Mitglieder der Liste: ${selectedList.name}` : 'Mitglieder der Liste';
    
    try {
        state.selectedListMembers = [];
        
        const isMock = state.session && state.session.did === 'did:plc:testuser123';
        if (isMock) {
            await new Promise(resolve => setTimeout(resolve, 600));
            
            let mockMembers = [];
            if (listUri.endsWith('list1')) {
                mockMembers = [
                    { did: 'did:plc:protected1', handle: 'protected-user.bsky.social', displayName: 'Protected Account 🛡️', relation: 'blocked', rkey: 'item1' },
                    { did: 'did:plc:regular3', handle: 'regular-troll.bsky.social', displayName: 'Regular Troll', relation: 'mutual', rkey: 'item2' }
                ];
            } else {
                mockMembers = [
                    { did: 'did:plc:target3', handle: 'target-none.bsky.social', displayName: 'Target None (Bot)', relation: 'none', rkey: 'item3' }
                ];
            }
            
            state.selectedListMembers = mockMembers.map(m => {
                if (!state.detailedProfilesMap.has(m.did)) {
                    state.detailedProfilesMap.set(m.did, {
                        did: m.did,
                        description: 'List member description.',
                        postsCount: 120,
                        followersCount: 50,
                        followsCount: 10
                    });
                }
                return {
                    did: m.did,
                    handle: m.handle,
                    displayName: m.displayName,
                    avatar: '',
                    relation: m.relation,
                    status: 'idle',
                    selected: false,
                    rkey: m.rkey
                };
            });
            
        } else {
            let cursor = '';
            const items = [];
            do {
                let url = `${state.session.serverUrl}/xrpc/app.bsky.graph.getList?list=${encodeURIComponent(listUri)}&limit=100`;
                if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
                const res = await apiFetch(url);
                if (res.items) {
                    items.push(...res.items);
                }
                cursor = res.cursor;
            } while (cursor);
            
            const uniqueDids = items.map(it => it.subject.did);
            const profiles = await fetchDetailedProfiles(uniqueDids.slice(0, 100));
            
            const blockedDids = new Set(state.blockedUsers.filter(u => u.status !== 'unblocked').map(u => u.did));
            
            state.selectedListMembers = items.slice(0, 100).map(item => {
                const p = profiles.find(profile => profile.did === item.subject.did) || item.subject;
                
                let relation = 'none';
                if (blockedDids.has(p.did)) relation = 'blocked';
                else if (state.myFollows.has(p.did) && state.myFollowers.has(p.did)) relation = 'mutual';
                else if (state.myFollows.has(p.did)) relation = 'following';
                else if (state.myFollowers.has(p.did)) relation = 'follower';
                
                state.detailedProfilesMap.set(p.did, {
                    did: p.did,
                    description: p.description || '',
                    postsCount: p.postsCount || 0,
                    followersCount: p.followersCount || 0,
                    followsCount: p.followsCount || 0
                });
                
                return {
                    did: p.did,
                    handle: p.handle,
                    displayName: p.displayName || p.handle,
                    avatar: p.avatar || '',
                    relation: relation,
                    status: 'idle',
                    selected: false,
                    rkey: item.uri.split('/').pop()
                };
            });
        }
        
        updateListsStats();
        renderListMembers();
        
    } catch (err) {
        log(`Fehler beim Abrufen der Listenmitglieder: ${getErrorMessage(err)}`, 'error');
        alert(`Fehler: ${getErrorMessage(err)}`);
    } finally {
        DOM.btnLoadListMembers.disabled = false;
        DOM.loadingLists.classList.add('hidden');
    }
}

function updateListsStats() {
    DOM.statListsMembersCount.textContent = state.selectedListMembers.length;
    DOM.statListsSelected.textContent = state.selectedListMembers.filter(m => m.selected).length;
}

function renderListMembers() {
    DOM.listsListGrid.innerHTML = '';
    DOM.listsVisibleCountBadge.textContent = `${state.selectedListMembers.length} geladen`;
    
    if (state.selectedListMembers.length === 0) {
        DOM.listsListGrid.classList.add('hidden');
        DOM.emptyLists.classList.remove('hidden');
        return;
    }
    
    DOM.emptyLists.classList.add('hidden');
    DOM.listsListGrid.classList.remove('hidden');
    
    state.selectedListMembers.forEach((user, index) => {
        const card = document.createElement('div');
        card.className = `block-item fade-in`;
        
        let relationLabel = 'Keine';
        let badgeClass = 'block-status-badge none';
        if (user.relation === 'blocked') {
            relationLabel = 'Blockiert';
            badgeClass = 'block-status-badge blocked';
        } else if (user.relation === 'mutual') {
            relationLabel = 'Mutual';
            badgeClass = 'block-status-badge mutual';
        } else if (user.relation === 'following') {
            relationLabel = 'Folge ich';
            badgeClass = 'block-status-badge following';
        } else if (user.relation === 'follower') {
            relationLabel = 'Folgt mir';
            badgeClass = 'block-status-badge follower';
        }
        
        const details = state.detailedProfilesMap.get(user.did) || {};
        const bioHtml = details.description ? `<div class="follower-bio" title="${details.description}">${details.description}</div>` : '';
        const statsHtml = `
            <div class="follower-stats">
                <span>📝 ${details.postsCount || 0} Posts</span>
                <span>👤 ${details.followersCount || 0} Follower</span>
            </div>
        `;
        
        const avatarSrc = user.avatar || '';
        const avatarEl = avatarSrc 
            ? `<img src="${avatarSrc}" alt="Avatar" class="block-avatar" onerror="this.src=''; this.className='avatar-placeholder'">`
            : `<div class="block-avatar avatar-placeholder"></div>`;
            
        card.innerHTML = `
            <label class="checkbox-container">
                <input type="checkbox" ${user.selected ? 'checked' : ''} data-index="${index}">
                <span class="checkmark"></span>
            </label>
            ${avatarEl}
            <div class="follower-item-detail">
                <div class="block-name" title="${user.displayName}">${user.displayName}</div>
                <div class="block-handle">
                    <a href="https://bsky.app/profile/${user.handle}" target="_blank" rel="noopener noreferrer">@${user.handle}</a>
                </div>
                ${bioHtml}
                ${statsHtml}
                <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                    <span class="${badgeClass}">${relationLabel}</span>
                </div>
            </div>
        `;
        
        const cb = card.querySelector('input[type="checkbox"]');
        if (cb) {
            cb.addEventListener('change', () => {
                user.selected = cb.checked;
                updateListsStats();
            });
        }
        
        DOM.listsListGrid.appendChild(card);
    });
}

async function cloneSelectedList() {
    const listUri = DOM.selectUserListsPrimary.value;
    const newName = DOM.inputCloneListName.value.trim();
    
    if (!listUri) {
        alert('Bitte wähle zuerst eine primäre Liste zum Klonen aus!');
        return;
    }
    if (!newName) {
        alert('Bitte gib einen Namen für die neue geklonte Liste ein!');
        return;
    }
    
    DOM.btnListsClone.disabled = true;
    log(`Klone Liste auf Bluesky...`, 'system');
    
    try {
        const members = [...state.selectedListMembers];
        if (members.length === 0) {
            log('Die Liste hat keine Mitglieder zum Klonen.', 'warning');
            alert('Die Liste hat keine Mitglieder zum Klonen.');
            DOM.btnListsClone.disabled = false;
            return;
        }
        
        const isMock = state.session && state.session.did === 'did:plc:testuser123';
        if (isMock) {
            await new Promise(resolve => setTimeout(resolve, 800));
            log(`[Mock] Liste geklont unter dem Namen "${newName}" mit ${members.length} Mitgliedern.`, 'success');
            alert(`[Mock] Liste "${newName}" erfolgreich erstellt und geklont!`);
            DOM.inputCloneListName.value = '';
            
        } else {
            const createListRes = await apiFetch(`${state.session.serverUrl}/xrpc/com.atproto.repo.createRecord`, {
                method: 'POST',
                body: JSON.stringify({
                    repo: state.session.did,
                    collection: 'app.bsky.graph.list',
                    record: {
                        $type: 'app.bsky.graph.list',
                        name: newName,
                        purpose: 'app.bsky.graph.defs#curatelist',
                        description: 'Geklont mit C.T.H.U.L.H.U.',
                        createdAt: new Date().toISOString()
                    }
                })
            });
            const newListUri = createListRes.uri;
            log(`Neue Liste erstellt: ${newListUri}. Füge Mitglieder hinzu...`, 'info');
            
            for (const item of members) {
                await apiFetch(`${state.session.serverUrl}/xrpc/com.atproto.repo.createRecord`, {
                    method: 'POST',
                    body: JSON.stringify({
                        repo: state.session.did,
                        collection: 'app.bsky.graph.listitem',
                        record: {
                            $type: 'app.bsky.graph.listitem',
                            subject: item.did,
                            list: newListUri,
                            createdAt: new Date().toISOString()
                        }
                    })
                });
                log(`Füge hinzu: @${item.handle}`, 'success');
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            log(`Liste erfolgreich geklont!`, 'success');
            alert(`Liste "${newName}" wurde erfolgreich mit ${members.length} Mitgliedern geklont.`);
            DOM.inputCloneListName.value = '';
            fetchMyLists();
        }
    } catch (err) {
        log(`Fehler beim Klonen: ${getErrorMessage(err)}`, 'error');
        alert(`Fehler: ${getErrorMessage(err)}`);
    } finally {
        DOM.btnListsClone.disabled = false;
    }
}

async function mergeSelectedLists() {
    const listUri1 = DOM.selectUserListsPrimary.value;
    const listUri2 = DOM.selectUserListsSecondary.value;
    const newName = DOM.inputMergeListName.value.trim();
    
    if (!listUri1 || !listUri2) {
        alert('Bitte wähle zwei Listen zum Zusammenführen aus!');
        return;
    }
    if (listUri1 === listUri2) {
        alert('Bitte wähle zwei unterschiedliche Listen aus!');
        return;
    }
    if (!newName) {
        alert('Bitte gib einen Namen für die zusammengeführte Liste ein!');
        return;
    }
    
    DOM.btnListsMerge.disabled = true;
    log(`Führe Listen zusammen...`, 'system');
    
    try {
        const isMock = state.session && state.session.did === 'did:plc:testuser123';
        let membersToMerge = [];
        
        if (isMock) {
            await new Promise(resolve => setTimeout(resolve, 800));
            membersToMerge = [
                { did: 'did:plc:protected1', handle: 'protected-user' },
                { did: 'did:plc:regular3', handle: 'regular-troll' },
                { did: 'did:plc:target3', handle: 'target-none' }
            ];
            log(`[Mock] Listen zusammengeführt unter dem Namen "${newName}" mit ${membersToMerge.length} Mitgliedern.`, 'success');
            alert(`[Mock] Liste "${newName}" erfolgreich zusammengeführt!`);
            DOM.inputMergeListName.value = '';
            
        } else {
            const items1 = [];
            let cursor = '';
            do {
                let url = `${state.session.serverUrl}/xrpc/app.bsky.graph.getList?list=${encodeURIComponent(listUri1)}&limit=100`;
                if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
                const res = await apiFetch(url);
                if (res.items) items1.push(...res.items);
                cursor = res.cursor;
            } while (cursor);
            
            const items2 = [];
            cursor = '';
            do {
                let url = `${state.session.serverUrl}/xrpc/app.bsky.graph.getList?list=${encodeURIComponent(listUri2)}&limit=100`;
                if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
                const res = await apiFetch(url);
                if (res.items) items2.push(...res.items);
                cursor = res.cursor;
            } while (cursor);
            
            const unionMap = new Map();
            items1.forEach(it => unionMap.set(it.subject.did, it.subject));
            items2.forEach(it => unionMap.set(it.subject.did, it.subject));
            
            membersToMerge = Array.from(unionMap.values());
            log(`${membersToMerge.length} einzigartige Mitglieder gefunden. Erstelle Liste...`, 'info');
            
            const createListRes = await apiFetch(`${state.session.serverUrl}/xrpc/com.atproto.repo.createRecord`, {
                method: 'POST',
                body: JSON.stringify({
                    repo: state.session.did,
                    collection: 'app.bsky.graph.list',
                    record: {
                        $type: 'app.bsky.graph.list',
                        name: newName,
                        purpose: 'app.bsky.graph.defs#curatelist',
                        description: 'Zusammengeführt mit C.T.H.U.L.H.U.',
                        createdAt: new Date().toISOString()
                    }
                })
            });
            const newListUri = createListRes.uri;
            log(`Neue Liste erstellt: ${newListUri}. Füge Mitglieder hinzu...`, 'info');
            
            for (const item of membersToMerge) {
                await apiFetch(`${state.session.serverUrl}/xrpc/com.atproto.repo.createRecord`, {
                    method: 'POST',
                    body: JSON.stringify({
                        repo: state.session.did,
                        collection: 'app.bsky.graph.listitem',
                        record: {
                            $type: 'app.bsky.graph.listitem',
                            subject: item.did,
                            list: newListUri,
                            createdAt: new Date().toISOString()
                        }
                    })
                });
                log(`Füge hinzu: @${item.handle}`, 'success');
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            log(`Listen erfolgreich zusammengeführt!`, 'success');
            alert(`Liste "${newName}" wurde erfolgreich mit ${membersToMerge.length} Mitgliedern zusammengeführt.`);
            DOM.inputMergeListName.value = '';
            fetchMyLists();
        }
    } catch (err) {
        log(`Fehler beim Zusammenführen: ${getErrorMessage(err)}`, 'error');
        alert(`Fehler: ${getErrorMessage(err)}`);
    } finally {
        DOM.btnListsMerge.disabled = false;
    }
}

// --- NEW FUNCTIONS FOR C.T.H.U.L.H.U. v1.3.0 ---

// --- 1. UNDO LOG (ACTION HISTORY) LOGIC ---
function addActionToHistory(type, description, targets) {
    const id = 'action_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const action = {
        id,
        type, // 'follow' | 'unfollow' | 'block' | 'unblock' | 'softblock' | 'mute'
        description,
        timestamp: new Date().toISOString(),
        targets // array of { did, handle }
    };
    state.actionHistory.unshift(action);
    if (state.actionHistory.length > 50) state.actionHistory.pop();
    
    if (state.session && state.session.did) {
        localStorage.setItem('cthulhu_action_history_' + state.session.did, JSON.stringify(state.actionHistory));
    }
    
    renderActionHistory();
}

function loadActionHistory() {
    state.actionHistory = [];
    if (state.session && state.session.did) {
        try {
            state.actionHistory = JSON.parse(localStorage.getItem('cthulhu_action_history_' + state.session.did) || '[]');
        } catch (_) {
            state.actionHistory = [];
        }
    }
}

function renderActionHistory() {
    DOM.undoHistoryList.innerHTML = '';
    
    if (state.actionHistory.length === 0) {
        DOM.historyEmptyState.classList.remove('hidden');
        DOM.undoHistoryList.classList.add('hidden');
        return;
    }
    
    DOM.historyEmptyState.classList.add('hidden');
    DOM.undoHistoryList.classList.remove('hidden');
    
    state.actionHistory.forEach(action => {
        const card = document.createElement('div');
        card.className = 'undo-item fade-in';
        
        const dateStr = new Date(action.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + new Date(action.timestamp).toLocaleDateString('de-DE');
        
        let typeBadge = '⚙️ Aktion';
        if (action.type === 'follow') typeBadge = '👥 Gefolgt';
        if (action.type === 'unfollow') typeBadge = '🧹 Entfolgt';
        if (action.type === 'block') typeBadge = '🚫 Blockiert';
        if (action.type === 'unblock') typeBadge = '🛡️ Entblockiert';
        if (action.type === 'softblock') typeBadge = '👻 Soft-Block';
        if (action.type === 'mute') typeBadge = '🔇 Stumm';
        
        card.innerHTML = `
            <div class="undo-item-header">
                <span class="undo-item-title">${typeBadge}</span>
                <span class="undo-item-time">${dateStr}</span>
            </div>
            <div class="undo-item-details">
                ${action.description} (${action.targets.length} Accounts)
            </div>
            <div class="undo-item-actions">
                <button type="button" class="btn btn-small btn-secondary btn-undo-rollback" data-id="${action.id}">↩️ Rückgängig</button>
            </div>
        `;
        
        card.querySelector('.btn-undo-rollback').addEventListener('click', () => {
            rollbackAction(action.id);
        });
        
        DOM.undoHistoryList.appendChild(card);
    });
}

async function rollbackAction(actionId) {
    const action = state.actionHistory.find(a => a.id === actionId);
    if (!action) return;
    
    if (action.type === 'softblock') {
        alert('Ein Soft-Block kann nicht automatisch rückgängig gemacht werden, da der Account dir danach nicht mehr folgt. Du kannst den betroffenen Accounts jedoch wieder folgen.');
        if (confirm('Möchtest du den bereinigten Accounts wieder folgen?')) {
            const list = action.targets;
            state.followQueue = list.map(t => t.did);
            state.followRunTotal = list.length;
            
            DOM.overlapProgressContainer.classList.remove('hidden');
            updateOverlapFollowProgress();
            processOverlapFollowQueue();
        }
        return;
    }
    
    if (action.type === 'mute') {
        if (!confirm(`Möchtest du das Stummschalten für diese ${action.targets.length} Accounts aufheben?`)) return;
        log(`Hebe Stummschaltung auf für ${action.targets.length} Accounts...`, 'system');
        
        for (const target of action.targets) {
            try {
                const isMock = state.session && state.session.did === 'did:plc:testuser123';
                if (isMock) {
                    log(`[Mock] Stummschaltung aufgehoben: @${target.handle}`, 'success');
                } else {
                    await apiFetch(`${state.session.serverUrl}/xrpc/app.bsky.graph.unmuteActor`, {
                        method: 'POST',
                        body: JSON.stringify({ actor: target.did })
                    });
                    log(`Stummschaltung aufgehoben: @${target.handle}`, 'success');
                }
            } catch (err) {
                log(`Fehler bei Unmute von @${target.handle}: ${getErrorMessage(err)}`, 'error');
            }
        }
        state.actionHistory = state.actionHistory.filter(a => a.id !== actionId);
        if (state.session && state.session.did) {
            localStorage.setItem('cthulhu_action_history_' + state.session.did, JSON.stringify(state.actionHistory));
        }
        renderActionHistory();
        return;
    }
    
    if (!confirm(`Möchtest du die Aktion "${action.description.substring(0, 60)}..." wirklich rückgängig machen?`)) {
        return;
    }
    
    log(`Rolle Aktion zurück (${action.type})...`, 'system');
    
    const undoBtns = DOM.undoHistoryList.querySelectorAll('.btn-undo-rollback');
    undoBtns.forEach(btn => btn.disabled = true);
    
    try {
        const isMock = state.session && state.session.did === 'did:plc:testuser123';
        
        for (const target of action.targets) {
            log(`Rolle zurück für @${target.handle}...`, 'info');
            
            if (isMock) {
                await new Promise(resolve => setTimeout(resolve, 150));
            } else {
                if (action.type === 'follow') {
                    let rkey = state.myFollowsRkeys.get(target.did);
                    if (!rkey) {
                        const res = await apiFetch(`${state.session.serverUrl}/xrpc/com.atproto.repo.listRecords?repo=${state.session.did}&collection=app.bsky.graph.follow&limit=50`);
                        const record = (res.records || []).find(r => r.value.subject === target.did);
                        if (record) rkey = record.uri.split('/').pop();
                    }
                    if (rkey) {
                        await apiFetch(`${state.session.serverUrl}/xrpc/com.atproto.repo.deleteRecord`, {
                            method: 'POST',
                            body: JSON.stringify({
                                repo: state.session.did,
                                collection: 'app.bsky.graph.follow',
                                rkey: rkey
                            })
                        });
                        state.myFollows.delete(target.did);
                        state.myFollowsRkeys.delete(target.did);
                    }
                } else if (action.type === 'unfollow') {
                    await apiFetch(`${state.session.serverUrl}/xrpc/com.atproto.repo.createRecord`, {
                        method: 'POST',
                        body: JSON.stringify({
                            repo: state.session.did,
                            collection: 'app.bsky.graph.follow',
                            record: {
                                $type: 'app.bsky.graph.follow',
                                subject: target.did,
                                createdAt: new Date().toISOString()
                            }
                        })
                    });
                    state.myFollows.add(target.did);
                } else if (action.type === 'block') {
                    let rkey = null;
                    const res = await apiFetch(`${state.session.serverUrl}/xrpc/com.atproto.repo.listRecords?repo=${state.session.did}&collection=app.bsky.graph.block&limit=50`);
                    const record = (res.records || []).find(r => r.value.subject === target.did);
                    if (record) rkey = record.uri.split('/').pop();
                    if (rkey) {
                        await apiFetch(`${state.session.serverUrl}/xrpc/com.atproto.repo.deleteRecord`, {
                            method: 'POST',
                            body: JSON.stringify({
                                repo: state.session.did,
                                collection: 'app.bsky.graph.block',
                                rkey: rkey
                            })
                        });
                    }
                } else if (action.type === 'unblock') {
                    await apiFetch(`${state.session.serverUrl}/xrpc/com.atproto.repo.createRecord`, {
                        method: 'POST',
                        body: JSON.stringify({
                            repo: state.session.did,
                            collection: 'app.bsky.graph.block',
                            record: {
                                $type: 'app.bsky.graph.block',
                                subject: target.did,
                                createdAt: new Date().toISOString()
                            }
                        })
                    });
                }
            }
        }
        
        log(`Rollback erfolgreich durchgeführt!`, 'success');
        state.actionHistory = state.actionHistory.filter(a => a.id !== actionId);
        if (state.session && state.session.did) {
            localStorage.setItem('cthulhu_action_history_' + state.session.did, JSON.stringify(state.actionHistory));
        }
        renderActionHistory();
        
        if (action.type === 'follow' || action.type === 'unfollow') {
            recalculateRelationships();
        } else if (action.type === 'block' || action.type === 'unblock') {
            fetchAllBlocks();
        }
        
    } catch (err) {
        log(`Fehler bei Rollback: ${getErrorMessage(err)}`, 'error');
        alert(`Rollback fehlgeschlagen: ${getErrorMessage(err)}`);
    } finally {
        undoBtns.forEach(btn => btn.disabled = false);
    }
}

// --- 2. WHITELIST LOGIC ---
function initWhitelistTab() {
    DOM.addWhitelistForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const actor = DOM.inputWhitelistActor.value.trim();
        if (actor) {
            addToWhitelist(actor);
        }
    });
    
    DOM.btnGenerateSmartWhitelist.addEventListener('click', generateSmartWhitelist);
}

async function addToWhitelist(actor) {
    if (!state.session) return;
    
    try {
        const isMock = state.session.did === 'did:plc:testuser123';
        let did = actor;
        let handle = actor;
        
        if (isMock) {
            if (!actor.startsWith('did:')) {
                did = 'did:plc:' + actor.split('.')[0];
            }
        } else {
            did = await resolveHandleOrDid(actor);
            const profile = await apiFetch(`${state.session.serverUrl}/xrpc/app.bsky.actor.getProfile?actor=${did}`);
            handle = profile.handle;
        }
        
        state.whitelist.add(did);
        localStorage.setItem('unblocker_whitelist_' + state.session.did, JSON.stringify(Array.from(state.whitelist)));
        
        log(`Account @${handle} zur Whitelist hinzugefügt.`, 'success');
        DOM.inputWhitelistActor.value = '';
        renderWhitelist();
        renderBlocklist();
        
    } catch (err) {
        log(`Fehler beim Hinzufügen zur Whitelist: ${getErrorMessage(err)}`, 'error');
        alert(`Fehler: ${getErrorMessage(err)}`);
    }
}

function removeFromWhitelist(did) {
    if (!state.session) return;
    
    state.whitelist.delete(did);
    localStorage.setItem('unblocker_whitelist_' + state.session.did, JSON.stringify(Array.from(state.whitelist)));
    log(`Account von Whitelist entfernt.`, 'info');
    renderWhitelist();
    renderBlocklist();
}

function renderWhitelist() {
    DOM.whitelistItemsList.innerHTML = '';
    
    if (!state.whitelist || state.whitelist.size === 0) {
        DOM.whitelistEmptyState.classList.remove('hidden');
        DOM.whitelistItemsList.classList.add('hidden');
        return;
    }
    
    DOM.whitelistEmptyState.classList.add('hidden');
    DOM.whitelistItemsList.classList.remove('hidden');
    
    state.whitelist.forEach(did => {
        const item = document.createElement('div');
        item.className = 'whitelist-item fade-in';
        
        let handle = did;
        const user = state.blockedUsers.find(u => u.did === did) || 
                     state.overlapFollowers.find(u => u.did === did) || 
                     state.ghostFollowers.find(u => u.did === did) ||
                     state.selectedListMembers.find(u => u.did === did);
                     
        if (user) handle = user.handle;
        else if (did === 'did:plc:protected1') handle = 'protected-user.bsky.social';
        
        item.innerHTML = `
            <div class="whitelist-item-details">
                <span class="whitelist-item-handle">@${handle}</span>
                <span class="whitelist-item-did">${did}</span>
            </div>
            <button type="button" class="btn btn-small btn-danger-action btn-remove-whitelist" data-did="${did}">Schutz aufheben</button>
        `;
        
        item.querySelector('.btn-remove-whitelist').addEventListener('click', () => {
            removeFromWhitelist(did);
        });
        
        DOM.whitelistItemsList.appendChild(item);
    });
}

function toggleWhitelist(did, handle) {
    if (state.whitelist.has(did)) {
        removeFromWhitelist(did);
    } else {
        state.whitelist.add(did);
        localStorage.setItem('unblocker_whitelist_' + state.session.did, JSON.stringify(Array.from(state.whitelist)));
        log(`Account @${handle} geschützt (Whitelist).`, 'success');
        renderWhitelist();
        renderBlocklist();
    }
}

async function generateSmartWhitelist() {
    if (!state.session) return;
    
    DOM.btnGenerateSmartWhitelist.disabled = true;
    DOM.btnGenerateSmartWhitelist.querySelector('.spinner').classList.remove('hidden');
    log('Analysiere deine Interaktionen für die Smart Whitelist...', 'system');
    
    try {
        const isMock = state.session.did === 'did:plc:testuser123';
        const suggestedDids = new Set();
        
        if (isMock) {
            await new Promise(resolve => setTimeout(resolve, 800));
            suggestedDids.add('did:plc:protected1');
            suggestedDids.add('did:plc:regular3');
        } else {
            const res = await apiFetch(`${state.session.serverUrl}/xrpc/app.bsky.feed.getAuthorFeed?actor=${state.session.did}&limit=30`);
            const feed = res.feed || [];
            
            feed.forEach(item => {
                if (item.reply) {
                    if (item.reply.parent && item.reply.parent.author) {
                        suggestedDids.add(item.reply.parent.author.did);
                    }
                    if (item.reply.root && item.reply.root.author) {
                        suggestedDids.add(item.reply.root.author.did);
                    }
                }
                if (item.post && item.post.record && item.post.record.reply) {
                    const parentUri = item.post.record.reply.parent?.uri;
                    if (parentUri) {
                        const parsedDid = parentUri.split('/')[2];
                        if (parsedDid && parsedDid.startsWith('did:')) {
                            suggestedDids.add(parsedDid);
                        }
                    }
                }
            });
        }
        
        log(`Smart Whitelist: ${suggestedDids.size} Gesprächspartner analysiert.`, 'info');
        
        let addedCount = 0;
        suggestedDids.forEach(did => {
            if (!state.whitelist.has(did) && did !== state.session.did) {
                state.whitelist.add(did);
                addedCount++;
            }
        });
        
        if (addedCount > 0) {
            localStorage.setItem('unblocker_whitelist_' + state.session.did, JSON.stringify(Array.from(state.whitelist)));
            log(`${addedCount} neue vertrauenswürdige Accounts automatisch geschützt!`, 'success');
            renderWhitelist();
            renderBlocklist();
            alert(`Smart Whitelist: ${addedCount} neue Gesprächspartner wurden erfolgreich geschützt!`);
        } else {
            log('Keine neuen Gesprächspartner gefunden, die nicht bereits geschützt sind.', 'info');
            alert('Smart Whitelist: Deine Gesprächspartner sind bereits alle geschützt.');
        }
        
    } catch (err) {
        log(`Fehler bei Smart Whitelist Erstellung: ${getErrorMessage(err)}`, 'error');
        alert(`Fehler: ${getErrorMessage(err)}`);
    } finally {
        DOM.btnGenerateSmartWhitelist.disabled = false;
        DOM.btnGenerateSmartWhitelist.querySelector('.spinner').classList.add('hidden');
    }
}

// --- 3. TIMELINE SIFTER LOGIC ---
function initTimelineTab() {
    DOM.btnAnalyzeFeed.addEventListener('click', fetchTimelineFeed);
    DOM.selectTimelineFilter.addEventListener('change', renderTimelineActors);
    
    DOM.btnTimelineSelectAll.addEventListener('click', () => {
        const filtered = getFilteredTimelineActors();
        filtered.forEach(a => {
            if (a.status !== 'muted' && a.relation !== 'blocked') {
                a.selected = true;
            }
        });
        updateTimelineStats();
        renderTimelineActors();
    });
    
    DOM.btnTimelineDeselectAll.addEventListener('click', () => {
        state.timelineActors.forEach(a => a.selected = false);
        updateTimelineStats();
        renderTimelineActors();
    });
    
    DOM.btnTimelineMuteSelected.addEventListener('click', startTimelineMuteFlow);
}

async function fetchTimelineFeed() {
    if (!state.session) return;
    
    DOM.btnAnalyzeFeed.disabled = true;
    DOM.btnAnalyzeFeed.querySelector('.spinner').classList.remove('hidden');
    DOM.loadingTimeline.classList.remove('hidden');
    DOM.emptyTimeline.classList.add('hidden');
    DOM.timelineListGrid.classList.add('hidden');
    
    log('Lade Timeline-Beiträge zur Analyse...', 'system');
    
    try {
        state.timelineActors = [];
        
        const isMock = state.session.did === 'did:plc:testuser123';
        const source = DOM.selectFeedSource.value;
        
        if (isMock) {
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const mockActors = [
                { did: 'did:plc:reposter1', handle: 'repost-machine.bsky.social', displayName: 'Repost Machine 🤖', avatar: '', postsCount: 15, repostCount: 14, quoteCount: 1, relation: 'none' },
                { did: 'did:plc:troll3', handle: 'quote-master.bsky.social', displayName: 'Quote Master 📢', avatar: '', postsCount: 12, repostCount: 2, quoteCount: 10, relation: 'none' },
                { did: 'did:plc:regular3', handle: 'regular-troll.bsky.social', displayName: 'Regular Troll', avatar: '', postsCount: 10, repostCount: 1, quoteCount: 0, relation: 'mutual' },
                { did: 'did:plc:protected1', handle: 'protected-user.bsky.social', displayName: 'Protected Friend', avatar: '', postsCount: 8, repostCount: 0, quoteCount: 0, relation: 'following' }
            ];
            
            state.timelineActors = mockActors.map(a => ({
                ...a,
                status: 'idle',
                selected: (a.repostCount / a.postsCount) >= 0.5
            }));
            
            state.timelineActors.forEach(a => {
                state.detailedProfilesMap.set(a.did, {
                    did: a.did,
                    description: 'Timeline actor description.',
                    postsCount: a.postsCount * 10,
                    followersCount: 100,
                    followsCount: 200
                });
            });
            
        } else {
            let feedItems = [];
            
            if (source === 'timeline') {
                const res = await apiFetch(`${state.session.serverUrl}/xrpc/app.bsky.feed.getTimeline?limit=50`);
                feedItems = res.feed || [];
            } else {
                const res = await apiFetch(`${state.session.serverUrl}/xrpc/app.bsky.feed.getAuthorFeed?actor=${state.session.did}&limit=50`);
                feedItems = res.feed || [];
            }
            
            log(`${feedItems.length} Beiträge geladen. Analysiere Verteilung...`, 'info');
            
            const actorMap = new Map();
            
            feedItems.forEach(item => {
                if (!item.post) return;
                
                const actor = item.post.author;
                if (actor.did === state.session.did) return;
                
                let isRepost = item.reason && item.reason.$type === 'app.bsky.feed.defs#reasonRepost';
                let isQuote = item.post.record && item.post.record.embed && item.post.record.embed.$type === 'app.bsky.embed.record';
                
                if (!actorMap.has(actor.did)) {
                    actorMap.set(actor.did, {
                        did: actor.did,
                        handle: actor.handle,
                        displayName: actor.displayName || actor.handle,
                        avatar: actor.avatar || '',
                        postsCount: 0,
                        repostCount: 0,
                        quoteCount: 0
                    });
                }
                
                const entry = actorMap.get(actor.did);
                entry.postsCount++;
                if (isRepost) entry.repostCount++;
                if (isQuote) entry.quoteCount++;
            });
            
            const actors = Array.from(actorMap.values());
            if (actors.length === 0) {
                state.timelineActors = [];
            } else {
                const uniqueDids = actors.map(a => a.did);
                log(`Lade Profile für ${actors.length} Timeline-Benutzer...`, 'info');
                const profiles = await fetchDetailedProfiles(uniqueDids.slice(0, 100));
                
                const blockedDids = new Set(state.blockedUsers.filter(u => u.status !== 'unblocked').map(u => u.did));
                
                state.timelineActors = actors.map(a => {
                    const p = profiles.find(profile => profile.did === a.did);
                    
                    let relation = 'none';
                    if (blockedDids.has(a.did)) relation = 'blocked';
                    else if (state.myFollows.has(a.did) && state.myFollowers.has(a.did)) relation = 'mutual';
                    else if (state.myFollows.has(a.did)) relation = 'following';
                    else if (state.myFollowers.has(a.did)) relation = 'follower';
                    
                    if (p) {
                        state.detailedProfilesMap.set(a.did, {
                            did: a.did,
                            description: p.description || '',
                            postsCount: p.postsCount || 0,
                            followersCount: p.followersCount || 0,
                            followsCount: p.followsCount || 0
                        });
                    }
                    
                    return {
                        did: a.did,
                        handle: a.handle,
                        displayName: a.displayName || a.handle,
                        avatar: a.avatar,
                        relation: relation,
                        status: 'idle',
                        selected: (a.repostCount / a.postsCount) >= 0.5 && relation !== 'blocked',
                        postsCount: a.postsCount,
                        repostCount: a.repostCount,
                        quoteCount: a.quoteCount
                    };
                });
            }
        }
        
        updateTimelineStats();
        renderTimelineActors();
        log('Timeline-Analyse abgeschlossen.', 'success');
        
    } catch (err) {
        log(`Fehler bei Timeline-Analyse: ${getErrorMessage(err)}`, 'error');
        alert(`Fehler: ${getErrorMessage(err)}`);
    } finally {
        DOM.btnAnalyzeFeed.disabled = false;
        DOM.btnAnalyzeFeed.querySelector('.spinner').classList.add('hidden');
        DOM.loadingTimeline.classList.add('hidden');
    }
}

function getFilteredTimelineActors() {
    const filter = DOM.selectTimelineFilter.value;
    return state.timelineActors.filter(a => {
        if (filter === 'heavy-reposts') return (a.repostCount / a.postsCount) >= 0.5;
        if (filter === 'quotes') return a.quoteCount > 0;
        return true;
    });
}

function updateTimelineStats() {
    let totalReposts = 0;
    let totalPosts = 0;
    let heavyReposts = 0;
    
    state.timelineActors.forEach(a => {
        totalPosts += a.postsCount;
        totalReposts += a.repostCount;
        if ((a.repostCount / a.postsCount) >= 0.5) {
            heavyReposts++;
        }
    });
    
    const percentageStr = totalPosts > 0 ? Math.round((totalReposts / totalPosts) * 100) + '%' : '0%';
    DOM.statTimelineReposts.textContent = percentageStr;
    DOM.statTimelineHeavyReposters.textContent = heavyReposts;
    DOM.statTimelineSelected.textContent = state.timelineActors.filter(a => a.selected).length;
}

function renderTimelineActors() {
    DOM.timelineListGrid.innerHTML = '';
    const filtered = getFilteredTimelineActors();
    DOM.timelineVisibleCountBadge.textContent = `${filtered.length} von ${state.timelineActors.length} angezeigt`;
    
    if (filtered.length === 0) {
        DOM.timelineListGrid.classList.add('hidden');
        DOM.emptyTimeline.classList.remove('hidden');
        return;
    }
    
    DOM.emptyTimeline.classList.add('hidden');
    DOM.timelineListGrid.classList.remove('hidden');
    
    filtered.forEach((user) => {
        const card = document.createElement('div');
        let statusClass = user.status;
        if (user.status === 'muted') statusClass = 'inactive';
        card.className = `block-item fade-in ${statusClass}`;
        
        let relationLabel = 'Keine';
        let badgeClass = 'block-status-badge none';
        if (user.relation === 'blocked') {
            relationLabel = 'Blockiert';
            badgeClass = 'block-status-badge blocked';
        } else if (user.relation === 'mutual') {
            relationLabel = 'Mutual';
            badgeClass = 'block-status-badge mutual';
        } else if (user.relation === 'following') {
            relationLabel = 'Folge ich';
            badgeClass = 'block-status-badge following';
        } else if (user.relation === 'follower') {
            relationLabel = 'Folgt mir';
            badgeClass = 'block-status-badge follower';
        }
        
        if (user.status === 'processing') {
            relationLabel = 'Mute...';
            badgeClass = 'block-status-badge processing';
        } else if (user.status === 'muted') {
            relationLabel = 'Stumm ✓';
            badgeClass = 'block-status-badge none';
        }
        
        const details = state.detailedProfilesMap.get(user.did) || {};
        const bioHtml = details.description ? `<div class="follower-bio" title="${details.description}">${details.description}</div>` : '';
        
        const repostPct = Math.round((user.repostCount / user.postsCount) * 100);
        let repostBadge = '';
        if (repostPct >= 75) {
            repostBadge = `<span class="block-status-badge spambot" style="margin-top: 3px;">🔄 ${repostPct}% Reposts</span>`;
        } else if (repostPct >= 50) {
            repostBadge = `<span class="block-status-badge warning" style="margin-top: 3px; background: rgba(245, 158, 11, 0.1); color: var(--warning); border-color: rgba(245, 158, 11, 0.2);">🔄 ${repostPct}% Reposts</span>`;
        } else {
            repostBadge = `<span class="block-status-badge none" style="margin-top: 3px;">🔄 ${repostPct}% Reposts</span>`;
        }
        
        let quoteBadge = user.quoteCount > 0 ? `<span class="block-status-badge follower" style="margin-top: 3px; background: rgba(139, 92, 246, 0.1); color: #c084fc; border-color: rgba(139, 92, 246, 0.2);">💬 ${user.quoteCount} Zitate</span>` : '';
        
        const avatarSrc = user.avatar || '';
        const avatarEl = avatarSrc 
            ? `<img src="${avatarSrc}" alt="Avatar" class="block-avatar" onerror="this.src=''; this.className='avatar-placeholder'">`
            : `<div class="block-avatar avatar-placeholder"></div>`;
            
        const isInteractive = user.status !== 'muted' && user.relation !== 'blocked';
        
        card.innerHTML = `
            <label class="checkbox-container">
                <input type="checkbox" ${user.selected && isInteractive ? 'checked' : ''} ${isInteractive ? '' : 'disabled'} data-did="${user.did}">
                <span class="checkmark"></span>
            </label>
            ${avatarEl}
            <div class="follower-item-detail">
                <div class="block-name" title="${user.displayName}">${user.displayName}</div>
                <div class="block-handle">
                    <a href="https://bsky.app/profile/${user.handle}" target="_blank" rel="noopener noreferrer">@${user.handle}</a>
                </div>
                ${bioHtml}
                <div class="follower-stats" style="margin-top: 3px;">
                    <span>📊 In Feed: ${user.postsCount} Beiträge</span>
                </div>
                <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                    <span class="${badgeClass}">${relationLabel}</span>
                    ${repostBadge}
                    ${quoteBadge}
                </div>
            </div>
        `;
        
        const cb = card.querySelector('input[type="checkbox"]');
        if (cb) {
            cb.addEventListener('change', () => {
                user.selected = cb.checked;
                updateTimelineStats();
            });
        }
        
        DOM.timelineListGrid.appendChild(card);
    });
}

async function startTimelineMuteFlow() {
    const list = state.timelineActors.filter(a => a.selected && a.status !== 'muted');
    if (list.length === 0) {
        alert('Bitte wähle mindestens einen Account zum Stummschalten aus!');
        return;
    }
    
    if (state.session && state.session.did !== 'did:plc:testuser123') {
        if (!confirm(`Bist du sicher, dass du diese ${list.length} Accounts auf Bluesky stummschalten möchtest?`)) {
            return;
        }
    }
    
    log(`Mute ${list.length} Accounts in der Timeline...`, 'system');
    
    const targetsForHistory = [];
    
    for (const actor of list) {
        actor.status = 'processing';
        renderTimelineActors();
        
        try {
            const isMock = state.session.did === 'did:plc:testuser123';
            if (isMock) {
                await new Promise(resolve => setTimeout(resolve, 200));
                log(`[Mock] Stummgeschaltet: @${actor.handle}`, 'success');
            } else {
                await apiFetch(`${state.session.serverUrl}/xrpc/app.bsky.graph.muteActor`, {
                    method: 'POST',
                    body: JSON.stringify({
                        actor: actor.did
                    })
                });
                log(`Erfolgreich stummgeschaltet: @${actor.handle}`, 'success');
            }
            actor.status = 'muted';
            actor.selected = false;
            targetsForHistory.push({ did: actor.did, handle: actor.handle });
            
        } catch (err) {
            actor.status = 'error';
            log(`Fehler beim Muten von @${actor.handle}: ${getErrorMessage(err)}`, 'error');
        }
    }
    
    if (targetsForHistory.length > 0) {
        addActionToHistory('mute', `Timeline-Filter: Stummgeschaltet: ${targetsForHistory.map(t => '@' + t.handle).join(', ')}`, targetsForHistory);
    }
    
    updateTimelineStats();
    renderTimelineActors();
}

// Initialize on page load
loadSavedProfiles();
initFollowerCopier();
initWhitelistTab();
initTimelineTab();
loadActionHistory();

// Test Mock Data for Visual verification
if (new URLSearchParams(window.location.search).has('test')) {
    state.session = {
        serverUrl: 'https://bsky.social',
        did: 'did:plc:testuser123',
        handle: 'testuser.bsky.social',
        displayName: 'Test User',
        avatar: ''
    };
    state.whitelist = new Set(['did:plc:protected1']);
    state.repoRkeys = new Set(['rkey1', 'rkey3']);
    state.blockedUsers = [
        {
            did: 'did:plc:protected1',
            handle: 'protected-user.bsky.social',
            displayName: 'Protected Account 🛡️',
            avatar: '',
            rkey: 'rkey1',
            indexedAt: '2026-06-15T12:00:00.000Z',
            status: 'blocked',
            selected: false
        },
        {
            did: 'did:plc:phantom2',
            handle: 'phantom-spammer.bsky.social',
            displayName: 'Phantom Spammer 👻',
            avatar: '',
            rkey: 'rkey2',
            indexedAt: '2026-05-20T08:30:00.000Z',
            status: 'blocked',
            selected: false
        },
        {
            did: 'did:plc:regular3',
            handle: 'regular-troll.bsky.social',
            displayName: 'Regular Troll',
            avatar: '',
            rkey: 'rkey3',
            indexedAt: '2026-06-22T22:15:00.000Z',
            status: 'blocked',
            selected: false
        },
        {
            did: 'did:plc:inactive4',
            handle: 'handle.invalid',
            displayName: '',
            avatar: '',
            rkey: 'rkey4',
            indexedAt: '2026-04-10T14:00:00.000Z',
            status: 'blocked',
            selected: false
        }
    ];
    
    // Mock follows and followers
    state.myFollows = new Set(['did:plc:protected1', 'did:plc:regular3', 'did:plc:target1']);
    state.myFollowers = new Set(['did:plc:regular3', 'did:plc:target2']);
    state.myFollowsRkeys = new Map([
        ['did:plc:protected1', 'rkey-follow-protected1'],
        ['did:plc:regular3', 'rkey-follow-regular3'],
        ['did:plc:target1', 'rkey-follow-target1']
    ]);
    state.myFollowsLoaded = true;
    state.myFollowersLoaded = true;
    
    // Show workspace
    DOM.loginSection.classList.add('hidden');
    DOM.workspaceSection.classList.remove('hidden');
    DOM.userDisplayName.textContent = state.session.displayName;
    DOM.userHandle.textContent = `@${state.session.handle}`;
    
    // Set status text for owns in test mode
    DOM.ownDataStatusText.innerHTML = `Bereit (👥 ${state.myFollowers.size} / 👤 ${state.myFollows.size})`;
    
    // Load saved profiles mock
    state.savedProfiles = [
        { did: 'did:plc:u1', handle: 'alice.bsky.social', displayName: 'Alice', avatar: '', serverUrl: 'https://bsky.social' },
        { did: 'did:plc:u2', handle: 'bob.bsky.social', displayName: 'Bob', avatar: '', serverUrl: 'https://bsky.social' }
    ];
    
    // Pre-populate mock action history
    state.actionHistory = [
        {
            id: 'action_mock1',
            type: 'unfollow',
            description: 'Massen-Entfolgen: 2 inaktive Accounts bereinigt',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            targets: [
                { did: 'did:plc:regular3', handle: 'regular-troll.bsky.social' },
                { did: 'did:plc:target2', handle: 'target-follower.bsky.social' }
            ]
        },
        {
            id: 'action_mock2',
            type: 'block',
            description: 'Massen-Block: 1 Kommentar-Spammer blockiert',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            targets: [
                { did: 'did:plc:phantom2', handle: 'phantom-spammer.bsky.social' }
            ]
        }
    ];
    
    updateStats();
    renderBlocklist();
    renderSavedProfilesWidget();
    renderActionHistory();
}
