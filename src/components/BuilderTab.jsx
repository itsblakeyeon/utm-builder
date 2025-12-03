import { buildUTMUrl } from "../utils/urlBuilder";
import { createEmptyRow } from "../utils/rowFactory";
import { useKeyboardNavigation } from "../hooks/useKeyboardNavigation";
import { useToast } from "../hooks/useToast";
import { useHistory } from "../hooks/useHistory";
import { useEffect, useCallback } from "react";
import BuilderTableHeader from "./BuilderTableHeader";
import UTMTableRow from "./UTMTableRow";
import Toast from "./Toast";
import { STORAGE_KEYS, DEBOUNCE_DELAY, FIELDS } from "../constants";

function BuilderTab({ onSave }) {
  // 편집 가능한 필드 목록 (키보드 네비게이션용)
  const fields = FIELDS;

  // 토스트 알림 훅
  const { toast, showToast, hideToast } = useToast();

  // rows + 커서 상태를 함께 관리하는 히스토리 상태
  const [historyState, setHistoryState, { undo, redo, canUndo, canRedo }] =
    useHistory(
      () => {
        const saved = localStorage.getItem(STORAGE_KEYS.ROWS);
        const initialRows = (() => {
          if (saved) {
            try {
              return JSON.parse(saved);
            } catch (e) {
              return [createEmptyRow(), createEmptyRow(), createEmptyRow()];
            }
          }
          return [createEmptyRow(), createEmptyRow(), createEmptyRow()];
        })();

        if (saved) {
          try {
            // saved가 rows 배열이라고 가정하고 historyState 형태로 래핑
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              return {
                rows: parsed,
                editingCell: null,
              };
            }
            // 혹시 나중에 구조가 바뀌었을 경우 안전하게 처리
            return {
              rows: initialRows,
              editingCell: null,
            };
          } catch (e) {
            return {
              rows: initialRows,
              editingCell: null,
            };
          }
        }
        return {
          rows: initialRows,
          editingCell: null,
        };
      },
      {
        maxHistory: 50,
        debounceMs: 500,
      }
    );

  const { rows, editingCell } = historyState;

  // rows만 부분 업데이트하기 위한 헬퍼
  const setRows = (updaterOrValue, preserveEditingCell = true) => {
    setHistoryState((prev) => {
      const prevRows = prev.rows;
      const nextRows =
        typeof updaterOrValue === "function"
          ? updaterOrValue(prevRows)
          : updaterOrValue;
      return {
        ...prev,
        rows: nextRows,
        editingCell: preserveEditingCell ? prev.editingCell : null,
      };
    });
  };

  // editingCell만 부분 업데이트하기 위한 헬퍼
  const setEditingCell = (nextEditingCell) => {
    setHistoryState((prev) => ({
      ...prev,
      editingCell: nextEditingCell,
    }));
  };

  // 행 삭제 (키보드 네비게이션 훅에서 사용하기 위해 먼저 정의)
  const deleteRow = (id) => {
    if (rows.length === 1) {
      showToast("최소 1개의 행은 필요합니다!", "warning");
      return;
    }
    
    // 삭제할 행의 인덱스 찾기
    const index = rows.findIndex((row) => row.id === id);
    if (index === -1) return;
    
    // 삭제 후 남을 행들
    const rowsAfter = rows.filter((row) => row.id !== id);
    
    // 포커스할 행 인덱스 계산 (삭제 후 상태)
    let targetIndex;
    if (index > 0) {
      // 위 행 선택
      targetIndex = index - 1;
    } else {
      // 첫 행 삭제 시 새 첫 행 선택
      targetIndex = 0;
    }
    
    // 마지막 행 삭제 시 보정
    if (targetIndex >= rowsAfter.length) {
      targetIndex = rowsAfter.length - 1;
    }
    
    // 히스토리 기록을 위해 두 단계로 나눔:
    // 1. editingCell을 삭제될 행으로 설정 (히스토리 기록: 삭제 전 상태, 삭제될 행에 포커스)
    //    → Undo 시 이 상태로 돌아가면 삭제될 행에 포커스가 있음
    setHistoryState((prev) => ({
      ...prev,
      editingCell: { rowIndex: index, field: fields[0] },
    }));
    
    // 2. 행 삭제 및 위 행으로 포커스 (히스토리 기록: 삭제 후 상태, 위 행에 포커스)
    //    → Redo 시 이 상태로 돌아가면 행이 삭제되고 위 행에 포커스가 있음
    setHistoryState((prev) => ({
      ...prev,
      rows: rowsAfter,
      editingCell: { rowIndex: targetIndex, field: fields[0] },
    }));
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
    setSelectedCell,
    setSelectedCellRange,
    setSelectedRowIndex,
    setSelectedRange,
    handleCellSelectionKeyDown,
    handleRowSelectionKeyDown,
    handleInputFocus,
    handleKeyDown,
    isComposing,
    onCompositionStart,
    onCompositionEnd,
  } = useKeyboardNavigation(
    rows,
    setRows,
    fields,
    deleteRow,
    toggleSelect,
    editingCell,
    setEditingCell
  );

  // Undo/Redo 래퍼 함수 (선택 상태 클리어)
  const handleUndo = useCallback(() => {
    undo();
    setSelectedCell(null);
    setSelectedCellRange(null);
    setSelectedRowIndex(null);
    setSelectedRange(null);
  }, [
    undo,
    setSelectedCell,
    setSelectedCellRange,
    setSelectedRowIndex,
    setSelectedRange,
  ]);

  const handleRedo = useCallback(() => {
    redo();
    setSelectedCell(null);
    setSelectedCellRange(null);
    setSelectedRowIndex(null);
    setSelectedRange(null);
  }, [
    redo,
    setSelectedCell,
    setSelectedCellRange,
    setSelectedRowIndex,
    setSelectedRange,
  ]);

  // 셀 클릭 핸들러 (편집 모드로 전환)
  const handleCellClick = (rowIndex, field) => {
    setEditingCell({ rowIndex, field });
  };

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

    // IME 조합 중에는 히스토리는 그대로 두고 값만 업데이트
    setRows((prevRows) =>
      prevRows.map((row) =>
        row.id === id ? { ...row, [field]: processedValue } : row
      )
    );
  };

  // 행 추가
  const addRow = () => {
    const newRow = createEmptyRow();
    // 새 행 추가 후, 새 행의 첫 번째 필드로 커서 이동할 수 있도록 editingCell 초기화
    setHistoryState((prev) => {
      const nextRows = [...prev.rows, newRow];
      return {
        ...prev,
        rows: nextRows,
        editingCell: { rowIndex: nextRows.length - 1, field: fields[0] },
      };
    });
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

    if (savedItems.length === 0) {
      showToast("URL이 없는 항목은 저장할 수 없습니다!", "warning");
      return;
    }

    onSave(savedItems);

    // 일부만 저장된 경우 알림
    if (savedItems.length < selectedRows.length) {
      const skippedCount = selectedRows.length - savedItems.length;
      showToast(
        `${savedItems.length}개 항목이 저장되었습니다. (${skippedCount}개 항목은 URL이 없어 제외됨)`,
        "success"
      );
    } else {
      showToast(`${savedItems.length}개 항목이 저장되었습니다!`, "success");
    }
  };

  // 특정 행의 URL 복사
  const copyUrl = (row) => {
    const url = buildUTMUrl(row);
    if (url) {
      navigator.clipboard.writeText(url);
      showToast("URL이 클립보드에 복사되었습니다!", "success");
    }
  };

  // 특정 행의 URL을 새 탭에서 열기
  const openUrlInNewTab = (row) => {
    const url = buildUTMUrl(row);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      showToast("새 탭에서 열었습니다!", "success");
    }
  };

  // localStorage에 자동 저장 (디바운스)
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEYS.ROWS, JSON.stringify(rows));
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [rows]);

  // editingCell 변경 시 해당 셀로 포커스 이동 (노션/구글 시트 스타일 Undo/Redo용)
  useEffect(() => {
    if (!editingCell) return;
    const { rowIndex, field } = editingCell;
    if (rowIndex == null || !field) return;

    requestAnimationFrame(() => {
      const selector = `input[data-row-index="${rowIndex}"][data-field="${field}"]`;
      const input = document.querySelector(selector);
      if (input) {
        input.focus();
        // 커서를 텍스트 끝으로 이동
        const length = input.value?.length ?? 0;
        input.setSelectionRange(length, length);
      }
    });
  }, [editingCell]);

  // 키보드 단축키 (Cmd+Z Undo, Cmd+Shift+Z Redo, Cmd+S 저장)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+Z: Undo
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        if (canUndo) {
          handleUndo();
        }
        return;
      }

      // Cmd+Shift+Z: Redo
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        if (canRedo) {
          handleRedo();
        }
        return;
      }

      // Cmd+S: 선택 항목 저장
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        e.stopPropagation();
        saveSelected();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [canUndo, canRedo, handleUndo, handleRedo, saveSelected]);

  return (
    <div className="max-w-full mx-auto p-6">
      {/* 컨트롤 버튼들 */}
      <div className="mb-4 flex gap-3">
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
                editingCell={editingCell}
                selectedCell={selectedCell}
                selectedCellRange={selectedCellRange}
                selectedRowIndex={selectedRowIndex}
                selectedRange={selectedRange}
                onToggleSelect={toggleSelect}
                onChange={handleChange}
                onInputFocus={handleInputFocus}
                onKeyDown={handleKeyDown}
                onCellSelectionKeyDown={handleCellSelectionKeyDown}
                onCompositionStart={onCompositionStart}
                onCompositionEnd={onCompositionEnd}
                onCopyUrl={copyUrl}
                onTestUrl={openUrlInNewTab}
                onDeleteRow={deleteRow}
                onRowSelectionKeyDown={handleRowSelectionKeyDown}
                onCellClick={handleCellClick}
              />
            ))}
          </tbody>
        </table>

        {/* Notion 스타일 행 추가 버튼 */}
        <button
          onClick={addRow}
          className="w-full mt-2 py-2 text-gray-400 hover:bg-[#1a2642] hover:text-gray-300 transition-colors duration-150 rounded flex items-center justify-center"
          aria-label="행 추가"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>

      {/* 토스트 알림 */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
}

export default BuilderTab;
