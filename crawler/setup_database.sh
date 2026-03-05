#!/bin/bash
# MySQL 데이터베이스 생성 스크립트

echo "MySQL 데이터베이스 생성 스크립트"
echo "================================"
echo ""

# MySQL 접속 정보 (필요시 수정)
DB_USER="${MYSQL_USER:-root}"
DB_PASSWORD="${MYSQL_PASSWORD:-}"
DB_HOST="${MYSQL_HOST:-localhost}"
DB_PORT="${MYSQL_PORT:-3306}"
DB_NAME="lizard_festival"

echo "데이터베이스 정보:"
echo "  호스트: $DB_HOST:$DB_PORT"
echo "  사용자: $DB_USER"
echo "  데이터베이스명: $DB_NAME"
echo ""

# 비밀번호가 있으면 -p 옵션 추가
if [ -z "$DB_PASSWORD" ]; then
    MYSQL_CMD="mysql -h $DB_HOST -P $DB_PORT -u $DB_USER"
else
    MYSQL_CMD="mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD"
fi

# 데이터베이스 생성
echo "데이터베이스 생성 중..."
$MYSQL_CMD -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

if [ $? -eq 0 ]; then
    echo "✓ 데이터베이스 '$DB_NAME' 생성 완료!"
    echo ""
    echo "다음 단계:"
    echo "1. 환경변수 설정:"
    echo "   export DATABASE_URL='mysql+pymysql://$DB_USER:비밀번호@$DB_HOST:$DB_PORT/$DB_NAME?charset=utf8mb4'"
    echo ""
    echo "2. 크롤러 실행:"
    echo "   python main.py"
else
    echo "✗ 데이터베이스 생성 실패"
    echo ""
    echo "수동으로 생성하려면:"
    echo "  mysql -u $DB_USER -p"
    echo "  CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    exit 1
fi
