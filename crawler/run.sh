#!/bin/bash
# 크롤러 실행 스크립트 (가상환경 자동 사용)

cd "$(dirname "$0")"

# 가상환경 확인
if [ ! -d ".venv" ]; then
    echo "✗ 가상환경(.venv)이 없습니다."
    echo "  먼저 가상환경을 생성하고 패키지를 설치하세요:"
    echo "  python3 -m venv .venv"
    echo "  .venv/bin/pip install -r requirements.txt"
    exit 1
fi

# 가상환경의 Python으로 실행
echo "크롤러 실행 중..."
.venv/bin/python main.py
