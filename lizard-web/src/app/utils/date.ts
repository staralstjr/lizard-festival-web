export const parseEventDate = (dateStr: string): Date => {
  const currentYear = 2026;

  // 1. [Full Date] "2025.03.15" 또는 "2026.04.25"
  const yearMatch = dateStr.match(/(\d{4})/);
  const monthMatch = dateStr.match(/(\d{1,2})[월\.\/-]/);
  const dayMatch = dateStr.match(/(\d{1,2})[일\.\/-]?/);

  if (yearMatch && monthMatch && dayMatch) {
    const year = parseInt(yearMatch[1]);
    const month =
      parseInt(monthMatch[1]) === year
        ? parseInt(dateStr.match(/[월\.\/-](\d{1,2})/)?.[1] || '1')
        : parseInt(monthMatch[1]);

    const dateParts = dateStr.match(/(\d{4})[^\d]+(\d{1,2})[^\d]+(\d{1,2})/);
    if (dateParts) {
      return new Date(
        parseInt(dateParts[1]),
        parseInt(dateParts[2]) - 1,
        parseInt(dateParts[3]),
      );
    }
  }

  // 2. 연도가 없는 경우 (💡 '일' 글자가 누락된 "4월 25" 같은 경우도 완벽 방어)
  const koDateMatch = dateStr.match(/(\d{1,2})월\s*(\d{1,2})/);
  if (koDateMatch) {
    return new Date(
      currentYear,
      parseInt(koDateMatch[1]) - 1,
      parseInt(koDateMatch[2]),
    );
  }

  const dotMatch = dateStr.match(/(\d{1,2})\.(\d{1,2})/);
  if (dotMatch) {
    return new Date(
      currentYear,
      parseInt(dotMatch[1]) - 1,
      parseInt(dotMatch[2]),
    );
  }

  return new Date(dateStr.split('~')[0].trim().replace(/\./g, '-'));
};

export const isFutureEvent = (dateStr: string): boolean => {
  if (dateStr.includes('2025')) return false;

  try {
    const eventDate = parseEventDate(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (eventDate.getFullYear() < 2026) return false;

    return eventDate >= today;
  } catch {
    return false;
  }
};

export const formatEventDate = (dateStr: string): string => {
  try {
    // 1. '~'가 포함된 범위 날짜인 경우 (기존 로직 유지)
    if (dateStr.includes('~')) {
      const parts = dateStr.split('~');
      const startStr = parts[0].trim();
      let endStr = parts[1].trim();

      const start = parseEventDate(startStr);

      // 끝나는 날짜에 '월'이나 '.'이 없다면 시작 월을 빌려옴
      if (!endStr.includes('월') && !endStr.includes('.')) {
        // 숫자만 남기고 월 정보를 결합 (ex: "8" -> "3월 8")
        const dayOnly = endStr.match(/\d+/)?.[0] || endStr;
        endStr = `${start.getMonth() + 1}월 ${dayOnly}`;
      }

      const end = parseEventDate(endStr);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return dateStr;
      }

      return `${start.getMonth() + 1}월 ${start.getDate()}일 ~ ${end.getMonth() + 1}월 ${end.getDate()}일`;
    }

    // 2. 🔥 [핵심 추가] '~'가 없는 단일 날짜인 경우 -> 자동으로 +1일 계산
    const start = parseEventDate(dateStr);
    if (isNaN(start.getTime())) return dateStr;

    // 시작 날짜를 기준으로 종료 날짜(+1일) 생성
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    // 출력 예시: "3월 7일 ~ 3월 8일"
    return `${start.getMonth() + 1}월 ${start.getDate()}일 ~ ${end.getMonth() + 1}월 ${end.getDate()}일`;
  } catch {
    return dateStr; // 에러 발생 시 원본 텍스트 반환
  }
};

export const getDDay = (dateStr: string): string => {
  const target = parseEventDate(dateStr);

  // 파싱에 실패했을 경우 예외 처리
  if (isNaN(target.getTime())) return '-';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diff = Math.ceil(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (target.getFullYear() < 2026 || diff < 0) return '종료';
  return diff === 0 ? 'D-Day' : `D-${diff}`;
};
