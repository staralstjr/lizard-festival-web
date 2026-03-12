export const parseEventDate = (dateStr: string): Date => {
  const currentYear = 2026;
  // (당일) 등의 텍스트 제거 후 파싱
  const cleanDate = dateStr.replace(/\(당일\)/g, '').trim();

  const yearMatch = cleanDate.match(/(\d{4})/);
  const monthMatch = cleanDate.match(/(\d{1,2})[월\.\/-]/);
  const dayMatch = cleanDate.match(/(\d{1,2})[일\.\/-]?/);

  if (yearMatch && monthMatch && dayMatch) {
    const year = parseInt(yearMatch[1]);
    const dateParts = cleanDate.match(/(\d{4})[^\d]+(\d{1,2})[^\d]+(\d{1,2})/);
    if (dateParts) {
      return new Date(
        parseInt(dateParts[1]),
        parseInt(dateParts[2]) - 1,
        parseInt(dateParts[3]),
      );
    }
  }

  const koDateMatch = cleanDate.match(/(\d{1,2})월\s*(\d{1,2})/);
  if (koDateMatch) {
    return new Date(
      currentYear,
      parseInt(koDateMatch[1]) - 1,
      parseInt(koDateMatch[2]),
    );
  }

  const dotMatch = cleanDate.match(/(\d{1,2})\.(\d{1,2})/);
  if (dotMatch) {
    return new Date(
      currentYear,
      parseInt(dotMatch[1]) - 1,
      parseInt(dotMatch[2]),
    );
  }

  return new Date(cleanDate.split('~')[0].trim().replace(/\./g, '-'));
};

export const isFutureEvent = (dateStr: string): boolean => {
  if (dateStr.includes('2025')) return false;
  try {
    const eventDate = parseEventDate(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate >= today;
  } catch {
    return false;
  }
};

export const formatEventDate = (dateStr: string): string => {
  try {
    // 1. 범위 날짜인 경우
    if (dateStr.includes('~')) {
      const parts = dateStr.split('~');
      const start = parseEventDate(parts[0]);
      let endStr = parts[1].trim();
      if (!endStr.includes('월') && !endStr.includes('.')) {
        const dayOnly = endStr.match(/\d+/)?.[0] || endStr;
        endStr = `${start.getMonth() + 1}월 ${dayOnly}`;
      }
      const end = parseEventDate(endStr);
      return `${start.getMonth() + 1}월 ${start.getDate()}일 ~ ${end.getMonth() + 1}월 ${end.getDate()}일`;
    }

    // 2. 🔥 [업데이트] 당일 행사 체크된 경우
    if (dateStr.includes('(당일)')) {
      const start = parseEventDate(dateStr);
      return `${start.getMonth() + 1}월 ${start.getDate()}일 (당일)`;
    }

    // 3. 단일 날짜 (자동 +1일)
    const start = parseEventDate(dateStr);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    return `${start.getMonth() + 1}월 ${start.getDate()}일 ~ ${end.getMonth() + 1}월 ${end.getDate()}일`;
  } catch {
    return dateStr;
  }
};

export const getDDay = (dateStr: string): string => {
  const target = parseEventDate(dateStr);
  if (isNaN(target.getTime())) return '-';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diff < 0) return '종료';
  return diff === 0 ? 'D-Day' : `D-${diff}`;
};
