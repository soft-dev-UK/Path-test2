// ===== グローバル状態管理 =====
const state = {
    anonymousUserId: '',
    isDarkMode: true,
    textPaths: [],
    undoStack: [],
    redoStack: [],
    isDrawing: false,
    currentStroke: null,
    currentChars: [],
    isStrokeFinalized: false,
    strokeStartTime: 0,
    lastUpdateTime: 0,
    animationFrameId: null,
};

// ===== DOM要素 =====
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const textInput = document.getElementById('textInput');
const titleInput = document.getElementById('titleInput');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const darkModeBtn = document.getElementById('darkModeBtn');
const exchangeBtn = document.getElementById('exchangeBtn');
const clearBtn = document.getElementById('clearBtn');
const exchangeModal = document.getElementById('exchangeModal');
const receivedCanvas = document.getElementById('receivedCanvas');
const nextBtn = document.getElementById('nextBtn');
const galleryBtn = document.getElementById('galleryBtn');
const galleryModal = document.getElementById('galleryModal');
const closeGalleryBtn = document.getElementById('closeGalleryBtn');
const tabBtns = document.querySelectorAll('.tab-btn');
const myWorksContent = document.getElementById('myworks-content');
const collectionContent = document.getElementById('collection-content');
const helpBtn = document.getElementById('helpBtn');
const helpModal = document.getElementById('helpModal');
const closeHelpBtn = document.getElementById('closeHelpBtn');
const detailModal = document.getElementById('detailModal');
const closeDetailBtn = document.getElementById('closeDetailBtn');
const detailCanvas = document.getElementById('detailCanvas');
const detailCtx = detailCanvas.getContext('2d');
const detailTitle = document.getElementById('detailTitle');
const detailInfo = document.getElementById('detailInfo');
const exportBtn = document.getElementById('exportBtn');
const toast = document.getElementById('toast');
const errorMessage = document.getElementById('errorMessage');
const statusMessage = document.getElementById('statusMessage');
const modalTitle = document.getElementById('modalTitle');

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', () => {
    state.anonymousUserId = getOrCreateAnonymousUserId();
    resizeCanvas();
    restoreState();
    updateDarkModeUI(); // Ensure UI reflects state regardless of restoration

    // イベントリスナー登録
    window.addEventListener('resize', resizeCanvas);

    // Mouse / Touch Events
    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // Buttons
    undoBtn.addEventListener('click', handleUndo);
    redoBtn.addEventListener('click', handleRedo);
    darkModeBtn.addEventListener('click', toggleDarkMode);
    clearBtn.addEventListener('click', handleClear);
    clearBtn.addEventListener('click', handleClear);
    exchangeBtn.addEventListener('click', handleExchange);

    // Help
    helpBtn.addEventListener('click', () => {
        helpModal.classList.add('active');
    });
    closeHelpBtn.addEventListener('click', () => {
        helpModal.classList.remove('active');
    });

    // Detail Modal
    closeDetailBtn.addEventListener('click', () => {
        detailModal.classList.remove('active');
    });
    exportBtn.addEventListener('click', handleShare);

    // Gallery
    galleryBtn.addEventListener('click', () => {
        openGallery();
    });
    closeGalleryBtn.addEventListener('click', () => {
        galleryModal.classList.remove('active');
    });
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });

    // Modal
    nextBtn.addEventListener('click', () => {
        exchangeModal.classList.remove('active');
        handleClear();
    });

    // Inputs
    textInput.addEventListener('input', () => {
        saveState();
    });
    titleInput.addEventListener('input', () => {
        saveState();
    });
});

// ===== ユーティリティ関数 =====
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function getOrCreateAnonymousUserId() {
    let userId = localStorage.getItem('anonymousUserId');
    if (!userId) {
        userId = generateUUID();
        localStorage.setItem('anonymousUserId', userId);
    }
    return userId;
}

function saveState() {
    const saveData = {
        textPaths: state.textPaths,
        isDarkMode: state.isDarkMode,
        title: titleInput.value,
        text: textInput.value,
    };
    localStorage.setItem(`canvasState_${state.anonymousUserId}`, JSON.stringify(saveData));
}

