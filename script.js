document.addEventListener('DOMContentLoaded', () => {
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            renderMenu(data);
            renderChat(data);
        })
        .catch(error => console.error('Error loading data:', error));
});

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

    // --- [헬퍼 함수 추가] 파일명에서 그룹 식별자 추출 ---
    // 예: "댓글237_제니_1.jpg" -> "댓글237_제니"
    // 예: "댓글237_제니_2.jpg" -> "댓글237_제니" (같으므로 묶임)
    // 예: "댓글238_제니_1.jpg" -> "댓글238_제니" (다르므로 안 묶임)
    const getBaseName = (filename) => {
        if (!filename) return '';
        // 정규식: _숫자.확장자 로 끝나는 부분을 제거
        return filename.replace(/_\d+\.(jpg|png|gif|jpeg|webp)$/i, '');
    };

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
        section.appendChild(header);

        // --- [핵심 수정] 메시지 그룹화 로직 ---
        const processedMessages = [];
        
        group.messages.forEach(msg => {
            const lastMsg = processedMessages[processedMessages.length - 1];

            // 현재 메시지의 이미지 베이스 이름 추출
            const currentBaseName = msg.img ? getBaseName(msg.img) : null;
            
            // 이전 메시지의 이미지 베이스 이름 추출 (이전 메시지가 이미지 그룹이라면 첫 번째 이미지 기준)
            const lastBaseName = (lastMsg && lastMsg.images) ? getBaseName(lastMsg.images[0]) : null;

            // 조건 확인:
            // 1. 이전 메시지 존재 & ID 동일 & 보낸사람 동일
            // 2. 현재 메시지에 이미지 있음
            // 3. 이전 메시지도 이미지 그룹임
            // 4. 이미지 개수 5개 미만
            // 5. [추가됨] 파일명의 베이스 이름이 같아야 함 (237번끼리, 238번끼리)
            if (lastMsg && 
                lastMsg.id === msg.id && 
                lastMsg.sender === msg.sender && 
                msg.img && 
                lastMsg.images && 
                lastMsg.images.length < 5 &&
                currentBaseName === lastBaseName // <--- 여기가 핵심 변경 사항
            ) {
                // 같은 그룹으로 판단 -> 합치기
                lastMsg.images.push(msg.img);
                
                // 텍스트가 있다면 이어붙이기
                if(msg.text) {
                    lastMsg.text = lastMsg.text ? lastMsg.text + "\n" + msg.text : msg.text;
                }

            } else {
                // 다른 그룹이거나 텍스트 메시지임 -> 새로 추가
                const newMsg = { ...msg };
                if (newMsg.img) {
                    newMsg.images = [newMsg.img]; // 이미지 배열로 변환
                    delete newMsg.img;
                }
                processedMessages.push(newMsg);
            }
        });

        // 렌더링 (이전과 동일)
        processedMessages.forEach(msg => {
            const row = document.createElement('div');
            
            if (msg.sender === 'note') {
                row.className = 'message-row note';
                row.innerHTML = `<div class="system-message">${msg.text}</div>`;
            } else {
                const isReceiver = (msg.sender === 'receiver');
                row.className = `message-row ${isReceiver ? 'receiver' : 'manito'}`;
                
                let displayName = '';
                let displayIcon = ''; 
                let profileContent = '';

                if (isReceiver) {
                    displayName = group.receiver;
                } else {
                    if (msg.sender === 'manito') {
                        displayName = group.giver ? group.giver : '마니또';
                        displayIcon = '🎁';
                    } else if (msg.sender === 'other') {
                        displayName = msg.name;
                        displayIcon = '👤';
                    }
                }

                if (displayName && displayName !== '마니또') {
                    profileContent = `<img src="src/profile/${displayName}.jpg" alt="${displayName}" onerror="this.parentNode.innerText='🎁'">`;
                } else {
                    profileContent = displayIcon || '🎁';
                }

                const avatarDiv = document.createElement('div');
                avatarDiv.className = 'avatar';
                avatarDiv.innerHTML = profileContent;

                const msgColumn = document.createElement('div');
                msgColumn.className = 'msg-column';

                const nameDiv = document.createElement('div');
                nameDiv.className = 'user-name';
                nameDiv.innerText = displayName;
                msgColumn.appendChild(nameDiv);

                const contentWrapper = document.createElement('div');
                contentWrapper.className = 'msg-content-wrapper';

                // 이미지 그리드 렌더링
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
