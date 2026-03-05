#!/bin/bash
# 크롤러 의존성 패키지 설치 스크립트

cd "$(dirname "$0")"

echo "크롤러 의존성 패키지 설치 중..."
echo "================================"

# 가상환경 확인
if [ ! -d ".venv" ]; then
    echo "가상환경이 없습니다. 생성 중..."
    python3 -m venv .venv
fi

# 가상환경의 pip로 패키지 설치
echo ""
echo "패키지 설치 중..."
.venv/bin/pip install --upgrade pip
.venv/bin/pip install -r requirements.txt

echo ""
echo "✓ 설치 완료!"
echo ""
echo "크롤러 실행 방법:"
echo "  .venv/bin/python main.py"
echo "  또는"
echo "  ./run.sh"
