import { Link } from "react-router-dom";

function HomePage() {
  return (
    <div className="min-h-screen relative z-10">
      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* 헤더 */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
            Toolbox
          </h1>
          <p className="text-xl text-gray-200">
            Toolbox for everyone
          </p>
        </div>
        {/* 툴 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* UTM Builder 카드 */}
          <Link
            to="/utm-builder"
            className="glass-strong p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
          >
            <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-gray-300 transition-colors">
              UTM Builder
            </h3>
            <p className="text-gray-200">
            Easily and quickly create and manage UTM parameters
            </p>
          </Link>

          {/* 향후 추가될 툴 카드들이 여기에 자동으로 배치됨 */}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
