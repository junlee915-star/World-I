# BookWorld
종교, 철학, 수학, 물리학을 깊게 다루는 책 소개 유튜브를 제작하고 공유한다. 삶의 깊은 의미를 4대 관점으로 바라본다.

## 웹사이트 (WORLD&I)

정적 프런트엔드(`public/index.html`) + Cloudflare Pages Functions(`functions/`) + Neon Postgres 구성.
회원가입/로그인/"나에게 묻는 질문" 기록 저장은 실제 백엔드(Neon DB)에 저장되고, 그 외 콘텐츠(북카드 본문, 투표 후보 등)는 아직 정적 데이터입니다.

### 로컬 개발

1. `npm install`
2. Neon 프로젝트를 만들고(https://neon.tech), SQL 편집기나 `psql`로 `schema.sql`을 실행해 테이블을 생성합니다.
3. `.dev.vars.example`을 `.dev.vars`로 복사하고 Neon 연결 문자열(`DATABASE_URL`)을 채웁니다. (`.dev.vars`는 git에 커밋되지 않습니다.)
4. `npm run dev` — `http://localhost:8788`에서 정적 페이지와 `/api/*` 함수가 함께 뜹니다.

### 배포 (Cloudflare Pages)

1. `npx wrangler login`으로 Cloudflare 계정 인증.
2. Cloudflare 대시보드 또는 `npx wrangler pages project create bookworld`로 Pages 프로젝트 생성.
3. Cloudflare 대시보드 → 해당 프로젝트 → Settings → Environment variables에 `DATABASE_URL`(Neon 연결 문자열)을 Production/Preview 각각 등록.
4. `npm run deploy`로 배포. (또는 GitHub 저장소를 Pages 프로젝트에 연결해 자동 배포)

### 폴더 구조

- `public/index.html` — 정적 프런트엔드 (해시 라우팅 SPA)
- `functions/api/*` — Cloudflare Pages Functions로 구현한 백엔드 API (회원가입/로그인/기록 CRUD)
- `functions/_lib/*` — DB 연결, 비밀번호 해시, 세션 처리 등 공용 로직
- `schema.sql` — Neon에 적용할 테이블 정의 (`users`, `sessions`, `responses`)
