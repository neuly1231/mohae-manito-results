document.addEventListener('DOMContentLoaded', () => {
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            renderChat(data);
        })
        .catch(error => console.error('Error loading data:', error));
});

function renderChat(data) {
    const app = document.getElementById('app');

    data.forEach(group => {
        const section = document.createElement('div');
        section.className = 'chat-section';

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
                
                // 1. 데이터 준비 (이름, 사진)
                let displayName = '';
                let displayIcon = ''; // 🎁 아이콘
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

                // 사진 태그 생성
                if (displayName && displayName !== '마니또') {
                    profileContent = `<img src="src/profile/${displayName}.jpg" alt="${displayName}" onerror="this.parentNode.innerText='🎁'">`;
                } else {
                    profileContent = displayIcon || '🎁';
                }

                // 2. 아바타(사진) 요소 생성
                const avatarDiv = document.createElement('div');
                avatarDiv.className = 'avatar';
                avatarDiv.innerHTML = profileContent;

                // 3. 메시지 컬럼(이름 + 말풍선) 생성
                const msgColumn = document.createElement('div');
                msgColumn.className = 'msg-column';

                // (3-1) 이름 추가
                const nameDiv = document.createElement('div');
                nameDiv.className = 'user-name';
                nameDiv.innerText = displayName;
                msgColumn.appendChild(nameDiv);

                // (3-2) 말풍선 래퍼 추가
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

                // 4. 배치 (왼쪽/오른쪽)
                if (isReceiver) {
                    // 받는 사람: [메시지기둥] [아바타]
                    row.appendChild(msgColumn);
                    row.appendChild(avatarDiv);
                } else {
                    // 보낸 사람: [아바타] [메시지기둥]
                    row.appendChild(avatarDiv);
                    row.appendChild(msgColumn);
                }
            }
            section.appendChild(row);
        });

        app.appendChild(section);
    });
}