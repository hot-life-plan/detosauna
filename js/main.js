document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 写真リスト（AVAILABLE_IMAGES）は外部ファイルの js/gallery_data.js から読み込まれます。
    // ==========================================

    function shuffleArray(array) {
        return array.slice().sort(() => Math.random() - 0.5);
    }
    
    const shuffledImages = shuffleArray(AVAILABLE_IMAGES);

    // --- メイン背景（Hero）にランダムで1枚設定 ---
    if (shuffledImages.length > 0) {
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
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-up').forEach(el => fadeObservers.observe(el));

    // 2. Smooth scrolling for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // 3. ギャラリーの自動挿入
    const officialGallery = document.getElementById('random-gallery');
    const guestGallery = document.getElementById('guest-gallery-list');
    
    if (shuffledImages.length > 0) {
        const guestImages = AVAILABLE_IMAGES.filter(src => src.startsWith('img/guest/'));
        const officialImages = shuffleArray(AVAILABLE_IMAGES.filter(src => !src.startsWith('img/guest/')));

        if (officialGallery) {
            officialGallery.innerHTML = '';
            officialImages.slice(0, 8).forEach(imgSrc => {
                const item = createGalleryItem(imgSrc);
                officialGallery.appendChild(item);
                fadeObservers.observe(item);
            });
        }

        if (guestGallery) {
            guestGallery.innerHTML = '';
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
                const item = createGalleryItem(imgSrc, 'guest-item', dateStr);
                item.classList.remove('fade-up');
                item.style.opacity = '1';
                guestGallery.appendChild(item);
            });

            // 📸 プレースホルダー（20枠）
            const emptySlotsNeeded = Math.max(0, 20 - sliderImages.length);
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

            // --- 無限ループスライダー本体 ---
            const track = guestGallery;
            const origItems = [...track.children];
            const itemWidth = 200 + 15;
            const totalWidth = origItems.length * itemWidth;

            // クローン作成
            origItems.forEach(item => {
                const clone = item.cloneNode(true);
                clone.style.opacity = '1';
                if (!clone.classList.contains('placeholder')) {
                    const origImg = item.querySelector('img');
                    if (origImg) {
                        clone.addEventListener('click', () => {
                            const lgImg = document.getElementById('lightbox-img');
                            lgImg.src = origImg.src;
                            document.getElementById('lightbox').style.display = 'flex';
                        });
                    }
                }
                track.appendChild(clone);
            });

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

    // ギャラリーアイテム作成ヘルパー（グローバルからDOMContentLoaded内に移動）
    function createGalleryItem(src, className = 'insta-item', dateText = '') {
        const item = document.createElement('div');
        item.className = `${className} fade-up`;
        let innerHtmlStr = `<img src="${src}" alt="デトサウナの風景" draggable="false">`;
        if (dateText) {
            innerHtmlStr += `<div class="guest-date">${dateText}</div>`;
        }
        item.innerHTML = innerHtmlStr;
        item.addEventListener('click', () => {
            const lbImg = document.getElementById('lightbox-img');
            lbImg.src = src;
            document.getElementById('lightbox').style.display = 'flex';
        });
        return item;
    }

    // Header transparency
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

    // Lightbox close
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.addEventListener('click', () => {
            lightbox.style.display = 'none';
        });
    }

}); // ここが正真正銘、最後の一つの閉じタグ
