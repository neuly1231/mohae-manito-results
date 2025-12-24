document.addEventListener('DOMContentLoaded', () => {
    // 로딩 오버레이 HTML 동적 추가
    createLoadingOverlay();

    // 공지사항 토글 기능 설정
    setupNoticeToggle();

    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            renderMenu(data);
            renderChat(data);
            setupImageModal();
        })
        .catch(error => console.error('Error loading data:', error));
});

// 로딩 UI 생성
function createLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.innerHTML = `
        <div class="spinner"></div>
        <div id="loading-text">잠시만 기다려주세요...</div>
    `;
    document.body.appendChild(overlay);
}

// 로딩 상태 제어
function toggleLoading(show, text = "처리 중...") {
    const overlay = document.getElementById('loading-overlay');
    const textEl = document.getElementById('loading-text');
    if (overlay) {
        textEl.innerText = text;
        overlay.style.display = show ? 'flex' : 'none';
    }
}

function setupNoticeToggle() {
    const btn = document.getElementById('notice-toggle-btn');
    const content = document.getElementById('notice-content');
    const icon = document.getElementById('notice-icon');

    if (btn && content && icon) {
        btn.addEventListener('click', () => {
            const isHidden = content.style.display === 'none';
            if (isHidden) {
                content.style.display = 'block';
                icon.innerText = '▲';
                btn.style.borderBottomLeftRadius = '0'; // 펼쳐졌을 때 버튼 하단 둥글기 제거
                btn.style.borderBottomRightRadius = '0';
            } else {
                content.style.display = 'none';
                icon.innerText = '▼';
                btn.style.borderBottomLeftRadius = '12px'; // 닫혔을 때 다시 둥글게
                btn.style.borderBottomRightRadius = '12px';
            }
        });
    }
}

function renderMenu(data) {
    const menuContainer = document.getElementById('menu-container');
    const sortedNames = data.map(item => item.receiver).sort((a, b) => a.localeCompare(b, 'ko'));

    sortedNames.forEach(name => {
        const link = document.createElement('a');
        link.className = 'menu-item';
        link.innerText = name;
        link.href = `#target-${name}`;
        menuContainer.appendChild(link);
    });
}

