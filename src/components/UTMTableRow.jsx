import { buildUTMUrl } from "../utils/urlBuilder";
import UTMTableInput from "./UTMTableInput";
import { FIELD_CONFIG } from "../constants";

/**
 * UTM 테이블의 개별 행을 렌더링하는 컴포넌트
 */
function UTMTableRow({
  row,
  index,
  editingCell,
  selectedCell,
  selectedCellRange,
  selectedRowIndex,
  selectedRange,
  onToggleSelect,
  onChange,
  onInputFocus,
  onKeyDown,
  onCellSelectionKeyDown,
  onCopyUrl,
  onDeleteRow,
  onRowSelectionKeyDown,
  onCellClick,
}) {
  const generatedUrl = buildUTMUrl(row);

  // 범위 선택 내에 있는지 확인
  const isInRange =
    selectedRange &&
    index >= Math.min(selectedRange.start, selectedRange.end) &&
    index <= Math.max(selectedRange.start, selectedRange.end);

  // 행이 선택되었는지 확인 (단일 선택 또는 범위 선택)
  const isRowSelected = selectedRowIndex === index || isInRange;

  return (
    <tr
      key={row.id}
      data-row-index={index}
      tabIndex={isRowSelected ? 0 : -1}
      onKeyDown={(e) => isRowSelected && onRowSelectionKeyDown(e, index)}
      className={`${
        isRowSelected
          ? "bg-blue-900 ring-2 ring-blue-500"
          : "hover:bg-[#1a2642]"
      }`}
    >
      {/* 체크박스 */}
      <td className="px-3 py-2 text-center border-r border-b border-gray-700">
        <input
          type="checkbox"
          checked={row.selected || false}
          onChange={() => onToggleSelect(row.id)}
          className="w-4 h-4 cursor-pointer"
        />
      </td>

      {/* 행 번호 */}
      <td className="px-3 py-2 text-center text-gray-300 text-sm border-r border-b border-gray-700">
        {index + 1}
      </td>

      {/* 입력 필드들 */}
      {FIELD_CONFIG.map((field) => {
        // 단일 셀 선택 확인
        const isCellSelected =
          selectedCell &&
          selectedCell.rowIndex === index &&
          selectedCell.field === field.key;

        // 셀 범위 선택 내에 있는지 확인
        const isInCellRange =
          selectedCellRange &&
          index >=
            Math.min(
              selectedCellRange.start.rowIndex,
              selectedCellRange.end.rowIndex
            ) &&
          index <=
            Math.max(
              selectedCellRange.start.rowIndex,
              selectedCellRange.end.rowIndex
            );

        // 필드가 범위 내에 있는지 확인
        const currentFieldIndex = FIELD_CONFIG.findIndex((f) => f.key === field.key);
        const startFieldIndex = selectedCellRange
          ? FIELD_CONFIG.findIndex((f) => f.key === selectedCellRange.start.field)
          : -1;
        const endFieldIndex = selectedCellRange
          ? FIELD_CONFIG.findIndex((f) => f.key === selectedCellRange.end.field)
          : -1;

        const isFieldInRange =
          selectedCellRange &&
          currentFieldIndex >= Math.min(startFieldIndex, endFieldIndex) &&
          currentFieldIndex <= Math.max(startFieldIndex, endFieldIndex);

        const isCellInRange = isInCellRange && isFieldInRange;

        // 편집 모드 확인
        const isEditing =
          editingCell &&
          editingCell.rowIndex === index &&
          editingCell.field === field.key;

        return (
          <td
            key={field.key}
            className={`px-2 py-1 border-r border-b border-gray-700 ${
              isCellSelected || isCellInRange
                ? "bg-blue-800 ring-1 ring-blue-400"
                : ""
            }`}
          >
            <UTMTableInput
              value={row[field.key]}
              field={field.key}
              rowId={row.id}
              rowIndex={index}
              placeholder={field.placeholder}
              onChange={onChange}
              onFocus={onInputFocus}
              onKeyDown={
                isEditing
                  ? onKeyDown  // 편집 모드: 일반 키보드 네비게이션
                  : (isCellSelected || isCellInRange)
                    ? (e) => onCellSelectionKeyDown(e, index, field.key)  // 셀 선택 모드
                    : onKeyDown  // 기본
              }
              isEditing={isEditing}
              isCellSelected={isCellSelected}
              onCellClick={onCellClick}
            />
          </td>
        );
      })}

      {/* 생성된 URL */}
      <td
        className={`px-2 py-1 border-r border-b border-gray-700 ${
          isRowSelected ? "" : "bg-[#0f1626]"
        }`}
      >
        <div
          className={`text-sm max-w-sm overflow-x-auto whitespace-nowrap ${
            generatedUrl ? "text-blue-400" : "text-gray-500 italic"
          }`}
        >
          {generatedUrl || ""}
        </div>
      </td>

      {/* 액션 버튼 */}
      <td className="px-2 py-1 border-b border-gray-700">
        <div className="flex gap-1 justify-center">
          <button
            onClick={() => onCopyUrl(row)}
            disabled={!generatedUrl}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-2 py-1 rounded text-xs transition duration-200"
          >
            복사
          </button>
          <button
            onClick={() => onDeleteRow(row.id)}
            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition duration-200"
          >
            삭제
          </button>
        </div>
      </td>
    </tr>
  );
}

export default UTMTableRow;
