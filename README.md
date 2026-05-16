# Altered Seeing / `<see-saw>` Prototype

QR로 접속하는 가짜 전시 큐레이션 모바일 웹과, 문단별 읽기 흔적을 실시간 텍스트 풍경으로 보여주는 로컬 프로토타입입니다.

## Run

```bash
npm install
npm run dev
```

- Mobile guide: `http://localhost:3000/guide/object-01`
- Display: `http://localhost:3000/display`

같은 Wi-Fi의 휴대폰에서 접속하려면 노트북의 로컬 IP를 사용합니다.

```bash
npm run qr
```

위 명령은 `public/qr/object-01.svg`를 생성합니다. 특정 주소로 QR을 만들려면:

```bash
QR_HOST=192.168.0.12 npm run qr
```

## Prototype Scope

- `/guide/object-01`: 공식 전시 안내처럼 보이는 모바일 큐레이션 페이지
- `IntersectionObserver`: 문단별 enter / exit / heartbeat 이벤트 수집
- Socket.IO: 읽기 이벤트를 서버로 실시간 전송
- 서버 메모리 집계: 문단별 총 노출 시간, 조회 횟수, 재방문 횟수
- `/display`: 오래 읽힌 문장일수록 커지고 진해지는 텍스트 풍경

개인 식별 정보, 위치, 카메라, 마이크, 로그인 정보는 수집하지 않습니다.
