// background.ts
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});

// 메시지 리스너
chrome.runtime.onMessage.addListener((request) => {
    switch (request.type) {
        case 'NAVIGATE_FORWARD':
            chrome.tabs.goForward();  // 앞으로 가기
            break;
        case 'NAVIGATE_BACK':
            chrome.tabs.goBack();     // 뒤로 가기
            break;
        case 'NAVIGATE_TO_URL':
            if ('url' in request && request.url) {
                chrome.tabs.create({ url: request.url });  // 새 탭에서 URL 열기
            }
            break;
    }
    return true;
});
