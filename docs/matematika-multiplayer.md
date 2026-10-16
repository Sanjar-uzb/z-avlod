# Matematika Poygasi — Multiplayer (Firebase Firestore)

## Muammo (sabab)

Eski kod `lib/multiplayer.ts` ichida `localStorage` + `BroadcastChannel` + `storage`
eventidan foydalangan. Bu API'lar **faqat bitta brauzer (bir qurilma) ichida** ishlaydi:
boshqa telefon/brauzer ularni umuman ko'ra olmaydi. Shuning uchun xonaga qo'shilgan
boshqa qurilmalarning mashinalari ko'rinmas edi.

## Yangi arxitektura

Realtime Firestore orqali:

| Narsa | Joy |
|---|---|
| Room | `mathRaceRooms/{ROOM_ID}` (`ROOM_ID` = `trim().toUpperCase()`, masalan `MATH-60`) |
| O'yinchilar | `mathRaceRooms/{ROOM_ID}/players/{PLAYER_ID}` |
| Room maydonlari | `roomId`, `gradeGroup` (`5-6`/`7-9`), `totalQuestions`, `hostId`, `createdAtMs` |
| Player maydonlari | `id`, `name`, `roomId`, `gradeGroup`, `progress`, `score`, `correctAnswers`, `wrongAnswers`, `currentQuestion`, `combo`, `maxCombo`, `totalAnswerTime`, `averageAnswerTime`, `finished`, `connected`, `joinedAtMs`, `lastSeenAtMs` |

Fayllar:

- `lib/firebase.ts` — Firestore ulanishi (kahoot bilan umumiy, `NEXT_PUBLIC_*` env yoki kod ichidagi fallback).
- `lib/mathRaceLogic.ts` — sof (server'siz) yordamchilar: `normalizeRoomId`, dedup, staleness, heartbeat intervalidi.
- `lib/mathRaceRealtime.ts` — Firestore I/O: `joinRaceRoom` (transaction), `subscribeRaceRoom` (`onSnapshot`),
  `pushPlayerState`, `markPlayerLeft`, `cleanupStalePlayers`, `generateRoomId`.
- `MatematikaGame.tsx` — butun poyga **roomdagi ro'yxatdan** (roster) quriladi: trassadagi mashinalar,
  reyting va o'yinchilar soni serverdan keladi.

Ishlash tartibi:

1. `joinRaceRoom` transaksiyasi: room yo'q bo'lsa yaratadi, sinf (`gradeGroup`) bir xilligini tekshiradi,
   o'yinchini `connected: true` bilan yozadi (room allaqachon boshqa sinfda ochilgan bo'lsa — aniq xato).
2. `subscribeRaceRoom` (`onSnapshot`) roomdagi barcha `players` hujjatlarini real vaqt tinglaydi.
   Har bir qurilma shu ro'yxatni ko'radi → barcha mashinalar ko'rinadi.
