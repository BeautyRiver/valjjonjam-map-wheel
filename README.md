# valjjonjam-map-wheel

발로란트 맵 랜덤 룰렛 + Firebase 연동 팀짜기 툴킷.

## 기능
- 🎡 **맵 고르기**: 맵 룰렛 (제외 모드 지원)
- ⚔️ **팀짜기**: 디스코드 봇이 모은 멤버 정보를 Firebase에서 불러와 밸런스/랜덤/직접 팀 구성
- ⚡ **모집 자동 선택**: Discord 파티·발쫀컵의 참가 확정자와 대기자를 순서대로 불러와 팀 수에 맞게 체크하고, 인게임/내부 티어 기준으로 5명씩 여러 팀 구성

## 데이터 흐름
1. 디스코드 봇(`../valjjonjam_bot`)에서 멤버가 `/기본설정`으로 **학번·이름·발로닉·티어·역할군**을 등록
2. 봇이 Firestore `users` 컬렉션에 저장
3. 봇이 파티·발쫀컵의 팀 편성용 공개 필드(확정·대기 명단, 희망 티어대 포함)만 `toolkit_recruitments` 컬렉션에 동기화
4. 이 웹앱이 `users`와 `toolkit_recruitments`를 결합해 참가자를 자동 선택하고 팀을 구성

`events` 원본에 저장되는 참가비·예금주·계좌번호는 웹에서 읽지 않으며,
`toolkit_recruitments`에도 복사하지 않습니다.

## 설정 방법
### 1) Firebase 웹 설정값 채우기
`config.js`를 열고 Firebase 콘솔 값으로 교체:
- Firebase 콘솔 > 프로젝트 설정(⚙️) > "내 앱" > 웹 앱(`</>`)
- 웹 앱이 없으면 **앱 추가 > 웹**으로 하나 생성
- `apiKey`, `messagingSenderId`, `appId`를 복사해 붙여넣기 (나머지는 미리 채워둠)

### 2) Firestore 보안 규칙 적용
`firestore.rules` 내용을 Firebase 콘솔 > Firestore Database > 규칙 에 붙여넣고 게시.
- `users`, `toolkit_recruitments`: 공개 읽기 / 클라이언트 쓰기 차단 (쓰기는 봇의 Admin SDK만)
- `parties`, `events`: 웹 접근 차단 유지
- ⚠️ `users` 문서 전체(학번·발로ID 포함)가 공개 읽기로 노출됩니다. 내부용으로만 사용하세요.

## 실행
정적 파일이라 로컬 서버로 열면 됩니다:
```bash
python -m http.server 8000   # http://localhost:8000
```