function restoreState() {
    const saved = localStorage.getItem(`canvasState_${state.anonymousUserId}`);
    if (saved) {
        try {
            const data = JSON.parse(saved);
            state.textPaths = data.textPaths || [];
            state.isDarkMode = data.isDarkMode !== undefined ? data.isDarkMode : true;
            titleInput.value = data.title || '';
            textInput.value = data.text || 'Draw your text';
            updateDarkModeUI();
            redraw();
            updateButtonStates();
        } catch (e) {
            console.error('Failed to restore state:', e);
        }
    }
}

function showError(msg) {
    // Simple alert strictly for error handling if modal UI isn't ready
    alert(msg);
}

// ===== キャンバス管理 =====
function resizeCanvas() {
    // Canvas internal resolution is fixed to ensure consistency across devices
    if (canvas.width !== CANVAS_WIDTH) {
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
    }
    redraw();
}

function redraw() {
    // CSS変数から色を取得できればベストだが、canvas内はJS制御
    const bgColor = state.isDarkMode ? '#0f172a' : '#ffffff'; // Match CSS --bg-dark / white
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景
    // ctx.fillStyle = bgColor;
    // ctx.fillRect(0, 0, canvas.width, canvas.height);

    state.textPaths.forEach(pathData => {
        pathData.chars.forEach(char => {
            drawChar(char, state.isDarkMode);
        });
    });

    state.currentChars.forEach(char => {
        drawChar(char, state.isDarkMode);
    });
}

function drawChar(charPos, isDark) {
    ctx.save();
    ctx.translate(charPos.x, charPos.y);
    ctx.rotate((charPos.rotation * Math.PI) / 180);
    // Use the new modern font
    ctx.font = `600 ${charPos.fontSize}px "Outfit", sans-serif`;
    ctx.fillStyle = isDark ? '#f1f5f9' : '#1e293b'; // Slate 100 / Slate 800
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(charPos.char, 0, 0);
    ctx.restore();
}

