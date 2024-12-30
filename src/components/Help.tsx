import { FC } from 'react';
import { ArrowLeft } from 'lucide-react';
import logo from '../assets/logo.svg';

interface HelpPageProps {
    onBack: () => void;
}

const HelpPage: FC<HelpPageProps> = ({ onBack }) => {
    const commands = [
        {
            category: "검색",
            examples: [
                "구글에서 뉴스 검색해줘",
                "오늘 날씨 알려줘",
                "근처 카페 찾아줘"
            ]
        },
        {
            category: "페이지 이동",
            examples: [
                "트위터로 이동해줘",
                "페이스북 열어줘",
                "다음으로 이동"
            ]
        },
        {
            category: "스크롤",
            examples: [
                "스크롤 위로 해줘",
                "스크롤 아래로 내려줘",
                "페이지 맨 위로 올려줘"
            ]
        },
        {
            category: "브라우저 제어",
            examples: [
                "이전 페이지로 가줘",
                "다음 페이지로 가줘",
                "페이지 새로고침",
                "화면 확대/축소",
                "페이지 번역",
                "현재 위치 클릭"
            ]
        }
    ];

    return (
        <div className="flex flex-col w-[500px] h-[680px] bg-black rounded-[24px] text-white p-6 relative overflow-y-auto">
            <div className="w-full max-w-md mx-auto">
                <div className="flex items-center space-x-4 mb-8">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        aria-label="뒤로 가기"
                    >
                        <ArrowLeft className="w-7 h-7" />
                    </button>
                    <div className="flex items-center">
                        <img src={logo} alt="Logo" className="w-7 h-7" />
                        <span className="text-[#3AFC95] text-3xl font-bold ml-2">Chromate</span>
                    </div>
                </div>

                <h1 className="text-3xl font-bold mb-8">음성 명령어 가이드</h1>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold text-[#3AFC95] mb-4">사용 방법</h2>
                    <div className="bg-white/5 rounded-xl p-5">
                        <p className="text-base text-gray-300 space-y-3 leading-relaxed">
                            1. 음성 인식을 시작하려면 START 버튼을 누르세요.<br />
                            2. "시리야"라고 말한 후 원하는 명령어를 입력하세요.<br />
                            3. 음성 인식을 중단하려면 STOP 버튼을 누르세요.
                        </p>
                    </div>
                </section>

                <div className="space-y-6">
                    {commands.map((command, index) => (
                        <section
                            key={index}
                            className="bg-white/5 rounded-xl p-5"
                        >
                            <h2 className="text-xl font-bold text-[#3AFC95] mb-4">
                                {command.category}
                            </h2>
                            <ul className="space-y-3">
                                {command.examples.map((example, idx) => (
                                    <li key={idx} className="text-base text-gray-300 flex items-start">
                                        <span className="mr-3 text-lg">▪</span>
                                        <span>{example}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>

                <section className="mt-6 mb-6 bg-white/5 rounded-xl p-5">
                    <h2 className="text-xl font-bold text-[#3AFC95] mb-4">주의사항</h2>
                    <ul className="space-y-3">
                        <li className="text-base text-gray-300 flex items-start">
                            <span className="mr-3 text-lg">•</span>
                            <span>조용한 환경에서 사용하면 인식 정확도가 높아집니다.</span>
                        </li>
                        <li className="text-base text-gray-300 flex items-start">
                            <span className="mr-3 text-lg">•</span>
                            <span>마이크 사용 권한을 반드시 허용하세요.</span>
                        </li>
                        <li className="text-base text-gray-300 flex items-start">
                            <span className="mr-3 text-lg">•</span>
                            <span>정확한 발음을 통해 인식률을 높일 수 있습니다.</span>
                        </li>
                    </ul>
                </section>
            </div>
        </div>
    );
};

export default HelpPage;
