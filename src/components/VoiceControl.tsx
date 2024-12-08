import { useState, useEffect } from 'react';
import logo from '../assets/logo.svg';
import mic from '../assets/mic.svg';

declare global {
    interface Window {
        webkitSpeechRecognition: any;
    }
}

const VoiceControl = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [recognition, setRecognition] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);
    const [loadingType, setLoadingType] = useState<string>('');

    const handleCommand = async (text: string) => {
        const command = text.toLowerCase().trim();

        setShowLoadingAnimation(true);
        setIsLoading(true);

        try {
            // 스크롤 명령 처리
            if (command.includes('스크롤') || command.includes('내려')) {
                setLoadingType('스크롤 중');

                if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
                    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                    const activeTab = tabs[0];

                    if (activeTab?.id) {
                        await chrome.tabs.sendMessage(activeTab.id, {
                            type: 'SCROLL_PAGE',
                            direction: command.includes('위') ? 'up' : 'down'
                        });
                    } else {
                        throw new Error('활성 탭을 찾을 수 없습니다.');
                    }
                } else {
                    throw new Error('Chrome 확장 프로그램 API를 사용할 수 없습니다.');
                }
                return;
            }

            if (command.includes('검색') || command.startsWith('찾아줘')) {
                setLoadingType('검색중');
            } else if (command.includes('접속') || command.includes('열어줘')) {
                setLoadingType('접속중');
            }

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

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            if (responseData.action === 'open' && responseData.parameters) {
                window.open(responseData.parameters, '_blank');
            } else if (responseData.action === 'search' && responseData.parameters) {
                window.open(`https://www.google.com/search?q=${encodeURIComponent(responseData.parameters)}`, '_blank');
            }

        } catch (error) {
            console.error('명령 처리 중 오류 발생:', error);
            setError(`오류: ${error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}`);
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

            recog.onresult = (event: any) => {
                const current = event.resultIndex;
                const transcript = event.results[current][0].transcript;
                setTranscript(transcript);

                if (event.results[current].isFinal) {
                    handleCommand(transcript);
                }
            };

            recog.onerror = (event: any) => {
                setError(`음성 인식 오류: ${event.error}`);
                setIsListening(false);
            };

            recog.onend = () => {
                setIsListening(false);
            };

            setRecognition(recog);
        } else {
            setError('이 브라우저는 음성 인식을 지원하지 않습니다.');
        }
    };

    useEffect(() => {
        initializeRecognition();

        return () => {
            if (recognition) {
                recognition.stop();
                setRecognition(null);
            }
        };
    }, []);

    const handleToggleListening = () => {
        if (isListening) {
            if (recognition) {
                recognition.stop();
                setIsListening(false);
            }
        } else {
            if (recognition) {
                recognition.start();
            }
        }
    };

    const renderButton = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center mt-16 space-y-8">
                    <p className="text-[42px] font-bold text-[#838383]">
                        {loadingType}
                        <span className="animate-bounce-dots">.</span>
                        <span className="animate-bounce-dots animation-delay-100">.</span>
                        <span className="animate-bounce-dots animation-delay-200">.</span>
                    </p>
                </div>
            );
        }

        return (
            <button
                onClick={handleToggleListening}
                className={`flex justify-center items-center text-xl font-bold transition-all duration-300 w-[119px] h-[119px] mt-16
                    ${isListening
                    ? 'rounded-[1000px] bg-[rgba(58,252,149,0.80)] px-[28px] text-black relative before:absolute before:w-[160px] before:h-[160px] before:rounded-full before:border-4 before:border-[#3AFC95]/40 before:animate-ping before:animation-delay-100 after:absolute after:w-[200px] after:h-[200px] after:rounded-full after:border-4 after:border-[#3AFC95]/30 after:animate-ping after:animation-delay-200 [&_span]:absolute [&_span]:w-[240px] [&_span]:h-[240px] [&_span]:rounded-full [&_span]:border-4 [&_span]:border-[#3AFC95]/20 [&_span]:animate-ping [&_span]:animation-delay-300 animate-pulse'
                    : 'rounded-[1000px] bg-gradient-to-b from-[rgba(95,106,100,0.80)] via-[rgba(140,157,148,0.80)] to-[rgba(115,115,115,0.80)] px-[21px] text-white hover:opacity-90'}`}
            >
                {isListening ? <><span></span>STOP</> : 'START'}
            </button>
        );
    };

    return (
        <div className={`flex flex-col items-center w-[500px] h-[680px] bg-black rounded-[24px] text-white p-4 relative overflow-hidden
            ${showLoadingAnimation ? 'animate-content-fade' : ''}`}>
            <div className="w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <img src={logo} alt="Logo" className="w-6 h-6"/>
                        <span className="text-[#3AFC95] text-2xl font-bold ml-2">Chromate</span>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center space-y-8 mt-24">
                    {renderButton()}

                    {error && (
                        <div className="text-red-500 mt-4">
                            {error}
                        </div>
                    )}

                    <div className="relative flex w-[462px] px-[35px] py-8 rounded-[24px] bg-white/10"
                         style={{marginTop: '8rem'}}>
                        <img src={mic} alt="mic"
                             className="w-6 h-6 absolute left-4 top-1/2 transform -translate-y-1/2"/>
                        <p className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold text-[20px] font-wanted-sans">
                            {transcript || '명령을 말씀해주세요'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoiceControl;