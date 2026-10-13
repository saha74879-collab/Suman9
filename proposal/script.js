document.addEventListener('DOMContentLoaded', () => {
    /* ==========================================================
       1. CORE STATE & DOM REFERENCES
       ========================================================== */
    const navButtons = document.querySelectorAll('.nav-btn');
    const navIndicator = document.getElementById('nav-indicator');
    const sections = {
        photos: document.getElementById('section-photos'),
        letter: document.getElementById('section-letter'),
        food: document.getElementById('section-food'),
        proposal: document.getElementById('section-proposal')
    };

    // Stepper buttons
    const btnToLetter = document.getElementById('btn-to-letter');
    const btnBackToPhotos = document.getElementById('btn-back-to-photos');
    const btnToFood = document.getElementById('btn-to-food');
    const btnBackToLetter = document.getElementById('btn-back-to-letter');
    const btnToProposal = document.getElementById('btn-to-proposal');
    const btnBackToFood = document.getElementById('btn-back-to-food');

    // Envelope & Letter
    const envelopeBox = document.getElementById('envelope-box');
    const waxSeal = document.getElementById('wax-seal');
    const parchmentSheet = document.getElementById('parchment-sheet');
    const editPsToggle = document.getElementById('edit-ps-toggle');
    const psEditInline = document.getElementById('ps-edit-inline');
    const psCustomInput = document.getElementById('ps-custom-input');
    const savePsBtn = document.getElementById('save-ps-btn');
    const psMessageDisplay = document.getElementById('ps-message-display');
    const recipientName = document.getElementById('recipient-name');

    // Photo Gallery & Filters
    const tagPills = document.querySelectorAll('.tag-pill');
    const polaroidGrid = document.getElementById('polaroid-grid');
    const customFileInput = document.getElementById('custom-file-input');

    // Lightbox Modal
    const lightboxModal = document.getElementById('lightbox-modal');
    const lightboxBackdrop = document.getElementById('lightbox-backdrop');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxFullImg = document.getElementById('lightbox-full-img');
    const lightboxCaptionText = document.getElementById('lightbox-caption-text');

    // Food Date Picker
    const datePickBtns = document.querySelectorAll('.select-date-btn');
    const itineraryStatusText = document.getElementById('itinerary-status-text');

    // Proposal Elements
    const proposalStepCard = document.getElementById('proposal-step-card');
    const celebrationStepCard = document.getElementById('celebration-step-card');
    const yesBtn = document.getElementById('yes-btn');
    const noBtn = document.getElementById('no-btn');
    const replayBtn = document.getElementById('replay-btn');
    const noHintMessage = document.getElementById('no-hint-message');
    const buttonPlayground = document.getElementById('button-playground');

    // Music & Equalizer
    const musicToggle = document.getElementById('music-toggle');
    const musicLabel = document.getElementById('music-label');

    // 60FPS Canvas
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // State Variables
    let currentSectionKey = 'photos';
    let isEnvelopeOpen = false;
    let isMusicPlaying = false;
    let audioCtx = null;
    let musicInterval = null;
    let noAttempts = 0;
    let yesScale = 1;
    let confetti = [];

    const noPhrases = [
        "Are you sure? 🥺",
        "Think again! 💔",
        "Pretty please? 🌹",
        "You can't catch me! 😜",
        "Error 404: No not found! 💖",
        "Destiny says YES! 💍"
    ];

    /* ==========================================================
       2. SLIDING NAV INDICATOR & SECTION SWITCHER
       ========================================================== */
    function updateNavIndicator(activeBtn) {
        if (!activeBtn || !navIndicator) return;
        const navPills = activeBtn.parentElement;
        const btnRect = activeBtn.getBoundingClientRect();
        const parentRect = navPills.getBoundingClientRect();
        
        const leftOffset = btnRect.left - parentRect.left;
        navIndicator.style.width = `${btnRect.width}px`;
        navIndicator.style.transform = `translateX(${leftOffset}px)`;
    }

    function switchSection(sectionKey) {
        if (!sections[sectionKey]) return;
        currentSectionKey = sectionKey;

        // Update active nav button
        let activeNavBtn = null;
        navButtons.forEach(btn => {
            if (btn.dataset.section === sectionKey) {
                btn.classList.add('active');
                activeNavBtn = btn;
            } else {
                btn.classList.remove('active');
            }
        });
        updateNavIndicator(activeNavBtn);

        // Switch visible section without layout flicker
        Object.entries(sections).forEach(([key, sectionEl]) => {
            if (key === sectionKey) {
                sectionEl.style.display = 'block';
                // Trigger reflow for smooth animation
                void sectionEl.offsetWidth;
                sectionEl.classList.add('active');
            } else {
                sectionEl.classList.remove('active');
                setTimeout(() => {
                    if (currentSectionKey !== key) {
                        sectionEl.style.display = 'none';
                    }
                }, 320);
            }
        });

        // Smooth scroll to top of page
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Nav button clicks
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            switchSection(btn.dataset.section);
            playChime(659.25, 0.2);
        });
    });

    // Window resize updates indicator
    window.addEventListener('resize', () => {
        const activeBtn = document.querySelector('.nav-btn.active');
        if (activeBtn) updateNavIndicator(activeBtn);
    });

    // Initial indicator position
    setTimeout(() => {
        const initialActiveBtn = document.querySelector('.nav-btn.active');
        if (initialActiveBtn) updateNavIndicator(initialActiveBtn);
    }, 100);

    // Stepper Navigation Links
    btnToLetter?.addEventListener('click', () => {
        switchSection('letter');
        playChime(659.25, 0.25);
    });

    btnBackToPhotos?.addEventListener('click', () => {
        switchSection('photos');
        playChime(523.25, 0.2);
    });

    btnToFood?.addEventListener('click', () => {
        switchSection('food');
        playChime(783.99, 0.25);
    });

    btnBackToLetter?.addEventListener('click', () => {
        switchSection('letter');
        playChime(659.25, 0.2);
    });

    btnToProposal?.addEventListener('click', () => {
        switchSection('proposal');
        playChime(1046.5, 0.3);
    });

    btnBackToFood?.addEventListener('click', () => {
        switchSection('food');
        playChime(783.99, 0.2);
    });

    /* ==========================================================
       3. WARM WEB AUDIO API MUSIC BOX & SFX
       ========================================================== */
    function getAudioContext() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContextClass();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    // Warm music box note with gentle lowpass filter
    function playMusicBoxNote(freq, duration = 0.8) {
        try {
            const ctx = getAudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);

            // Lowpass filter softens harsh frequencies
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1200, ctx.currentTime);

            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {}
    }

    function playChime(freq = 523.25, duration = 0.4) {
        playMusicBoxNote(freq, duration);
    }

    function playPop() {
        try {
            const ctx = getAudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(380, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(650, ctx.currentTime + 0.12);

            gain.gain.setValueAtTime(0.18, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.12);
        } catch (e) {}
    }

    function playCelebrationChords() {
        const chordNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        chordNotes.forEach((freq, idx) => {
            setTimeout(() => playMusicBoxNote(freq, 1.2), idx * 100);
        });
    }

    // Peaceful Romantic Melody Progression (Canon in D variation)
    const romanticMelody = [
        523.25, 659.25, 783.99, 1046.50, // C E G C
        440.00, 523.25, 659.25, 880.00,  // A C E A
        349.23, 440.00, 523.25, 698.46,  // F A C F
        392.00, 493.88, 587.33, 783.99   // G B D G
    ];
    let melodyIndex = 0;

    function playNextMelodyNote() {
        if (!isMusicPlaying) return;
        const freq = romanticMelody[melodyIndex % romanticMelody.length];
        playMusicBoxNote(freq, 0.7);
        melodyIndex++;
    }

    function toggleMusic() {
        getAudioContext();
        if (isMusicPlaying) {
            isMusicPlaying = false;
            clearInterval(musicInterval);
            musicToggle.classList.remove('playing');
            musicLabel.textContent = 'Music Box';
        } else {
            isMusicPlaying = true;
            musicInterval = setInterval(playNextMelodyNote, 700);
            musicToggle.classList.add('playing');
            musicLabel.textContent = 'Playing 🎶';
            playChime(523.25, 0.4);
        }
    }

    musicToggle?.addEventListener('click', toggleMusic);

    /* ==========================================================
       4. 60FPS FLOATING PARTICLES & CELEBRATION FIREWORKS
       ========================================================== */
    let canvasWidth = 0;
    let canvasHeight = 0;

    function resizeCanvas() {
        canvasWidth = window.innerWidth;
        canvasHeight = window.innerHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = canvasWidth * dpr;
        canvas.height = canvasHeight * dpr;
        canvas.style.width = canvasWidth + 'px';
        canvas.style.height = canvasHeight + 'px';
        ctx.scale(dpr, dpr);
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const backgroundHearts = Array.from({ length: 22 }, () => ({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        size: Math.random() * 11 + 9,
        speedY: Math.random() * 0.6 + 0.3,
        swayOffset: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.018 + 0.01,
        opacity: Math.random() * 0.32 + 0.14,
        color: ['#d8315b', '#ff6b8b', '#ff85a1', '#ffccd5', '#f72585'][Math.floor(Math.random() * 5)]
    }));

    function drawHeart(x, y, size, color, opacity) {
        ctx.save();
        ctx.translate(x, y);
        ctx.globalAlpha = opacity;
        ctx.fillStyle = color;
        ctx.beginPath();
        const top = size * 0.3;
        ctx.moveTo(0, top);
        ctx.bezierCurveTo(0, 0, -size / 2, 0, -size / 2, top);
        ctx.bezierCurveTo(-size / 2, (size + top) / 2, 0, size * 0.85, 0, size);
        ctx.bezierCurveTo(0, size * 0.85, size / 2, (size + top) / 2, size / 2, top);
        ctx.bezierCurveTo(size / 2, 0, 0, 0, 0, top);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    function createConfettiBurst(burstCount = 90, originX = canvasWidth / 2, originY = canvasHeight / 2) {
        const colors = ['#d8315b', '#ff4d6d', '#ffbe0b', '#fbbf24', '#06d6a0', '#118ab2', '#b5179e'];
        for (let i = 0; i < burstCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 9.5 + 3;
            confetti.push({
                x: originX,
                y: originY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 3.2,
                size: Math.random() * 7 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 7,
                opacity: 1,
                decay: Math.random() * 0.008 + 0.005
            });
        }
    }

    function renderLoop() {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Render ambient floating hearts
        for (const h of backgroundHearts) {
            h.y -= h.speedY;
            h.swayOffset += h.swaySpeed;
            h.x += Math.sin(h.swayOffset) * 0.55;

            if (h.y < -35) {
                h.y = canvasHeight + 25;
                h.x = Math.random() * canvasWidth;
            }

            drawHeart(h.x, h.y, h.size, h.color, h.opacity);
        }

        // Render celebratory confetti
        for (let i = confetti.length - 1; i >= 0; i--) {
            const c = confetti[i];
            c.vx *= 0.97;
            c.vy = c.vy * 0.97 + 0.17;
            c.x += c.vx;
            c.y += c.vy;
            c.rotation += c.rotSpeed;
            c.opacity -= c.decay;

            if (c.opacity <= 0 || c.y > canvasHeight + 25) {
                confetti.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.rotate((c.rotation * Math.PI) / 180);
            ctx.globalAlpha = Math.max(0, c.opacity);
            ctx.fillStyle = c.color;
            ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 1.4);
            ctx.restore();
        }

        requestAnimationFrame(renderLoop);
    }
    requestAnimationFrame(renderLoop);

    /* ==========================================================
       5. SECTION 1: PHOTOS, TAG FILTER, LIGHTBOX & UPLOAD
       ========================================================== */
    // Tag filter
    tagPills.forEach(pill => {
        pill.addEventListener('click', () => {
            tagPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');

            const filter = pill.dataset.filter;
            const items = document.querySelectorAll('.polaroid-item');

            items.forEach(item => {
                if (filter === 'all' || item.dataset.category === filter) {
                    item.style.display = 'block';
                    setTimeout(() => item.style.opacity = '1', 20);
                } else {
                    item.style.opacity = '0';
                    setTimeout(() => item.style.display = 'none', 250);
                }
            });
            playChime(659.25, 0.15);
        });
    });

    // Like buttons
    function bindLikeButtons() {
        const likeBtns = document.querySelectorAll('.like-counter-btn');
        likeBtns.forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const numSpan = btn.querySelector('.like-number');
                let count = parseInt(numSpan.textContent, 10) || 0;
                count++;
                numSpan.textContent = count;
                btn.classList.add('popped');
                playPop();

                const rect = btn.getBoundingClientRect();
                createConfettiBurst(12, rect.left + rect.width / 2, rect.top);

                setTimeout(() => btn.classList.remove('popped'), 400);
            };
        });
    }
    bindLikeButtons();

    // Lightbox modal setup
    function bindLightboxTriggers() {
        const triggers = document.querySelectorAll('.polaroid-image-frame, .food-image-wrapper');
        triggers.forEach(trig => {
            trig.onclick = () => {
                const imgUrl = trig.dataset.img;
                const caption = trig.dataset.caption;
                lightboxFullImg.src = imgUrl;
                lightboxCaptionText.textContent = caption || '';
                lightboxModal.classList.add('active');
                lightboxModal.setAttribute('aria-hidden', 'false');
                playChime(783.99, 0.2);
            };
        });
    }
    bindLightboxTriggers();

    function closeLightbox() {
        lightboxModal.classList.remove('active');
        lightboxModal.setAttribute('aria-hidden', 'true');
    }

    lightboxClose?.addEventListener('click', closeLightbox);
    lightboxBackdrop?.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
    });

    // Custom Photo Upload
    customFileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            const newPolaroid = document.createElement('article');
            newPolaroid.className = 'polaroid-item tilt-straight';
            newPolaroid.dataset.category = 'all';
            newPolaroid.innerHTML = `
                <div class="tape-strip"></div>
                <div class="polaroid-image-frame" data-img="${dataUrl}" data-caption="Our Special Uploaded Memory — A treasured moment together.">
                    <img src="${dataUrl}" alt="Our custom memory" class="polaroid-photo">
                    <span class="zoom-badge">🔍 Zoom In</span>
                </div>
                <div class="polaroid-meta">
                    <h3 class="polaroid-heading">Forever In My Heart 💖</h3>
                    <p class="polaroid-quote">“Another precious memory added to our journey.”</p>
                    <div class="polaroid-bottom">
                        <span class="polaroid-stamp">Just Added ✨</span>
                        <button class="like-counter-btn" aria-label="Like photo">
                            <span class="heart-ico">❤️</span>
                            <span class="like-number">999</span>
                        </button>
                    </div>
                </div>
            `;
            polaroidGrid.appendChild(newPolaroid);
            bindLikeButtons();
            bindLightboxTriggers();
            playCelebrationChords();
            createConfettiBurst(45);
        };
        reader.readAsDataURL(file);
    });

    /* ==========================================================
       6. SECTION 2: 3D ENVELOPE UNSEALING & LOVE LETTER
       ========================================================== */
    function unsealEnvelope() {
        if (isEnvelopeOpen) return;
        isEnvelopeOpen = true;

        playChime(783.99, 0.4);
        envelopeBox.classList.add('opening');

        setTimeout(() => {
            envelopeBox.classList.add('unsealed');
            parchmentSheet.classList.add('active');
            createConfettiBurst(40, window.innerWidth / 2, window.innerHeight / 2.5);
        }, 350);
    }

    waxSeal?.addEventListener('click', unsealEnvelope);
    envelopeBox?.addEventListener('click', unsealEnvelope);

    // P.S. Note Customization
    editPsToggle?.addEventListener('click', () => {
        psEditInline.classList.toggle('hidden');
        if (!psEditInline.classList.contains('hidden')) {
            psCustomInput.focus();
        }
    });

    savePsBtn?.addEventListener('click', () => {
        const val = psCustomInput.value.trim();
        if (val) {
            psMessageDisplay.textContent = `“${val}”`;
            psCustomInput.value = '';
            psEditInline.classList.add('hidden');
            playChime(880, 0.25);
            createConfettiBurst(18);
        }
    });

    // Partner Name auto-save in local memory
    recipientName?.addEventListener('blur', () => {
        const nameVal = recipientName.textContent.trim();
        if (!nameVal) recipientName.textContent = "My Love";
    });

    /* ==========================================================
       7. SECTION 3: FAVORITE FOOD & DATE NIGHT ITINERARY
       ========================================================= */
    datePickBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const foodName = btn.dataset.food;
            const parentCard = btn.closest('.food-card');

            // Select only this card or toggle
            document.querySelectorAll('.food-card').forEach(c => c.classList.remove('selected-for-date'));
            parentCard.classList.add('selected-for-date');

            // Update live itinerary summary
            itineraryStatusText.innerHTML = `<strong>${foodName}</strong> is locked in for our next date! Romantic candlelit dinner is ready! 🥂✨`;

            playChime(659.25, 0.3);
            playPop();
            createConfettiBurst(35, window.innerWidth / 2, window.innerHeight / 2);
        });
    });

    /* ==========================================================
       8. SECTION 4: SAFE RUNAWAY "NO" BUTTON & PROPOSAL
       ========================================================== */
    function dodgeNoButton() {
        noAttempts++;
        noBtn.querySelector('.btn-label-text').textContent = noPhrases[(noAttempts - 1) % noPhrases.length];

        // Grow Yes button progressively
        yesScale = Math.min(yesScale + 0.12, 1.7);
        yesBtn.style.transform = `scale(${yesScale})`;

        // Bounded evasion within playground
        const rangeX = Math.min(160, window.innerWidth / 3.5);
        const rangeY = 70;
        const randomX = (Math.random() - 0.5) * rangeX * 2;
        const randomY = (Math.random() - 0.5) * rangeY * 2;

        noBtn.style.transform = `translate(${randomX}px, ${randomY}px)`;
        noHintMessage.textContent = "The 'No' button is too slippery... Your heart already says YES! ❤️";

        playPop();
    }

    noBtn?.addEventListener('mouseenter', dodgeNoButton);
    noBtn?.addEventListener('touchstart', (e) => {
        e.preventDefault();
        dodgeNoButton();
    });
    noBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        dodgeNoButton();
    });

    // "Yes, Forever!" Celebration
    yesBtn?.addEventListener('click', () => {
        createConfettiBurst(160, canvasWidth / 2, canvasHeight / 2);
        playCelebrationChords();

        proposalStepCard.classList.add('hidden');
        celebrationStepCard.classList.remove('hidden');

        // Continuous waves of fireworks
        setTimeout(() => createConfettiBurst(80, canvasWidth * 0.25, canvasHeight * 0.35), 350);
        setTimeout(() => createConfettiBurst(80, canvasWidth * 0.75, canvasHeight * 0.35), 700);
        setTimeout(() => createConfettiBurst(100, canvasWidth / 2, canvasHeight * 0.25), 1100);
    });

    // Relive Story / Reset
    replayBtn?.addEventListener('click', () => {
        noAttempts = 0;
        yesScale = 1;
        yesBtn.style.transform = 'scale(1)';
        noBtn.style.transform = 'translate(0, 0)';
        noBtn.querySelector('.btn-label-text').textContent = 'No';
        noHintMessage.textContent = '';

        proposalStepCard.classList.remove('hidden');
        celebrationStepCard.classList.add('hidden');

        switchSection('photos');
        playChime(523.25, 0.3);
    });
});
