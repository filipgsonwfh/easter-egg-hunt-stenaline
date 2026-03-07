(function () {
    'use strict';

    const TOTAL_EGGS = 72;
    const COLS = 9;
    const ROWS = 8;
    const PUZZLE_IMAGE = 'images/puzzle.jpg';

    const db = firebase.firestore();
    const eggsCollection = db.collection('eggs');
    const progressCollection = db.collection('progress');

    const puzzleContainer = document.getElementById('puzzleContainer');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const eggsFoundEl = document.getElementById('eggsFound');
    const eggsRemainingEl = document.getElementById('eggsRemaining');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalIcon = document.getElementById('modalIcon');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalClose = document.getElementById('modalClose');
    const allFoundBanner = document.getElementById('allFoundBanner');

    let foundPieces = new Set();

    function buildPuzzleGrid() {
        puzzleContainer.innerHTML = '';
        for (let i = 0; i < TOTAL_EGGS; i++) {
            const piece = document.createElement('div');
            piece.className = 'puzzle-piece';
            piece.dataset.index = i;

            const img = document.createElement('div');
            img.className = 'piece-image';
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            const xPercent = (col / (COLS - 1)) * 100;
            const yPercent = (row / (ROWS - 1)) * 100;
            img.style.backgroundImage = `url('${PUZZLE_IMAGE}')`;
            img.style.backgroundSize = `${COLS * 100}% ${ROWS * 100}%`;
            img.style.backgroundPosition = `${xPercent}% ${yPercent}%`;

            piece.appendChild(img);
            puzzleContainer.appendChild(piece);
        }
    }

    function updateProgress() {
        const count = foundPieces.size;
        const pct = (count / TOTAL_EGGS) * 100;

        eggsFoundEl.textContent = count;
        eggsRemainingEl.textContent = TOTAL_EGGS - count;
        progressFill.style.width = pct + '%';
        progressText.textContent = Math.round(pct) + '% complete';

        document.querySelectorAll('.puzzle-piece').forEach(piece => {
            const idx = parseInt(piece.dataset.index);
            if (foundPieces.has(idx)) {
                piece.classList.add('found');
            }
        });

        if (count >= TOTAL_EGGS) {
            allFoundBanner.classList.remove('hidden');
        }
    }

    function revealPiece(index) {
        const piece = document.querySelector(`.puzzle-piece[data-index="${index}"]`);
        if (piece && !piece.classList.contains('found')) {
            piece.classList.add('found', 'just-found');
            piece.addEventListener('animationend', () => {
                piece.classList.remove('just-found');
            }, { once: true });
        }
    }

    function spawnConfetti() {
        const colors = ['#004a93', '#1178df', '#b4d4f9', '#ffc400', '#509e27', '#f1002e'];
        for (let i = 0; i < 40; i++) {
            const el = document.createElement('div');
            el.className = 'confetti';
            el.style.left = Math.random() * 100 + 'vw';
            el.style.top = (Math.random() * 30 - 10) + 'vh';
            el.style.background = colors[Math.floor(Math.random() * colors.length)];
            el.style.width = (6 + Math.random() * 8) + 'px';
            el.style.height = (6 + Math.random() * 8) + 'px';
            el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            el.style.animationDelay = (Math.random() * 0.5) + 's';
            document.body.appendChild(el);
            el.addEventListener('animationend', () => el.remove());
        }
    }

    function showModal(icon, title, message) {
        modalIcon.textContent = icon;
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalOverlay.classList.add('active');
    }

    modalClose.addEventListener('click', () => {
        modalOverlay.classList.remove('active');
    });

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.classList.remove('active');
        }
    });

    function listenForUpdates() {
        progressCollection.onSnapshot(snapshot => {
            foundPieces.clear();
            snapshot.forEach(doc => {
                foundPieces.add(parseInt(doc.id));
            });
            updateProgress();
        });
    }

    async function handleEggScan() {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('egg');
        if (!token) return;

        window.history.replaceState({}, '', window.location.pathname);

        const eggDocRef = eggsCollection.doc(token);

        try {
            const result = await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(eggDocRef);

                if (!doc.exists) {
                    return { invalid: true };
                }

                const data = doc.data();
                if (data.found) {
                    return { alreadyFound: true };
                }

                transaction.update(eggDocRef, {
                    found: true,
                    foundAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                const progressRef = progressCollection.doc(String(data.pieceIndex));
                transaction.set(progressRef, {
                    foundAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                return { alreadyFound: false, pieceIndex: data.pieceIndex };
            });

            if (result.invalid) {
                showModal('', 'Invalid egg', 'This QR code does not belong to the hunt.');
            } else if (result.alreadyFound) {
                showModal('', 'Already found!', 'This egg has already been found by someone. Keep looking!');
            } else {
                revealPiece(result.pieceIndex);
                spawnConfetti();
                const newCount = foundPieces.size + 1;
                showModal(
                    '',
                    'Egg found!',
                    `Puzzle piece ${result.pieceIndex + 1} of ${TOTAL_EGGS} revealed! (${newCount}/${TOTAL_EGGS} found)`
                );
            }
        } catch (err) {
            console.error('Error scanning egg:', err);
            showModal('', 'Something went wrong', 'Could not register the egg. Please try again!');
        }
    }

    buildPuzzleGrid();
    listenForUpdates();
    handleEggScan();
})();
