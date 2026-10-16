export type NpcId = "diyor" | "kamol" | "malika" | "jasur" | "madina";

export type NpcChoice = {
  label: string;
  response: string;
  outcome: string;
};

export type NpcStage = {
  stageIndex: number;
  question: string;
  choices: NpcChoice[];
};

export type NpcDefinition = {
  id: NpcId;
  name: string;
  role: string;
  topic: string;
  storyIntro: string;
  color: string;
  avatarEmoji: string;
  x: number;
  y: number;
  rewardBadge: string;
  rewardXp: number;
  reflectionQuestion: string;
  stages: NpcStage[];
};

export type NpcProgressState = {
  currentStage: number; // 0 to 5 (0: not started, 5: all stages done)
  completed: boolean;
  completedOnce: boolean;
  reflection?: string;
  selectedAnswers?: number[]; // indices of chosen options for each stage
};

export const NPC_DATA: Record<NpcId, NpcDefinition> = {
  diyor: {
    id: "diyor",
    name: "Diyor",
    role: "Do‘st",
    topic: "Raqamli etika: Guruh chatidagi mojaro",
    storyIntro:
      "Salom Aisha! Bizning sinf guruhimizda jiddiy mojaro bo‘lyapti. Bir sinfdoshimizning surati uning ruxsatisiz tarqatildi, ba’zilar esa ustidan kulyapti. Nima qilishni bilmay, boshim qotdi.",
    color: "#38bdf8",
    avatarEmoji: "👦",
    x: 790,
    y: 405,
    rewardBadge: "Raqamli etika nishoni",
    rewardXp: 120,
    reflectionQuestion: "Agar sinf chatingizda shunday holat yuz bersa, birinchi qadamingiz nima bo‘lardi?",
    stages: [
      {
        stageIndex: 0,
        question: "Sinfdoshning surati roziligisiz guruhga tarqatildi. Nima qilasan?",
        choices: [
          {
            label: "Suratni tarqatmayman va jabrlangan sinfdoshga shaxsiy xabar yozib qo‘llab-quvvatlayman.",
            response: "Diyor: “To‘g‘ri aytding! Eng muhimi — jabrlangan odam o‘zini yolg‘iz his qilmasligi kerak.”",
            outcome: "Madinaga ma’naviy madad berding. U yolg‘iz emasligini his qildi va o‘zini xavfsizroq sezdi.",
          },
          {
            label: "Aralashmayman, bu mening ishim emas deb shunchaki kuzataman.",
            response: "Diyor: “Jim turish ham ba’zan zulm qiluvchilarning qo‘lini bo‘sh qo‘yadi, lekin vaziyatni tushunaman.”",
            outcome: "Mojaro o‘z-o‘zidan to‘xtamadi. Betaraflik zararning oldini olmaydi, keyingi qadamda yordam berish kerak.",
          },
          {
            label: "Men ham qiziqib, suratni boshqa guruhdagi do‘stlarimga ulashaman.",
            response: "Diyor: “Aisha, bu rasm unga qanchalik og‘ir botayotganini o‘ylab ko‘rdingmi?”",
            outcome: "Surat ko‘proq kishiga tarqaldi va sinfdoshing qattiq ezildi. Kiberbulling zanjirini to‘xtatish zarur.",
          },
        ],
      },
      {
        stageIndex: 1,
        question: "Boshqalar chatda kulib, masxaralayotgan bo‘lsa, qanday munosabat bildirasan?",
        choices: [
          {
            label: "Chatda ochiqchasiga: “Birovning ustidan kulish noto‘g‘ri, buni to‘xtataylik” deb yozaman.",
            response: "Diyor: “Jasur qaror! Ko‘pincha bir kishining ochiq ovozi boshqalarni ham hushyor torttiradi.”",
            outcome: "Guruhda qat’iy madaniy chegara o‘rnatildi. Bir necha kishi kulishni to‘xtatdi.",
          },
          {
            label: "Kulayotganlarga shaxsiyda alohida yozib, bu ish xato ekanini tushuntiraman.",
            response: "Diyor: “Juda bosiq usul. Yuzma-yuz gaplashganda odamlar o‘zini himoya qilmay, xatosini osonroq tushunadi.”",
            outcome: "Mojaro kattalashmasdan, do‘stlar o‘rtasida xatolik yumshoq tarzda anglandi.",
          },
          {
            label: "Ko‘pchilik kulyapti-ku deb, men ham kulgili reaksiya qoldiraman.",
            response: "Diyor: “Olomon psixologiyasiga berilish adolatsizlikni odatiy holga aylantirib qo‘yadi.”",
            outcome: "Sinfdoshning nafsoniyati yanada toptaldi. Olomonga ko‘r-ko‘rona ergashmaslik muhim.",
          },
        ],
      },
      {
        stageIndex: 2,
        question: "Suratni boshqa guruhga yoki begona odamlarga yuborish to‘g‘rimi?",
        choices: [
          {
            label: "Mutlaqo noto‘g‘ri! Shaxsiy fotosurat va ma’lumotlarni ruxsatsiz tarqatish qonun va axloqqa ziddir.",
            response: "Diyor: “Ofarin! Raqamli gigiyena va shaxsiy daxlsizlik eng muhim qoidadir.”",
            outcome: "Raqamli qonun-qoidalar va inson huquqlariga hurmat saqlab qolindi.",
          },
          {
            label: "Faqat birgina ishonchli do‘stimga ko‘rsatib, darhol o‘chirib yuboraman.",
            response: "Diyor: “Bitta odam ham keyingi zanjirni boshlashi mumkin. Raqamli olamda hech narsa butunlay yo‘qolmaydi.”",
            outcome: "Xavf saqlanib qoldi. To‘xtatishning yagona kafolatli yo‘li — umuman yubormaslik.",
          },
          {
            label: "Yuzini stiker bilan berkitib yuborsam bo‘ladi deb o‘ylayman.",
            response: "Diyor: “Shakli o‘zgargani bilan mazmun o‘zgarmaydi, jabrlangan odam baribir o‘zini noqulay his qiladi.”",
            outcome: "Yarim chora muammoni hal qilmadi. To‘liq hurmat talab etiladi.",
          },
        ],
      },
      {
        stageIndex: 3,
        question: "Jabrlangan sinfdoshga amalda qanday yordam berish mumkin?",
        choices: [
          {
            label: "U bilan suhbatlashib, dalil sifatida chat skrinshotlarini saqlashni va xotirjam bo‘lishni maslahat beraman.",
            response: "Diyor: “Ajoyib maslahat! Skrinshotlar keyin kim nima yozganini isbotlashda yordam beradi.”",
            outcome: "Sinfdosh ma’naviy kuchga ega bo‘ldi, zarur dalillar esa xavfsiz saqlab qo‘yildi.",
          },
          {
            label: "Hech narsa bo‘lmagandek, o‘zingni bilmaganga sol deb aytaman.",
            response: "Diyor: “Hissiyotlarni bosish va ichga yutish keyinchalik chuqur stressga olib kelishi mumkin.”",
            outcome: "Muammo yechimsiz qoldi, ichki xavotir esa davom etdi.",
          },
          {
            label: "Rasmni tarqatganlar bilan janjallashib, ularni haqoratlayman.",
            response: "Diyor: “G‘azab bilan g‘azabni yengib bo‘lmaydi, yangi katta nizo boshlanadi.”",
            outcome: "Janjal vaziyatni yanada chalkashtirdi. Huquqiy va odobli yo‘l har doim samaraliroq.",
          },
        ],
      },
      {
        stageIndex: 4,
        question: "Mojaro davom etsa va to‘xtamasa, kimdan yordam so‘rash mumkin?",
        choices: [
          {
            label: "Sinf rahbari, maktab psixologi yoki ota-onaga xotirjam murojaat qilib, vaziyatni aytamiz.",
            response: "Diyor: “Eng to‘g‘ri yo‘l shu! Kattalar qonuniy va adolatli yechim topish tajribasiga ega.”",
            outcome: "Kattalar yordamida mojaro bartaraf etildi, guruhda esa sog‘lom muhit tiklandi.",
          },
          {
            label: "Faqat guruh administratoridan xabarlarni o‘chirib, a’zoni chetlatishni so‘raymiz.",
            response: "Diyor: “Bu texnik chora, lekin munosabatlarni to‘liq tiklash uchun baribir suhbat kerak bo‘ladi.”",
            outcome: "Tarqalish to‘xtatildi, ammo munosabatlarni yaxshilash ustida hali ishlash kerak.",
          },
          {
            label: "Hech kimga aytmay, o‘z-o‘zidan o‘tib ketishini kutamiz.",
            response: "Diyor: “Haddan tashqari kechikish ko‘proq zarar yetkazishi mumkin.”",
            outcome: "Mas’uliyatni o‘z vaqtida zimmasiga olish har qanday muammoning kalitidir.",
          },
        ],
      },
    ],
  },

  kamol: {
    id: "kamol",
    name: "Kamol",
    role: "Sinfdosh",
    topic: "Do‘stlik va empatiya: Xafa bo‘lgan do‘stga yordam",
    storyIntro:
      "Salom Aisha... Bugun o‘zimni juda noqulay his qilyapman. Boshimdan qiyin kunlar o‘tyapti, lekin do‘stlarim buni sezmayapti yoki qanday gaplashishni bilmayapti...",
    color: "#60a5fa",
    avatarEmoji: "👦",
    x: 460,
    y: 470,
    rewardBadge: "Mehribon tinglovchi nishoni",
    rewardXp: 120,
    reflectionQuestion: "Do‘stingiz sizga tayana olishi uchun o‘zingizda qaysi fazilatni kuchaytirmoqchisiz?",
    stages: [
      {
        stageIndex: 0,
        question: "Do‘sting odatdagidan jim yuribdi va ko‘zini olib qochyapti. Nima qilasan?",
        choices: [
          {
            label: "“Kayfiyating yo‘qligini sezdim, xohlasang yoningda o‘tiraman, dardingni bo‘lishishing mumkin” deyman.",
            response: "Kamol: “Rahmat... Aynan shunday iliq so‘zlar insonni yolg‘izlikdan xalos qiladi.”",
            outcome: "Do‘sting o‘zini tushunilgan his qildi. U senga nisbatan mehr va ishonch tuyg‘usini sezdi.",
          },
          {
            label: "Tezda savollarga ko‘mib, nima bo‘lganini aytishini qistayman.",
            response: "Kamol: “Bunday shoshiltirish odamni yanada siqib qo‘yadi, biroz tinchlik kerak edi.”",
            outcome: "Qistov uni yanada yopiqroq bo‘lishiga olib kelishi mumkin. Sabr va vazminlik muhim.",
          },
          {
            label: "O‘z holiga tashlab, umuman gaplashmay chetga ketaman.",
            response: "Kamol: “Befarqlik esa kishini butunlay unutilgandek his qildiradi.”",
            outcome: "Empatiya — boshqalarning dardi va hislariga e’tiborli bo‘lishdan boshlanadi.",
          },
        ],
      },
      {
        stageIndex: 1,
        question: "Do‘sting hozircha gapirishni istamasa va yolg‘iz qolishni so‘rasa, qanday yo‘l tutasan?",
        choices: [
          {
            label: "Uning shaxsiy chegarasini hurmat qilaman: “Xohlagan paytingda men eshitishga tayyorman” deb joy qoldiraman.",
            response: "Kamol: “Katta rahmat. Shaxsiy chegarani hurmat qilish — do‘stlikning eng oliy belgisi.”",
            outcome: "Do‘sting tinchlanib, o‘z hislarini tartibga solish uchun imkoniyatga ega bo‘ldi.",
          },
          {
            label: "“Nega mendan sir yashiryapsan?” deb arazlayman.",
            response: "Kamol: “Bu sir emas, shunchaki ichki og‘riq edi. Arazlash vaziyatni yanada og‘irlashtiradi.”",
            outcome: "Vaziyatni o‘zingga qarshi deb qabul qilding. Do‘stlik sabr va bag‘rikenglikni talab qiladi.",
          },
          {
            label: "Boshqa sinfdoshlarga borib, “U negadir arazlab yuribdi” deb aytaman.",
            response: "Kamol: “Birovning holatini orqasidan muhokama qilish ishonchni so‘ndiradi.”",
            outcome: "Mish-mishlar ishonchni sindiradi. Masalani yakkama-yakka hal qilish to‘g‘ri.",
          },
        ],
      },
      {
        stageIndex: 2,
        question: "Do‘sting senga o‘z ichki xavotir va sirini ishondi. Uning sirini boshqalarga aytish mumkinmi?",
        choices: [
          {
            label: "Yo‘q, ishonch omonatdir. Agar uning hayotiga xavf bo‘lmasa, sir qat’iy saqlanadi.",
            response: "Kamol: “Senga to‘liq ishonsa bo‘larkan! Ishonchli do‘st — bebaho boylik.”",
            outcome: "Omonatga sadoqat ko‘rsatding, munosabatlaringiz yanada mustahkamlandi.",
          },
          {
            label: "Faqat bir kishiga, u ham hech kimga aytmaslik sharti bilan aytaman.",
            response: "Kamol: “Afsuski, sirlar aynan shunday zanjir orqali fosh bo‘ladi.”",
            outcome: "Ishonch darz ketishi mumkin. Haqiqiy do‘st sirni qat’iy saqlaydi.",
          },
          {
            label: "Qiziqarli voqea deb hamma bilan o‘rtoqlashaman.",
            response: "Kamol: “Bu do‘stlikka xiyonat hisoblanadi.”",
            outcome: "Birovning dardini ko‘rgazma qilish do‘stlikni yo‘qqa chiqaradi.",
          },
        ],
      },
      {
        stageIndex: 3,
        question: "Do‘sting bilan o‘rtangizda fikrlar to‘qnashuvi yuz bersa, qanday yo‘l tutasan?",
        choices: [
          {
            label: "Hissiyotlar sovugach, tinch holda bir-birimizni tinglab, tushunmovchilikni ochiq tahlil qilamiz.",
            response: "Kamol: “Ajoyib! Ochiq muloqot va tinglash har qanday nizoni yechadi.”",
            outcome: "Do‘stona muloqot har ikki tomonning nuqtai nazarini tushunishga yordam berdi.",
          },
          {
            label: "O‘z fikrimni oxirigacha o‘tkazishga harakat qilib, baqiraman.",
            response: "Kamol: “Qaysarlik nizoni chuqurlashtiradi, g‘alaba esa yolg‘on bo‘lib qoladi.”",
            outcome: "Munosabatlarga putur yetdi. Murosaga kelish kuchsizlik emas, aql belgisidir.",
          },
          {
            label: "U bilan butunlay aloqani uzib qo‘yaman.",
            response: "Kamol: “Kichik sabab tufayli do‘stlikdan voz kechish pushaymonga olib keladi.”",
            outcome: "Munosabatlarni saqlash va kechirimli bo‘lish yuksak fazilatdir.",
          },
        ],
      },
      {
        stageIndex: 4,
        question: "Qachon va qaysi holatda ishonchli katta odamdan (ota-ona, ustoz) yordam so‘rash kerak?",
        choices: [
          {
            label: "Agar do‘stimning sog‘lig‘i, hayoti yoki ruhiyatiga jiddiy xavf tug‘ilsa, zudlik bilan kattalarga aytaman.",
            response: "Kamol: “Mutlaqo to‘g‘ri! Bu xiyonat emas, balki do‘stning hayotini asrab qolishdir.”",
            outcome: "Hayotiy xavfsizlik va mas’uliyatni to‘g‘ri ajrata olding. Do‘sting xavfdan asrab qolindi.",
          },
          {
            label: "Har qanday mayda arzimagan gapni ham kattalarga aytib shikoyat qilaman.",
            response: "Kamol: “Mustaqil hal qilsa bo‘ladigan ishlarni o‘zaro hal qilish do‘stlikni charxlaydi.”",
            outcome: "Mayda gaplarni tashish orani buzadi. Mezonni bilish kerak.",
          },
          {
            label: "Qanchalik jiddiy xavf bo‘lsa ham, sir berilmaydi deb yashiraman.",
            response: "Kamol: “Jiddiy xavf paytida yashirish ayanchli oqibatlarga olib kelishi mumkin.”",
            outcome: "Inson hayoti va salomatligi har doim har qanday sirdan ustundir.",
          },
        ],
      },
    ],
  },

  malika: {
    id: "malika",
    name: "Malika",
    role: "Jamoa yetakchisi",
    topic: "Halollik va mas’uliyat: Imtihon va kundalik qarorlar",
    storyIntro:
      "Assalomu alaykum, Aisha! Har kuni maktabda ham, hayotda ham halollik sinovlaridan o‘tamiz. Qisqa foydani deb vijdonimizga xilof ish qilishimiz kerakmi yoki to‘g‘ri yo‘lni tanlaymizmi?",
    color: "#a78bfa",
    avatarEmoji: "👧",
    x: 980,
    y: 730,
    rewardBadge: "Halollik va mas’uliyat nishoni",
    rewardXp: 120,
    reflectionQuestion: "Hayotda qiyin bo‘lsa ham halol yo‘lni tanlaganingiz sizga qanday his bergan?",
    stages: [
      {
        stageIndex: 0,
        question: "Do‘sting imtihonda tayyor javoblarni taklif qildi: “Ko‘chir, hech kim ko‘rmayapti”. Nima qilasan?",
        choices: [
          {
            label: "Ko‘chirmayman, o‘z bilimim bilan ishlab, tushunmagan savollarimni keyin o‘rganaman.",
            response: "Malika: “Ajoyib iroda! O‘z mehnating bilan olgan baho aldov bilan olingandan ming marta afzal.”",
            outcome: "Halollik va mustaqil fikrlashni tanlading. O‘z bilimingga ishonching oshdi.",
          },
          {
            label: "Faqat birgina qiyin savolning javobini ko‘chirib olaman.",
            response: "Malika: “Kichik aldov ham katta nohaqlikning boshlanishi bo‘lishi mumkin.”",
            outcome: "O‘z mehnating o‘rniga oson yo‘lni tanlading. Haqiqiy bilim mehnat bilan keladi.",
          },
          {
            label: "Do‘stimni darhol o‘qituvchiga sotib, jazo berishini talab qilaman.",
            response: "Malika: “Halol bo‘lish muhim, lekin buni ko‘z-ko‘z qilmasdan, vazminlik bilan yetkazish kerak.”",
            outcome: "O‘z pozitsiyangni hurmatli va xotirjam saqlash madaniyatini esda tut.",
          },
        ],
      },
      {
        stageIndex: 1,
        question: "Maktab hovlisida egasi noma’lum qimmatbaho buyum yoki pul topib olding. Nima qilasan?",
        choices: [
          {
            label: "Topilmani maktab ma’muriyatiga yoki navbatchi ustozga topshirib, e’lon berilishini so‘rayman.",
            response: "Malika: “Halol qalb! Buyum egasi qanchalik xavotirda bo‘lganini tasavvur qil.”",
            outcome: "Egasiga suyunchi bo‘ldi va sening halolliging butun maktabda e’tirof etildi.",
          },
          {
            label: "Hech kim qidirmasa, o‘zimda olib qolaman.",
            response: "Malika: “Birovning mulki hech qachon birovga baraka keltirmaydi.”",
            outcome: "Birovning mulkiga ko‘z tikish vijdonni xira qiladi. Omonat egasiga qaytishi shart.",
          },
          {
            label: "Topilgan narsani do‘stlarim bilan bo‘lib olaman.",
            response: "Malika: “Birovning yo‘qotgan narsasidan foydalanish adolatga ziddir.”",
            outcome: "Topilgan omonat har doim o‘z egasiga qaytarilishi kerak.",
          },
        ],
      },
      {
        stageIndex: 2,
        question: "Bajara olmasliging mumkin bo‘lgan katta va’dani boshqalarga berish to‘g‘rimi?",
        choices: [
          {
            label: "Yo‘q, imkoniyatlarimni real baholab, faqat bajara oladigan ishimga so‘z beraman.",
            response: "Malika: “Barakalla! Odamning qadri uning so‘ziga bo‘lgan ishonch bilan o‘lchanadi.”",
            outcome: "So‘zingizga sodiqlik obro‘ingizni va boshqalarning hurmatini oshirdi.",
          },
          {
            label: "Vaqtinchalik odamlarni xursand qilish uchun va’da berib turaman.",
            response: "Malika: “Bajarilmagan va’da boshqalarning rejasini buzadi va hafsalasini pir qiladi.”",
            outcome: "Soxta umid berish keyinchalik ko‘proq ranjitadi. Rostini aytish doim yaxshiroq.",
          },
          {
            label: "Hech qachon hech qanday mas’uliyatni zimmamga olmayman.",
            response: "Malika: “Mas’uliyatdan butunlay qochish insonning o‘sishiga to‘sqinlik qiladi.”",
            outcome: "Muvozanatni topish: o‘z kuchiga yarasha mas’uliyat olish kerak.",
          },
        ],
      },
      {
        stageIndex: 3,
        question: "Xato qilib biror narsani buzib qo‘yganingda uni tan olish qanday natija beradi?",
        choices: [
          {
            label: "Xatoni mardlarcha tan olaman va imkon boricha zararni qoplashga harakat qilaman.",
            response: "Malika: “Bu haqiqiy yetuklik! Xatoni tan olish zaiflik emas, aksincha kuch belgisidir.”",
            outcome: "Odamlar sening jasorating va samimiyligingni yuksak baholashdi.",
          },
          {
            label: "Boshqa birov qildi deb, aybni begunoh o‘quvchiga yuklayman.",
            response: "Malika: “Begunoh kishiga tuhmat qilish eng og‘ir adolatsizlikdir.”",
            outcome: "Tuhmat orani buzadi va vijdon azobini keltiradi. Mardlik xatoni tan olishda.",
          },
          {
            label: "Sezdirmay joyiga qo‘yib, indamay ketaman.",
            response: "Malika: “Qochish bilan xato yo‘qolib qolmaydi, balki ko‘payadi.”",
            outcome: "Xatoni to‘g‘rilash uchun qadam tashlash kerak.",
          },
        ],
      },
      {
        stageIndex: 4,
        question: "Boshqa odamning mehnati yoki loyihasini o‘ziniki deb ko‘rsatish (plagiat) to‘g‘rimi?",
        choices: [
          {
            label: "Mutlaqo noto‘g‘ri, o‘zgalar mehnati hurmat qilinishi va manba doim ko‘rsatilishi shart.",
            response: "Malika: “Ofarin! Halol ilm va halol ijod eng toza boylikdir.”",
            outcome: "Akademik va insoniy halollik tamoyiliga to‘liq rioya qilding.",
          },
          {
            label: "Ozginasini o‘zgartirib taqdim etsam, hech narsa bo‘lmaydi deb o‘ylayman.",
            response: "Malika: “Plagiat boshqalarning peshona terini o‘g‘irlash bilan barobardir.”",
            outcome: "O‘zgalar mehnatiga hurmatsizlik ijodiy o‘sishni to‘xtatadi.",
          },
          {
            label: "Internetda ochiq turgan bo‘lsa, istalgancha o‘z nomidan ishlatsa bo‘ladi deyman.",
            response: "Malika: “Ochiq ma’lumotdan foydalansa bo‘ladi, lekin mualliflikni o‘zlashtirish noto‘g‘ri.”",
            outcome: "Mualliflikka hurmat qilish raqamli madaniyatning asosiy talabidir.",
          },
        ],
      },
    ],
  },

  jasur: {
    id: "jasur",
    name: "Jasur",
    role: "Jamoa a’zosi",
    topic: "Jamoaviy hamkorlik: Jamoa loyihasidagi muammo",
    storyIntro:
      "Aisha, jamoamiz bilan fan loyihasini tayyorlayapmiz. Lekin ba’zilar ishlamayapti, boshqalar esa tortishyapti. Birgalikda jamoaviy ruhni qanday tiklaymiz?",
    color: "#f59e0b",
    avatarEmoji: "👦",
    x: 1015,
    y: 825,
    rewardBadge: "Jamoa yetakchisi nishoni",
    rewardXp: 120,
    reflectionQuestion: "Jamoada ishlaganda o‘zingizni ko‘proq qaysi rolda ko‘rasiz va nima uchun?",
    stages: [
      {
        stageIndex: 0,
        question: "Jamoada bir kishi barcha ishni bajaryapti, boshqalar esa chetda tomoshabin. Nima qilasan?",
        choices: [
          {
            label: "Qisqa yig‘ilish chaqirib, vazifalarni teng va qiziqishlarga mos qayta taqsimlashni taklif qilaman.",
            response: "Jasur: “Ajoyib tashabbus! Bir kishiga hamma yukni ortish jamoani parokanda qiladi.”",
            outcome: "Ish yuklamasi adolatli taqsimlandi va jamoada o‘zaro ishonch uyg‘ondi.",
          },
          {
            label: "Ishlayotgan odam qilaversin, loyiha topshirilsa bo‘ldi deb jim turaman.",
            response: "Jasur: “Bir kishi charchab loyihani tashlab qo‘ysa, butun jamoa yutqazadi.”",
            outcome: "Tengsizlik jamoa ruhini so‘ndiradi. Hamkorlik faol ishtirokni talab qiladi.",
          },
          {
            label: "Dangasalarni hamma oldida izza qilib baqiraman.",
            response: "Jasur: “Baqirish odamlarni yanada begonalashtiradi, oqilona muloqot kerak.”",
            outcome: "Ayblov o‘rniga aniq vazifa va yordam taklif qilish ancha samaraliroq.",
          },
        ],
      },
      {
        stageIndex: 1,
        question: "Ikki jamoa a’zosi qaysi g‘oya yaxshiroqligi bo‘yicha kelisha olmayapti. Qanday yordam berasan?",
        choices: [
          {
            label: "Ikkala g‘oyaning kuchli tomonlarini birlashtirib, murosali kompromiss yechim topishga undayman.",
            response: "Jasur: “Super g‘oya! “Meniki-seniki” emas, balki “bizniki” degan yondashuv bu.”",
            outcome: "Ikkala a’zo ham o‘z qadrini ko‘rdi va loyiha yanada boyidi.",
          },
          {
            label: "Ularning tortishuviga aralashmay, kim baqirib yutsa, shuni qabul qilamiz.",
            response: "Jasur: “Kuchli ovoz har doim ham to‘g‘ri fikrni anglatmaydi.”",
            outcome: "Mantiq va tahlil his-tuyg‘ulardan ustun bo‘lishi lozim.",
          },
          {
            label: "Faqat o‘zimga yoqqan do‘stimning tarafini olib, ikkinchisini chetlataman.",
            response: "Jasur: “Tarafkashlik jamoani ikkiga bo‘lib yuboradi.”",
            outcome: "Adolat va loyiha manfaati shaxsiy simpatiyadan yuqori turishi lozim.",
          },
        ],
      },
      {
        stageIndex: 2,
        question: "Jamoa muhokamasida kimningdir fikri e’tiborsiz qoldirilsa, nima qilish mumkin?",
        choices: [
          {
            label: "“Do‘stlar, uning fikrini ham to‘liq tinglaylik, balki ajoyib taklif bordir” deb unga so‘z beraman.",
            response: "Jasur: “Juda olijanob harakat! Ba’zan eng sokin odamda eng yorqin g‘oyalar bo‘ladi.”",
            outcome: "U o‘ziga ishonch hosil qildi va loyihaga juda qimmatli yangilik qo‘shildi.",
          },
          {
            label: "Agar qolganlar kulgan bo‘lsa, men ham kulib qo‘yaman.",
            response: "Jasur: “Begonallashtirish insonning ishtiyoqini so‘ndiradi.”",
            outcome: "Inkluzivlik — har bir a’zoning ovozi muhimligini tan olishdir.",
          },
          {
            label: "Fikr aytishga ulgurmagan o‘zi aybdor deb hisoblayman.",
            response: "Jasur: “Hamma ham o‘z fikrini oson bayon qila olmasligi mumkin, qo‘llash kerak.”",
            outcome: "Hurmat va qo‘llab-quvvatlash jamoaning asosiy tayanchidir.",
          },
        ],
      },
      {
        stageIndex: 3,
        question: "Vazifalarni adolatli taqsimlash uchun jamoa bilan qanday kelishasiz?",
        choices: [
          {
            label: "Har kimning kuchli tomoni va bo‘sh vaqtini hisobga olib, oraliq muddatlarni birga belgilaymiz.",
            response: "Jasur: “Rejali ish — yarim muvaffaqiyat! Hamma o‘z mas’uliyatini aniq bildi.”",
            outcome: "Loyiha bosqichma-bosqich, intizom bilan mukammal bajarildi.",
          },
          {
            label: "Eng og‘ir ishlarni eng jim o‘tirgan odamga yuklaymiz.",
            response: "Jasur: “Majburiy yuklama sifatning pasayishiga va norozilikka olib keladi.”",
            outcome: "Moslik tamoyili ish samaradorligini keskin oshiradi.",
          },
          {
            label: "Hamma bir vaqtda bitta topshiriqda tartibsiz ishlasin deymiz.",
            response: "Jasur: “Rejasiz ish tartibsizlik va vaqt yo‘qotilishiga sabab bo‘ladi.”",
            outcome: "Aniq reja va kelishuv har qanday jamoaning tayanchidir.",
          },
        ],
      },
      {
        stageIndex: 4,
        question: "Jamoa natijasi kutilganidek chiqmasa yoki kamchilik bo‘lsa, kim javobgar?",
        choices: [
          {
            label: "G‘alaba ham, kamchilik ham butun jamoaniki; bir-birimizni ayblamay, sabablarni tahlil qilamiz.",
            response: "Jasur: “Ofarin! Haqiqiy yetakchi aybdor qidirmaydi, birgalikda yechim topadi.”",
            outcome: "Jamoa sinovdan yanada kuchli va jipslashgan holda chiqdi.",
          },
          {
            label: "Oxirgi topshirgan odamni aybdor deb e’lon qilamiz.",
            response: "Jasur: “Birovni aybdor qilish orani buzadi, muammoni esa hal qilmaydi.”",
            outcome: "Ayblash madaniyati hamkorlikni o‘ldiradi. Mas’uliyat umumiy bo‘lishi shart.",
          },
          {
            label: "Men yaxshi ishlagandim, boshqalar xato qildi deb o‘zimni chetga olaman.",
            response: "Jasur: “Jamoada alohida qutqarilish bo‘lmaydi, hamma bir kemada.”",
            outcome: "Yagona maqsad yo‘lida bir-biriga yelkadosh bo‘lish eng muhim fazilatdir.",
          },
        ],
      },
    ],
  },

  madina: {
    id: "madina",
    name: "Madina",
    role: "O‘quvchi",
    topic: "Stress va o‘zini boshqarish: Vaqt, o‘qish va raqamli odatlar",
    storyIntro:
      "Salom Aisha! Oxirgi paytlarda uy vazifalari, imtihonlar va telefon bildirishnomalari orasida o‘zimni juda charchagan his qilyapman. Keling, vaqt va stressni to‘g‘ri boshqarishni birga ko‘rib chiqaylik.",
    color: "#10b981",
    avatarEmoji: "👧",
    x: 1450,
    y: 445,
    rewardBadge: "Xotirjamlik va muvozanat nishoni",
    rewardXp: 120,
    reflectionQuestion: "Stressli vaziyatda o‘zingizni xotirjam qilish uchun eng yaxshi usul siz uchun qaysi?",
    stages: [
      {
        stageIndex: 0,
        question: "Bir kunda juda ko‘p vazifa berildi: uy vazifalari, to‘garak va imtihon. Nimadan boshlaysan?",
        choices: [
          {
            label: "Vazifalarni muhimligi va muddatiga qarab ro‘yxat tuzib, eng muhimidan ketma-ket boshlayman.",
            response: "Madina: “Aynan shunday! Katta ishlarni kichik qismlarga bo‘lish sarosimani yo‘qotadi.”",
            outcome: "Reja bilan ish boshlading, xavotir kamaydi va ishlar o‘z vaqtida bitdi.",
          },
          {
            label: "Boshim qotib, hech birini qilmasdan telefon titkilab o‘tiraman.",
            response: "Madina: “Muammodan qochish uni kattalashtiradi, keyinroq stress ikki barobar bo‘ladi.”",
            outcome: "Vaqt o‘tib xavotir yanada kuchayadi. Kichik qadamdan boshlash afzal.",
          },
          {
            label: "Hammasini bir vaqtda bajarishga urinib, shoshib ishlayman.",
            response: "Madina: “Ko‘p vazifalilik tez charchatadi va xatolar ko‘payadi.”",
            outcome: "Diqqatni bitta ishga jamlash ancha yuqori sifat beradi.",
          },
        ],
      },
      {
        stageIndex: 1,
        question: "Dars qilayotganda telefon bildirishnomalari tez-tez chalg‘itsa, nima qilasan?",
        choices: [
          {
            label: "Telefonni “Ovozsiz” rejimiga qo‘yib, boshqa xonaga yoki sumkaga solib qo‘yaman.",
            response: "Madina: “Zo‘r odat! Ko‘zdan uzoq bo‘lsa, miya chuqur diqqat (deep work) holatiga oson kiradi.”",
            outcome: "Diqqating jamlandi va odatda 2 soat ketadigan vazifani 45 daqiqada sifatli bajarding.",
          },
          {
            label: "Har xabar kelganda ochib ko‘rib, keyin yana darsga qaytaman.",
            response: "Madina: “Har safar chalg‘iganda diqqatni qayta to‘plash uchun 15 daqiqa vaqt ketadi.”",
            outcome: "Miya tez toliqadi va o‘qilgan ma’lumot xotirada yaxshi saqlanmaydi.",
          },
          {
            label: "Darsni tashlab, faqat ijtimoiy tarmoqda o‘tiraman.",
            response: "Madina: “Qisqa rohat keyinchalik katta stress va kechikishga aylanadi.”",
            outcome: "Raqamli chegaralarni o‘rnatish ruhiy salomatlik uchun juda zarur.",
          },
        ],
      },
      {
        stageIndex: 2,
        question: "Imtihon yoki muhim tadbir oldidan xavotir va hayajon kuchaysa, qanday usul yordam berishi mumkin?",
        choices: [
          {
            label: "Chuqur nafas olish mashqlarini bajaraman, iliq suv ichib, “Men qo‘limdan kelganicha tayyorman” deb dalda beraman.",
            response: "Madina: “Juda samarali! Chuqur nafas yurak urishini me’yoriga keltiradi va asablarni tinchlantiradi.”",
            outcome: "Tana va aql tinchlandi, xotira va fikrlash ravonlashdi.",
          },
          {
            label: "Tunu-kun uxlamay, tinimsiz kitob yodlashga tushaman.",
            response: "Madina: “Uyqusizlik miya faoliyatini sekinlashtiradi va stressni yanada oshiradi.”",
            outcome: "Yetarli uyqu va dam olish har qanday dori va mashqdan afzal.",
          },
          {
            label: "Xavotirimni hammaga aytib, vahima ko‘taraman.",
            response: "Madina: “Vahima boshqalarga ham yuqadi va vaziyatni yomonlashtiradi.”",
            outcome: "Xotirjamlik va o‘zini qo‘lga olish orqali haqiqiy kuch namoyon bo‘ladi.",
          },
        ],
      },
      {
        stageIndex: 3,
        question: "Dam olish va ishlash vaqtini muvozanatli rejalashtirish uchun qaysi reja eng foydali?",
        choices: [
          {
            label: "25-30 daqiqa diqqat bilan o‘qib, 5 daqiqa ko‘z va tana mashqlari bilan dam olish (Pomodoro usuli).",
            response: "Madina: “Ilmiy isbotlangan ajoyib metod! Miya charchamaydi va uzoq vaqt unumli o‘rganish imkoni bo‘ladi.”",
            outcome: "Kuchingiz tejaldi, charchoqsiz uzoq vaqt unumli o‘rganishga erishdingiz.",
          },
          {
            label: "5 soat to‘xtovsiz o‘tirib, keyin butun kun yotish.",
            response: "Madina: “Surunkali toliqish va qiziqish so‘nishiga olib keladi.”",
            outcome: "Jismoniy harakat va toza havo aqliy faoliyat uchun juda muhim.",
          },
          {
            label: "Faqat dam olib, topshiriqni oxirgi kechaga qoldirish.",
            response: "Madina: “Kechiktirish odati doimiy asabiylik manbaiga aylanadi.”",
            outcome: "Kun tartibiga rioya qilish hayot sifatini va kayfiyatni yaxshilaydi.",
          },
        ],
      },
      {
        stageIndex: 4,
        question: "Qattiq toliqqanda yoki hissiy bosimni yolg‘iz hal qila olmasang, kimga murojaat qilish eng to‘g‘ri?",
        choices: [
          {
            label: "Ota-onam, maktab psixologi yoki ishonchli ustozim bilan ochiq gaplashib, maslahat olaman.",
            response: "Madina: “Eng oqilona qaror! Yordam so‘rash — kuchsizlik emas, balki o‘ziga bo‘lgan g‘amxo‘rlikdir.”",
            outcome: "Kattalarning mehr va tushunishi senga yengillik va to‘g‘ri maslahat berdi.",
          },
          {
            label: "Ichimga yutib, hech kimga bildirmaslikka harakat qilaman.",
            response: "Madina: “Hissiyotlarni bostirish sog‘liqqa va kayfiyatga salbiy ta’sir qiladi.”",
            outcome: "Hissiyotlarni ifoda etish ruhiy sog‘lomlikning poydevoridir.",
          },
          {
            label: "Begona internet foydalanuvchilariga shikoyat qilaman.",
            response: "Madina: “Begonalar noto‘g‘ri yoki xavfli maslahat berishi mumkin, ehtiyot bo‘lish kerak.”",
            outcome: "Ishonchli va yaqin insonlar davrasi eng xavfsiz maskandir.",
          },
        ],
      },
    ],
  },
};

export const NPC_LIST: NpcDefinition[] = Object.values(NPC_DATA);

export const MASTER_ACHIEVEMENT = {
  id: "master-ambassador",
  title: "Z-Avlod elchisi: Barkamol shaxs nishoni",
  description: "Barcha 5 ta RPG qahramon bilan suhbatlashib, barcha hayotiy vaziyatlarni muvaffaqiyatli hal qildingiz!",
  badge: "Barkamol shaxs nishoni",
  xpBonus: 200,
};
