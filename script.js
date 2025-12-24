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

        // 개별 저장 버튼
        const btnArea = document.createElement('div');
        btnArea.className = 'save-btn-area';
        
        const pngBtn = document.createElement('button');
        pngBtn.className = 'btn-save';
        pngBtn.innerHTML = 'PNG';
        pngBtn.onclick = () => saveAsImage(group.receiver);

        const pdfBtn = document.createElement('button');
        pdfBtn.className = 'btn-save';
        pdfBtn.innerHTML = 'PDF';
        pdfBtn.onclick = () => saveAsPDF(group.receiver);

        btnArea.appendChild(pdfBtn);
        btnArea.appendChild(pngBtn);
        header.appendChild(btnArea);

        section.appendChild(header);

        // 메시지 로직
        const processedMessages = [];
        group.messages.forEach(msg => {
            const lastMsg = processedMessages[processedMessages.length - 1];
            const currentBaseName = msg.img ? getBaseName(msg.img) : null;
            const lastBaseName = (lastMsg && lastMsg.images) ? getBaseName(lastMsg.images[0]) : null;

            if (lastMsg && lastMsg.id === msg.id && lastMsg.sender === msg.sender && msg.img && lastMsg.images && lastMsg.images.length < 5 && currentBaseName === lastBaseName) {
                lastMsg.images.push(msg.img);
                if(msg.text) lastMsg.text = lastMsg.text ? lastMsg.text + "\n" + msg.text : msg.text;
            } else {
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
    logging: false
};

/**
 * 캡처를 위한 임시 래퍼(Wrapper)를 생성하는 함수
 * CSS 상속 문제(header h1 등)를 해결하기 위해 가짜 header 태그를 생성합니다.
 */
function createCaptureWrapper(receiverName) {
    const originalContent = document.getElementById(`target-${receiverName}`);
    // [수정] header 태그가 아닌 내용물(title-area)만 선택
    const originalTitleArea = document.querySelector('.header-title-area');

    if (!originalContent || !originalTitleArea) return null;

    // 1. 임시 컨테이너 생성
    const wrapper = document.createElement('div');
    
    // 스타일 복사
    wrapper.style.position = 'fixed';
    wrapper.style.top = '0';
    wrapper.style.left = '-10000px'; 
    wrapper.style.zIndex = '-9999';
    wrapper.style.width = getComputedStyle(document.getElementById('app')).width; 
    wrapper.style.maxWidth = '900px'; 
    wrapper.style.backgroundColor = '#cad1dc'; 
    wrapper.style.paddingBottom = '40px';

    // 2. [핵심 수정] 가짜 <header> 태그 생성 (CSS 'header h1' 적용을 위해)
    const dummyHeader = document.createElement('header');
    
    // 헤더 스타일 강제 적용 (배경 투명도 문제 방지 및 위치 초기화)
    dummyHeader.style.position = 'static'; // sticky 제거
    dummyHeader.style.width = '100%';
    dummyHeader.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
    dummyHeader.style.borderBottom = '1px solid rgba(0,0,0,0.1)';
    dummyHeader.style.paddingTop = '20px';
    dummyHeader.style.textAlign = 'center';
    dummyHeader.style.display = 'block';

    // 3. 타이틀 영역 복제 및 가짜 헤더에 삽입
    const titleClone = originalTitleArea.cloneNode(true);
    // 타이틀 영역의 마진/패딩 보정 (필요시)
    titleClone.style.margin = '0';
    titleClone.style.paddingBottom = '20px'; // 하단 여백 확보

    dummyHeader.appendChild(titleClone);
    
    // 4. 채팅 내용 복제
    const contentClone = originalContent.cloneNode(true);

    // 저장 버튼 제거
    const btnArea = contentClone.querySelector('.save-btn-area');
    if (btnArea) btnArea.remove();

    // 5. 컨테이너에 조립
    wrapper.appendChild(dummyHeader); // 가짜 헤더 추가
    wrapper.appendChild(contentClone);
    
    document.body.appendChild(wrapper);

    return wrapper;
}

// 공통 캡처 실행 함수 (폰트 로딩 대기 포함)
function processCapture(receiverName, callback) {
    toggleLoading(true, "생성 준비 중...");

    // 웹폰트 로딩이 완료될 때까지 대기
    document.fonts.ready.then(() => {
        const wrapper = createCaptureWrapper(receiverName);
        if (!wrapper) {
            toggleLoading(false);
            return alert('영역을 찾을 수 없습니다.');
        }

        // 약간의 렌더링 시간을 줌 (0.1초)
        setTimeout(() => {
            html2canvas(wrapper, captureOptions)
                .then(canvas => {
                    callback(canvas);
                    document.body.removeChild(wrapper);
                    toggleLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    alert('저장 실패');
                    if (document.body.contains(wrapper)) document.body.removeChild(wrapper);
                    toggleLoading(false);
                });
        }, 100);
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

// 개별 PDF 저장 (모바일 메모리 강제 최적화)
function saveAsPDF(receiverName) {
    // 1. 라이브러리 로드 확인
    if (!window.jspdf) {
        alert('PDF 라이브러리가 로드되지 않았습니다. 페이지를 새로고침 해주세요.');
        return;
    }

    toggleLoading(true, "PDF 변환 중...");

    // 2. 임시 래퍼 생성
    const wrapper = createCaptureWrapper(receiverName);
    if (!wrapper) {
        toggleLoading(false);
        return alert('영역을 찾을 수 없습니다.');
    }

    // 3. 모바일 여부 및 긴 내용 체크
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const contentHeight = wrapper.offsetHeight;
    
    // [핵심] 모바일이거나 내용이 너무 길면(5000px 이상) 화질을 1배율로 낮춤
    // 기존 1.5배도 길면 터질 수 있어서 1.0으로 변경
    let finalScale = 2; 
    if (isMobile) {
        finalScale = contentHeight > 5000 ? 1 : 1.5; 
    }

    const currentOptions = {
        ...captureOptions,
        scale: finalScale,
        useCORS: true,
        allowTaint: true,
    };

    html2canvas(wrapper, currentOptions).then(canvas => {
        try {
            // [핵심] JPEG 압축률을 0.95 -> 0.8로 낮춰서 용량 확보
            const imgData = canvas.toDataURL('image/jpeg', 0.8);
            
            const imgWidth = 210; // A4 너비 (mm)
            const pageHeight = 297; // A4 높이 (mm)
            
            // 이미지 비율에 맞춘 높이 계산
            const imgHeight = canvas.height * imgWidth / canvas.width;
            
            let heightLeft = imgHeight;
            let position = 0;

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');

            // 첫 페이지
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // 내용이 남았다면 페이지 추가 (루프)
            while (heightLeft > 0) {
                position -= pageHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`마니또결과_${receiverName}.pdf`);
            
        } catch (e) {
            console.error(e);
            alert('PDF 생성 중 오류가 발생했습니다. (메모리 부족 가능성)\nPC에서 시도하거나 PNG로 저장해주세요.');
        }

        // 뒷정리
        if (document.body.contains(wrapper)) document.body.removeChild(wrapper);
        toggleLoading(false);

    }).catch(err => {
        console.error("html2canvas error:", err);
        alert('이미지 캡처 단계에서 실패했습니다.');
        if (document.body.contains(wrapper)) document.body.removeChild(wrapper);
        toggleLoading(false);
    });
}
