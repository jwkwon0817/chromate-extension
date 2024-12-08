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
    const [loadingType, setLoadingType] = useState<'connect' | 'search'>('connect');
    const [searchQuery, setSearchQuery] = useState('');

    const handleCommand = (text: string) => {
        const command = text.toLowerCase().trim();

        // 구글 접속 명령
        if (command.includes('유튜브로 접속') || command.includes('유튜브 검색')) {
            setLoadingType('connect');
            setShowLoadingAnimation(true);
            setTimeout(() => {
                setIsLoading(true);
            }, 300);

            setTimeout(() => {
                window.open('https://www.youtube.com', '_blank');
                setIsLoading(false);
                setShowLoadingAnimation(false);
            }, 3000);
        }
        // 검색 명령
        else if (command.includes('검색') || command.includes('찾아')) {
            let query = '';

            if (command.includes('검색')) {
                query = command.split('검색')[0].trim();
            } else if (command.includes('찾아')) {
                query = command.split('찾아')[0].trim();
            }

            if (query) {
                setSearchQuery(query);
                setLoadingType('search');
                setShowLoadingAnimation(true);
                setTimeout(() => {
                    setIsLoading(true);
                }, 300);

                setTimeout(() => {
                    const searchUrl = `https://www.youtube.com/search?q=${encodeURIComponent(query)}`;
                    window.open(searchUrl, '_blank');
                    setIsLoading(false);
                    setShowLoadingAnimation(false);
                }, 3000);
            }
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
                <div className={`flex flex-col items-center justify-center h-[119px] mt-16 space-y-2
                    animate-fade-in-up`}>
                    <p className="text-2xl font-bold animate-slide-up">
                        {loadingType === 'connect' ?
                            'https://www.google.com' :
                            searchQuery
                        }
                    </p>
                    <div className="relative">
                        <p className="font-wanted-sans text-[42px] font-bold text-[#838383] animate-pulse">
                            {loadingType === 'connect' ? '접속 중' : '검색 중'}
                            <span className="animate-bounce-dots">.</span>
                            <span className="animate-bounce-dots animation-delay-100">.</span>
                            <span className="animate-bounce-dots animation-delay-200">.</span>
                        </p>
                        <div className="absolute -inset-4 bg-gradient-to-r from-transparent via-[#3AFC95]/10 to-transparent animate-loading-gradient"></div>
                    </div>
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
                         style={{marginTop: '15rem'}}>
                        <img src={mic} alt="mic"
                             className="w-6 h-6 absolute left-4 top-1/2 transform -translate-y-1/2"/>
                        <p className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold text-[20px] font-wanted-sans">
                            {transcript || '명령어를 말하세요'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoiceControl;