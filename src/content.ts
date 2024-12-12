// content.ts

interface VoiceCommand {
    message: string;
    action: string;
    parameters?: any;
}

class ContentVoiceRecognition {
    private recognition: any;
    private stream: MediaStream | null = null;

    constructor() {
        this.initializeRecognition();
        this.requestMicPermission();
    }

    private async requestMicPermission() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // 스트림을 유지하여 마이크 권한 계속 사용
        } catch (error) {
            console.error('마이크 권한 획득 실패:', error);
        }
    }

    private initializeRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new window.webkitSpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'ko-KR';

            this.recognition.onstart = () => {
                console.log('음성 인식 시작');
            };

            this.recognition.onresult = async (event: any) => {
                const current = event.resultIndex;
                const transcript = event.results[current][0].transcript;

                console.log(transcript);
                console.log(event.results[current])

                if (event.results[current].isFinal) {
                    console.log('Final', transcript)
                    await this.processCommand(transcript);
                }
            };

            this.recognition.onerror = (event: any) => {
                console.error('음성 인식 오류:', event.error);
                // 오류 발생 시 재시작
                this.restartRecognition();
            };

            this.recognition.onend = () => {
                // 음성 인식이 끝나면 자동으로 재시작
                this.restartRecognition();
            };

            // 초기 시작
            this.recognition.start();
        }
    }

    private async processCommand(command: string) {
        try {
            const response = await fetch('https://chromate.sunrin.kr/api/v1/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    message: command
                })
            });

            if (!response.ok) {
                throw new Error(`서버 오류: ${response.status}`);
            }

            const result = await response.json();
            this.executeAction(result);

        } catch (error) {
            console.error('명령 처리 중 오류:', error);
        }
    }

    private executeAction(result: VoiceCommand) {
        switch (result.action) {
            case 'scroll':
                this.handleScroll(result.parameters.direction);
                break;
            case 'open':
                window.open(result.parameters, '_blank');
                break;
            case 'search':
                window.open(`https://www.google.com/search?q=${encodeURIComponent(result.parameters)}`, '_blank');
                break;
            // 필요한 다른 액션들 추가
        }
    }

    private handleScroll(direction: 'up' | 'down') {
        const scrollAmount = window.innerHeight * 0.8;
        window.scrollBy({
            top: direction === 'up' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    }

    private restartRecognition() {
        try {
            this.recognition.start();
        } catch (error) {
            console.error('음성 인식 재시작 실패:', error);
            // 잠시 후 다시 시도
            setTimeout(() => this.restartRecognition(), 1000);
        }
    }
}

// content script가 로드되면 자동으로 실행
new ContentVoiceRecognition();