function renderChat(data) {
    const app = document.getElementById('app');
    const getBaseName = (filename) => filename ? filename.replace(/_\d+\.(jpg|png|gif|jpeg|webp)$/i, '') : '';

    data.forEach(group => {
        const section = document.createElement('div');
        section.className = 'chat-section';
        section.id = `target-${group.receiver}`;

        // 헤더
        const header = document.createElement('div');
        header.className = 'section-header';
        
        let cardHtml = group.card_img 
            ? `<img src="src/manito_card/${group.card_img}" alt="마니또 카드" class="manito-card-img">`
            : `<div style="color:#ccc; font-size:0.9rem;">(공개된 카드가 없습니다)</div>`;

        header.innerHTML = `
            <span class="receiver-name">To. ${group.receiver}</span>
            ${cardHtml}
        `;

        // 제니가 아닐 때만 'PNG 저장' 버튼 생성
        if (group.receiver !== '제니') {
            const btnArea = document.createElement('div');
            btnArea.className = 'save-btn-area';
            
            const pngBtn = document.createElement('button');
            pngBtn.className = 'btn-save';
            pngBtn.innerHTML = 'PNG 저장'; // 버튼 텍스트를 조금 더 명확하게 변경했습니다
            pngBtn.onclick = () => saveAsImage(group.receiver);

            btnArea.appendChild(pngBtn);
            header.appendChild(btnArea);
        }

        section.appendChild(header);

        // 메시지 로직 
        const processedMessages = [];
        
        // 파일명에서 _숫자.확장자 를 제거하여 그룹명을 추출하는 함수
        // 예: "댓글240_제니_1.jpg" -> "댓글240_제니"
        const getBaseName = (filename) => {
            if (!filename) return null;
            return filename.replace(/_\d+\.(jpg|png|gif|jpeg|webp)$/i, '');
        };

        group.messages.forEach(msg => {
            const lastMsg = processedMessages[processedMessages.length - 1];
            
            // 현재 메시지의 이미지 베이스 이름
            const currentBaseName = msg.img ? getBaseName(msg.img) : null;
            
            // 직전 메시지의 이미지 베이스 이름 (이미지 그룹인 경우 첫 번째 이미지 기준)
            const lastBaseName = (lastMsg && lastMsg.images) ? getBaseName(lastMsg.images[0]) : null;

            // [조건]
            // 1. 직전 메시지가 있고, 보낸 사람이 같아야 함
            // 2. 현재 메시지가 이미지여야 함
            // 3. 직전 메시지도 이미지(배열)여야 함
            // 4. ★핵심★: 파일명의 베이스 이름이 같아야 함 (240끼리, 241끼리)
            // 5. 이미지 최대 개수 제한 (예: 5개 미만일 때만 합치기)
            if (lastMsg && 
                lastMsg.sender === msg.sender && 
                msg.img && 
                lastMsg.images && 
                currentBaseName === lastBaseName && 
                lastMsg.images.length < 5) {
                
                // 조건이 맞으면 같은 말풍선에 이미지 추가
                lastMsg.images.push(msg.img);
                // 텍스트가 있다면 이어 붙이기
                if(msg.text) lastMsg.text = lastMsg.text ? lastMsg.text + "\n" + msg.text : msg.text;
                
            } else {
                // 조건이 다르면 새로운 말풍선 생성
                const newMsg = { ...msg };
                if (newMsg.img) {
                    newMsg.images = [newMsg.img];
                    delete newMsg.img;
                }
                processedMessages.push(newMsg);
            }
        });

        // 메시지 렌더링
        processedMessages.forEach(msg => {
            const row = document.createElement('div');
            
            if (msg.sender === 'note') {
                row.className = 'message-row note';
                row.innerHTML = `<div class="system-message">${msg.text}</div>`;
            } else {
                const isReceiver = (msg.sender === 'receiver');
                row.className = `message-row ${isReceiver ? 'receiver' : 'manito'}`;
                
                let displayName = isReceiver ? group.receiver : (msg.sender === 'manito' ? (group.giver || '마니또') : msg.name);
                let profileContent = '';

                if (displayName && displayName !== '마니또') {
                    profileContent = `<img src="src/profile/${displayName}.jpg" alt="${displayName}" onerror="this.parentNode.innerText='🎁'">`;
                } else {
                    profileContent = '🎁';
                }

                const avatarDiv = document.createElement('div');
                avatarDiv.className = 'avatar';
                avatarDiv.innerHTML = profileContent;

                const msgColumn = document.createElement('div');
                msgColumn.className = 'msg-column';
                msgColumn.innerHTML = `<div class="user-name">${displayName}</div>`;

                const contentWrapper = document.createElement('div');
                contentWrapper.className = 'msg-content-wrapper';

                // 1. 이미지 처리
                if (msg.images && msg.images.length > 0) {
                    const imgBubble = document.createElement('div');
                    imgBubble.className = `bubble image-bubble image-group-${msg.images.length}`;
                    let imgsHtml = '';
                    msg.images.forEach(imgSrc => {
                        imgsHtml += `<div class="img-item"><img src="src/manito_asset/${imgSrc}" class="attach-img" alt="이미지"></div>`;
                    });
                    imgBubble.innerHTML = `<div class="image-grid">${imgsHtml}</div>`;
                    contentWrapper.appendChild(imgBubble);
                }

                // 2. 동영상 처리
                if (msg.video) {
                    const videoBubble = document.createElement('div');
                    videoBubble.className = 'bubble video-bubble';
                    videoBubble.innerHTML = `
                        <video src="src/manito_asset/${msg.video}" controls playsinline class="chat-video"></video>
                    `;
                    contentWrapper.appendChild(videoBubble);
                }

                if (msg.text) {
                    const textBubble = document.createElement('div');
                    textBubble.className = 'bubble text-bubble';
                    textBubble.innerText = msg.text;
                    contentWrapper.appendChild(textBubble);
                }
                msgColumn.appendChild(contentWrapper);

                if (isReceiver) {
                    row.appendChild(msgColumn);
                    row.appendChild(avatarDiv);
                } else {
                    row.appendChild(avatarDiv);
                    row.appendChild(msgColumn);
                }
            }
            section.appendChild(row);
        });

        app.appendChild(section);
    });
}

function setupImageModal() {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');
    const closeBtn = document.querySelector('.close');

    document.getElementById('app').addEventListener('click', (e) => {
        if (e.target.tagName === 'IMG' && (e.target.classList.contains('attach-img') || e.target.closest('.image-grid'))) {
            modal.style.display = "flex";
            modal.style.alignItems = "center";
            modal.style.justifyContent = "center";
            modalImg.src = e.target.src; 
            document.body.style.overflow = "hidden";
        }
    });

    if(closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === "Escape" && modal.style.display !== "none") closeModal(); });

    function closeModal() {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    }
}

