# 인수인계: 성인용 "오늘 뭐 입지?" 앱

이 폴더는 유아용 앱 **"오늘 뭐 입혀?"**(`../weather_clothes`)의 코드를 그대로 복사한 출발점이에요.
목표는 이 코드를 **성인용 날씨 기반 옷차림 추천 앱 "오늘 뭐 입지?"**로 바꾸는 거예요.

> 새 세션에서는 이 파일을 먼저 읽고, 아래 "바꿀 것" 체크리스트를 사용자와 상의해서 진행하세요.
> 유아용 폴더(`../weather_clothes`)는 수정하지 마세요. 별개의 운영 중인 앱이에요.

---

## 1. 유아용 앱 요약 (2026-10-13~14 작업)

- **스택**: React 18 + Vite 5 (JavaScript), PWA(vite-plugin-pwa), 서버 없음
- **배포**: GitHub Pages — https://kmddkkim.github.io/weather-clothes/ (저장소 `KMDDKKIM/weather-clothes`, 공개)
- **데이터**: Open-Meteo 날씨·미세먼지 API(무료, 키 없음), OpenStreetMap Nominatim 동네 검색(무료, 키 없음)
- **저장**: 모두 브라우저 localStorage (서버 없음)

### 핵심 아이디어 (성인용에도 그대로 유효)
- **안에 입는 옷(상의·하의)** = 밖에 있는 동안의 **낮 최고 체감온도** 기준 → "낮에 덥지 않을까?"
- **겉옷·내복** = 오갈 때(등원·하원) 중 **더 추운 시간** 기준 → "오갈 때 춥지 않을까?"
- 일교차가 크면(8° 이상) "벗기 쉬운 겉옷" 안내
- 추운 날의 "더위" 걱정은 실내 난방 때문 → 두꺼운 한 벌보다 겹쳐 입기
- 옷은 **아이템 단위 카탈로그**(적정 체감온도 범위 + ideal), 날씨에 맞는 옷을 **고르게 하지 않고 한 번에** 보여줌 (가장 잘 맞는 것 크게, 나머지 "이것도 괜찮아요")

### 파일 구조
| 파일 | 역할 | 성인용에서 |
|---|---|---|
| `src/lib/weather.js` | Open-Meteo 호출, 날씨 코드·미세먼지 등급 | **그대로 재사용** |
| `src/lib/geocode.js` | 동네 검색, 현재 위치 이름 | **그대로 재사용** |
| `src/lib/feedback.js` | 피드백 → 보정값 학습 (낮/오갈 때 분리) | 거의 그대로 (저장 키만 변경) |
| `src/lib/outfit.js` | 추천 로직, 문구(헤드라인·걱정 카드·챙길 것) | **문구·용어 대폭 수정** |
| `src/lib/clothes.js` | 옷 카탈로그 + 온도 범위 | **성인 옷으로 새로 작성** |
| `src/lib/colors.js` | 색 조합표(코디 조합표 참고), 쿨/웜톤 | 조합표는 재사용 가능, 색 목록 조정 |
| `src/lib/shop.js` | 색+옷 이름으로 쇼핑 검색 링크 (광고 자리) | 검색어에서 "아동" 제거 |
| `src/App.jsx` | 화면 전체, 설정, 탭(오늘/내일/색 조합) | 용어 수정 |
| `src/ColorPage.jsx` | 색 조합 페이지 | 거의 그대로 |
| `src/FeedbackCard.jsx` | "오늘 옷차림 어땠어요?" | 문구 수정 |
| `src/InstallBanner.jsx` | 홈 화면 설치 안내 (카톡 인앱 → 외부 브라우저) | 그대로 |
| `vite.config.js` | base 경로, PWA 매니페스트 | **이름·경로 변경 필수** |

---

## 2. ⚠️ 반드시 바꿀 것 (안 바꾸면 고장)

1. **localStorage 키 이름** — 두 앱 모두 `kmddkkim.github.io`에 올라가면 저장 공간을 공유해서 설정이 서로 덮어써져요.
   - `weather-clothes-settings` (App.jsx)
   - `weather-clothes-feedback` (lib/feedback.js)
   - `weather-clothes-install-dismissed` (InstallBanner.jsx)
   → 예: `what-to-wear-...` 로 변경
