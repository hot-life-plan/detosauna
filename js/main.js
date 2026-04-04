document.addEventListener('DOMContentLoaded', () => {
    // 0. Hero Random Background Image
    const heroImages = [
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
    const randomHero = heroImages[Math.floor(Math.random() * heroImages.length)];
    // CSS変数を上書きしてランダム背景を設定
    document.documentElement.style.setProperty('--hero-bg', `url('../${randomHero}')`);

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

    // 3. Instagram API 連携 (Instagram Basic Display API)
    // -------------------------------------------------------------
    // 【ちから様へ】
    // 1. Meta for Developersでアプリを作成し、「アクセストークン」を取得してください。
    // 2. 以下の `INSTAGRAM_ACCESS_TOKEN` にその値を貼り付けてください。
    // -------------------------------------------------------------
    const INSTAGRAM_ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN_HERE'; // ← ここにアクセストークンを入力
    const instaGrid = document.getElementById('insta-grid');

    async function fetchInstagramFeed() {
        if (!instaGrid) return;
        
        // トークンが未設定の場合は、案内を表示
        if (INSTAGRAM_ACCESS_TOKEN === 'YOUR_ACCESS_TOKEN_HERE') {
            renderTokenWarning();
            return;
        }

        try {
            const response = await fetch(`https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&access_token=${INSTAGRAM_ACCESS_TOKEN}`);
            const result = await response.json();

            if (result.data) {
                renderFeed(result.data.slice(0, 8)); // 最新8件を表示
            } else {
                console.error('Instagram API Error:', result.error);
                renderTokenWarning('APIエラーが発生しました。設定を確認してください。');
            }
        } catch (error) {
            console.error('Fetch Error:', error);
            renderTokenWarning('通信エラーが発生しました。');
        }
    }

    function renderFeed(posts) {
        instaGrid.innerHTML = ''; // クリア
        posts.forEach(post => {
            const mediaUrl = post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url;
            const item = document.createElement('a');
            item.href = post.permalink;
            item.target = '_blank';
            item.className = 'insta-item fade-up';
            item.innerHTML = `
                <img src="${mediaUrl}" alt="${post.caption || 'Instagram Post'}">
                <div class="insta-overlay">
                    <span class="insta-info"><i class="fab fa-instagram"></i> VIEW POST</span>
                </div>
            `;
            instaGrid.appendChild(item);
            fadeObservers.observe(item);
        });
    }

    function renderTokenWarning(message = 'Instagram API連携の準備ができました。') {
        instaGrid.style.display = 'block';
        instaGrid.innerHTML = `
            <div style="background: rgba(212, 175, 55, 0.1); border: 1px dashed var(--accent); padding: 40px; text-align: center; border-radius: 15px; color: var(--accent);">
                <p style="margin-bottom: 20px;">${message}</p>
                <p style="font-size: 0.8rem; color: var(--text-sub);">js/main.js 内の INSTAGRAM_ACCESS_TOKEN に<br>取得したトークンを貼り付けると自動で表示が切り替わります。</p>
            </div>
        `;
    }

    // 実行
    fetchInstagramFeed();

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