// ===== 文字配置計算 =====
function calculatePathLength(points) {
    let length = 0;
    for (let i = 0; i < points.length - 1; i++) {
        const dx = points[i + 1].x - points[i].x;
        const dy = points[i + 1].y - points[i].y;
        length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
}

function calculateCharPositions(points, text, isDark, startTime, endTime, forcedFontSize) {
    if (points.length < 1 || !text) return [];
    const chars = [];
    const totalLength = calculatePathLength(points);
    const charCount = text.length;
    const strokeDuration = Math.max(endTime - startTime, 1);
    const spacing = totalLength > 0 ? totalLength / Math.max(charCount, 1) : 0;

    let baseFontSize = forcedFontSize || (24 + (96 - 24) * Math.min(strokeDuration / 2000, 1)); // scaled up for 800px width

    if (points.length < 2) {
        const point = points[0];
        for (let i = 0; i < charCount; i++) {
            chars.push({ char: text[i], x: point.x, y: point.y, rotation: 0, fontSize: baseFontSize });
        }
        return chars;
    }

    let accumulatedLength = 0;
    let charIndex = 0;

    for (let i = 0; i < points.length - 1 && charIndex < charCount; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const segmentLength = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

        while (accumulatedLength < (charIndex + 1) * spacing && charIndex < charCount) {
            const t = segmentLength > 0 ? ((charIndex + 1) * spacing - accumulatedLength) / segmentLength : 0;
            if (t > 1) break;
            const x = p1.x + (p2.x - p1.x) * t;
            const y = p1.y + (p2.y - p1.y) * t;
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            chars.push({ char: text[charIndex], x, y, rotation: (angle * 180) / Math.PI, fontSize: baseFontSize });
            charIndex++;
        }
        accumulatedLength += segmentLength;
    }

    // Fallback: If floating point errors prevented the last character(s) from being added,
    // place them at the very end of the last segment.
    if (charIndex < charCount && points.length > 0) {
        const lastPoint = points[points.length - 1];
        // Ideally we might want the rotation of the last segment, but 0 or last known angle is fine as fallback
        // Let's try to get angle from last two points if possible
        let lastAngle = 0;
        if (points.length >= 2) {
            const pLast = points[points.length - 1];
            const pPrev = points[points.length - 2];
            lastAngle = (Math.atan2(pLast.y - pPrev.y, pLast.x - pPrev.x) * 180) / Math.PI;
        }

        while (charIndex < charCount) {
            chars.push({
                char: text[charIndex],
                x: lastPoint.x,
                y: lastPoint.y,
                rotation: lastAngle,
                fontSize: baseFontSize
            });
            charIndex++;
        }
    }

    return chars;
}

// ===== スマホ・PC共通の描画処理 =====
function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

function handlePointerDown(e) {
    if (e.pointerType === 'touch') {
        // e.preventDefault(); // Don't prevent default everywhere to allow UI interaction
    }
    // Only prevent default if on canvas
    if (e.target === canvas) {
        // e.preventDefault();
    }

    const pos = getMousePos(e);
    const now = Date.now();

    state.isDrawing = true;
    state.isStrokeFinalized = false;
    state.currentStroke = {
        points: [{ x: pos.x, y: pos.y, timestamp: now }],
        startTime: now,
        endTime: now,
    };
    state.currentChars = [];
    state.strokeStartTime = now;
    state.lastUpdateTime = now;

    startAnimationLoop();
}

function handlePointerMove(e) {
    if (!state.isDrawing || !state.currentStroke) return;
    const pos = getMousePos(e);
    const now = Date.now();
    state.currentStroke.points.push({ x: pos.x, y: pos.y, timestamp: now });
    state.currentStroke.endTime = now;
}

function handlePointerUp() {
    if (state.isDrawing && state.currentStroke && state.currentStroke.points.length > 1 && textInput.value.trim()) {
        const chars = calculateCharPositions(
            state.currentStroke.points,
            textInput.value,
            state.isDarkMode,
            state.currentStroke.startTime,
            state.currentStroke.endTime,
            undefined
        );
        const newTextPaths = [...state.textPaths, { chars, isDark: state.isDarkMode }];
        saveToUndoStack(newTextPaths);
    }

    // 状態のリセット
    state.isDrawing = false;
    state.isStrokeFinalized = true;
    state.currentStroke = null;
    state.currentChars = [];

    if (state.animationFrameId !== null) {
        cancelAnimationFrame(state.animationFrameId);
        state.animationFrameId = null;
    }
    redraw();
}

function startAnimationLoop() {
    const updateFrame = () => {
        const now = Date.now();
        if (now - state.lastUpdateTime < 16) {
            state.animationFrameId = requestAnimationFrame(updateFrame);
            return;
        }
        state.lastUpdateTime = now;
        if (state.currentStroke) {
            state.currentChars = calculateCharPositions(
                state.currentStroke.points,
                textInput.value,
                state.isDarkMode,
                state.currentStroke.startTime,
                state.currentStroke.endTime,
                undefined
            );
            redraw();
        }
        state.animationFrameId = requestAnimationFrame(updateFrame);
    };
    state.animationFrameId = requestAnimationFrame(updateFrame);
}

// ===== Undo/Redo =====
function saveToUndoStack(newTextPaths) {
    state.undoStack.push({ textPaths: state.textPaths });
    state.redoStack = [];
    state.textPaths = newTextPaths;
    updateButtonStates();
    saveState();
    redraw();
}

function handleUndo() {
    if (state.undoStack.length === 0) return;
    const previousState = state.undoStack.pop();
    state.redoStack.push({ textPaths: state.textPaths });
    state.textPaths = previousState.textPaths;
    updateButtonStates();
    saveState();
    redraw();
}

function handleRedo() {
    if (state.redoStack.length === 0) return;
    const nextState = state.redoStack.pop();
    state.undoStack.push({ textPaths: state.textPaths });
    state.textPaths = nextState.textPaths;
    updateButtonStates();
    saveState();
    redraw();
}

function updateButtonStates() {
    undoBtn.disabled = state.undoStack.length === 0;
    redoBtn.disabled = state.redoStack.length === 0;
}

// ===== ダークモード =====
function toggleDarkMode() {
    state.isDarkMode = !state.isDarkMode;
    updateDarkModeUI();
    saveState();
    redraw();
}

function updateDarkModeUI() {
    if (state.isDarkMode) {
        document.body.classList.add('dark-mode'); // Use body class for CSS
        darkModeBtn.innerHTML = '<span style="font-size: 1.2rem">🌙</span>';
    } else {
        document.body.classList.remove('dark-mode');
        darkModeBtn.innerHTML = '<span style="font-size: 1.2rem">☀️</span>';
    }
}

// ===== クリア =====
function handleClear() {
    if (state.textPaths.length > 0) saveToUndoStack([]);
    state.currentStroke = null;
    state.currentChars = [];
    redraw();
}

// ===== 作品交換 =====
async function handleExchange(e) {
    if (e) e.preventDefault();

    if (!titleInput.value.trim() || state.textPaths.length === 0) {
        alert('タイトルを入力し、作品を描いてください！');
        return;
    }
    exchangeBtn.disabled = true;
    exchangeBtn.innerHTML = '<div class="loading-spinner" style="width: 20px; height: 20px; margin: 0;"></div> 交換中...';

    try {
        const saveResponse = await fetch('/api/artworks/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                anonymousUserId: state.anonymousUserId,
                title: titleInput.value,
                strokesData: JSON.stringify(state.textPaths),
                isDarkBg: state.isDarkMode ? 1 : 0,
            }),
        });
        if (!saveResponse.ok) throw new Error('保存失敗');

        const exchangeResponse = await fetch('/api/artworks/exchange', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ anonymousUserId: state.anonymousUserId }),
        });

        if (exchangeResponse.status === 404) {
            alert('保存完了！まだ他の作品がないので待機しましょう。');
        } else {
            const artwork = await exchangeResponse.json();
            displayReceivedArtwork(artwork);
        }
    } catch (error) {
        console.error(error);
        alert('通信エラーが発生しました');
    } finally {
        exchangeBtn.disabled = false;
        exchangeBtn.textContent = '✨ 作品を交換';
    }
}

