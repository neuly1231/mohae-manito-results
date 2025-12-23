document.addEventListener('DOMContentLoaded', () => {
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            renderMenu(data); // 메뉴 생성 함수 호출
            renderChat(data); // 채팅방 생성 함수 호출
        })
        .catch(error => console.error('Error loading data:', error));
});

// [추가됨] 상단 메뉴 생성 함수
function renderMenu(data) {
    const menuContainer = document.getElementById('menu-container');
    
    // 1. 데이터에서 받는 사람 이름만 추출해서 가나다순 정렬
    // 원본 데이터 순서는 유지하고, 메뉴만 정렬해서 보여줍니다.
    const sortedNames = data.map(item => item.receiver).sort((a, b) => a.localeCompare(b, 'ko'));

    sortedNames.forEach(name => {
        const link = document.createElement('a');
        link.className = 'menu-item';
        link.innerText = name;
        link.href = `#target-${name}`; // 앵커 링크 생성
        menuContainer.appendChild(link);
    });
}

function renderChat(data) {
    const app = document.getElementById('app');

    data.forEach(group => {
        const section = document.createElement('div');
        section.className = 'chat-section';
        
        // [추가됨] 앵커 이동을 위한 ID 부여
        section.id = `target-${group.receiver}`;

        // 헤더
        const header = document.createElement('div');
        header.className = 'section-header';
        
        let cardHtml = '';
        if (group.card_img) {
            cardHtml = `<img src="src/manito_card/${group.card_img}" alt="마니또 카드" class="manito-card-img">`;
        } else {
            cardHtml = `<div style="color:#ccc; font-size:0.9rem;">(공개된 카드가 없습니다)</div>`;
        }

        header.innerHTML = `
            <span class="receiver-name">To. ${group.receiver}</span>
            ${cardHtml}
        `;
        section.appendChild(header);

        // 메시지 렌더링
        group.messages.forEach(msg => {
            const row = document.createElement('div');
            
            if (msg.sender === 'note') {
                row.className = 'message-row note';
                row.innerHTML = `<div class="system-message">${msg.text}</div>`;
            } else {
                const isReceiver = (msg.sender === 'receiver');
                row.className = `message-row ${isReceiver ? 'receiver' : 'manito'}`;
                
                // 1. 데이터 준비
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

                // 2. 아바타
                const avatarDiv = document.createElement('div');
                avatarDiv.className = 'avatar';
                avatarDiv.innerHTML = profileContent;

                // 3. 메시지 컬럼
                const msgColumn = document.createElement('div');
                msgColumn.className = 'msg-column';

                const nameDiv = document.createElement('div');
                nameDiv.className = 'user-name';
                nameDiv.innerText = displayName;
                msgColumn.appendChild(nameDiv);

                const contentWrapper = document.createElement('div');
                contentWrapper.className = 'msg-content-wrapper';

                if (msg.img) {
                    const imgBubble = document.createElement('div');
                    imgBubble.className = 'bubble image-bubble';
                    imgBubble.innerHTML = `<img src="src/manito_asset/${msg.img}" class="attach-img" alt="첨부 이미지">`;
                    contentWrapper.appendChild(imgBubble);
                }

                if (msg.text) {
                    const textBubble = document.createElement('div');
                    textBubble.className = 'bubble text-bubble';
                    textBubble.innerText = msg.text;
                    contentWrapper.appendChild(textBubble);
                }
                msgColumn.appendChild(contentWrapper);

                // 4. 배치
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