// === 저장 관련 설정 ===
const captureOptions = {
    scale: 2,
    useCORS: true,
    backgroundColor: "#cad1dc",
    logging: false,
    allowTaint: true // 추가: CORS 문제 완화
};

/**
 * 이미지 로딩을 기다리는 헬퍼 함수
 */
function waitForImages(element) {
    const images = element.querySelectorAll('img');
    const promises = Array.from(images).map(img => {
        if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
        return new Promise(resolve => {
            img.onload = () => resolve();
            img.onerror = () => resolve(); // 에러나도 진행
        });
    });
    // 모든 이미지가 로드되거나, 최대 3초가 지나면 진행 (무한 로딩 방지)
    const timeout = new Promise(resolve => setTimeout(resolve, 3000));
    return Promise.race([Promise.all(promises), timeout]);
}

/**
 * 캡처를 위한 임시 래퍼(Wrapper) 생성
 */
function createCaptureWrapper(receiverName) {
    const originalContent = document.getElementById(`target-${receiverName}`);
    const originalTitleArea = document.querySelector('.header-title-area');

    if (!originalContent || !originalTitleArea) return null;

    // 1. 임시 컨테이너 생성
    const wrapper = document.createElement('div');
    
    // 스타일 수정: 화면 밖으로 보내지 않고, 사용자 눈에만 안 보이게 맨 뒤로 배치
    wrapper.style.position = 'absolute';
    wrapper.style.top = '0';
    wrapper.style.left = '0';
    wrapper.style.zIndex = '-9999'; // 맨 뒤로
    wrapper.style.width = getComputedStyle(document.getElementById('app')).width; 
    wrapper.style.maxWidth = '900px'; 
    wrapper.style.backgroundColor = '#cad1dc'; 
    wrapper.style.paddingBottom = '40px';
    wrapper.style.visibility = 'visible'; // visibility: hidden은 캡처 안될 수 있음

    // 2. 가짜 헤더 생성
    const dummyHeader = document.createElement('header');
    dummyHeader.style.position = 'static';
    dummyHeader.style.width = '100%';
    dummyHeader.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
    dummyHeader.style.borderBottom = '1px solid rgba(0,0,0,0.1)';
    dummyHeader.style.paddingTop = '20px';
    dummyHeader.style.textAlign = 'center';
    dummyHeader.style.display = 'block';

    // 3. 타이틀 복제
    const titleClone = originalTitleArea.cloneNode(true);
    titleClone.style.margin = '0';
    titleClone.style.paddingBottom = '20px';
    dummyHeader.appendChild(titleClone);
    
    // 4. 내용 복제
    const contentClone = originalContent.cloneNode(true);
    const btnArea = contentClone.querySelector('.save-btn-area');
    if (btnArea) btnArea.remove();

    // 동영상 -> 텍스트 변환
    contentClone.querySelectorAll('.video-bubble').forEach(bubble => {
        bubble.innerHTML = '(동영상)';
        bubble.classList.remove('video-bubble');
        bubble.classList.add('text-bubble');
        bubble.style.color = '#888'; 
        bubble.style.fontStyle = 'italic';
        bubble.style.textAlign = 'center';
    });

    wrapper.appendChild(dummyHeader);
    wrapper.appendChild(contentClone);
    document.body.appendChild(wrapper);

    return wrapper;
}

// 공통 캡처 실행 함수 (이미지 로딩 대기 포함)
function processCapture(receiverName, callback) {
    toggleLoading(true, "이미지 처리 중...");

    document.fonts.ready.then(() => {
        const wrapper = createCaptureWrapper(receiverName);
        if (!wrapper) {
            toggleLoading(false);
            return alert('영역을 찾을 수 없습니다.');
        }

        // ★핵심 수정: 이미지가 다 뜰 때까지 기다림
        waitForImages(wrapper).then(() => {
            html2canvas(wrapper, captureOptions)
                .then(canvas => {
                    callback(canvas);
                    if (document.body.contains(wrapper)) document.body.removeChild(wrapper);
                    toggleLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    alert('저장 실패: ' + err.message);
                    if (document.body.contains(wrapper)) document.body.removeChild(wrapper);
                    toggleLoading(false);
                });
        });
    });
}

// 개별 PNG 저장
function saveAsImage(receiverName) {
    processCapture(receiverName, (canvas) => {
        const link = document.createElement('a');
        link.download = `마니또결과_${receiverName}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    });
}


