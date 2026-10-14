from pathlib import Path

base = Path(r"c:\Users\Администратор\Documents\GitHub\z-avlod\app\games\matematika")
(base / "data").mkdir(exist_ok=True)


def emit_grade5():
    items = []
    seq = 1

    easy = [
        ("18 + 7 = ?", "25", "18 + 7 = 25.", "Natural sonlar"),
        ("43 - 19 = ?", "24", "43 - 19 = 24.", "Ayirish"),
        ("12 × 8 = ?", "96", "12 ning 8 baravarini hisoblasak 96 bo'ladi.", "Ko'paytirish"),
        ("56 ÷ 7 = ?", "8", "56 ni 7 ga bo'lsak 8 chiqadi.", "Bo'lish"),
        ("5 + 12 + 9 = ?", "26", "5 + 12 = 17, 17 + 9 = 26.", "Qo'shish"),
        ("27 + 35 = ?", "62", "27 va 35 ni qo'shsak 62 bo'ladi.", "Qo'shish"),
        ("90 - 46 = ?", "44", "90 - 46 = 44.", "Ayirish"),
        ("9 × 7 = ?", "63", "9 ni 7 martaga ko'paytirish 63 ga teng.", "Ko'paytirish"),
        ("72 ÷ 9 = ?", "8", "72 ni 9 ga bo'lsak 8 chiqadi.", "Bo'lish"),
        ("14 + 6 - 5 = ?", "15", "14 + 6 = 20, 20 - 5 = 15.", "Amallar tartibi"),
        ("3 × 9 + 4 = ?", "31", "3 × 9 = 27, 27 + 4 = 31.", "Amallar tartibi"),
        ("48 ÷ 6 = ?", "8", "48 ni 6 ga bo'lsak 8 chiqadi.", "Bo'lish"),
        ("19 + 25 = ?", "44", "19 va 25 qo'shilsa 44 bo'ladi.", "Qo'shish"),
        ("60 - 27 = ?", "33", "60 - 27 = 33.", "Ayirish"),
        ("11 × 6 = ?", "66", "11 ning 6 baravari 66.", "Ko'paytirish"),
        ("84 ÷ 12 = ?", "7", "84 ni 12 ga bo'lsak 7 chiqadi.", "Bo'lish"),
        ("8 + 15 + 7 = ?", "30", "8 + 15 = 23, 23 + 7 = 30.", "Qo'shish"),
        ("50 - 18 = ?", "32", "50 - 18 = 32.", "Ayirish"),
        ("7 × 8 = ?", "56", "7 × 8 = 56.", "Ko'paytirish"),
        ("81 ÷ 9 = ?", "9", "81 ni 9 ga bo'lsak 9 chiqadi.", "Bo'lish"),
        ("6 + 9 × 2 = ?", "24", "Avval ko'paytirish: 9 × 2 = 18, keyin 6 + 18 = 24.", "Amallar tartibi"),
        ("16 + 8 ÷ 2 = ?", "20", "Birinchi bo'lish: 8 ÷ 2 = 4, keyin 16 + 4 = 20.", "Amallar tartibi"),
        ("4 × 5 + 12 = ?", "32", "4 × 5 = 20, 20 + 12 = 32.", "Amallar tartibi"),
        ("72 - 8 × 7 = ?", "16", "8 × 7 = 56, 72 - 56 = 16.", "Amallar tartibi"),
        ("45 ÷ 5 + 9 = ?", "18", "45 ÷ 5 = 9, 9 + 9 = 18.", "Amallar tartibi"),
        ("23 + 17 = ?", "40", "23 va 17 ni qo'shsak 40 bo'ladi.", "Qo'shish"),
        ("75 - 28 = ?", "47", "75 - 28 = 47.", "Ayirish"),
        ("14 × 5 = ?", "70", "14 ni 5 martaga ko'paytirsak 70 bo'ladi.", "Ko'paytirish"),
        ("96 ÷ 8 = ?", "12", "96 ni 8 ga bo'lsak 12 bo'ladi.", "Bo'lish"),
        ("25 + 13 - 7 = ?", "31", "25 + 13 = 38, 38 - 7 = 31.", "Amallar tartibi"),
        ("9 + 3 × 4 = ?", "21", "3 × 4 = 12, 9 + 12 = 21.", "Amallar tartibi"),
    ]
    for q, a, exp, cat in easy:
        items.append({
            "id": seq,
            "gradeGroup": "5-6",
            "difficulty": "easy",
            "question": q,
            "answer": a,
            "explanation": exp,
            "category": cat,
        })
        seq += 1

    medium = [
        ("1/2 + 1/2 = ?", "1", "Yarim va yarim birga teng.", "Kasrlar"),
        ("3/4 - 1/4 = ?", "1/2", "3/4 - 1/4 = 2/4 = 1/2.", "Kasrlar"),
        ("0,5 + 0,25 = ?", "0,75", "0,5 + 0,25 = 0,75.", "O'nli kasrlar"),
        ("20% dan 80 = ?", "16", "20% = 0,2; 80 × 0,2 = 16.", "Foiz"),
        ("10 dan 30% ni toping", "3", "30% = 0,3; 10 × 0,3 = 3.", "Foiz"),
        ("To'g'ri to'rtburchakning bo'yi 8 sm, eni 5 sm. Perimetri qancha?", "26", "P = 2(a + b) = 2(8 + 5) = 26 sm.", "Perimetr"),
        ("Kvadratning tomoni 6 sm. Yuzi qancha?", "36", "S = a² = 6² = 36 sm².", "Yuza"),
        ("1 soat 20 minut + 40 minut = ?", "2 soat", "1 soat 20 min + 40 min = 2 soat.", "Vaqt"),
        ("2 km 300 m + 700 m = ?", "3 km", "2 km 300 m = 2300 m, 2300 + 700 = 3000 m = 3 km.", "Masofa"),
        ("Tezlik 60 km/soat, vaqt 2 soat. Masofa qancha?", "120", "Masofa = tezlik × vaqt = 60 × 2 = 120 km.", "Tezlik"),
        ("7 × 9 - 18 = ?", "45", "7 × 9 = 63, 63 - 18 = 45.", "Amallar tartibi"),
        ("5 × (6 + 4) = ?", "50", "Qavs ichidagi yig'indi 10, 5 × 10 = 50.", "Amallar tartibi"),
        ("60 ÷ (3 + 7) = ?", "6", "3 + 7 = 10, 60 ÷ 10 = 6.", "Amallar tartibi"),
        ("25% of 120 = ?", "30", "120 ning 25% i = 30.", "Foiz"),
        ("0,8 × 5 = ?", "4", "0,8 × 5 = 4.", "O'nli kasrlar"),
        ("1/3 + 1/3 = ?", "2/3", "1/3 + 1/3 = 2/3.", "Kasrlar"),
        ("3/5 of 20 = ?", "12", "20 × 3/5 = 12.", "Kasrlar"),
        ("5 + 0,5 = ?", "5,5", "5 + 0,5 = 5,5.", "O'nli kasrlar"),
        ("25 + 15 × 2 = ?", "55", "15 × 2 = 30, 25 + 30 = 55.", "Amallar tartibi"),
        ("(18 - 6) ÷ 3 = ?", "4", "18 - 6 = 12, 12 ÷ 3 = 4.", "Amallar tartibi"),
        ("Aylana diametri 14 sm. Radiusi qancha?", "7", "R = D/2 = 14/2 = 7 sm.", "Geometriya"),
        ("To'g'ri burchakli uchburchakning katetlari 3 va 4. Gipotenuza qancha?", "5", "3² + 4² = 25, √25 = 5.", "Geometriya"),
        ("Uchburchakning perimetri 18 sm, tomonlari 5, 6, x. x = ?", "7", "5 + 6 + x = 18, x = 7.", "Geometriya"),
        ("Qutining eni 4 m, bo'yi 5 m. Yuzi qancha?", "20", "S = 4 × 5 = 20 m².", "Yuza"),
        ("45 minutni soatga aylantiring", "0,75 soat", "45 minut = 45/60 = 0,75 soat.", "Vaqt"),
        ("2/5 + 1/5 = ?", "3/5", "2/5 + 1/5 = 3/5.", "Kasrlar"),
        ("3/8 ni 16 ga ko'paytiring", "6", "16 × 3/8 = 6.", "Kasrlar"),
        ("25% + 15% = ?", "40%", "25% + 15% = 40%.", "Foiz"),
        ("6 kg 200 g + 800 g = ?", "7 kg", "6 kg 200 g = 6200 g, + 800 g = 7000 g = 7 kg.", "O'lchov"),
        ("7² = ?", "49", "7² = 7 × 7 = 49.", "Daraja"),
        ("10³ = ?", "1000", "10³ = 10 × 10 × 10 = 1000.", "Daraja"),
        ("4² + 3² = ?", "25", "16 + 9 = 25.", "Daraja"),
        ("12 ning 1/3 qismi = ?", "4", "12 × 1/3 = 4.", "Kasrlar"),
        ("14 sonining yarmi = ?", "7", "14 ÷ 2 = 7.", "Natural sonlar"),
        ("Qolgan 9 ta olma 3 ta bolaga teng taqsimlansa, har biriga nechta olma tushadi?", "3", "9 ÷ 3 = 3.", "Mantiq"),
        ("Bir quti 24 konfet. 3/4 qismi nechta?", "18", "24 × 3/4 = 18.", "Kasrlar"),
        ("1 m = ? sm", "100", "1 metr 100 santimetrga teng.", "O'lchov"),
        ("2 soat 15 minut = ? minut", "135", "2 soat = 120 minut, +15 = 135.", "Vaqt"),
        ("Tezlik 75 km/soat, vaqt 4 soat. Masofa = ?", "300", "75 × 4 = 300 km.", "Tezlik"),
    ]
    for q, a, exp, cat in medium:
        items.append({
            "id": seq,
            "gradeGroup": "5-6",
            "difficulty": "medium",
            "question": q,
            "answer": a,
            "explanation": exp,
            "category": cat,
        })
        seq += 1

    hard = [
        ("Bir bankda 72 litr sut bor. 1/3 qismi sotildi. Qancha qoldi?", "48", "72 × 1/3 = 24, 72 - 24 = 48.", "Kasrlar"),
        ("Uchburchakning yuzi 24 sm², asosi 8 sm. Balandligi qancha?", "6", "S = a × h / 2; 24 = 8 × h / 2 => h = 6.", "Geometriya"),
        ("8 ta quti uchun 56 kg sabzi olib kelindi. Har qutida necha kg?", "7", "56 ÷ 8 = 7.", "Mantiq"),
        ("80 sonining 15% i qancha?", "12", "0,15 × 80 = 12.", "Foiz"),
        ("Aylana diametri 20 sm. Radiusi va yuzi nimaga teng?", "10 va 314", "R = 10, S = πr² ≈ 3,14 × 100 = 314.", "Geometriya"),
        ("Bir ishchi 6 soatda 18 ta detal tayyorladi. 1 soatda necha detal tayyorlaydi?", "3", "18 ÷ 6 = 3 detal.", "Tezlik"),
        ("To'g'ri to'rtburchakning perimetri 28 sm, eni 4 sm. Bo'yi qancha?", "10", "2(a + 4) = 28 => a + 4 = 14 => a = 10.", "Perimetr"),
        ("7 + 3 × (8 - 2) = ?", "25", "8 - 2 = 6, 3 × 6 = 18, 7 + 18 = 25.", "Amallar tartibi"),
        ("Bir erkak 3 soatda 15 km yo'l bosdi. Uning tezligi qancha?", "5", "15 ÷ 3 = 5 km/soat.", "Tezlik"),
        ("Sinfda 28 o'quvchi bor. Ularning 3/4 qismi qizlar. Qizlar soni qancha?", "21", "28 × 3/4 = 21.", "Kasrlar"),
        ("30 dan 40% ni ayirib, 12 ga qo'shing", "30", "30 - 12 + 12 = 30.", "Foiz"),
        ("4ta oyok bilan 8 ta to'p uchun 32 so'm turadi. 1 ta to'p qancha turadi?", "4", "32 ÷ 8 = 4.", "Mantiq"),
        ("Do'konda 120 ta shakarli pechenye bor. 25% i sotildi. Qancha qoldi?", "90", "25% = 30, 120 - 30 = 90.", "Foiz"),
        ("5 soat 30 minut + 2 soat 45 minut = ?", "8 soat 15 minut", "5 soat 30 min + 2 soat 45 min = 8 soat 15 min.", "Vaqt"),
        ("1 litr sut 1000 ml. 3/5 qismi qancha ml?", "600", "1000 × 3/5 = 600 ml.", "Kasrlar"),
        ("Bir qutidagi 24 ta qalamning 1/6 qismi yirtilgan. Yirtilganlar soni qancha?", "4", "24 × 1/6 = 4.", "Kasrlar"),
        ("3 ta sonning o'rta arifmetigi 14 bo'lsa, ularning yig'indisi qancha?", "42", "O'rta arifmetik = yig'indi/3, shuning uchun yig'indi = 14 × 3 = 42.", "Mantiq"),
        ("4 qoyilishni ishlatkanda 32 kg yuk ko'tarilgan. 1 qoyilishni necha kg?", "8", "32 ÷ 4 = 8.", "Mantiq"),
        ("Aylanadagi doira yuzasi 50 sm². Radiusi qanchaga yaqin?", "4", "S = πr² ≈ 3,14 × r² = 50 => r² ≈ 15,9 => r≈4.", "Geometriya"),
        ("100 ta qizil va ko'k shar. 30% qizil. Ko'k sharlar soni qancha?", "70", "100 - 30 = 70.", "Foiz"),
        ("Maktabning kengligi 15 m, uzunligi 18 m. Yuzi qancha?", "270", "15 × 18 = 270 m².", "Yuza"),
        ("12 ta olma 4 ta bola o'rtasida teng bo'lib berildi. Har bir bola nechtadan oladi?", "3", "12 ÷ 4 = 3.", "Mantiq"),
        ("Bir kema 3 soatda 72 km yurgan bo'lsa, tezligi qancha?", "24", "72 ÷ 3 = 24 km/soat.", "Tezlik"),
        ("1/2 + 1/4 + 1/4 = ?", "1", "1/2 + 1/4 + 1/4 = 1.", "Kasrlar"),
        ("8 ta qutidagi 96 kg un 3 kunda ishlatildi. 1 kundagi miqdor?", "32", "96 ÷ 3 = 32 kg.", "Mantiq"),
        ("2,5 + 1,75 = ?", "4,25", "2,5 + 1,75 = 4,25.", "O'nli kasrlar"),
        ("4,5 ÷ 0,5 = ?", "9", "4,5 ÷ 0,5 = 9.", "O'nli kasrlar"),
        ("Yuzasi 64 sm² bo'lgan kvadratning tomoni qancha?", "8", "a² = 64 => a = 8.", "Yuza"),
        ("10 ta meva 30 so'm turadi. 1 ta meva qancha?", "3", "30 ÷ 10 = 3.", "Mantiq"),
        ("Tezlik 80 km/soat, masofa 240 km. Vaqt qancha?", "3", "240 ÷ 80 = 3 soat.", "Tezlik"),
        ("Bola 1200 so'mga 4 ta daftar oldi. 1 daftar qancha turadi?", "300", "1200 ÷ 4 = 300.", "Mantiq"),
    ]
    for q, a, exp, cat in hard:
        items.append({
            "id": seq,
            "gradeGroup": "5-6",
            "difficulty": "hard",
            "question": q,
            "answer": a,
            "explanation": exp,
            "category": cat,
        })
        seq += 1
    return items


