import { useState, useEffect } from "react";
import { useRowClipboard } from "./useRowClipboard";

/**
 * 행 선택 상태를 관리하는 커스텀 훅
 * - 단일 행 선택
 * - 행 범위 선택 (Shift + 방향키)
 * - 행 선택 모드 키보드 핸들러
 */
export const useRowSelection = (
  rows,
  setRows,
  onDeleteRow,
  onToggleSelect,
  showToast,
  focusCell,
  lastFocusedField
) => {
  // 행 선택 모드 상태 (rowIndex가 선택되면 해당 행 전체 선택)
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);

  // 범위 선택 상태 (시작 인덱스와 끝 인덱스)
  const [selectedRange, setSelectedRange] = useState(null);

  // 행 복사/붙여넣기 훅
  const { copyRow, copyRows, pasteRows } = useRowClipboard();

  // 행이 선택되었을 때 해당 행에 포커스
  useEffect(() => {
    if (selectedRowIndex !== null) {
      // 약간의 지연을 두어 DOM 업데이트 후 포커스
      requestAnimationFrame(() => {
        const rowElement = document.querySelector(
          `tr[data-row-index="${selectedRowIndex}"]`
        );
        if (rowElement) {
          rowElement.focus();
        }
      });
    }
  }, [selectedRowIndex, selectedRange]);

  // 행 선택 모드용 키보드 핸들러
  const handleRowSelectionKeyDown = (e, rowIndex) => {
    // Chrome 확장 프로그램 충돌 방지
    if (!e || !e.key) return;

    // Shift + ArrowUp/Down: 범위 포커싱 (체크박스 선택 없이 시각적 하이라이트만)
    if (e.shiftKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      // 범위 선택 시작점: 이미 범위 선택 중이면 그 시작점 사용, 아니면 현재 행
      const startIndex = selectedRange ? selectedRange.start : rowIndex;
      let endIndex = rowIndex;

      if (e.key === "ArrowUp") {
        endIndex = Math.max(0, rowIndex - 1);
      } else if (e.key === "ArrowDown") {
        endIndex = Math.min(rows.length - 1, rowIndex + 1);
      }

      // 범위 선택 상태 업데이트 (시각적 하이라이트용만, 체크박스 선택 안함)
      setSelectedRange({ start: startIndex, end: endIndex });
      setSelectedRowIndex(endIndex);
      return;
    }

    // Space: 체크박스 선택/해제 (범위 선택 중이면 모든 행에 적용)
    if (e.key === " ") {
      e.preventDefault();
      if (onToggleSelect) {
        if (selectedRange) {
          // 범위 내 모든 행의 체크박스 상태 확인
          const minIndex = Math.min(selectedRange.start, selectedRange.end);
          const maxIndex = Math.max(selectedRange.start, selectedRange.end);
          const rangeRows = rows.slice(minIndex, maxIndex + 1);
          const allSelected = rangeRows.every((row) => row.selected);

          // 모두 선택되어 있으면 전체 해제, 아니면 전체 선택
          rangeRows.forEach((row) => {
            if (allSelected && row.selected) {
              onToggleSelect(row.id); // 해제
            } else if (!allSelected && !row.selected) {
              onToggleSelect(row.id); // 선택
            }
          });
        } else {
          // 단일 행만 선택/해제
          onToggleSelect(rows[rowIndex].id);
        }
      }
      return;
    }

    // ArrowUp: 위 행 선택
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (rowIndex > 0) {
        setSelectedRowIndex(rowIndex - 1);
        setSelectedRange(null); // 범위 선택 초기화
      }
    }
    // ArrowDown: 아래 행 선택
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (rowIndex < rows.length - 1) {
        setSelectedRowIndex(rowIndex + 1);
        setSelectedRange(null); // 범위 선택 초기화
      }
    }
    // Delete 또는 Backspace: 행 삭제 (범위 선택 중이면 모든 행 삭제)
    else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      if (selectedRange) {
        // 범위 내 모든 행 삭제
        const minIndex = Math.min(selectedRange.start, selectedRange.end);
        const maxIndex = Math.max(selectedRange.start, selectedRange.end);
        const rowsToDelete = [];
        for (let i = minIndex; i <= maxIndex; i++) {
          rowsToDelete.push(rows[i].id);
        }

        // 최소 1개 행은 유지해야 함
        if (rows.length - rowsToDelete.length < 1) {
          showToast("최소 1개의 행은 필요합니다!", "warning");
          return;
        }

        // 모든 행 삭제
        rowsToDelete.forEach((id) => onDeleteRow(id));

        // 범위 선택 해제 및 포커스 조정
        setSelectedRange(null);
        const remainingRows = rows.filter(
          (row) => !rowsToDelete.includes(row.id)
        );
        if (remainingRows.length > 0) {
          const newIndex = Math.min(minIndex, remainingRows.length - 1);
          setSelectedRowIndex(newIndex);
        } else {
          setSelectedRowIndex(null);
        }
      } else {
        // 단일 행 삭제
        if (rows.length > 1) {
          onDeleteRow(rows[rowIndex].id);
          // 삭제 후 선택 해제 또는 이전 행 선택
          if (rowIndex > 0) {
            setSelectedRowIndex(rowIndex - 1);
          } else if (rows.length > 1) {
            setSelectedRowIndex(0);
          } else {
            setSelectedRowIndex(null);
          }
        } else {
          showToast("최소 1개의 행은 필요합니다!", "warning");
        }
      }
    }
    // Cmd/Ctrl + C: 행 복사 (범위 선택 시 모든 행 복사)
    else if ((e.metaKey || e.ctrlKey) && e.key === "c") {
      e.preventDefault();
      if (selectedRange) {
        // 범위 선택 시 모든 행 복사
        const minIndex = Math.min(selectedRange.start, selectedRange.end);
        const maxIndex = Math.max(selectedRange.start, selectedRange.end);
        const rowsToCopy = rows.slice(minIndex, maxIndex + 1);
        if (copyRows(rowsToCopy)) {
          showToast(`${rowsToCopy.length}개 행이 복사되었습니다!`, "success");
        }
      } else {
        // 단일 행 복사
        if (copyRow(rows[rowIndex])) {
          showToast("행이 복사되었습니다!", "success");
        }
      }
    }
    // Cmd/Ctrl + V: 행 붙여넣기 (멀티 복사 시 여러 행 붙여넣기)
    else if ((e.metaKey || e.ctrlKey) && e.key === "v") {
      e.preventDefault();
      const result = pasteRows(rows, rowIndex);
      if (result.success) {
        setRows(result.newRows);
        setSelectedRowIndex(result.insertedIndex);
        showToast("행이 붙여넣어졌습니다!", "success");
      }
    }
    // Enter 또는 다른 키: 행 선택 모드 해제 및 마지막 포커스된 필드로 포커스
    else if (e.key === "Enter" || e.key.length === 1) {
      e.preventDefault();
      setSelectedRowIndex(null);
      focusCell(rowIndex, lastFocusedField);
    }
    // ESC: 행 선택 모드에서 ESC → 편집 모드로 전환
    else if (e.key === "Escape") {
      e.preventDefault();
      setSelectedRowIndex(null);
      setSelectedRange(null);
      // 마지막 포커스된 필드로 포커스 이동
      focusCell(rowIndex, lastFocusedField);
    }
  };

  return {
    selectedRowIndex,
    selectedRange,
    setSelectedRowIndex,
    setSelectedRange,
    handleRowSelectionKeyDown,
  };
};

