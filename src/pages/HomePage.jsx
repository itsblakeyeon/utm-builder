import { Link } from "react-router-dom";

function HomePage() {
  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      <div className="container mx-auto px-4 py-16">
        {/* 헤더 */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            Marketing Toolbox
          </h1>
          <p className="text-xl text-gray-400">
            효율적인 마케팅을 위한 도구 모음
          </p>
        </div>

        {/* 툴 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* UTM Builder 카드 */}
          <Link
            to="/utm-builder"
            className="bg-[#16213e] p-8 rounded-lg border border-gray-700 hover:border-blue-500 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20"
          >
            <h3 className="text-2xl font-bold text-white mb-3">
              UTM Builder
            </h3>
            <p className="text-gray-400">
              UTM 파라미터를 쉽고 빠르게 생성하고 관리하세요
            </p>
          </Link>

          {/* 향후 추가될 툴 카드들이 여기에 자동으로 배치됨 */}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
