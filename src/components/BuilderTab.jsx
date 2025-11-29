import { buildUTMUrl } from "../utils/urlBuilder";
import { createEmptyRow } from "../utils/rowFactory";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useKeyboardNavigation } from "../hooks/useKeyboardNavigation";
import { useToast } from "../hooks/useToast";
import { useEffect, useRef } from "react";
import BuilderTableHeader from "./BuilderTableHeader";
import UTMTableRow from "./UTMTableRow";
import Toast from "./Toast";

function BuilderTab({ onSave }) {
  // 행 데이터 상태 관리 (localStorage 자동 저장)
  const [rows, setRows] = useLocalStorage("utmBuilderRows", [
    {
      id: 1,
      baseUrl: "https://example.com",
      source: "google",
      medium: "cpc",
      campaign: "spring_sale",
      term: "running shoes",
      content: "text_ad",
      selected: false,
    },
    {
      id: 2,
      baseUrl: "https://example.com",
      source: "facebook",
      medium: "social",
      campaign: "new_product",
      term: "",
      content: "carousel_ad",
      selected: false,
    },
    {
      id: 3,
      baseUrl: "https://example.com",
      source: "newsletter",
      medium: "email",
      campaign: "weekly_news",
      term: "",
      content: "header_banner",
      selected: false,
    },
  ]);

  // 편집 가능한 필드 목록 (키보드 네비게이션용)
  const fields = ["baseUrl", "source", "medium", "campaign", "term", "content"];

  // 토스트 알림 훅
  const { toast, showToast, hideToast } = useToast();

  // 행 삭제 (키보드 네비게이션 훅에서 사용하기 위해 먼저 정의)
  const deleteRow = (id) => {
    if (rows.length === 1) {
      showToast("최소 1개의 행은 필요합니다!", "warning");
      return;
    }
    setRows(rows.filter((row) => row.id !== id));
  };

  // 체크박스 토글
  const toggleSelect = (id) => {
    setRows((prevRows) =>
      prevRows.map((row) =>
        row.id === id ? { ...row, selected: !row.selected } : row
      )
    );
  };

  // 키보드 네비게이션 훅
  const {
    selectedCell,
    selectedCellRange,
    selectedRowIndex,
    selectedRange,
    isComposing,
    setIsComposing,
    handleCellSelectionKeyDown,
    handleRowSelectionKeyDown,
    handleInputFocus,
    handleKeyDown,
  } = useKeyboardNavigation(rows, setRows, fields, deleteRow, toggleSelect);

  // 입력 필드 값 변경 핸들러
  const handleChange = (id, field, value) => {
    // baseUrl 필드일 때 프로토콜이 없으면 자동으로 https:// 추가
    let processedValue = value;
    if (
      field === "baseUrl" &&
      value &&
      !value.startsWith("http://") &&
      !value.startsWith("https://")
    ) {
      // 프로토콜이 없고, 공백이 아닌 경우에만 https:// 추가
      const trimmedValue = value.trim();
      if (
        trimmedValue &&
        !trimmedValue.startsWith("http://") &&
        !trimmedValue.startsWith("https://")
      ) {
        processedValue = `https://${trimmedValue}`;
      }
    }

    setRows((prevRows) =>
      prevRows.map((row) =>
        row.id === id ? { ...row, [field]: processedValue } : row
      )
    );
  };

  // 행 추가
  const addRow = () => {
    const newRow = createEmptyRow();
    setRows([...rows, newRow]);
  };

  // 모든 필드 초기화
  const handleReset = () => {
    setRows([createEmptyRow()]);
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    const allSelected = rows.every((row) => row.selected);
    setRows((prevRows) =>
      prevRows.map((row) => ({ ...row, selected: !allSelected }))
    );
  };

  // 선택 항목 저장
  const saveSelected = () => {
    const selectedRows = rows.filter((row) => row.selected);

    if (selectedRows.length === 0) {
      showToast("저장할 항목을 선택해주세요!", "warning");
      return;
    }

    const savedItems = selectedRows
      .map((row) => {
        const fullUrl = buildUTMUrl(row);
        if (!fullUrl) return null;

        return {
          id: Date.now() + Math.random(),
          campaignName: `${row.source}-${row.medium}-${row.campaign}`,
          savedAt: Date.now(),
          comment: "",
          params: {
            source: row.source,
            medium: row.medium,
            campaign: row.campaign,
            term: row.term,
            content: row.content,
          },
          fullUrl: fullUrl,
        };
      })
      .filter(Boolean);

    if (savedItems.length > 0) {
      onSave(savedItems);
      showToast(`${savedItems.length}개 항목이 저장되었습니다!`, "success");

      // 저장 후 선택 해제
      setRows((prevRows) =>
        prevRows.map((row) => ({ ...row, selected: false }))
      );
    }
  };

  // saveSelected 함수를 ref로 저장하여 최신 버전 유지
  const saveSelectedRef = useRef(saveSelected);
  saveSelectedRef.current = saveSelected;

  // 특정 행의 URL 복사
  const copyUrl = (row) => {
    const url = buildUTMUrl(row);
    if (url) {
      navigator.clipboard.writeText(url);
      showToast("URL이 클립보드에 복사되었습니다!", "success");
    }
  };

  // 전역 키보드 단축키 핸들러
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // input, textarea 등 입력 필드에 포커스가 있을 때는 제외
      const isInputFocused =
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable;

      // Cmd/Ctrl + S: 선택 항목 저장
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (!isInputFocused) {
          // ref를 통해 최신 함수 호출
          saveSelectedRef.current();
        }
        return;
      }

      // Cmd/Ctrl + A: 전체 선택/해제
      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        // input 필드에 포커스가 있으면 기본 동작 허용 (전체 선택)
        if (isInputFocused) {
          return;
        }
        e.preventDefault();
        setRows((prevRows) => {
          const allSelected = prevRows.every((row) => row.selected);
          return prevRows.map((row) => ({ ...row, selected: !allSelected }));
        });
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [setRows]);

  return (
    <div className="max-w-full mx-auto p-6">
      {/* 행 추가 버튼 */}
      <div className="mb-4 flex gap-3">
        <button
          onClick={addRow}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium transition duration-200"
        >
          + 행 추가
        </button>
        <button
          onClick={handleReset}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-medium transition duration-200"
        >
          전체 초기화
        </button>
        <button
          onClick={toggleSelectAll}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-medium transition duration-200"
        >
          전체 선택
        </button>
        <button
          onClick={saveSelected}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition duration-200"
        >
          선택 항목 저장
        </button>
      </div>

      {/* 테이블 형식 */}
      <div className="overflow-x-auto border border-gray-700 rounded-lg">
        <table className="w-full bg-[#16213e]">
          <BuilderTableHeader
            allSelected={rows.length > 0 && rows.every((row) => row.selected)}
            onToggleSelectAll={toggleSelectAll}
          />
          <tbody>
            {rows.map((row, index) => (
              <UTMTableRow
                key={row.id}
                row={row}
                index={index}
                selectedCell={selectedCell}
                selectedCellRange={selectedCellRange}
                selectedRowIndex={selectedRowIndex}
                selectedRange={selectedRange}
                onToggleSelect={toggleSelect}
                onChange={handleChange}
                onInputFocus={handleInputFocus}
                onKeyDown={handleKeyDown}
                onCellSelectionKeyDown={handleCellSelectionKeyDown}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                onCopyUrl={copyUrl}
                onDeleteRow={deleteRow}
                onRowSelectionKeyDown={handleRowSelectionKeyDown}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* 토스트 알림 */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
}

export default BuilderTab;
