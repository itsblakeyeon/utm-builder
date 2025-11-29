import { useState } from "react";
import { createRowFromCopied } from "../utils/rowFactory";

/**
 * 행 복사/붙여넣기 기능을 제공하는 훅
 * @returns {Object} { copiedRow, copiedRows, copyRow, copyRows, pasteRow, pasteRows, hasCopiedRow }
 */
export const useRowClipboard = () => {
  const [copiedRow, setCopiedRow] = useState(null);
  const [copiedRows, setCopiedRows] = useState(null);

  /**
   * 행을 클립보드에 복사 (단일 행)
   * @param {Object} row - 복사할 행 데이터
   * @returns {boolean} 성공 여부
   */
  const copyRow = (row) => {
    setCopiedRow({ ...row });
    setCopiedRows(null); // 단일 복사 시 멀티 복사 초기화
    return true;
  };

  /**
   * 여러 행을 클립보드에 복사
   * @param {Array} rows - 복사할 행 데이터 배열
   * @returns {boolean} 성공 여부
   */
  const copyRows = (rows) => {
    if (rows && rows.length > 0) {
      setCopiedRows(rows.map((row) => ({ ...row })));
      setCopiedRow(null); // 멀티 복사 시 단일 복사 초기화
      return true;
    }
    return false;
  };

  /**
   * 클립보드의 행을 특정 위치에 붙여넣기 (단일 행)
   * @param {Array} rows - 현재 행 배열
   * @param {number} rowIndex - 붙여넣을 위치 (해당 인덱스 다음에 삽입)
   * @returns {Object} { success: boolean, newRows: Array, insertedIndex: number }
   */
  const pasteRow = (rows, rowIndex) => {
    if (!copiedRow && !copiedRows) {
      return { success: false };
    }

    // 멀티 복사가 있으면 멀티 붙여넣기 사용
    if (copiedRows && copiedRows.length > 0) {
      return pasteRows(rows, rowIndex);
    }

    // 단일 복사
    if (copiedRow) {
      const newRow = createRowFromCopied(copiedRow);
      const newRows = [
        ...rows.slice(0, rowIndex + 1),
        newRow,
        ...rows.slice(rowIndex + 1),
      ];

      return {
        success: true,
        newRows,
        insertedIndex: rowIndex + 1,
      };
    }

    return { success: false };
  };

  /**
   * 클립보드의 여러 행을 특정 위치에 붙여넣기
   * @param {Array} rows - 현재 행 배열
   * @param {number} rowIndex - 붙여넣을 위치 (해당 인덱스 다음에 삽입)
   * @returns {Object} { success: boolean, newRows: Array, insertedIndex: number }
   */
  const pasteRows = (rows, rowIndex) => {
    if (!copiedRows || copiedRows.length === 0) {
      // 멀티 복사가 없으면 단일 복사 사용
      return pasteRow(rows, rowIndex);
    }

    const newRows = copiedRows.map((row) => createRowFromCopied(row));
    const updatedRows = [
      ...rows.slice(0, rowIndex + 1),
      ...newRows,
      ...rows.slice(rowIndex + 1),
    ];

    return {
      success: true,
      newRows: updatedRows,
      insertedIndex: rowIndex + 1,
    };
  };

  return {
    copiedRow,
    copiedRows,
    copyRow,
    copyRows,
    pasteRow,
    pasteRows,
    hasCopiedRow:
      copiedRow !== null || (copiedRows !== null && copiedRows.length > 0),
  };
};
