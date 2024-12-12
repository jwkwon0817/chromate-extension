let voiceRecognitionState = {
    isListening: false
};

chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});

// 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.type) {
        case 'NAVIGATE_FORWARD':
            chrome.tabs.goForward();  // 앞으로 가기
            break;
        case 'NAVIGATE_BACKWARD':
            chrome.tabs.goBack();     // 뒤로 가기
            break;
        case 'NAVIGATE_TO_URL':
            if ('url' in request && request.url) {
                chrome.tabs.create({ url: request.url });  // 새 탭에서 URL 열기
            }
            break;
        case 'SAVE_VOICE_STATE':
            voiceRecognitionState.isListening = request.isListening;
            // 모든 탭에 상태 변경을 알림
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    if (tab.id) {
                        chrome.tabs.sendMessage(tab.id, {
                            type: 'VOICE_STATE_CHANGED',
                            isListening: voiceRecognitionState.isListening
                        }).catch(() => {
                            // 일부 탭에서 메시지 수신이 실패할 수 있음 (예: 확장 프로그램이 로드되지 않은 탭)
                        });
                    }
                });
            });
            sendResponse({ success: true });
            break;
        case 'GET_VOICE_STATE':
            sendResponse(voiceRecognitionState);
            break;
    }
    return true; // 비동기 응답을 위해 true 반환
});