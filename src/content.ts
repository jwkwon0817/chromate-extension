// content.ts

// 음성 명령을 처리하는 함수
function handleCommand(command: string) {
    switch (command.trim().toLowerCase()) {
        case '앞으로 가줘':
            chrome.runtime.sendMessage({ type: 'NAVIGATE_FORWARD' });
            break;
        case '뒤로 가줘':
            chrome.runtime.sendMessage({ type: 'NAVIGATE_BACK' });
            break;
        default:
            if (command.includes('접속해줘')) {
                const site = command.replace('접속해줘', '').trim();
                const url = site.includes('http') ? site : `https://${site}`;
                chrome.runtime.sendMessage({ type: 'NAVIGATE_TO_URL', url });
            }
    }
}

// 스크롤 처리 함수
function handleScroll(direction: 'up' | 'down') {
    const scrollAmount = window.innerHeight * 0.8; // 화면 높이의 80%만큼 스크롤
    window.scrollBy({
        top: direction === 'up' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
    });
}

// 메시지 리스너
chrome.runtime.onMessage.addListener((request) => {
    if (request.type === 'VOICE_COMMAND') {
        handleCommand(request.command);
    } else if (request.type === 'SCROLL_PAGE') {
        handleScroll(request.direction);
    }
    return true;
});