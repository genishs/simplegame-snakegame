# Android v1 — 순수 WebView 셸 (A안) + 모노레포

**Type:** Feature
**Date:** 2026-09-08

## 결정 (회의 만장일치)

- **A안**: 네이티브 게임 재구현 없이, 루트의 `index.html`/`game.js`/`style.css` 3파일을 **그대로** WebView로 감싼다. 게임 로직의 단일 진실원은 여전히 웹 3파일이다.
- **모노레포**: 별도 레포를 만들지 않고 이 레포 루트에 `android/` Gradle 프로젝트를 둔다.

## 버전 동기화

`android/app/build.gradle.kts`가 **game.js를 파싱해서** `versionName`/`versionCode`를 만든다 — 두 곳에 버전을 따로 적지 않는다.

- SoT: `game.js` 최상단의 `const GAME_VERSION = '<major>.<minor>.<patch>';` (v1에서 새로 추가, 웹 동작 무영향)
- 정규식 매치 실패 시 **빌드 실패** (스테일 버전으로 조용히 배포되는 사고 방지)
- `versionCode = major*10000 + minor*100 + patch` (예: 0.6.1 → 601)

## 웹 자산 처리 — 커밋하지 않는다

`android/` 밑에 `index.html`/`game.js`/`style.css` 사본을 두지 않는다. Gradle `copyWebAssets` 태스크(Copy)가 **빌드 시점에** 레포 루트 3파일을 `build/generated/webAssets`로 복사하고, `sourceSets.main.assets`에 그 디렉토리를 추가한다. `preBuild`가 이 태스크에 의존한다. 결과적으로 웹 3파일은 여전히 레포 루트 하나뿐 — 안드로이드 빌드가 그걸 그대로 패키징할 뿐이다.

## MainActivity — 순수 셸

- **WebViewAssetLoader**로 `https://appassets.androidplatform.net/assets/index.html` 로드 (`file://` 금지 — Android 문서가 권장하는 로컬 자산 서빙 방식, mixed-content/CORS 문제 없음)
- `javaScriptEnabled = true`, **`domStorageEnabled = true`** (게임의 최고점수가 `localStorage`를 쓰므로 필수)
- **몰입형 전체화면**: `WindowInsetsControllerCompat`로 시스템바 숨김 + `BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE`(스와이프로 일시노출). `onWindowFocusChanged`에서 포커스 복귀 시 재적용.
- `FLAG_KEEP_SCREEN_ON`, 매니페스트에 `android:screenOrientation` **미지정**(세로/가로 모두 허용)
- **뒤로가기**: `game.js`에 이미 존재하는 최상위 `pause()`/`state`/`STATE.PLAYING`을 `evaluateJavascript`로 확인해, 재생 중이면 `pause()`만 호출(액티비티 종료 없음). 그 외 상태거나 `pause`가 없으면(방어적 폴백) `moveTaskToBack(true)`.
- **진동 브릿지**: `addJavascriptInterface(VibratorBridge, "Android")` → JS에서 `Android.vibrate(ms)`. `game.js`의 과일 먹기(20ms)·게임오버(100ms) 지점에 `typeof Android !== 'undefined' && Android.vibrate` 가드로 호출 — 일반 브라우저에서는 무동작.
- **스플래시**: `androidx.core:core-splashscreen`으로 페이지 배경색 + 런처 아이콘의 단순 테마 스플래시.

## 에지투에지

- `index.html`은 이미 `viewport-fit=cover`를 갖고 있었다 — 변경 없음.
- `style.css`의 `.mobile-controls`는 이미 `env(safe-area-inset-bottom, 0px)`를 padding-bottom에 반영하고 있었다 — 변경 없음. (값이 0이면 웹에서 그대로 무해.)
- 즉 이 항목은 **기존 웹 코드가 이미 충족**하고 있었고, v1에서 추가 CSS 변경은 없었다.

## 아이콘 · 서명

- 뱀 테마 어댑티브 아이콘(`ic_launcher_background`/`foreground`, 108dp viewBox 벡터 직접 제작 — 기본 아이콘 아님). minSdk 26 = 어댑티브 아이콘 도입 버전이라 레거시 래스터 mipmap 불필요.
- 서명은 dday-sgshs와 동일 패턴: `~/keystores/sgshs-upload.jks` + 같은 폴더 `.pass` 파일 존재 시에만 `signingConfigs["release"]` 활성화, alias `upload`.

## 권한

`VIBRATE` 하나만 명시 요청. `INTERNET`은 요청하지 않는다 — 모든 콘텐츠가 로컬 자산이라 필요 없음.

## 검증

- `aapt2 dump badging`으로 package/versionCode/versionName/minSdk/targetSdk/권한 확인
- Pixel_6 AVD에 릴리스 APK 설치 후 스모크: 렌더링, 터치 반응(회전 버튼), 벽 충돌 게임오버, 몰입형 전체화면(시스템 툴팁으로 간접 확인), 하단 모바일 컨트롤이 제스처 영역에 가려지지 않음.
