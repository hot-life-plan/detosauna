document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 写真管理用リスト (画像を増やしたり減らしたりする場合はここを編集してください)
    // ==========================================
    const AVAILABLE_IMAGES = [
        'img/line_oa_chat_260404_192627.jpg',
        'img/line_oa_chat_260404_192635.jpg',
        'img/line_oa_chat_260404_192633.jpg',
        'img/line_oa_chat_260404_192641.jpg',
        'img/line_oa_chat_260404_192644.jpg',
        'img/line_oa_chat_260404_192646.jpg',
        'img/line_oa_chat_260404_192649.jpg',
        'img/line_oa_chat_260404_192639.jpg',
        'img/line_oa_chat_260404_192654.jpg',
        'img/line_oa_chat_260404_192652.jpg',
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

    // 3. ランダムギャラリーの自動挿入
    const galleryContainer = document.getElementById('random-gallery');
    if (galleryContainer && shuffledImages.length > 0) {
        galleryContainer.innerHTML = ''; // 一旦中身を空にする
        
        // 全画像の中からランダムに順番を入れ替えた最初の8枚を取得
        const galleryTargetImages = shuffledImages.slice(0, 8);
        
        galleryTargetImages.forEach(imgSrc => {
            const item = document.createElement('div');
            item.className = 'insta-item fade-up';
            item.innerHTML = `<img src="${imgSrc}" alt="デトサウナの風景">`;
            galleryContainer.appendChild(item);
            
            // フェードインのアニメーションをセット
            fadeObservers.observe(item);
        });
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