2. **`vite.config.js`의 base 경로** `/weather-clothes/` → 새 저장소 이름에 맞게 (예: `/what-to-wear/`)
3. **PWA 매니페스트** 이름(`오늘 뭐 입혀?` / `뭐 입혀?`), 설명, 색상
4. **`index.html`** 제목·description·og 태그, apple-mobile-web-app-title
5. **`package.json`** name
6. **아이콘** `public/` — 유아용과 구별되게 새로 (지금은 웃는 흰 티셔츠 + 해, 주황 배경)
   - 아이콘 PNG는 sharp로 SVG에서 생성했음 (scratchpad에 sharp 설치 후 192/512/180 크기 변환)
7. 이 폴더는 **아직 git 저장소가 아님** → `git init` 후 새 GitHub 저장소 생성

## 3. 성인용으로 바꿀 것 (사용자와 상의할 항목)

- **시간 기준**: 등원·하원 → **출근·퇴근** (기본값 예: 08:00 / 19:00). "원에 있는 동안" → "밖에 있는 동안/회사에 있는 동안"
- **실내 환경**: 원 난방 → **사무실 냉난방** (여름 에어컨 때문에 얇은 겉옷 필요 등)
- **옷 카탈로그**: 셔츠, 블라우스, 니트, 슬랙스, 치마, 원피스, 트렌치코트, 코트, 경량패딩, 롱패딩 등. 성별/스타일(캐주얼·오피스) 선택 여부 상의
- **"엄마 걱정" 카드** → 성인 관점 문구 ("점심때 덥지 않을까?", "퇴근길 춥지 않을까?")
- **성향 설정**: "우리 아이는" → "나는 더위/추위를 많이 타요"
- **챙길 것**: 우산, 선크림, 마스크, 텀블러 등 / 여벌옷은 빼기
- **쿨/웜톤**: 성인에게는 퍼스널컬러가 유아보다 의미가 큼 → 더 비중 있게 써도 됨
- **광고/쇼핑**: 성인 의류 브랜드, 검색어에서 "아동" 제거
- 색 조합표의 "아이 옷에 흔한 색"(연핑크·라벤더 하의 등)은 성인용에 맞게 정리

---

## 4. 배포 방법 (유아용에서 겪은 것)

- `gh`는 `KMDDKKIM` 계정으로 로그인돼 있음. **토큰에 `workflow` 권한이 없어서** GitHub Actions 자동배포 파일은 푸시가 거절됨
  → `gh-pages` 패키지로 `npm run deploy` (= `vite build && gh-pages -d dist`) 방식 사용
- 저장소 생성: `gh repo create <이름> --public --source . --remote origin --push`
- Pages 설정: `gh api -X POST repos/KMDDKKIM/<이름>/pages -f build_type=legacy -f "source[branch]=gh-pages" -f "source[path]=/"`
  (첫 배포 후 사이트가 404면 `gh api -X POST repos/KMDDKKIM/<이름>/pages/builds`로 빌드를 한 번 직접 실행)
- 공개 저장소라서 **커밋 작성자는 GitHub noreply 이메일**로 저장소 로컬 설정
  (`git config user.email "<id>+KMDDKKIM@users.noreply.github.com"`, id는 `gh api user --jq .id`)
- 커밋 메시지 끝에 Co-Authored-By 줄
- `npm install` 시 esbuild install script 경고(allow-scripts)가 떠도 빌드는 정상 동작함
- `vite preview`로 배포본 확인할 때도 base 경로가 맞게 `isPreview` 처리돼 있음 (vite.config.js)

## 5. 사용자 작업 스타일

- 한국어로 소통, 개발 비전문가 → 쉬운 말로, 결과 위주로 설명
- **"너무 번잡하지 않게"**를 중요하게 생각함 → 기능을 넣을 때 화면을 단순하게
- 직접 써보며 의견을 주는 방식 → 작업 후 브라우저(모바일 크기)에서 확인하고 보여주기
- 아이디어를 내면 의견을 먼저 듣고 싶어 함 (예: 쿨/웜톤은 "너무 복잡할까?" 물어봄)
- 장기 목표: 날씨에 어울리는 **다른 회사 옷 광고**로 수익화 → 추천과 광고 영역은 분리, 광고 표기 필수

## 6. 시작 방법

```bash
npm install
npm run dev
```
http://localhost:5173 에서 확인 (launch 설정 `.claude/launch.json`에 `web`, `preview-build` 있음)
