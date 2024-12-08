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

// 음성 명령을 받아서 처리
chrome.runtime.onMessage.addListener((request) => {
    if (request.type === 'VOICE_COMMAND') {
        handleCommand(request.command);  // 음성 명령에 맞는 작업 실행
    }
    return true;
});
