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
	private isRecognitionRunning: boolean = false;
	private isActiveListening: boolean = false;
	private readonly KEYWORD = '시리야';
	private backgroundRecognition: any;
	private lastHoveredElement: Element | null = null;

	constructor() {
		this.initializeRecognition();
		this.initializeBackgroundRecognition();
		this.requestMicPermission();
		this.initializeMouseTracker();
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

	private initializeMouseTracker() {
		document.addEventListener('mousemove', (event) => {
			this.lastHoveredElement = document.elementFromPoint(event.clientX, event.clientY);
		});
	}

	private initializeBackgroundRecognition() {
		if ('webkitSpeechRecognition' in window) {
			this.backgroundRecognition = new window.webkitSpeechRecognition();
			this.backgroundRecognition.continuous = true;
			this.backgroundRecognition.interimResults = true;
			this.backgroundRecognition.lang = 'ko-KR';

			this.backgroundRecognition.onstart = () => {
				console.log('백그라운드 음성 감지 시작');
			};

			this.backgroundRecognition.onend = () => {
				console.log('백그라운드 음성 감지 종료');
				if (!this.isActiveListening) {
					setTimeout(() => {
						this.backgroundRecognition.start();
					}, 100);
				}
			};

			this.backgroundRecognition.onresult = (event: any) => {
				const current = event.resultIndex;
				const transcript = event.results[current][0].transcript.trim().toLowerCase();

				if (transcript.includes(this.KEYWORD.toLowerCase())) {
					console.log('키워드 감지:', this.KEYWORD);
					this.backgroundRecognition.stop();
					this.startActiveListening();
				}
			};

			this.backgroundRecognition.start();
		}
	}

	private startActiveListening() {
		this.isActiveListening = true;
		textVisualElement.style.visibility = 'visible';
		textElement.innerText = '명령어를 말씀해주세요';
		this.startRecognition();
	}

	private initializeRecognition() {
		if ('webkitSpeechRecognition' in window) {
			this.recognition = new window.webkitSpeechRecognition();
			this.recognition.continuous = false;
			this.recognition.interimResults = true;
			this.recognition.lang = 'ko-KR';

			this.recognition.onstart = () => {
				console.log('명령어 인식 시작');
				this.isRecognitionRunning = true;
			};

			this.recognition.onend = () => {
				console.log('명령어 인식 종료');
				this.isRecognitionRunning = false;
				this.isActiveListening = false;

				setTimeout(() => {
					textVisualElement.style.visibility = 'hidden';
					textElement.innerText = '';
					this.backgroundRecognition.start();
				}, 2000);
			};

			this.recognition.onerror = (event: any) => {
				console.error('명령어 인식 오류:', event.error);
				this.isRecognitionRunning = false;
				this.isActiveListening = false;
				this.backgroundRecognition.start();
			};

			this.recognition.onresult = async (event: any) => {
				const current = event.resultIndex;
				const transcript = event.results[current][0].transcript;

				textElement.innerText = transcript.length > 16 ? transcript.slice(-16) : transcript;

				if (event.results[current].isFinal) {
					console.log('최종 인식된 명령어:', transcript);
					await this.processCommand(transcript, this.lastHoveredElement);
				}
			};
		}
	}

	private startRecognition() {
		if (!this.isRecognitionRunning) {
			try {
				this.recognition.start();
			} catch (error) {
				console.error('명령어 인식 시작 실패:', error);
				this.isActiveListening = false;
				this.backgroundRecognition.start();
			}
		}
	}

	private async processCommand(command: string, targetElement: Element | null) {
		try {
			console.log('서버로 전송하는 명령어:', command);

			let elementInfo = null;
			if (targetElement) {
				const element = targetElement as HTMLElement;
				elementInfo = {
					tagName: element.tagName.toLowerCase(),
					className: element.className,
					id: element.id,
					text: element.textContent?.trim(),
					href: (element as HTMLAnchorElement).href,
					type: element.getAttribute('type'),
					role: element.getAttribute('role')
				};
			}

			const response = await fetch('https://chromate.sunrin.kr/api/v1/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body: JSON.stringify({
					message: command,
					elementInfo: elementInfo
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
			case 'zoom': {
				const direction = typeof result.parameters === 'string' ? result.parameters : result.parameters?.direction;
				this.handleZoom(direction || 'in');
				break;
			}
			case 'reset': {
				this.handleZoom('reset');
				break;
			}
			case 'click': {
				if (this.lastHoveredElement) {
					console.log('클릭할 요소:', this.lastHoveredElement);
					(this.lastHoveredElement as HTMLElement).click();
				} else {
					console.log('클릭할 요소를 찾을 수 없습니다.');
				}
				break;
			}
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
				window.location.href = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
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
				console.log('새로고침 실행');
				try {
					window.location.reload();
				} catch (error) {
					console.error('새로고침 중 오류:', error);
				}
				break;
			case 'close':
				try {
					window.close();
				} catch (error) {
					console.error('창닫기 실행 중 오류:', error);
				}
				break;
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

	private handleZoom(direction: string) {
		console.log('줌 방향:', direction);
		if (direction.toLowerCase() === 'reset') {
			document.body.style.removeProperty('zoom');
			console.log('줌 레벨 초기화: 기본값');
			return;
		}

		const currentZoom = document.body.style.zoom ? parseFloat(document.body.style.zoom) : 1;
		const zoomStep = 0.3;

		let newZoom: number;
		if (direction.toLowerCase() === 'in') {
			newZoom = currentZoom + zoomStep;
		} else {
			newZoom = Math.max(0.3, currentZoom - zoomStep);
		}

		document.body.style.zoom = newZoom.toString();
		console.log('현재 줌 레벨:', newZoom);
	}
}

new ContentVoiceRecognition();