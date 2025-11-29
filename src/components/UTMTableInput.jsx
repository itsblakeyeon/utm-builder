/**
 * UTM 테이블의 input 필드 컴포넌트
 * 모든 input 필드에 공통으로 사용되는 속성과 이벤트 핸들러를 캡슐화
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
  onCompositionStart,
  onCompositionEnd,
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(rowId, field, e.target.value)}
      onFocus={() => onFocus(field, rowIndex)}
      onCompositionStart={onCompositionStart}
      onCompositionEnd={onCompositionEnd}
      onKeyDown={(e) => onKeyDown(e, rowIndex, field)}
      data-row-index={rowIndex}
      data-field={field}
      placeholder={placeholder}
      className="w-full bg-transparent text-gray-300 px-2 py-1 focus:bg-[#1a2642] focus:outline-none text-sm"
    />
  );
}

export default UTMTableInput;
