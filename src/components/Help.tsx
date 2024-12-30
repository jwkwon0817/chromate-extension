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
                "구글에서 날씨 검색해줘",
                "오늘 주식 시장 검색해줘",
                "맛집 찾아줘"
            ]
        },
        {
            category: "페이지 이동",
            examples: [
                "네이버로 이동해줘",
                "유튜브 열어줘",
                "구글로 이동"
            ]
        },
        {
            category: "스크롤",
            examples: [
                "위로 올려줘",
                "아래로 내려줘",
                "맨 위로 올려줘"
            ]
        },
        {
            category: "브라우저 제어",
            examples: [
                "뒤로 가줘",
                "앞으로 가줘",
                "새로고침 해줘"
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
                    <h2 className="text-2xl font-bold text-[#3AFC95] mb-4">시작하기</h2>
                    <div className="bg-white/5 rounded-xl p-5">
                        <p className="text-base text-gray-300 space-y-3 leading-relaxed">
                            1. START 버튼을 클릭하여 음성 인식을 시작합니다.<br />
                            2. "시리야"라고 부른 후 원하는 명령어를 말합니다.<br />
                            3. 음성 인식을 중지하려면 STOP 버튼을 클릭합니다.
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
                            <span>조용한 환경에서 사용하면 더 정확한 인식이 가능합니다.</span>
                        </li>
                        <li className="text-base text-gray-300 flex items-start">
                            <span className="mr-3 text-lg">•</span>
                            <span>마이크 사용 권한을 허용해야 음성 인식이 가능합니다.</span>
                        </li>
                        <li className="text-base text-gray-300 flex items-start">
                            <span className="mr-3 text-lg">•</span>
                            <span>발음을 또박또박 말해주시면 인식 정확도가 올라갑니다.</span>
                        </li>
                    </ul>
                </section>
            </div>
        </div>
    );
};

export default HelpPage;