import { useEffect, useRef } from "react";

/**
 * UTM 테이블의 input 필드 컴포넌트
 * 편집 모드와 셀 선택 모드를 구분하여 렌더링
 * - 편집 모드: input 요소 (커서 있음)
 * - 셀 선택 모드: div 요소 (커서 없음, 키보드 네비게이션 가능)
 */
function UTMTableInput({
  value,
  field,
  rowId,
  rowIndex,
  placeholder,
  onChange,
  onFocus,
  onKeyDown,
  isEditing,
  isCellSelected,
  onCellClick,
}) {
  const divRef = useRef(null);

  const inputRef = useRef(null);

  // 셀 선택 모드일 때 div에 포커스
  useEffect(() => {
    if (isCellSelected && divRef.current) {
      divRef.current.focus();
    }
  }, [isCellSelected]);

  // 편집 모드일 때 input에 포커스
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // 셀 선택 모드: div 렌더링 (커서 없음, 포커스 가능)
  if (isCellSelected) {
    return (
      <div
        ref={divRef}
        onClick={() => onCellClick(rowIndex, field)}
        onKeyDown={(e) => onKeyDown(e, rowIndex, field)}
        data-row-index={rowIndex}
        data-field={field}
        tabIndex={0}
        className="w-full bg-transparent text-gray-300 px-2 py-1 text-sm min-h-[28px] cursor-text focus:outline-none"
      >
        {value || <span className="text-gray-600">{placeholder}</span>}
      </div>
    );
  }

  // 편집 모드 또는 기본: input 렌더링 (커서 있음)
  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(rowId, field, e.target.value)}
      onFocus={() => onFocus(field, rowIndex)}
      onKeyDown={(e) => onKeyDown(e, rowIndex, field)}
      data-row-index={rowIndex}
      data-field={field}
      placeholder={placeholder}
      className="w-full bg-transparent text-gray-300 px-2 py-1 focus:bg-[#1a2642] focus:outline-none text-sm"
    />
  );
}

export default UTMTableInput;
