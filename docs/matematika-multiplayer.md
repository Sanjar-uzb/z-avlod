# Matematika Poygasi — Multiplayer (alohida Firebase loyihasi)

> **Muhim:** Matematika o'yini o'zining alohida Firebase loyihasidan foydalanadi:
> **`matematik-26d6f`**. Kahoot Live esa boshqa loyihada (`kahoot-5fa99`).
> Ikkalasi bir-biriga bog'lanmagan — matematika ma'lumotlari kahootga tushmaydi.

## ⚠️ Maxfiy kalit haqida ogohlantirish

Firebase "service account" faylidagi `private_key` — bu **maxfiy** kalit. U:
- chatda/gitda oshkor bo'lsa, uni **darhol** Firebase Console → Project settings →
  Service accounts → "Manage service account permissions" orqali **o'chirib (rotate)**
  yangilash kerak;
- **hech qachon** frontendga (brauzer kodiga, `.env` ichidagi `NEXT_PUBLIC_*` ga) qo'yilmaydi.

Brauzerdagi o'yin uchun service account emas, balki **Web app config** (public) kerak —
quyida ko'rsatilgan.

## Muammo (sabab)

Eski kod `lib/multiplayer.ts` ichida `localStorage` + `BroadcastChannel` + `storage`
eventidan foydalangan. Bu API'lar **faqat bitta brauzer (bir qurilma) ichida** ishlaydi:
boshqa telefon/brauzer ularni umuman ko'ra olmaydi. Shuning uchun xonaga qo'shilgan
boshqa qurilmalarning mashinalari ko'rinmas edi.

## Yangi arxitektura

Realtime Firestore orqali (project `matematik-26d6f`, default app'dan alohida "matematika" nomli app):

| Narsa | Joy |
|---|---|
| Firebase init | `lib/firebaseMath.ts` (`dbMath`, `mathApp`, project `matematik-26d6f`) |
| Room | `mathRaceRooms/{ROOM_ID}` (`ROOM_ID` = `trim().toUpperCase()`, masalan `MATH-60`) |
| O'yinchilar | `mathRaceRooms/{ROOM_ID}/players/{PLAYER_ID}` |
| Room maydonlari | `roomId`, `gradeGroup` (`5-6`/`7-9`), `totalQuestions`, `hostId`, `createdAtMs` |
| Player maydonlari | `id`, `name`, `roomId`, `gradeGroup`, `progress`, `score`, `correctAnswers`, `wrongAnswers`, `currentQuestion`, `combo`, `maxCombo`, `totalAnswerTime`, `averageAnswerTime`, `finished`, `connected`, `joinedAtMs`, `lastSeenAtMs` |

Fayllar:

- `lib/firebaseMath.ts` — matematika uchun **alohida** Firestore ulanishi (`NEXT_PUBLIC_MATH_FB_*`).
- `lib/mathRaceLogic.ts` — sof yordamchilar: `normalizeRoomId`, dedup, staleness, heartbeat intervalidi.
- `lib/mathRaceRealtime.ts` — Firestore I/O: `joinRaceRoom` (transaction), `subscribeRaceRoom` (`onSnapshot`),
  `pushPlayerState`, `markPlayerLeft`, `cleanupStalePlayers`, `generateRoomId`.
- `MatematikaGame.tsx` — butun poyga **roomdagi ro'yxatdan** (roster) quriladi.

Ishlash tartibi:

1. `joinRaceRoom` transaksiyasi: room yo'q bo'lsa yaratadi, sinf (`gradeGroup`) bir xilligini tekshiradi,
   o'yinchini `connected: true` bilan yozadi (room boshqa sinfda ochilgan bo'lsa — aniq xato).
2. `subscribeRaceRoom` (`onSnapshot`) roomdagi barcha `players` hujjatlarini real vaqt tinglaydi.
3. Har 20 soniyada **heartbeat** (`lastSeenAtMs`).
4. 45 soniya heartbeat bo'lmasa — "uzilgan" (mashina kulrang + "Uzildi").
5. 10 daqiqadan eski o'yinchilar tozalanadi.
6. Sahifa yopilsa `beforeunload` da `connected: false` (best-effort).

## Sozlash (3 qadam)

### 1. Firestore'ni yoqish

Firebase Console → **matematik-26d6f** → Firestore Database → **Create database** →
**Native mode** → joy tanlang. (Hali yoqilmagan bo'lishi mumkin.)

### 2. Rules qo'shish

**Firebase Console → matematik-26d6f → Firestore Database → Rules** bo'limiga:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

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

### 3. Web app config kiritish

Firebase Console → **matematik-26d6f** → Project settings (⚙️) → General →
**Your apps** → Web app (`</>`) → "SDK setup and configuration" → **Config**.
U yerdagi qiymatlarni `.env.local` faylga yozing:

```
NEXT_PUBLIC_MATH_FB_API_KEY=<apiKey>
NEXT_PUBLIC_MATH_FB_AUTH_DOMAIN=matematik-26d6f.firebaseapp.com
NEXT_PUBLIC_MATH_FB_PROJECT_ID=matematik-26d6f
NEXT_PUBLIC_MATH_FB_STORAGE_BUCKET=matematik-26d6f.firebasestorage.app
NEXT_PUBLIC_MATH_FB_SENDER_ID=<messagingSenderId>
NEXT_PUBLIC_MATH_FB_APP_ID=<appId>
```

Web app hali yo'q bo'lsa: **Add app** → **Web** → nom bering → Register.

GitHub Pages uchun: repo **Settings → Secrets and variables → Actions → Variables**
bo'limiga xuddi shu nomdagi o'zgaruvchilarni qo'ying; `deploy.yml` ularni build'ga uzatadi.

`NEXT_PUBLIC_MATH_FB_API_KEY` va `appId` bo'lmasa, o'yin "Matematika uchun Firebase
sozlanmagan" deb aniq xato ko'rsatadi va yakka (lokal) rejimda davom etadi —
multiplayer ishlayapti deb ko'rsatilmaydi.

## Test qilish

1. `.env.local` to'ldirilgan bo'lsin, so'ng `npm run dev` → `/games/matematika`.
2. Room ID yozing (masalan `MATH-TEST1`) → sinf tanlang.
3. Boshqa telefon/parda (yoki Chrome boshqa profil) xuddi shu Room ID bilan kiring.
4. Ikkalangiz ham boshqa mashinani ko'rish va javob berganda uning siljishini ko'rishingiz kerak.
5. Bir qurilmani yoping → 45 soniyadan keyin mashina "Uzildi"; 10 daqiqadan keyin o'chadi.
6. Boshqa sinf bilan xuddi shu room'ga kirish → aniq xato (`Bu room boshqa sinf (5-6) uchun ochilgan`).

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

- Javoblar **clientda** hisoblanadi. Firestore ularni saqlaydi va qoidalar orqali
  `progress` 0..100 va faqat oshuvchi bo'lishini majburlaydi, ammo javobning o'zini
  server baholamaydi. To'liq himoya uchun Cloud Functions kerak — hozircha yo'q.
- Room o'chirilmaydi (faqat eski o'yinchilar tozalanadi).
- Kahoot Live (`lib/firebase.ts`, `kahootRooms`, project `kahoot-5fa99`) o'z holicha
  ishlaydi va matematikaga bog'lanmagan.