def emit_grade7():
    items = []
    seq = 1

    easy = [
        ("3x + 7 = 22", "5", "3x = 15, x = 5.", "Chiziqli tenglamalar"),
        ("x - 9 = 14", "23", "x = 14 + 9 = 23.", "Chiziqli tenglamalar"),
        ("5x = 35", "7", "x = 35 ÷ 5 = 7.", "Chiziqli tenglamalar"),
        ("x/4 = 6", "24", "x = 6 × 4 = 24.", "Chiziqli tenglamalar"),
        ("x² = 49", "7 yoki -7", "7² = 49 va (-7)² = 49.", "Daraja va ildiz"),
        ("√81 = ?", "9", "9² = 81.", "Ildiz"),
        ("12% of 250 = ?", "30", "250 × 0,12 = 30.", "Foiz"),
        ("1/2 + 1/4 = ?", "3/4", "1/2 = 2/4, 2/4 + 1/4 = 3/4.", "Kasrlar"),
        ("20 : 5 = ?", "4", "20 ni 5 ga bo'lsak 4 bo'ladi.", "Nisbat"),
        ("3/5 = ?/20", "12", "20 ni 5 ga bo'lib, 3 ni 4 ga ko'paytirsak 12.", "Kasrlar"),
        ("2a + 3a = ?", "5a", "Ikki o'xshash hadni qo'shsak 5a bo'ladi.", "Algebraik ifodalar"),
        ("(x + 3)² = ?", "x² + 6x + 9", "Kvadrat formulasi: (a + b)² = a² + 2ab + b².", "Algebra"),
        ("17 - 9 = ?", "8", "17 - 9 = 8.", "Natural sonlar"),
        ("8² = ?", "64", "8² = 64.", "Daraja"),
        ("2/3 × 9 = ?", "6", "9 × 2/3 = 6.", "Kasrlar"),
        ("4x - 2 = 10", "3", "4x = 12, x = 3.", "Chiziqli tenglamalar"),
        ("x + 12 = 19", "7", "x = 19 - 12 = 7.", "Chiziqli tenglamalar"),
        ("5% of 200 = ?", "10", "200 × 0,05 = 10.", "Foiz"),
        ("3x + 4x = ?", "7x", "3x va 4x bir xil o'zgaruvchili hadlar.", "Algebraik ifodalar"),
        ("12 ÷ 3 = ?", "4", "12 ni 3 ga bo'lsak 4.", "Bo'lish"),
        ("10 - 3x = 1", "3", "-3x = -9, x = 3.", "Chiziqli tenglamalar"),
        ("(2x + 5) - x = ?", "x + 5", "2x - x = x, keyin +5.", "Algebraik ifodalar"),
        ("√144 = ?", "12", "12² = 144.", "Ildiz"),
        ("3/4 + 1/8 = ?", "7/8", "3/4 = 6/8, 6/8 + 1/8 = 7/8.", "Kasrlar"),
        ("8x = 72", "9", "x = 72 ÷ 8 = 9.", "Chiziqli tenglamalar"),
        ("a + a + a = ?", "3a", "Uchta a ning yig'indisi 3a.", "Algebraik ifodalar"),
        ("2² × 3² = ?", "36", "4 × 9 = 36.", "Daraja"),
        ("30% of 60 = ?", "18", "60 × 0,3 = 18.", "Foiz"),
        ("x = 6, 2x + 1 = ?", "13", "2 × 6 + 1 = 13.", "Chiziqli tenglamalar"),
        ("3/6 = ?", "1/2", "3 va 6 ni 3 ga kamaytirsak 1/2 bo'ladi.", "Kasrlar"),
    ]
    for q, a, exp, cat in easy:
        items.append({
            "id": seq,
            "gradeGroup": "7-9",
            "difficulty": "easy",
            "question": q,
            "answer": a,
            "explanation": exp,
            "category": cat,
        })
        seq += 1

    medium = [
        ("x/3 + 2 = 7", "15", "x/3 = 5, x = 15.", "Chiziqli tenglamalar"),
        ("2(x + 5) = 20", "5", "x + 5 = 10, x = 5.", "Chiziqli tenglamalar"),
        ("2/3 + 1/6 = ?", "5/6", "2/3 = 4/6, 4/6 + 1/6 = 5/6.", "Kasrlar"),
        ("5/8 - 1/4 = ?", "3/8", "1/4 = 2/8, 5/8 - 2/8 = 3/8.", "Kasrlar"),
        ("A : B = 3 : 5, B = 20 bo'lsa, A = ?", "12", "3/5 = A/20 => A = 12.", "Nisbat"),
        ("Foiz hisobida 40 ning 25% i = ?", "10", "40 × 0,25 = 10.", "Foiz"),
        ("x² = 81", "9 yoki -9", "9² = 81 va (-9)² = 81.", "Ildiz va daraja"),
        ("(3x - 1) + (x + 6) = ?", "4x + 5", "3x + x = 4x, -1 + 6 = 5.", "Algebraik ifodalar"),
        ("3(x - 2) = 15", "7", "x - 2 = 5, x = 7.", "Chiziqli tenglamalar"),
        ("2/5 × 15 = ?", "6", "15 × 2/5 = 6.", "Kasrlar"),
        ("Bolalar soni 12, qizlar 5. Qizlar ulushi qanday?", "5/12", "Qizlar soni 5, umumiy 12.", "Nisbat"),
        ("(a + 2)(a - 2) = ?", "a² - 4", "Bu ko'paytmaning farqi: a² - 4.", "Algebra"),
        ("4x + 7 = 31", "6", "4x = 24, x = 6.", "Chiziqli tenglamalar"),
        ("(x + 1)² = ?", "x² + 2x + 1", "Kvadratlarni yoyish: x² + 2x + 1.", "Algebra"),
        ("3/4 ÷ 1/2 = ?", "3/2", "3/4 × 2 = 6/4 = 3/2.", "Kasrlar"),
        ("To'g'ri to'rtburchakning uzunligi 12 sm, eni 5 sm. Yuzi qancha?", "60", "S = 12 × 5 = 60 sm².", "Geometriya"),
        ("Aylana radiusi 7 sm. Diametri qancha?", "14", "D = 2r = 14.", "Geometriya"),
        ("√225 = ?", "15", "15² = 225.", "Ildiz"),
        ("6x - 4 = 20", "4", "6x = 24, x = 4.", "Chiziqli tenglamalar"),
        ("x² - 9 = 0", "3 yoki -3", "(x - 3)(x + 3) = 0.", "Tenglamalar"),
        ("45% ni kasr ko'rinishida yozing", "9/20", "45% = 45/100 = 9/20.", "Foiz"),
        ("3/5 = 18/x bo'lsa, x = ?", "30", "3x = 90, x = 30.", "Kasrlar"),
        ("2ab + 3ab = ?", "5ab", "Birxil hadlarni qo'shamiz.", "Algebraik ifodalar"),
        ("4² + 5² = ?", "41", "16 + 25 = 41.", "Daraja"),
        ("x = 8, y = 3, 2x - y = ?", "13", "2 × 8 - 3 = 13.", "Algebra"),
        ("1/3 + 2/9 = ?", "5/9", "1/3 = 3/9, 3/9 + 2/9 = 5/9.", "Kasrlar"),
        ("4x - 5 = 11", "4", "4x = 16, x = 4.", "Chiziqli tenglamalar"),
        ("5/6 - 1/3 = ?", "1/2", "1/3 = 2/6, 5/6 - 2/6 = 3/6 = 1/2.", "Kasrlar"),
        ("Yuzasi 144 sm² bo'lgan kvadratning tomoni qancha?", "12", "a² = 144 => a = 12.", "Geometriya"),
        ("Uchburchakning ikkita tomoni 7 va 9, perimetri 24. Uchinchi tomoni qancha?", "8", "7 + 9 + x = 24 => x = 8.", "Geometriya"),
        ("2x + 6 = 18", "6", "2x = 12, x = 6.", "Chiziqli tenglamalar"),
        ("12% of 150 = ?", "18", "150 × 0,12 = 18.", "Foiz"),
        ("x/2 = 10", "20", "x = 20.", "Chiziqli tenglamalar"),
        ("a² - a = ?", "a(a - 1)", "Umumiy ko'paytuvchi a ni chiqarib olish mumkin.", "Algebraik ifodalar"),
        ("3/7 × 14 = ?", "6", "14 × 3/7 = 6.", "Kasrlar"),
        ("9² - 6² = ?", "45", "81 - 36 = 45.", "Daraja"),
        ("2x + 3 = 11", "4", "2x = 8, x = 4.", "Chiziqli tenglamalar"),
        ("Masofa 120 km, tezlik 60 km/soat. Vaqt qancha?", "2 soat", "120 ÷ 60 = 2.", "Tezlik"),
        ("0,4 + 0,3 = ?", "0,7", "0,4 + 0,3 = 0,7.", "O'nli kasrlar"),
        ("√49 + √16 = ?", "11", "7 + 4 = 11.", "Ildiz"),
    ]
    for q, a, exp, cat in medium:
        items.append({
            "id": seq,
            "gradeGroup": "7-9",
            "difficulty": "medium",
            "question": q,
            "answer": a,
            "explanation": exp,
            "category": cat,
        })
        seq += 1

    hard = [
        ("x² - 5x + 6 = 0", "2 yoki 3", "(x - 2)(x - 3) = 0.", "Ikki bosqichli tenglamalar"),
        ("3x² = 75", "5 yoki -5", "x² = 25, x = ±5.", "Ikki bosqichli tenglamalar"),
        ("(x - 4)(x + 4) = 0", "4 yoki -4", "Ko'paytmaning qiymati nol bo'lishi uchun bir ko'paytuvchi nol bo'lishi kerak.", "Ikki bosqichli tenglamalar"),
        ("1/2x + 3 = 9", "12", "1/2x = 6, x = 12.", "Chiziqli tenglamalar"),
        ("3x + 2 = 2x + 9", "7", "x = 7.", "Chiziqli tenglamalar"),
        ("9x - 4 = 5x + 12", "4", "4x = 16, x = 4.", "Chiziqli tenglamalar"),
        ("5/6 ÷ 2/3 = ?", "5/4", "5/6 × 3/2 = 15/12 = 5/4.", "Kasrlar"),
        ("2x² - 7x + 3 = 0", "3 yoki 1/2", "(2x - 1)(x - 3) = 0.", "Ikki bosqichli tenglamalar"),
        ("Aylana radiusi 6 sm. Yuzi qancha?", "113,04", "S = πr² = 3,14 × 36 = 113,04 sm².", "Geometriya"),
        ("To'g'ri uchburchakning katetlari 9 va 12. Gipotenuza qancha?", "15", "9² + 12² = 225, √225 = 15.", "Pifagor teoremasi"),
        ("(x + 3)² = 49", "4 yoki -10", "x + 3 = ±7, x = 4 yoki -10.", "Ikki bosqichli tenglamalar"),
        ("3(x - 1) = 2x + 5", "8", "3x - 3 = 2x + 5 => x = 8.", "Chiziqli tenglamalar"),
        ("5/9 + 7/18 = ?", "17/18", "5/9 = 10/18, 10/18 + 7/18 = 17/18.", "Kasrlar"),
        ("x² + 7x + 12 = 0", "-3 yoki -4", "(x + 3)(x + 4) = 0.", "Ikki bosqichli tenglamalar"),
        ("1,5 × 0,4 = ?", "0,6", "1,5 × 0,4 = 0,6.", "O'nli kasrlar"),
        ("4/5 dan 20% ni ayiring", "0,64", "4/5 = 0,8; 20% = 0,16; 0,8 - 0,16 = 0,64.", "Foiz"),
        ("3/8 = x/40", "15", "40 ÷ 8 = 5, 3 × 5 = 15.", "Kasrlar"),
        ("Qutida 25 ta olma bor. Ularning 20% i buzilgan. Buzilganlar soni qancha?", "5", "25 × 0,2 = 5.", "Foiz"),
        ("2x + 3 = 5x - 9", "4", "3 + 9 = 3x, x = 4.", "Chiziqli tenglamalar"),
        ("Aylana diametri 10 sm bo'lsa, yuzasi qancha?", "78,5", "r = 5, S = 3,14 × 25 = 78,5.", "Geometriya"),
        ("A va B nisbat 2:3, A=12 bo'lsa B = ?", "18", "12/2=6, 6×3=18.", "Nisbat"),
        ("x² = 121", "11 yoki -11", "11² = 121.", "Ildiz va daraja"),
        ("(2x - 3)(x + 2) = 0", "1,5 yoki -2", "Ikki ko'paytuvchining biri 0 bo'lishi kerak.", "Ikki bosqichli tenglamalar"),
        ("1/3 + 5/6 = ?", "7/6", "1/3 = 2/6, 2/6 + 5/6 = 7/6.", "Kasrlar"),
        ("5x - 8 = 2x + 13", "7", "3x = 21, x = 7.", "Chiziqli tenglamalar"),
        ("√(36 + 64) = ?", "10", "36 + 64 = 100, √100 = 10.", "Ildiz"),
        ("To'g'ri burchakli uchburchakning katetlari 5 va 12, gipotenuza = ?", "13", "5² + 12² = 169, √169 = 13.", "Pifagor"),
        ("3x² - 12 = 0", "2 yoki -2", "3x² = 12, x² = 4, x = ±2.", "Ikki bosqichli tenglamalar"),
        ("4/7 + 3/14 = ?", "11/14", "4/7 = 8/14, 8/14 + 3/14 = 11/14.", "Kasrlar"),
        ("Aylananing uzunligi 31,4 sm bo'lsa, radiusi qancha?", "5", "L = 2πr, 31,4 = 2 × 3,14 × r => r = 5.", "Geometriya"),
    ]
    for q, a, exp, cat in hard:
        items.append({
            "id": seq,
            "gradeGroup": "7-9",
            "difficulty": "hard",
            "question": q,
            "answer": a,
            "explanation": exp,
            "category": cat,
        })
        seq += 1
    return items


grade5 = emit_grade5()
assert len(grade5) >= 100, len(grade5)
grade7 = emit_grade7()
assert len(grade7) >= 100, len(grade7)

out5 = "import type { MathQuestion } from \"../types\";\n\nexport const gradeFiveToSixQuestions: MathQuestion[] = " + str(grade5).replace("True", "true").replace("False", "false").replace("None", "null") + ";\n"
out7 = "import type { MathQuestion } from \"../types\";\n\nexport const gradeSevenToNineQuestions: MathQuestion[] = " + str(grade7).replace("True", "true").replace("False", "false").replace("None", "null") + ";\n"

(base / "data" / "grade5-6.ts").write_text(out5, encoding="utf-8")
(base / "data" / "grade7-9.ts").write_text(out7, encoding="utf-8")
print("Generated", len(grade5), "grade 5-6 questions")
print("Generated", len(grade7), "grade 7-9 questions")
