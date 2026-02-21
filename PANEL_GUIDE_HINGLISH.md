# XploitArena: Company aur Researcher Panel Guide (A to Z)

Namaste! Is file mein hum detail mein samjhenge ki **Company Panel** aur **Researcher (Hacker) Panel** kaise kaam karte hain, har ek feature/page ka kya matlab hai, aur usmein kya data dala jata hai aur kyu dala jata hai.

---

## 1. Company Panel (Company kya, kyu aur kaise karti hai)

Company panel un organizations (companies) ke liye hai jo apni website, app, ya network ko secure karna chahti hain aur uske liye ethical hackers ko platform par invite karti hain.

### A. Company Dashboard (`/company/dashboard`)

- **Kya dikhta hai:** Yahan dashboard par platform ka overview hota hai jaise **Total Payouts** (kitna paisa abhi tak hackers ko diya ja chuka hai), **Active Programs**, aur **Security Reports** (kitni vulnerabilities report hui hain).
- **Kyun dikhta hai:** Taki company ke Admin ya Security Manager (CISO) ko ek glance (ek nazar) mein pata chal jaye ki unka Bug Bounty program kaisa perform kar raha hai aur security health kya hai.

### B. Program Create/Edit Karna (`/company/programs/create`)

Company yahan aakar apna **Bug Bounty Program** banati hai. Is form mein kaafi saari cheezein input karni padti hain:

1. **Program Name & Description:** Program ka naam (e.g. "XploitArena Core Bug Bounty") aur uski ek short summary ki ye program kis baare mein hai.
2. **Scope (In-Scope & Out-of-Scope):**
   - _In-Scope (Targets):_ Wo Domains/URLs ya Android/iOS Apps jinko hack karne ki **Permission** di gayi hai (e.g., `api.example.com`).
   - _Out-of-Scope:_ Wo assets jinpe attack karna **Mana** hai (jaise kisi 3rd party vendor ki site ya marketing blog).
   - _Kyun dalte hain?:_ Hackers ko ek boundary deni padti hai, warna wo galti se kisi aise server ko attack kar sakte hain jissey company ka real data loss ho ya unka server crash ho jaye.
3. **Bounty Table (Rewards):** Hackers ko motivation dene ke liye paiso ka structure banaya jata hai (e.g., Low: $50, Medium: $200, High: $500, Critical: $2000+).
   - _Kyun dalte hain?:_ Hackers apna time lagayenge toh unhe pata hona chahiye ki chhota bug nikalne par kitna paisa milega aur Critical (sabse khatarnak) bug nikalne par kitna milega.
4. **Rules / Policy:** Yahan company apne terms batati hai jaise "Automated scanners (Acunetix/Nessus) use karna mana hai" ya "Phishing/Social Engineering allowed nahi hai".

### C. Team Management (`/company/team-management`)

- **Kya hota hai:** Company apne internal security engineers, managers, ya developers ko platform par invite kar sakti hai.
- **Kyun hota hai:** Jab hackers hazaro bugs report karenge, toh ek akela insaan un sabko check nahi kar sakta. Isliye puri team hoti hai jo reports read karti hai, verify karti hai aur bounty release karti hai.

### D. Events (`/events`)

- **Kya hota hai:** Agar company chahe toh kisi specific time ke liye (jaise 7 din ka hackathon) ek Live Event chala sakti hai, jisme rewards normal se double hon.

---

## 2. Researcher Panel (Hacker kya, kyu aur kaise karta hai)

Researcher panel **Ethical Hackers** ke liye banaya gaya hai jahan wo bugs dhundh kar Submit karte hain, Paise (Bounties) aur Izzat (Reputation) kamate hain.

### A. Researcher Dashboard (`/researcher/dashboard`)

- **Kya dikhta hai:** Hacker ki puri History! Usne total kitni **Bounties Earn** ki hain, uski **Global Rank** kya hai, uske **Reputation Points** kitne hain, aur kitni reports pass (valid) hui hain.
- **Kyun dikhta hai:** Ek hacker ki profile uska Resume hoti hai. Stats dekh kar hacker ko motivation milta hai aage aur hacking continue rakhne ke liye.

### B. Directory / Programs (`/researcher/programs`)

