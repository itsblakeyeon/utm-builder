/**
 * URL의 유효성을 검사합니다
 * @param {string} url - 검사할 URL
 * @returns {Object} { valid: boolean, message: string }
 */
export const validateUrl = (url) => {
  // 빈 문자열이면 검사하지 않음
  if (!url || url.trim() === "") {
    return { valid: true, message: "" };
  }

  const trimmedUrl = url.trim();

  // 공백이 포함되어 있으면 오류
  if (url !== trimmedUrl || trimmedUrl.includes(" ")) {
    return { valid: false, message: "URL에 공백이 포함되어 있습니다" };
  }

  // 프로토콜이 없으면 자동으로 https:// 추가
  let fullUrl = trimmedUrl;
  if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
    fullUrl = `https://${trimmedUrl}`;
  }

  try {
    const urlObj = new URL(fullUrl);

    // 프로토콜 검증 (http 또는 https만 허용)
    if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
      return {
        valid: false,
        message: "http:// 또는 https:// 프로토콜만 사용할 수 있습니다",
      };
    }

    // 호스트명 검증 (도메인이 비어있으면 안됨)
    if (!urlObj.hostname || urlObj.hostname.length === 0) {
      return { valid: false, message: "올바른 도메인을 입력해주세요" };
    }

    // 호스트명에 최소한 하나의 점이 있어야 함 (도메인 형식)
    if (!urlObj.hostname.includes(".")) {
      return {
        valid: false,
        message: "올바른 도메인 형식이 아닙니다 (예: example.com)",
      };
    }

    // 호스트명이 너무 짧으면 오류 (최소 3자: a.b)
    if (urlObj.hostname.length < 3) {
      return { valid: false, message: "도메인이 너무 짧습니다" };
    }

    // 특수문자 검증 (일부 특수문자는 URL 인코딩되어야 함)
    const invalidChars = /[<>"`]/;
    if (invalidChars.test(trimmedUrl)) {
      return {
        valid: false,
        message: "URL에 사용할 수 없는 문자가 포함되어 있습니다",
      };
    }

    return { valid: true, message: "" };
  } catch (error) {
    // 더 구체적인 오류 메시지
    if (error.message.includes("Invalid URL")) {
      return { valid: false, message: "올바른 URL 형식이 아닙니다" };
    }
    return { valid: false, message: "URL 형식이 올바르지 않습니다" };
  }
};

/**
 * 필수 필드들이 모두 채워졌는지 검사합니다
 * @param {Object} row - 행 데이터
 * @returns {boolean}
 */
export const hasRequiredFields = (row) => {
  return !!(row.baseUrl && row.source && row.medium && row.campaign);
};
