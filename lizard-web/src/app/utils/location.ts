/**
 * 📍 지역명 뒤의 불필요한 조사(에, 에서)를 제거하는 유틸리티
 * ex: "광주에" -> "광주", "서울에서" -> "서울"
 */
export const normalizeLocation = (location: string): string => {
  if (!location) return '지역미정';

  // '에' 또는 '에서'로 끝나는 경우 해당 부분을 제거
  // 정규식 설명: (에|에서)$ -> 문자열 끝($)에 붙은 '에' 또는 '에서'를 찾음
  return location.replace(/(에|에서)$/, '').trim();
};