- **Kya hota hai:** Ye ek Marketplace hai. Yahan saari registered companies (public programs ya hacker ko aaye hue private invites) dikhte hain.
- **Kyun hota hai:** Hacker yahan list me aakar dekhta hai ki kis company ko hack karne par sabse achhi bounty mil rahi hai, aur kiske Scope rules use suit karte hain. Yahan se target choose karke wo hacking start karta hai.

### C. Submit Report (`/researcher/submissions/new`)

Jab hacker kisi website me Bug (khami) dhundh leta hai, toh use company ko report karna hota hai form bharkar. Isme ye details aati hain:

1. **Asset/Target:** Report kis target se related hai (`api.example.com` ya `app.example.com`).
2. **Vulnerability Type (CWE):** Kis type ka hacker attack tha? E.g., SQL Injection, Cross-Site Scripting (XSS), ya Server-Side Request Forgery (SSRF).
   - _Kyun dalte hain:_ Triager (jo verify karega) ko exactly pata chale ki flaw kis nature ka hai.
3. **Severity / Impact (Low/Medium/High/Critical):** Is bug se company ka kitna nuksaan ho sakta hai. (Jaise agar normal user dikh raha hai toh "Low", aur agar pura database delete ho sakta hai toh "Critical").
   - _Kyun dalte hain:_ Taki company ko pata chale ki is bug ko kitni jaldi (urgency) fix karna hai.
4. **Steps to Reproduce (PoC - Proof of Concept):** Ye form ka sabse important part hai. Yahan hacker Step-by-Step batata hai ki usne hack kiya TOH KAISE KIYA. (E.g., "Step 1: Go to profile. Step 2: Intercept request in Burp Suite. Step 3: Change user_id=1 to user_id=2...").
   - _Kyun dalte hain:_ Kyunki jab tak company us bug ko khud karke (reproduce karke) nahi dekhegi, tab tak wo kaise manegi ki sach me bug hai aur hacker ko Paise kyu degi?
5. **Attachments:** Screenshots, screen-recording video, ya script files upload karna bug ko prove karne ke liye.

### D. Submissions & Inbox (`/researcher/submissions`)

- **Kya hota hai:** Hacker ne jo report bheji, vo is list me chali jati hai. Yahan wo apni report ka **Status** check karta hai:
  - _New:_ Abhi kisi ne (company ne) read nahi ki hai.
  - _Triaged:_ Company ki security team ne verify kar liya hai ki "Haan, aapka bataya hua Bug Sahi/Valid hai".
  - _Resolved:_ Developer ne code me wo galti theek (fix) kar di hai. Ab hacking kaam nahi karegi wahan.
  - _Duplicate:_ Kisine (kisi aur hacker ne) aapse pehle wahi same bug report kar diya tha (Better luck next time).
- **Kyun hota hai:** Communication! Hacker aur company ke beech isi report ke comment section mein baat hoti hai till the bug is fixed.

### E. Leaderboard (`/researcher/leaderboard`)

- **Kya hota hai:** Top Hackers ki list unke Reputation score ke hisaab se.
- **Kyun hota hai:** "Gamification". Hackers competitive hote hain. Leaderboard me Rank 1 par aana unke liye bahut badi achievement hai aur cybersecurity industry me job milne ka sabse bada criteria hai.

### F. Teams (`/researcher/teams`)

- **Kya hota hai:** Ek hacker akela sabkuch nahi kar sakta. Yahan hackers dusre hackers ki profile search karke unhe Friend/Team request bhej sakte hain aur ek "Squad" ya "Team" bana sakte hain.
- **Kyun hota hai:** Kuch websites bahut complicated hoti hain. Toh hackers team banakar attack karte hain. (Collaborative Hacking). Jaise Ram ne bug dhundha aur Shyam ne usko exploit karke dikhaya. Jab report Valid hoti hai, to Bounty ke paise team members ke beech split (bat-te) hain.

---

**Conclusion:** XploitArena ek fully functional ecosystem hai. Company aati hai taaki system test ho (Bina data loss ke), Hakcers aate hain Paison aur Rank ke liye, aur ye platform dono ke beech safe aur ethical connection banata hai.
