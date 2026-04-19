document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 写真リスト（AVAILABLE_IMAGES）は外部ファイルの js/gallery_data.js から読み込まれます。
    // ==========================================

    // 配列をランダムにシャッフルする関数
    function shuffleArray(array) {
        return array.slice().sort(() => Math.random() - 0.5);
    }
    
    const shuffledImages = shuffleArray(AVAILABLE_IMAGES);

    // --- メイン背景（Hero）にランダムで1枚設定 ---
    if (shuffledImages.length > 0) {
        // CSSファイル(css/style.css)の位置待停で解決されるため ../ が必要
        document.documentElement.style.setProperty('--hero-bg', `url('../${shuffledImages[0]}')`);
    }

    // 1. Fade-in on scroll animation
    const fadeObservers = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                fadeObservers.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('.fade-up').forEach(el => fadeObservers.observe(el));

    // 2. Smooth scrolling for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // 3. ギャラリーの自動挿入 (公式とゲストの振り分け)
    const officialGallery = document.getElementById('random-gallery');
    const guestGallery = document.getElementById('guest-gallery-list');
    
    if (shuffledImages.length > 0) {
        // --- ゲストの投稿（img/guest/ で始まるもの）を抽出 ---
        // ※Workerが配列の先頭に追加するため、そのままの順番＝新着順になります
        const guestImages = AVAILABLE_IMAGES.filter(src => src.startsWith('img/guest/'));
        
        // --- 公式の写真（それ以外）を抽出してシャッフル ---
        const officialImages = shuffleArray(AVAILABLE_IMAGES.filter(src => !src.startsWith('img/guest/')));

        // 公式ギャラリー（ランダム8枚表示）
        if (officialGallery) {
            officialGallery.innerHTML = '';
            officialImages.slice(0, 8).forEach(imgSrc => {
                const item = createGalleryItem(imgSrc);
                officialGallery.appendChild(item);
                fadeObservers.observe(item);
            });
        }

        // ゲストギャラリー（投稿写真のみ・新着順表示）
        if (guestGallery) {
            guestGallery.innerHTML = '';

            // ゲスト投稿写真のみ表示（公式写真はフォールバックに使わない）
            const sliderImages = guestImages;

            sliderImages.forEach(imgSrc => {
                let dateStr = '';
                const parts = imgSrc.split('/');
                const filename = parts[parts.length - 1];
                const timestampMatch = filename.match(/^(\d{13})_/);
                if (timestampMatch) {
                    const d = new Date(parseInt(timestampMatch[1]));
                    dateStr = `${d.getFullYear()}.${(d.getMonth()+1).toString().padStart(2,'0')}.${d.getDate().toString().padStart(2,'0')}`;
                }
                // ★ fade-up を付けない（クローン時に opacity:0 になるのを防ぐ）
                const item = createGalleryItem(imgSrc, 'guest-item', dateStr);
                item.classList.remove('fade-up'); // 念のため除去
                item.style.opacity = '1';
                guestGallery.appendChild(item);
            });

            // 📸 プレースホルダー（最低20枠確保 → 画面いっぱいでも埋まる）
            const maxGuestSlots = Math.max(20, sliderImages.length);
            const emptySlotsNeeded = Math.max(0, maxGuestSlots - sliderImages.length);
            for (let i = 0; i < emptySlotsNeeded; i++) {
                const placeholder = document.createElement('div');
                placeholder.className = 'guest-item placeholder';
                placeholder.style.opacity = '1';
                placeholder.innerHTML = `
                    <div class="placeholder-content">
                        <i class="fas fa-camera"></i>
                        <span>Your Photo</span>
                        <p>あなたの写真を<br>投稿してね！</p>
                    </div>
                `;
                guestGallery.appendChild(placeholder);
            }

            // ============================================================
            // 🚀 真の無限ループ：transform: translateX() 方式（観覧車方式）
            //    scrollLeft は overflow:hidden で動かないブラウザがあるため廃止
            // ============================================================
            const track = guestGallery; // .guest-grid がトラック

            // オリジナルを丸ごとクローンして末尾に追加
            const origItems = [...track.children];
            origItems.forEach(item => {
                const clone = item.cloneNode(true);
                clone.style.opacity = '1'; // クローンも必ず表示
                // クリックイベント再設定
                if (!clone.classList.contains('placeholder')) {
                    const origImg = item.querySelector('img');
                    if (origImg) {
                        clone.addEventListener('click', () => {
                            const lightbox = document.getElementById('lightbox');
                            const lightboxImg = document.getElementById('lightbox-img');
                            lightboxImg.src = origImg.src;
                            lightbox.style.display = 'flex';
                        });
                    }
                }
                track.appendChild(clone);
            });

            const itemWidth = 200 + 15; // flex: 0 0 200px + gap: 15px
            const totalWidth = origItems.length * itemWidth;

            let currentX = 0;
            const autoSpeed = 0.3; 
            let velocity = 0;
            const friction = 0.98;
            
            let isDragging = false;
            let isFollowing = false;
            let startX = 0;
            let startY = 0;
            let startCurrentX = 0;
            let lastX = 0;
            let trackHistory = [];

            const inner = document.createElement('div');
            inner.className = 'slider-inner';
            inner.style.cssText = 'display:flex; gap:15px; will-change:transform;';
            [...track.children].forEach(child => inner.appendChild(child));
            track.innerHTML = '';
            track.style.overflow = 'hidden';
            track.appendChild(inner);

            const updateLoop = () => {
                if (!isDragging && !isFollowing) {
                    currentX -= autoSpeed;
                    currentX += velocity;
                    velocity *= friction;
                    if (Math.abs(velocity) < 0.1) velocity = 0;
                }
                if (currentX <= -totalWidth) currentX += totalWidth;
                if (currentX > 0) currentX -= totalWidth;
                inner.style.transform = `translateX(${currentX}px)`;
                requestAnimationFrame(updateLoop);
            };
            requestAnimationFrame(updateLoop);

            const onStart = (e) => {
                const x = e.pageX || (e.touches ? e.touches[0].pageX : 0);
                const y = e.pageY || (e.touches ? e.touches[0].pageY : 0);
                isDragging = true;
                isFollowing = false;
                startX = x;
                startY = y;
                lastX = x;
                startCurrentX = currentX;
                velocity = 0;
                trackHistory = [];
                inner.style.transition = 'none';
            };

            const onMove = (e) => {
                const x = e.pageX || (e.touches ? e.touches[0].pageX : 0);
                const y = e.pageY || (e.touches ? e.touches[0].pageY : 0);
                if (isDragging) {
                    if (e.touches) {
                        const dx = Math.abs(x - startX);
                        const dy = Math.abs(y - startY);
                        if (dy > dx && dy > 10) { isDragging = false; return; }
                        if (e.cancelable) e.preventDefault();
                        trackHistory.push({ x, t: Date.now() });
                        if (trackHistory.length > 5) trackHistory.shift();
                    }
                    currentX = startCurrentX + (x - startX);
                } else if (isFollowing) {
                    const dx = x - lastX;
                    currentX += dx;
                }
                lastX = x;
            };

            const onEnd = () => {
                if (isDragging && trackHistory.length >= 2) {
                    const first = trackHistory[0];
                    const last = trackHistory[trackHistory.length - 1];
                    const dt = last.t - first.t;
                    const dx = last.x - first.x;
                    if (dt > 20) velocity = (dx / dt) * 16.6 * 2.5; 
                }
                isDragging = false;
            };

            track.addEventListener('dragstart', (e) => e.preventDefault());
            track.addEventListener('mousedown', onStart);
            track.addEventListener('touchstart', onStart, { passive: false });
            window.addEventListener('mousemove', onMove);
            window.addEventListener('touchmove', onMove, { passive: false });
            window.addEventListener('mouseup', onEnd);
            window.addEventListener('touchend', onEnd);
            track.addEventListener('mouseenter', (e) => {
                if (!isDragging) { isFollowing = true; lastX = e.pageX; }
            });
            track.addEventListener('mouseleave', () => { isFollowing = false; });
        }
    }
});

    // ギャラリーアイテム作成ヘルパー
    function createGalleryItem(src, className = 'insta-item', dateText = '') {
        const item = document.createElement('div');
        item.className = `${className} fade-up`;
        
        // draggable="false" を追加してマウス操作を安定させる
        let innerHtmlStr = `<img src="${src}" alt="デトサウナの風景" draggable="false">`;
        if (dateText) {
            innerHtmlStr += `<div class="guest-date">${dateText}</div>`;
        }
        item.innerHTML = innerHtmlStr;
        
        // クリックイベント (Lightbox)
        item.addEventListener('click', () => {
            const lightbox = document.getElementById('lightbox');
            const lightboxImg = document.getElementById('lightbox-img');
            lightboxImg.src = src;
            lightbox.style.display = 'flex';
        });
        
        return item;
    }

    // 4. Header transparency change on scroll
    window.addEventListener('scroll', () => {
        const header = document.querySelector('header');
        if (window.scrollY > 50) {
            header.style.backgroundColor = 'rgba(13, 26, 19, 0.95)';
            header.style.padding = '10px 50px';
        } else {
            header.style.backgroundColor = 'transparent';
            header.style.padding = '20px 50px';
        }
    });
});
