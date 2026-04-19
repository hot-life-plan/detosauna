document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 写真管理用リスト (画像を増やしたり減らしたりする場合はここを編集してください)
    // ==========================================
    const AVAILABLE_IMAGES = [
        'img/img_1776578370954_1000000561.jpg',
        'img/line_oa_chat_260404_192627.jpg',
        'img/line_oa_chat_260404_192633.jpg',
        'img/line_oa_chat_260404_192635.jpg',
        'img/line_oa_chat_260404_192639.jpg',
        'img/line_oa_chat_260404_192641.jpg',
        'img/line_oa_chat_260404_192644.jpg',
        'img/line_oa_chat_260404_192646.jpg',
        'img/line_oa_chat_260404_192649.jpg',
        'img/line_oa_chat_260404_192652.jpg',
        'img/line_oa_chat_260404_192654.jpg',
        'img/line_oa_chat_260404_192657.jpg',
        'img/line_oa_chat_260404_192700.jpg',
        'img/line_oa_chat_260404_192703.jpg',
        'img/line_oa_chat_260404_192705.jpg',
        'img/line_oa_chat_260404_192708.jpg'
    ];

    // 配列をランダムにシャッフルする関数
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

        // ゲストギャラリー（全件・新着順表示）
        if (guestGallery) {
            guestGallery.innerHTML = '';
            guestImages.forEach(imgSrc => {
                const item = createGalleryItem(imgSrc, 'guest-item');
                guestGallery.appendChild(item);
                fadeObservers.observe(item);
            });
        }
    }

    // ギャラリーアイテム作成ヘルパー
    function createGalleryItem(src, className = 'insta-item') {
        const item = document.createElement('div');
        item.className = `${className} fade-up`;
        item.innerHTML = `<img src="${src}" alt="デトサウナの風景">`;
        
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
