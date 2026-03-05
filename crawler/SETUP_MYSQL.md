# MySQL 데이터베이스 설정 가이드

## 방법 1: MySQL 클라이언트 사용 (권장)

### 1단계: MySQL에 접속

```bash
mysql -u root -p
```

비밀번호를 입력하면 MySQL 프롬프트가 나타납니다:
```
mysql>
```

### 2단계: 데이터베이스 생성

MySQL 프롬프트에서 다음 명령어 실행:

```sql
CREATE DATABASE lizard_festival CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3단계: 확인

```sql
SHOW DATABASES;
```

`lizard_festival`이 목록에 보이면 성공입니다.

### 4단계: 종료

```sql
exit;
```

---

## 방법 2: 한 줄 명령어로 실행

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS lizard_festival CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

---

## 방법 3: 스크립트 사용

```bash
cd crawler
chmod +x setup_database.sh
./setup_database.sh
```

환경변수로 MySQL 정보 설정 가능:
```bash
export MYSQL_USER=root
export MYSQL_PASSWORD=your_password
export MYSQL_HOST=localhost
./setup_database.sh
```

---

## 다음 단계: 환경변수 설정

데이터베이스 생성 후, 크롤러에서 사용할 수 있도록 환경변수를 설정하세요:

```bash
export DATABASE_URL='mysql+pymysql://root:비밀번호@localhost:3306/lizard_festival?charset=utf8mb4'
```

또는 `.env` 파일 생성:

```bash
cd crawler
cp .env.example .env
# .env 파일을 편집하여 DATABASE_URL 설정
```

---

## 문제 해결

### "command not found: mysql" 오류

MySQL 클라이언트가 설치되지 않았습니다.

**macOS:**
```bash
brew install mysql-client
```

**Ubuntu/Debian:**
```bash
sudo apt-get install mysql-client
```

### "Access denied" 오류

MySQL 사용자 권한이 없습니다. root 계정으로 접속하거나, 권한이 있는 계정을 사용하세요.

### 데이터베이스가 이미 존재하는 경우

```sql
DROP DATABASE IF EXISTS lizard_festival;
CREATE DATABASE lizard_festival CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

또는 기존 데이터베이스를 사용해도 됩니다 (테이블은 자동 생성됩니다).
