import { useEffect, useState } from 'react';
import logo from '../assets/logo.svg';
import mic from '../assets/mic.svg';

declare global {
	interface Window {
		webkitSpeechRecognition: any;
	}
}

const VoiceControl = () => {
	const [ isListening, setIsListening ] = useState(false);
	const [ transcript, setTranscript ] = useState('');
	const [ error, setError ] = useState<string | null>(null);
	const [ recognition, setRecognition ] = useState<any>(null);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ showLoadingAnimation, setShowLoadingAnimation ] = useState(false);
	const [ loadingType, setLoadingType ] = useState<string>('');
	const [ hasMicPermission, setHasMicPermission ] = useState<boolean | null>(null);

	const requestMicrophonePermission = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			stream.getTracks().forEach(track => track.stop());
			setHasMicPermission(true);
			return true;
		} catch (error) {
			console.error('마이크 권한 요청 실패:', error);
			setError('마이크 접근 권한을 얻을 수 없습니다.');
			setHasMicPermission(false);
			return false;
		}
	};

	const handleScroll = (direction: 'up' | 'down') => {
		console.log('스크롤 함수 실행:', direction);
		const scrollAmount = direction === 'up' ? -800 : 800;

		if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
			console.log('크롬 확장프로그램 환경 감지');
			chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
				const activeTab = tabs[0];
				if (activeTab?.id) {
					try {
						console.log('탭에 메시지 전송 시도');
						await chrome.tabs.sendMessage(activeTab.id, {
							type: 'SCROLL_PAGE',
							direction,
						});
						console.log('스크롤 메시지 전송 성공');
					} catch (error) {
						console.error('스크롤 메시지 전송 실패:', error);
						try {
							if (window.opener) {
								window.opener.scrollBy({
									top: scrollAmount,
									behavior: 'smooth',
								});
							} else if (window.parent && window.parent !== window) {
								window.parent.scrollBy({
									top: scrollAmount,
									behavior: 'smooth',
								});
							}
						} catch (scrollError) {
							console.error('대체 스크롤 실행 실패:', scrollError);
						}
					}
				}
			});
		} else {
			console.log('일반 웹사이트 환경 감지');
			try {
				if (window.opener) {
					window.opener.scrollBy({
						top: scrollAmount,
						behavior: 'smooth',
					});
				} else if (window.parent && window.parent !== window) {
					window.parent.scrollBy({
						top: scrollAmount,
						behavior: 'smooth',
					});
				} else {
					const script = `window.scrollBy({
                        top: ${ scrollAmount },
                        behavior: 'smooth'
                    });`;

					document.documentElement.setAttribute('onreset', script);
					document.documentElement.dispatchEvent(new CustomEvent('reset'));
					document.documentElement.removeAttribute('onreset');
				}
				console.log('스크롤 실행 성공');
			} catch (error) {
				console.error('스크롤 실행 실패:', error);
			}
		}
	};

	const handleCommand = async (text: string) => {
		const command = text.toLowerCase().trim();
		console.log('음성 명령어:', command);

		setShowLoadingAnimation(true);
		setIsLoading(true);

		try {
			const requestData = {
				message: command,
			};
			console.log('서버로 전송하는 데이터:', requestData);

			setLoadingType('처리 중');

			const response = await fetch('https://chromate.sunrin.kr/api/v1/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				body: JSON.stringify(requestData),
			});

			console.log('서버 응답 상태:', response.status);


			if (!response.ok) {
				setError(`API Error: ${ response.status }`);
				throw new Error(`API Error: ${ response.status }`);
			}

			const responseData = await response.json();
			console.log('서버 응답 데이터:', responseData);

			if (responseData.error) {
				setError(`API Error: ${ responseData.error }`);
				throw new Error(`API Error: ${ responseData.error }`);
			}

			const wasListening = isListening;

			if (responseData.action === 'scroll') {
				console.log('스크롤 액션 실행:', responseData.parameters);
				handleScroll(responseData.parameters.direction);
			} else if (responseData.action === 'open') {
				console.log('URL 열기 액션 실행:', responseData.parameters);
				window.open(responseData.parameters, '_blank');
			} else if (responseData.action === 'search') {
				console.log('검색 액션 실행:', responseData.parameters);
				window.open(`https://www.google.com/search?q=${ encodeURIComponent(responseData.parameters) }`, '_blank');
			}

			if (wasListening && recognition) {
				recognition.start();
			}

		} catch (error) {
			console.error('명령 처리 중 오류 발생:', error);
			setError(`오류: ${ error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' }`);
		} finally {
			setIsLoading(false);
			setShowLoadingAnimation(false);
			setLoadingType('');
		}
	};

	const initializeRecognition = () => {
		if ('webkitSpeechRecognition' in window) {
			const recog = new window.webkitSpeechRecognition();
			recog.continuous = true;
			recog.interimResults = true;
			recog.lang = 'ko-KR';

			recog.onstart = () => {
				setError(null);
				setIsListening(true);
			};

			recog.onresult = async (event: any) => {
				const current = event.resultIndex;
				const transcript = event.results[current][0].transcript;
				setTranscript(transcript);

				if (event.results[current].isFinal) {
					await handleCommand(transcript);
				}
			};

			recog.onerror = (event: any) => {
				setError(`음성 인식 오류: ${ event.error }`);
				setIsListening(false);
			};

			recog.onend = () => {
				if (isListening) {
					recog.start();
				}
			};

			setRecognition(recog);
		} else {
			setError('이 브라우저는 음성 인식을 지원하지 않습니다.');
		}
	};

	const handleToggleListening = async () => {
		if (isListening) {
			if (recognition) {
				recognition.stop();
				setIsListening(false);
			}
		} else {
			if (!hasMicPermission) {
				const permitted = await requestMicrophonePermission();
				if (!permitted) return;
			}

			if (recognition) {
				try {
					await recognition.start();
				} catch (error) {
					console.error('음성 인식 시작 실패:', error);
					setError('음성 인식을 시작할 수 없습니다. 페이지를 새로고침해주세요.');
				}
			}
		}
	};

	useEffect(() => {
		// 초기 마이크 권한 상태 확인
		navigator.mediaDevices.getUserMedia({ audio: true })
			.then(stream => {
				stream.getTracks().forEach(track => track.stop());
				setHasMicPermission(true);
			})
			.catch(() => {
				setHasMicPermission(false);
			});

		initializeRecognition();

		return () => {
			if (recognition) {
				recognition.stop();
				setRecognition(null);
			}
		};
	}, []);

	const renderButton = () => {
		if (isLoading) {
			return (
				<div className="flex flex-col items-center justify-center mt-16 space-y-8">
					<p className="text-[28px] font-bold text-[#838383]">
						<span>{ loadingType }</span>
						<span className="animate-bounce-dots">.</span>
						<span className="animate-bounce-dots animation-delay-100">.</span>
						<span className="animate-bounce-dots animation-delay-200">.</span>
					</p>
				</div>
			);
		}

		return (
			<button
				onClick={ handleToggleListening }
				className={ `flex justify-center items-center text-xl font-bold transition-all duration-300 w-[119px] h-[119px] mt-16
                    ${ isListening
					? 'rounded-[1000px] bg-[rgba(58,252,149,0.80)] px-[28px] text-black relative before:absolute before:w-[160px] before:h-[160px] before:rounded-full before:border-4 before:border-[#3AFC95]/40 before:animate-ping before:animation-delay-100 after:absolute after:w-[200px] after:h-[200px] after:rounded-full after:border-4 after:border-[#3AFC95]/30 after:animate-ping after:animation-delay-200 [&_span]:absolute [&_span]:w-[240px] [&_span]:h-[240px] [&_span]:rounded-full [&_span]:border-4 [&_span]:border-[#3AFC95]/20 [&_span]:animate-ping [&_span]:animation-delay-300 animate-pulse'
					: 'rounded-[1000px] bg-gradient-to-b from-[rgba(95,106,100,0.80)] via-[rgba(140,157,148,0.80)] to-[rgba(115,115,115,0.80)] px-[21px] text-white hover:opacity-90' }` }
			>
				{ isListening ? <><span></span>STOP</> : 'START' }
			</button>
		);
	};

	return (
		<div className={ `flex flex-col items-center w-[500px] h-[680px] bg-black rounded-[24px] text-white p-4 relative overflow-hidden
            ${ showLoadingAnimation ? 'animate-content-fade' : '' }` }>
			<div className="w-full max-w-md">
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center">
						<img src={ logo } alt="Logo" className="w-6 h-6" />
						<span className="text-[#3AFC95] text-2xl font-bold ml-2">Chromate</span>
					</div>
				</div>

				<div className="flex flex-col items-center justify-center space-y-8 mt-24">
					{ renderButton() }

					{ error && (
						<div className="text-red-500 mt-4">
							{ error }
						</div>
					) }

					{
						isListening && (
							<div className="fixed w-[462px] px-[35px] py-8 rounded-[24px] bg-white/10 bottom-[70px]">
								<img src={ mic } alt="mic" className="w-6 h-6 absolute left-4 top-1/2 transform -translate-y-1/2" />
								<p
									className={ `absolute top-1/2 left-1/2 transform -translate-y-1/2 ${
										transcript.length > 30
											? 'translate-x-0 left-auto right-[35px]'
											: '-translate-x-1/2'
									} text-white font-bold text-[20px] font-wanted-sans w-[350px] overflow-hidden whitespace-nowrap ${
										transcript.length > 30 ? 'text-right' : 'text-center'
									}` }
								>
									{ transcript.length > 30 ? transcript.slice(-30) : transcript || '음성 대기 중...' }
								</p>
							</div>
						)
					}
				</div>
			</div>
		</div>
	);
};

export default VoiceControl;
