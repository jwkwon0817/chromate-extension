import {before} from "node:test";

interface VoiceCommand {
	message: string;
	action: string;
	parameters?: any;
}

const textVisualElement = document.createElement('div');
textVisualElement.style.position = 'fixed';
textVisualElement.style.top = '30px';
textVisualElement.style.right = '20px';
textVisualElement.style.zIndex = '9999';
textVisualElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
textVisualElement.style.visibility = 'hidden';
textVisualElement.style.color = 'white';
textVisualElement.style.paddingLeft = '32px';
textVisualElement.style.paddingRight = '32px';
textVisualElement.style.height = '56px';
textVisualElement.style.width = '400px';
textVisualElement.style.borderRadius = '16px';
textVisualElement.style.display = 'flex';
textVisualElement.style.alignItems = 'center';
textVisualElement.style.justifyContent = 'flex-start';
textVisualElement.style.gap = '80px';

const micIcon = document.createElement('img');
micIcon.src = chrome.runtime.getURL('mic.svg');

const textElement = document.createElement('p');
textElement.style.color = 'white';
textElement.style.fontSize = '18px';
textElement.style.fontWeight = 'bold';
textElement.style.overflow = 'hidden';
textElement.style.fontFamily = 'Wanted Sans';

textVisualElement.appendChild(micIcon);
textVisualElement.appendChild(textElement);
document.body.appendChild(textVisualElement);

class ContentVoiceRecognition {
	private recognition: any;
	private isRecognitionRunning: boolean = false; // 음성 인식 실행 여부 플래그

	constructor() {
		this.initializeRecognition();
		this.requestMicPermission();
	}

	private async requestMicPermission() {
		try {
			const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
			if (permissionStatus.state === 'denied') {
				console.warn('마이크 권한이 거부되었습니다. 권한을 허용해주세요.');
				return;
			}
			if (permissionStatus.state === 'granted' || permissionStatus.state === 'prompt') {
				await navigator.mediaDevices.getUserMedia({ audio: true });
				console.log('마이크 권한 획득 성공');
			}
		} catch (error) {
			console.error('마이크 권한 요청 중 오류 발생:', error);
		}
	}

	private initializeRecognition() {
		if ('webkitSpeechRecognition' in window) {
			this.recognition = new window.webkitSpeechRecognition();
			this.recognition.continuous = false;
			this.recognition.interimResults = true;
			this.recognition.lang = 'ko-KR';

			this.recognition.onstart = () => {
				console.log('음성 인식 시작');
				this.isRecognitionRunning = true; // 실행 상태 업데이트
			};

			this.recognition.onend = () => {
				console.log('음성 인식 종료');
				this.isRecognitionRunning = false; // 실행 상태 업데이트
				this.restartRecognition();
			};

			this.recognition.onerror = (event: any) => {
				console.error('음성 인식 오류:', event.error);
				this.isRecognitionRunning = false; // 실행 상태 업데이트
				this.restartRecognition();
			};

			this.recognition.onresult = async (event: any) => {
				const current = event.resultIndex;
				const transcript = event.results[current][0].transcript;

				textVisualElement.style.visibility = 'visible';

				console.log('음성 인식된 내용:', transcript);

				textElement.innerText = transcript.length > 16 ? transcript.slice(-16) : transcript;

				if (event.results[current].isFinal) {
					console.log('최종 인식된 내용:', transcript);

					setTimeout(() => {
						textElement.innerText = '';
						textVisualElement.style.visibility = 'hidden';
					}, 2000);

					await this.processCommand(transcript);
				}
			};

			this.startRecognition();
		}
	}

	private startRecognition() {
		if (!this.isRecognitionRunning) {
			try {
				this.recognition.start();
			} catch (error) {
				console.error('음성 인식 시작 실패:', error);
			}
		}
	}

	private restartRecognition() {
		setTimeout(() => {
			this.startRecognition();
		}, 1000); // 1초 후 재시작 시도
	}

	private async processCommand(command: string) {
		try {
			console.log('서버로 전송하는 명령어:', command);

			const response = await fetch('https://chromate.sunrin.kr/api/v1/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body: JSON.stringify({
					message: command,
				}),
			});

			if (!response.ok) {
				throw new Error(`서버 오류: ${response.status}`);
			}

			const result = await response.json();
			console.log('서버 응답 전체:', result);
			this.executeAction(result);
		} catch (error) {
			console.error('명령 처리 중 오류:', error);
		}
	}

	private executeAction(result: VoiceCommand) {
		console.log('실행할 액션:', result.action);
		console.log('액션 파라미터:', result.parameters);

		switch (result.action) {
			case 'scroll': {
				const direction = typeof result.parameters === 'string' ? result.parameters : result.parameters?.direction;
				this.handleScroll(direction || 'down');
				break;
			}
			case 'open': {
				window.location.href = typeof result.parameters === 'string' ? result.parameters : result.parameters?.url;
				break;
			}
			case 'search': {
				const searchQuery = typeof result.parameters === 'string'
					? result.parameters
					: (typeof result.parameters === 'object' && result.parameters !== null)
						? result.parameters.query || Object.values(result.parameters).join(' ')
						: '';
				console.log('검색어:', searchQuery);
				window.location.href = `https://www.google.com/search?q=${ encodeURIComponent(searchQuery) }`;
				break;
			}
			case 'backward':
				console.log('뒤로 가기 실행');
				try {
					window.history.back();
				} catch (error) {
					console.error('뒤로 가기 실행 중 오류:', error);
				}
				break;
			case 'forward':
				console.log('앞으로 가기 실행');
				try {
					window.history.forward();
				} catch (error) {
					console.error('앞으로 가기 실행 중 오류:', error);
				}
				break;
			case 'refresh':
				window.location.reload();
				break;
			case 'close': {
				window.close();
				break;
			}
			default:
				console.log('알 수 없는 액션:', result.action);
		}
	}

	private handleScroll(direction: string) {
		console.log('스크롤 방향:', direction);
		const scrollAmount = window.innerHeight * 0.8;

		const normalizedDirection = direction.toLowerCase().trim();

		if (normalizedDirection === 'up') {
			window.scrollBy({
				top: -scrollAmount,
				behavior: 'smooth',
			});
		} else {
			window.scrollBy({
				top: scrollAmount,
				behavior: 'smooth',
			});
		}
	}
}

new ContentVoiceRecognition();
