import { useState } from "react";
import { useToast } from "../hooks/useToast";
import Toast from "./Toast";

function SavedTab({ savedItems, onDelete, onDeleteAll, onUpdateComment }) {
  const [editingId, setEditingId] = useState(null);
  const [editComment, setEditComment] = useState("");

  // 토스트 알림 훅
  const { toast, showToast, hideToast } = useToast();

  // 코멘트 편집 시작
  const startEdit = (item) => {
    setEditingId(item.id);
    setEditComment(item.comment);
  };

  // 코멘트 저장
  const saveComment = (id) => {
    onUpdateComment(id, editComment);
    setEditingId(null);
    setEditComment("");
  };

  // 코멘트 편집 취소
  const cancelEdit = () => {
    setEditingId(null);
    setEditComment("");
  };

  // URL 복사
  const copyUrl = (url) => {
    navigator.clipboard.writeText(url);
    showToast("URL이 클립보드에 복사되었습니다!", "success");
  };

  // 날짜 포맷팅
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (savedItems.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-[#16213e] rounded-lg p-12 text-center">
          <p className="text-gray-400 text-lg">저장된 URL이 없습니다.</p>
          <p className="text-gray-500 text-sm mt-2">
            Builder 탭에서 URL을 선택하고 저장해보세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 전체 삭제 버튼 */}
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">
          저장된 URL ({savedItems.length}개)
        </h2>
        <button
          onClick={onDeleteAll}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium transition duration-200"
        >
          전체 삭제
        </button>
      </div>

      {/* 저장된 항목 리스트 */}
      <div className="space-y-4">
        {savedItems.map((item) => (
          <div
            key={item.id}
            className="bg-[#16213e] rounded-lg p-6 border border-gray-700"
          >
            {/* 헤더: 캠페인명, 저장 시간 */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {item.campaignName}
                </h3>
                <p className="text-gray-400 text-sm">
                  {formatDate(item.savedAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyUrl(item.fullUrl)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition duration-200"
                >
                  복사
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition duration-200"
                >
                  삭제
                </button>
              </div>
            </div>

            {/* UTM 파라미터 요약 */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <div>
                <p className="text-gray-400 text-xs">Source</p>
                <p className="text-white text-sm font-medium">
                  {item.params.source}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Medium</p>
                <p className="text-white text-sm font-medium">
                  {item.params.medium}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Campaign</p>
                <p className="text-white text-sm font-medium">
                  {item.params.campaign}
                </p>
              </div>
              {item.params.term && (
                <div>
                  <p className="text-gray-400 text-xs">Term</p>
                  <p className="text-white text-sm font-medium">
                    {item.params.term}
                  </p>
                </div>
              )}
              {item.params.content && (
                <div>
                  <p className="text-gray-400 text-xs">Content</p>
                  <p className="text-white text-sm font-medium">
                    {item.params.content}
                  </p>
                </div>
              )}
            </div>

            {/* 생성된 URL */}
            <div className="mb-4">
              <p className="text-gray-400 text-xs mb-2">생성된 URL</p>
              <div className="bg-[#0f1419] text-gray-300 px-4 py-3 rounded border border-gray-700 break-all text-sm">
                {item.fullUrl}
              </div>
            </div>

            {/* 코멘트 (인라인 편집) */}
            <div>
              <p className="text-gray-400 text-xs mb-2">코멘트</p>
              {editingId === item.id ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                    placeholder="코멘트를 입력하세요"
                    className="flex-1 bg-[#0f1419] text-gray-300 px-3 py-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
                    autoFocus
                  />
                  <button
                    onClick={() => saveComment(item.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm transition duration-200"
                  >
                    저장
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm transition duration-200"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => startEdit(item)}
                  className="bg-[#0f1419] text-gray-300 px-4 py-3 rounded border border-gray-700 cursor-pointer hover:border-blue-500 transition duration-200 text-sm"
                >
                  {item.comment || "코멘트를 추가하려면 클릭하세요"}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 토스트 알림 */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
}

export default SavedTab;
