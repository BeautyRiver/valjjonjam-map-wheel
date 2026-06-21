# valjjonjam-map-wheel

발로란트 맵 랜덤 룰렛 + Firebase 연동 팀짜기 툴킷.

## 기능
- 🎡 **맵 고르기**: 맵 룰렛 (제외 모드 지원)
- ⚔️ **팀짜기**: 디스코드 봇이 모은 멤버 정보를 Firebase에서 불러와 밸런스/랜덤/직접 팀 구성

## 데이터 흐름
1. 디스코드 봇(`../valjjonjam_bot`)에서 멤버가 `/기본설정`으로 **학번·이름·발로닉·티어·역할군**을 등록
2. 봇이 Firestore `users` 컬렉션에 저장
3. 이 웹앱이 `users` 컬렉션을 읽어 `name`·`tier`·`role`로 팀짜기 멤버 목록을 구성

## 설정 방법
### 1) Firebase 웹 설정값 채우기
`config.js`를 열고 Firebase 콘솔 값으로 교체:
- Firebase 콘솔 > 프로젝트 설정(⚙️) > "내 앱" > 웹 앱(`</>`)
- 웹 앱이 없으면 **앱 추가 > 웹**으로 하나 생성
- `apiKey`, `messagingSenderId`, `appId`를 복사해 붙여넣기 (나머지는 미리 채워둠)

### 2) Firestore 보안 규칙 적용
`firestore.rules` 내용을 Firebase 콘솔 > Firestore Database > 규칙 에 붙여넣고 게시.
- `users`: 공개 읽기 / 클라이언트 쓰기 차단 (쓰기는 봇의 Admin SDK만)
- ⚠️ `users` 문서 전체(학번·발로ID 포함)가 공개 읽기로 노출됩니다. 내부용으로만 사용하세요.

## 실행
정적 파일이라 로컬 서버로 열면 됩니다:
```bash
python -m http.server 8000   # http://localhost:8000
```
