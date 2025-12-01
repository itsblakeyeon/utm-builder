import { useState, useEffect, useRef } from "react";

/**
 * 셀 선택 상태를 관리하는 커스텀 훅
 * - 단일 셀 선택
 * - 셀 범위 선택 (Shift + 방향키)
 * - 셀 선택 모드 키보드 핸들러
 */
export const useCellSelection = (rows, setRows, fields, showToast, setEditingCell) => {
  // 셀 선택 상태 (rowIndex와 field로 특정 셀 선택)
  const [selectedCell, setSelectedCell] = useState(null);

  // 셀 범위 선택 상태 (시작 셀과 끝 셀)
  const [selectedCellRange, setSelectedCellRange] = useState(null);
  const selectedCellRangeRef = useRef(selectedCellRange);

  // 최신 selectedCellRange 참조 유지
  useEffect(() => {
    selectedCellRangeRef.current = selectedCellRange;
  }, [selectedCellRange]);

  // 셀 선택 모드용 키보드 핸들러
  const handleCellSelectionKeyDown = (e, rowIndex, field) => {
    // Chrome 확장 프로그램 충돌 방지
    if (!e || !e.key) return;

    // ESC는 useKeyboardNavigation의 wrappedCellSelectionKeyDown에서 처리

    // Shift + ArrowUp/Down/Left/Right: 셀 범위 선택
    if (
      e.shiftKey &&
      (e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight")
    ) {
      e.preventDefault();
      // 범위 선택 시작점: 이미 범위 선택 중이면 그 시작점 사용, 아니면 현재 셀
      const currentRange = selectedCellRangeRef.current;
      const startCell = currentRange ? currentRange.start : { rowIndex, field };
      let endCell = { rowIndex, field };

      if (e.key === "ArrowUp") {
        endCell = { rowIndex: Math.max(0, rowIndex - 1), field };
      } else if (e.key === "ArrowDown") {
        endCell = { rowIndex: Math.min(rows.length - 1, rowIndex + 1), field };
      } else if (e.key === "ArrowLeft") {
        const currentFieldIndex = fields.indexOf(field);
        if (currentFieldIndex > 0) {
          endCell = { rowIndex, field: fields[currentFieldIndex - 1] };
        }
      } else if (e.key === "ArrowRight") {
        const currentFieldIndex = fields.indexOf(field);
        if (currentFieldIndex < fields.length - 1) {
          endCell = { rowIndex, field: fields[currentFieldIndex + 1] };
        }
      }

      // 범위 선택 상태 업데이트
      setSelectedCellRange({ start: startCell, end: endCell });
      setSelectedCell(endCell); // 마지막 셀에 포커스
      return;
    }

    // Delete 또는 Backspace: 셀 값 삭제 (범위 선택 시 모든 셀 삭제)
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      const currentRange = selectedCellRangeRef.current;
      if (currentRange) {
        // 범위 내 모든 셀 삭제
        const minRow = Math.min(
          currentRange.start.rowIndex,
          currentRange.end.rowIndex
        );
        const maxRow = Math.max(
          currentRange.start.rowIndex,
          currentRange.end.rowIndex
        );
        const startFieldIndex = fields.indexOf(currentRange.start.field);
        const endFieldIndex = fields.indexOf(currentRange.end.field);
        const minFieldIndex = Math.min(startFieldIndex, endFieldIndex);
        const maxFieldIndex = Math.max(startFieldIndex, endFieldIndex);

        setRows((prevRows) =>
          prevRows.map((row, idx) => {
            if (idx >= minRow && idx <= maxRow) {
              const updatedRow = { ...row };
              for (let i = minFieldIndex; i <= maxFieldIndex; i++) {
                updatedRow[fields[i]] = "";
              }
              return updatedRow;
            }
            return row;
          })
        );
      } else {
        // 단일 셀 삭제
        setRows((prevRows) =>
          prevRows.map((row, idx) =>
            idx === rowIndex ? { ...row, [field]: "" } : row
          )
        );
      }
      return;
    }

    // Cmd/Ctrl + C: 셀 값 복사 (범위 선택 시 모든 셀 값 복사)
    if ((e.metaKey || e.ctrlKey) && e.key === "c") {
      e.preventDefault();
      const currentRange = selectedCellRangeRef.current;
      if (currentRange) {
        // 범위 내 모든 셀 값 복사 (탭으로 구분)
        const minRow = Math.min(
          currentRange.start.rowIndex,
          currentRange.end.rowIndex
        );
        const maxRow = Math.max(
          currentRange.start.rowIndex,
          currentRange.end.rowIndex
        );
        const startFieldIndex = fields.indexOf(currentRange.start.field);
        const endFieldIndex = fields.indexOf(currentRange.end.field);
        const minFieldIndex = Math.min(startFieldIndex, endFieldIndex);
        const maxFieldIndex = Math.max(startFieldIndex, endFieldIndex);

        const cellValues = [];
        for (let r = minRow; r <= maxRow; r++) {
          const rowValues = [];
          for (let f = minFieldIndex; f <= maxFieldIndex; f++) {
            rowValues.push(rows[r][fields[f]] || "");
          }
          cellValues.push(rowValues.join("\t"));
        }
        const textToCopy = cellValues.join("\n");
        navigator.clipboard.writeText(textToCopy);
        showToast("셀 범위가 클립보드에 복사되었습니다!", "success");
      } else {
        // 단일 셀 복사
        const cellValue = rows[rowIndex][field] || "";
        navigator.clipboard.writeText(cellValue);
        showToast("셀 값이 클립보드에 복사되었습니다!", "success");
      }
      return;
    }

    // Cmd/Ctrl + V: 셀 값 붙여넣기 (탭/줄바꿈으로 구분된 텍스트 파싱)
    if ((e.metaKey || e.ctrlKey) && e.key === "v") {
      e.preventDefault();
      navigator.clipboard
        .readText()
        .then((text) => {
          if (!text) return;

          // 텍스트를 파싱 (탭으로 열 구분, 줄바꿈으로 행 구분)
          const lines = text.split("\n").filter((line) => line.trim());
          if (lines.length === 0) return;

          // 시작 셀 결정 (범위 선택 중이면 시작 셀, 아니면 현재 셀)
          const currentRange = selectedCellRangeRef.current;
          const startRow = currentRange ? currentRange.start.rowIndex : rowIndex;
          const startField = currentRange ? currentRange.start.field : field;
          const startFieldIndex = fields.indexOf(startField);

          setRows((prevRows) => {
            const newRows = [...prevRows];
            lines.forEach((line, lineIndex) => {
              const values = line.split("\t");
              const targetRowIndex = startRow + lineIndex;

              if (targetRowIndex < newRows.length) {
                values.forEach((value, colIndex) => {
                  const targetFieldIndex = startFieldIndex + colIndex;
                  if (targetFieldIndex < fields.length) {
                    newRows[targetRowIndex] = {
                      ...newRows[targetRowIndex],
                      [fields[targetFieldIndex]]: value.trim(),
                    };
                  }
                });
              }
            });
            return newRows;
          });
          showToast("붙여넣었습니다!", "success");
        })
        .catch(() => {
          showToast("클립보드 읽기에 실패했습니다!", "error");
        });
      return;
    }

    // 방향키: 인접 셀로 이동 (범위 선택 중이면 시작점 기준)
    const arrowKeys = {
      ArrowUp: { rowDelta: -1, fieldDelta: 0, rowBoundCheck: (r) => r > 0 },
      ArrowDown: { rowDelta: 1, fieldDelta: 0, rowBoundCheck: (r) => r < rows.length - 1 },
      ArrowLeft: { rowDelta: 0, fieldDelta: -1, fieldBoundCheck: (f) => f > 0 },
      ArrowRight: { rowDelta: 0, fieldDelta: 1, fieldBoundCheck: (f) => f < fields.length - 1 },
    };

    const arrowConfig = arrowKeys[e.key];
    if (arrowConfig) {
      e.preventDefault();
      const currentRange = selectedCellRangeRef.current;

      if (currentRange) {
        // 범위 선택 중이면 시작점 기준으로 이동
        const startRow = currentRange.start.rowIndex;
        const startField = currentRange.start.field;
        const startFieldIndex = fields.indexOf(startField);

        const newRow = startRow + arrowConfig.rowDelta;
        const newFieldIndex = startFieldIndex + arrowConfig.fieldDelta;

        const canMoveRow = arrowConfig.rowBoundCheck ? arrowConfig.rowBoundCheck(startRow) : true;
        const canMoveField = arrowConfig.fieldBoundCheck ? arrowConfig.fieldBoundCheck(startFieldIndex) : true;

        if (canMoveRow && canMoveField) {
          setSelectedCell({
            rowIndex: newRow,
            field: arrowConfig.fieldDelta !== 0 ? fields[newFieldIndex] : startField
          });
          setSelectedCellRange(null);
        }
      } else {
        // 단일 셀 선택 중
        const currentFieldIndex = fields.indexOf(field);
        const newRow = rowIndex + arrowConfig.rowDelta;
        const newFieldIndex = currentFieldIndex + arrowConfig.fieldDelta;

        const canMoveRow = arrowConfig.rowBoundCheck ? arrowConfig.rowBoundCheck(rowIndex) : true;
        const canMoveField = arrowConfig.fieldBoundCheck ? arrowConfig.fieldBoundCheck(currentFieldIndex) : true;

        if (canMoveRow && canMoveField) {
          setSelectedCell({
            rowIndex: newRow,
            field: arrowConfig.fieldDelta !== 0 ? fields[newFieldIndex] : field
          });
          setSelectedCellRange(null);
        }
      }
      return;
    }

    // Enter 또는 문자 입력: 편집 모드로 전환
    if (e.key === "Enter" || (e.key.length === 1 && !e.ctrlKey && !e.metaKey)) {
      e.preventDefault();

      // 문자 입력인 경우 해당 문자로 시작
      if (e.key.length === 1 && e.key !== "Enter") {
        setRows((prevRows) =>
          prevRows.map((row, idx) =>
            idx === rowIndex ? { ...row, [field]: e.key } : row
          )
        );
      }

      // 셀 선택 해제 → 자동으로 input 렌더링 및 포커스
      setSelectedCell(null);
      setSelectedCellRange(null);
      // editingCell 설정 (포커스를 위해)
      setEditingCell({ rowIndex, field });

      return;
    }
  };

  return {
    selectedCell,
    selectedCellRange,
    setSelectedCell,
    setSelectedCellRange,
    handleCellSelectionKeyDown,
  };
};