3. Har 20 soniyada **heartbeat** (`lastSeenAtMs` yangilanadi).
4. 45 soniya heartbeat bo'lmasa o'yinchi "uzilgan" (mashina kulrang + "Uzildi") deb ko'rsatiladi.
5. 10 daqiqadan eski o'yinchilar `cleanupStalePlayers` tomonidan o'chiriladi (disk tozalanadi).
6. Sahifa yopilsa `beforeunload` da `connected: false` yoziladi (best-effort; browser o'ldirsa staleness qutqaradi).

## Kerakli qadam: Firestore rules

`mathRaceRooms` kolleksiyasi hozircha **yopiq** (`PERMISSION_DENIED`). Kod tayyor, lekin
multiplayer ishlashi uchun quyidagi qoidalarni Firebase Console'da qo'shish shart:

**Firebase Console → Firestore Database → Rules** bo'limiga quyidagi qoidani qo'shing
(mavjud `kahootRooms` qoidangiz saqlanadi):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ... sizning mavjud kahootRooms qoidalaringiz shu yerda qoladi ...

    match /mathRaceRooms/{roomId} {
      allow read: if true;
      allow create: if request.resource.data.roomId is string
        && request.resource.data.roomId == roomId
        && request.resource.data.gradeGroup in ['5-6', '7-9']
        && request.resource.data.totalQuestions is int
        && request.resource.data.hostId is string;
      allow update: if request.resource.data.diff(resource.data).affectedKeys()
        .hasOnly(['totalQuestions', 'hostId']);
      allow delete: if false;

      match /players/{playerId} {
        allow read: if true;

        allow create: if request.resource.data.id == playerId
          && request.resource.data.name is string
          && request.resource.data.name.size() > 0
          && request.resource.data.name.size() <= 40
          && request.resource.data.gradeGroup in ['5-6', '7-9']
          && request.resource.data.progress is number
          && request.resource.data.progress >= 0
          && request.resource.data.progress <= 100
          && request.resource.data.score is number
          && request.resource.data.score >= 0
          && request.resource.data.finished is bool
          && request.resource.data.connected is bool;

        // progress faqat oshadi va 100 dan oshmaydi (server tomonidan cheklangan)
        allow update: if request.resource.data.id == playerId
          && request.resource.data.progress is number
          && request.resource.data.progress >= resource.data.progress
          && request.resource.data.progress <= 100
          && request.resource.data.score is number
          && request.resource.data.score >= 0
          && request.resource.data.finished is bool
          && request.resource.data.connected is bool;

        // faqat 10 daqiqadan eski (heartbeat to'xtagan) o'yinchilar o'chiriladi
        allow delete: if resource.data.lastSeenAtMs is int
          && request.time.toMillis() - resource.data.lastSeenAtMs > 600000;
      }
    }
  }
}
```

Rules joylashtirilgandan so'ng sahifani yangilang — xato yo'qoladi va bir xil Room ID'ga
kirgan qurilmalar bir birining mashinalarini ko'radi.

## Muhit o'zgaruvchilari (ixtiyoriy)

Kod allaqachon `kahoot-5fa99` loyihasi bilan ishlaydi (koddagi fallback orqali).
Boshqa loyihaga o'tish uchun `.env.local.example` ni nusxalab `.env.local` qiling
(`.env.local` git'ga tushmaydi). GitHub Pages uchun: repo **Settings → Secrets and
variables → Actions → Variables** bo'limiga shu nomlardagi o'zgaruvchilarni qo'ying
(`NEXT_PUBLIC_FB_API_KEY`, `NEXT_PUBLIC_FB_AUTH_DOMAIN`, `NEXT_PUBLIC_FB_PROJECT_ID`,
`NEXT_PUBLIC_FB_STORAGE_BUCKET`, `NEXT_PUBLIC_FB_SENDER_ID`, `NEXT_PUBLIC_FB_APP_ID`,
`NEXT_PUBLIC_FB_MEASUREMENT_ID`). `deploy.yml` ularni build'ga uzatadi.

Eslatma: `NEXT_PUBLIC_*` qiymatlar brauzerda ochiq ko'rinadi — bu Firebase web config'i
uchun normal holat. Xavfsizlikni **Firestore rules** ta'minlaydi; frontendda maxfiy kalit
(service_account / private key) yo'q va bo'lishi shart emas.

## Test qilish

1. Lokal: `npm run dev` → `/games/matematika` → Room ID yozing (masalan `MATH-TEST1`) → sinfni tanlang.
2. Ikkita-qurilma testi: boshqa telefonda/parda (yoki Chrome'da boshqa profil) shu Room ID bilan kiring.
3. Ikkalangiz ham boshqa mashinani ko'rishingiz, javob yozgan sari uning mashinasi siljishi kerak.
4. Bir qurilmani yoping → 45 soniyadan keyin mashina "Uzildi" bo'ladi; 10 daqiqadan keyin o'chadi.
5. Boshqa sinf bilan xuddi shu room'ga kirishga urinib ko'ring → aniq xato chiqishi kerak
   (`Bu room boshqa sinf (5-6) uchun ochilgan`).
6. Rules qo'shilmagan bo'lsa → lobbyda xato kartasi chiqadi va "Lokal rejimda davom etish"
   tugmasi bilan o'yin yakka rejimda davom etadi (multiplayer **ishlayapti** deb ko'rsatilmaydi).

## Dostup (dev) loglari

Production'da o'chiriladi (`NODE_ENV=development` da faqat):

```
[ROOM] Joining room: MATH-TEST1
[ROOM] Presence sync: 2 player(s)
[PLAYER] Joined: Sanjar
[RACE] Progress update: Sanjar -> 25%
[PLAYER] Left: p-...
```

## Hozir cheklovlar (halol izoh)

- Javoblar **clientda** hisoblanadi (to'g'ri/noto'g'ri, ball, progress). Firestore ularni
  saqlaydi va qoidalar orqali `progress` 0..100 oralig'ida, faqat oshuvchi bo'lishini
  majburlaydi, ammo javobning o'zini server baholamaydi. To'liq himoya (server-side
  answer verification) uchun Firebase Cloud Functions yozish kerak — hozircha yo'q.
- Room o'chirilmaydi (faqat eski o'yinchilar tozalanadi).
- `matematika` o'yini boshqa o'yinlarga tegmadi: `kahootLive.ts`, `kahootRooms` va
  boshqa g'eymlar o'z holicha ishlaydi.