function displayReceivedArtwork(artwork) {
    exchangeModal.classList.add('active');
    modalTitle.textContent = artwork.title;
    receivedCanvas.innerHTML = '';
    receivedCanvas.classList.toggle('dark', artwork.isDarkBg == 1);

    const originalRatio = canvas.height / canvas.width;
    receivedCanvas.style.height = (receivedCanvas.clientWidth * originalRatio) + 'px';
    const parsedStrokes = JSON.parse(artwork.strokesData);

    // 1. 作品全体の範囲（バウンディングボックス）を計算
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    parsedStrokes.forEach(pathData => {
        pathData.chars.forEach(char => {
            minX = Math.min(minX, char.x);
            maxX = Math.max(maxX, char.x);
            minY = Math.min(minY, char.y);
            maxY = Math.max(maxY, char.y);
        });
    });

    // 作品の幅と高さを算出（少し余白を持たせる）
    const artworkWidth = (maxX - minX) || 1;
    const artworkHeight = (maxY - minY) || 1;
    const rect = receivedCanvas.getBoundingClientRect();
    const padding = 40; // プレビュー枠内の余白
    const targetW = rect.width - padding;
    const targetH = rect.height - padding;

    // 3. 縮小率（スケール）を計算
    const scale = Math.min(targetW / artworkWidth, targetH / artworkHeight, 1);

    // 4. 中心に配置するためのオフセット計算
    const finalX = (rect.width - artworkWidth * scale) / 2;
    const finalY = (rect.height - artworkHeight * scale) / 2;

    // 5. DOM要素として描画
    parsedStrokes.forEach(pathData => {
        pathData.chars.forEach(char => {
            const span = document.createElement('span');
            span.textContent = char.char;
            span.style.position = 'absolute';
            span.style.left = (finalX + (char.x - minX) * scale) + 'px';
            span.style.top = (finalY + (char.y - minY) * scale) + 'px';
            span.style.transform = `rotate(${char.rotation}deg)`;
            span.style.fontSize = (char.fontSize * scale) + 'px';
            span.style.color = (pathData.isDark || artwork.isDarkBg == 1) ? '#f1f5f9' : '#1e293b';
            span.style.fontWeight = '600';
            span.style.whiteSpace = 'nowrap';
            span.style.fontFamily = '"Outfit", sans-serif';
            receivedCanvas.appendChild(span);
        });
    });
}


