// localStorage 키
export const STORAGE_KEYS = {
  ROWS: 'utmBuilderRows',
  SAVED: 'utmBuilderSaved'
};

// 디바운스 시간 (밀리초)
export const DEBOUNCE_DELAY = 500;

// 편집 가능한 필드 목록
export const FIELDS = ["baseUrl", "source", "medium", "campaign", "term", "content"];

// 필드 설정 (placeholder 포함)
export const FIELD_CONFIG = [
  { key: "baseUrl", placeholder: "https://example.com" },
  { key: "source", placeholder: "google" },
  { key: "medium", placeholder: "cpc" },
  { key: "campaign", placeholder: "spring_sale" },
  { key: "term", placeholder: "running shoes" },
  { key: "content", placeholder: "banner_ad" },
];
