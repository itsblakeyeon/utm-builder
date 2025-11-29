/**
 * UTM 파라미터로 완전한 URL을 생성합니다
 * @param {Object} params - UTM 파라미터 객체
 * @param {string} params.baseUrl - 기본 URL (필수)
 * @param {string} params.source - utm_source (선택)
 * @param {string} params.medium - utm_medium (선택)
 * @param {string} params.campaign - utm_campaign (선택)
 * @param {string} params.term - utm_term (선택)
 * @param {string} params.content - utm_content (선택)
 * @returns {string} 생성된 UTM URL
 */
export const buildUTMUrl = ({
  baseUrl,
  source,
  medium,
  campaign,
  term,
  content,
}) => {
  // baseUrl이 없으면 빈 문자열 반환
  if (!baseUrl) {
    return "";
  }

  try {
    // URL에 프로토콜이 없으면 https:// 추가
    const fullUrl = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
    const url = new URL(fullUrl);

    // UTM 파라미터가 있으면 추가
    if (source) url.searchParams.set("utm_source", source);
    if (medium) url.searchParams.set("utm_medium", medium);
    if (campaign) url.searchParams.set("utm_campaign", campaign);
    if (term) url.searchParams.set("utm_term", term);
    if (content) url.searchParams.set("utm_content", content);

    return url.toString();
  } catch (error) {
    // URL이 유효하지 않으면 빈 문자열 반환
    return "";
  }
};