// ===== Gallery Logic =====
function openGallery() {
    galleryModal.classList.add('active');
    switchTab('myworks'); // Default tab
}

function switchTab(tabName) {
    // Update tabs UI
    tabBtns.forEach(btn => {
        if (btn.dataset.tab === tabName) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    // Content visibility
    if (tabName === 'myworks') {
        myWorksContent.style.display = 'grid';
        collectionContent.style.display = 'none';
        loadGalleryData('myworks');
    } else {
        myWorksContent.style.display = 'none';
        collectionContent.style.display = 'grid';
        loadGalleryData('collection');
    }
}

async function loadGalleryData(type) {
    const container = type === 'myworks' ? myWorksContent : collectionContent;
    container.innerHTML = '<div class="loading-spinner"></div>';

    try {
        let url;
        if (type === 'myworks') {
            url = `/api/artworks/list/${state.anonymousUserId}`;
        } else {
            url = `/api/artworks/received/${state.anonymousUserId}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch');

        const artworks = await response.json();
        renderGalleryItems(artworks, container);
    } catch (error) {
        console.error(error);
        container.innerHTML = '<p class="status-message">読み込みに失敗しました</p>';
    }
}

function renderGalleryItems(artworks, container) {
    container.innerHTML = '';

    if (artworks.length === 0) {
        container.innerHTML = '<p class="status-message" style="grid-column: 1/-1;">まだ作品がありません</p>';
        return;
    }

    artworks.forEach(art => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.style.cursor = 'pointer';
        item.onclick = () => openArtworkDetail(art);

        const preview = document.createElement('div');
        preview.className = `gallery-preview ${art.isDarkBg ? 'dark' : ''}`;

        // Render preview
        setTimeout(() => {
            renderPreview(art.strokesData, preview, art.isDarkBg);
        }, 0);

        const info = document.createElement('div');
        info.className = 'gallery-info';

        const title = document.createElement('div');
        title.className = 'gallery-title';
        title.textContent = art.title;

        const date = document.createElement('div');
        date.className = 'gallery-date';
        const d = new Date(art.receivedAt || art.createdAt);
        date.textContent = d.toLocaleDateString() + ' ' + d.toLocaleTimeString();

        info.appendChild(title);
        info.appendChild(date);

        item.appendChild(preview);
        item.appendChild(info);
        container.appendChild(item);
    });
}

// ===== 詳細＆シェア機能 =====
let currentDetailArtwork = null;

function openArtworkDetail(artwork) {
    currentDetailArtwork = artwork;
    detailModal.classList.add('active');
    detailTitle.textContent = artwork.title || 'Untitled';

    const date = new Date(artwork.receivedAt || artwork.createdAt);
    detailInfo.textContent = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

    // Use high resolution for sharing
    detailCanvas.width = 1200;
    detailCanvas.height = 800;

    drawDetailCanvas(artwork);
}

function drawDetailCanvas(artwork) {
    // Fill Background
    const bgColor = artwork.isDarkBg ? '#0f172a' : '#ffffff';
    detailCtx.fillStyle = bgColor;
    detailCtx.fillRect(0, 0, detailCanvas.width, detailCanvas.height);

    const strokes = JSON.parse(artwork.strokesData);

    strokes.forEach(pathData => {
        pathData.chars.forEach(char => {
            detailCtx.save();
            detailCtx.translate(char.x, char.y);
            detailCtx.rotate(char.rotation * Math.PI / 180);
            detailCtx.font = `${char.fontWeight || 600} ${char.fontSize}px "${char.fontFamily || 'Outfit'}", sans-serif`;
            detailCtx.textAlign = 'center';
            detailCtx.textBaseline = 'middle';

            // Text Color based on bg
            detailCtx.fillStyle = artwork.isDarkBg ? '#f1f5f9' : '#1e293b';

            detailCtx.fillText(char.char, 0, 0);
            detailCtx.restore();
        });
    });
}

async function handleShare() {
    if (!currentDetailArtwork) return;

    try {
        const blob = await new Promise(resolve => detailCanvas.toBlob(resolve, 'image/png'));
        const file = new File([blob], 'text-path-art.png', { type: 'image/png' });

        const creatorId = currentDetailArtwork.authorId || currentDetailArtwork.anonymousUserId;
        const isOwnWork = creatorId === state.anonymousUserId;

        let shareText = '';
        if (isOwnWork) {
            shareText = `✨文字で描く魔法のアート
『Text Path Drawer』で作品を作ったよ！
「${currentDetailArtwork.title || 'Untitled'}」

https://text-path-drawer.vercel.app
#TextPathDrawer`;
        } else {
            shareText = `✨文字で描く魔法のアート
『Text Path Drawer』で素敵な作品を受け取ったよ！
「${currentDetailArtwork.title || 'Untitled'}」

https://text-path-drawer.vercel.app
#TextPathDrawer`;
        }

        const shareData = {
            title: 'Text Path Drawer',
            text: shareText,
            files: [file],
        };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            await navigator.share(shareData);
        } else {
            // Fallback: Enhanced PC Share - Double Action

            // 1. Download Image
            const link = document.createElement('a');
            link.download = `art_${Date.now()}.png`;
            link.href = detailCanvas.toDataURL('image/png');
            link.click();

            // 2. Copy URL & Show Toast
            if (navigator.clipboard) {
                navigator.clipboard.writeText('https://text-path-drawer.vercel.app').then(() => {
                    toast.classList.add('show');
                    setTimeout(() => {
                        toast.classList.remove('show');
                    }, 3000);
                });
            }

            // 3. Open X (Twitter)
            const tweetText = encodeURIComponent(shareText);
            window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
        }
    } catch (err) {
        console.error('Share failed:', err);
        // If share was aborted by user, do nothing. 
    }
}

function renderPreview(strokesDataStr, container, isDarkBg) {
    try {
        const strokes = JSON.parse(strokesDataStr);
        // Calculate bounds
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        strokes.forEach(path => {
            path.chars.forEach(char => {
                minX = Math.min(minX, char.x);
                maxX = Math.max(maxX, char.x);
                minY = Math.min(minY, char.y);
                maxY = Math.max(maxY, char.y);
            });
        });

        const width = (maxX - minX) || 1;
        const height = (maxY - minY) || 1;
        const rect = container.getBoundingClientRect();

        // Same logic as receivedCanvas but for mini preview
        // Use a slight padding
        const padding = 10;
        const targetW = rect.width - padding * 2;
        const targetH = rect.height - padding * 2;

        const scale = Math.min(targetW / width, targetH / height, 1);

        const finalX = (rect.width - width * scale) / 2;
        const finalY = (rect.height - height * scale) / 2;

        strokes.forEach(path => {
            path.chars.forEach(char => {
                const span = document.createElement('span');
                span.textContent = char.char;
                span.style.position = 'absolute';
                span.style.left = (finalX + (char.x - minX) * scale) + 'px';
                span.style.top = (finalY + (char.y - minY) * scale) + 'px';
                span.style.transform = `rotate(${char.rotation}deg)`;
                span.style.fontSize = (char.fontSize * scale) + 'px';
                span.style.color = isDarkBg ? '#f1f5f9' : '#1e293b';
                span.style.fontWeight = '600';
                span.style.whiteSpace = 'nowrap';
                span.style.fontFamily = '"Outfit", sans-serif';
                container.appendChild(span);
            });
        });

    } catch (e) {
        console.error('Preview render error', e);
    }
}
