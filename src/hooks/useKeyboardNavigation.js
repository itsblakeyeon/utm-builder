import { useState, useEffect } from "react";
import { flushSync } from "react-dom";
import { createEmptyRow } from "../utils/rowFactory";
import { useRowClipboard } from "./useRowClipboard";
import { useToast } from "./useToast";
import { useCellSelection } from "./useCellSelection";
import { useRowSelection } from "./useRowSelection";

/**
 * 키보드 네비게이션 로직을 관리하는 커스텀 훅
 * - 방향키로 셀 간 이동
 * - Enter로 아래 행 이동
 * - ESC로 셀/행 선택 모드 전환
 * - Shift + 방향키로 범위 선택
 * - Cmd/Ctrl+C/V로 행 복사/붙여넣기
 */
export const useKeyboardNavigation = (
  rows,
  setRows,
  fields,
  onDeleteRow,
  onToggleSelect,
  editingCell,
  setEditingCell
) => {
  // 마지막으로 포커스된 필드 (행 선택 모드 진입 전)
  const [lastFocusedField, setLastFocusedField] = useState("baseUrl");

  // 토스트 알림 훅
  const { showToast } = useToast();

  // 행 복사/붙여넣기 훅
  const { copyRow } = useRowClipboard();

  // 키보드 네비게이션: 특정 셀로 포커스 이동
  const focusCell = (rowIndex, field) => {
    if (rowIndex < 0) return;

    const selector = `input[data-row-index="${rowIndex}"][data-field="${field}"]`;
    const nextInput = document.querySelector(selector);

    if (nextInput) {
      nextInput.focus();
      nextInput.select();
    }
  };

  // 셀 선택 훅
  const {
    selectedCell,
    selectedCellRange,
    setSelectedCell,
    setSelectedCellRange,
    handleCellSelectionKeyDown,
  } = useCellSelection(rows, setRows, fields, showToast, setEditingCell);

  // 행 선택 훅
  const {
    selectedRowIndex,
    selectedRange,
    setSelectedRowIndex,
    setSelectedRange,
    handleRowSelectionKeyDown,
  } = useRowSelection(
    rows,
    setRows,
    onDeleteRow,
    onToggleSelect,
    showToast,
    focusCell,
    lastFocusedField
  );

  // 셀 선택 모드 키보드 핸들러 (ESC 처리 추가)
  const wrappedCellSelectionKeyDown = (e, rowIndex, field) => {
    // ESC: 셀 선택 해제 후 행 선택 모드로 전환
    if (e.key === "Escape") {
      e.preventDefault();
      setSelectedCell(null);
      setSelectedCellRange(null);
      setSelectedRowIndex(rowIndex);
      setSelectedRange(null);

      // tr 요소에 포커스
      requestAnimationFrame(() => {
        const rowElement = document.querySelector(`tr[data-row-index="${rowIndex}"]`);
        if (rowElement) {
          rowElement.focus();
        }
      });
      return;
    }

    // 나머지는 원래 핸들러에 위임
    handleCellSelectionKeyDown(e, rowIndex, field);
  };

  // input 필드 포커스 핸들러 (행 선택 모드 해제, 편집 모드로 전환)
  const handleInputFocus = (field, rowIndex) => {
    setSelectedRowIndex(null);
    setSelectedCell(null);
    setSelectedCellRange(null);
    // 편집 모드로 전환
    setEditingCell({ rowIndex, field });
    setLastFocusedField(field);
  };

  // 키보드 이벤트 핸들러 (방향키, Enter, ESC, Delete, Cmd/Ctrl+C/V)
  const handleKeyDown = (e, rowIndex, field) => {
    // Chrome 확장 프로그램 충돌 방지
    if (!e || !e.target) return;

    const input = e.target;
    const cursorAtStart = input.selectionStart === 0;
    const cursorAtEnd = input.selectionStart === input.value.length;

    // ESC: 편집 모드 종료 → 셀 선택 모드 (2단계: 셀 선택 → 행 선택)
    if (e.key === "Escape") {
      e.preventDefault();

      // 편집 모드인지 확인
      const isEditingMode = editingCell &&
        editingCell.rowIndex === rowIndex &&
        editingCell.field === field;

      // 현재 셀이 이미 선택되어 있는지 확인
      const isCurrentCellSelected =
        selectedCell &&
        selectedCell.rowIndex === rowIndex &&
        selectedCell.field === field;

      if (isEditingMode) {
        // 편집 모드 → 셀 선택 모드
        setEditingCell(null);
        setSelectedCell({ rowIndex, field });
        setSelectedCellRange(null);
        setSelectedRowIndex(null);
        setSelectedRange(null);
      } else if (isCurrentCellSelected) {
        // 셀 선택 모드 → 행 선택 모드
        setSelectedCell(null);
        setSelectedCellRange(null);
        setSelectedRowIndex(rowIndex);
        setSelectedRange(null);
      }
      return;
    }

    // Cmd/Ctrl + C: 행 복사 (일반 텍스트 복사는 허용하지 않음)
    // input 필드에서 텍스트 선택 중이면 기본 동작 허용
    if ((e.metaKey || e.ctrlKey) && e.key === "c") {
      const input = e.target;
      const hasSelection = input.selectionStart !== input.selectionEnd;
      if (hasSelection) {
        // 텍스트가 선택되어 있으면 기본 복사 동작 허용
        return;
      }
      e.preventDefault();
      if (copyRow(rows[rowIndex])) {
        showToast("행이 복사되었습니다!", "success");
      }
      return;
    }

    // Enter: 아래 행으로 이동 (마지막 행이면 새 행 추가)
    if (e.key === "Enter") {
      e.preventDefault();

      // 마지막 행인 경우 새 행 추가
      if (rowIndex === rows.length - 1) {
        // flushSync로 동기적으로 상태 업데이트 후 포커스
        flushSync(() => {
          const newRow = createEmptyRow();
          setRows((prevRows) => [...prevRows, newRow]);
        });

        // DOM 업데이트를 기다린 후 포커스
        requestAnimationFrame(() => {
          focusCell(rowIndex + 1, field);
        });
      } else {
        focusCell(rowIndex + 1, field);
      }
    }
    // ArrowDown: 아래 행으로 이동
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      focusCell(rowIndex + 1, field);
    }
    // ArrowUp: 위 행으로 이동
    else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusCell(rowIndex - 1, field);
    }
    // ArrowRight: 오른쪽 열로 이동 (커서가 끝에 있을 때만)
    else if (e.key === "ArrowRight" && cursorAtEnd) {
      e.preventDefault();
      const currentFieldIndex = fields.indexOf(field);
      if (currentFieldIndex < fields.length - 1) {
        focusCell(rowIndex, fields[currentFieldIndex + 1]);
      }
    }
    // ArrowLeft: 왼쪽 열로 이동 (커서가 처음에 있을 때만)
    else if (e.key === "ArrowLeft" && cursorAtStart) {
      e.preventDefault();
      const currentFieldIndex = fields.indexOf(field);
      if (currentFieldIndex > 0) {
        focusCell(rowIndex, fields[currentFieldIndex - 1]);
      }
    }
  };

  return {
    selectedCell,
    selectedCellRange,
    selectedRowIndex,
    selectedRange,
    handleCellSelectionKeyDown: wrappedCellSelectionKeyDown,
    handleRowSelectionKeyDown,
    handleInputFocus,
    handleKeyDown,
  };
};
