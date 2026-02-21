# 🧪 XploitArena End-to-End Testing Flow

Jab aapne itne saare features complete (Done) kar liye hain, toh unko ek baar shuru se aakhir tak (End-to-End) test karna bahut zaroori hai taaki pata chale ki saari kadiyan (links) sahi se judi hain ya nahi.

Yeh ek step-by-step master plan hai jisse aapka pura platform (Frontend + Backend + DB) test ho jayega. Ise bilkul isi kram (order) me follow karein:

---

## 🏃 PHASE 1: User Onboarding & Roles (Account Banane ka Test)

_Is phase me hum check karenge ki kya naye account theek se ban rahe hain aur unko sahi permission mil rahi hai._

1. **Researcher Registration:**
   - [ ] Ek naya account banayein `hacker1@yopmail.com` ke naam se aur role 'Researcher' choose karein.
   - [ ] Check karein ki email verification link aata hai ya link verify karne ke baad `isVerified` true hota hai.
2. **Company Registration:**
   - [ ] Doosra account `admin@tesla.com` banayein aur role 'Company Admin' chunein.
   - [ ] Login karne ke baad dashboard dekhein ki kya "KYB Pending" status aa raha hai.
3. **MFA Enablement (2FA Test):**
   - [ ] `hacker1` se login karke, Settings me jakar 2FA (Authenticator App/Email OTP) on karein.
   - [ ] Logout karke wapas login karein. Bina 2FA code ke login nahi hona chahiye.

---

## 🏢 PHASE 2: Company Operations (Program Banane ka Test)

_Is phase me hum check karenge ki Company kya apna Bug Bounty Program sahi se bana pa rahi hai._

1. **Admin Approval (Super Admin kaam karega):**
   - [ ] "Super Admin" account (pehle se bana hoga) se login karein.
   - [ ] `admin@tesla.com` (Company) ko Approve karein taaki wo Program bana sake.
2. **Create Program:**
   - [ ] Vapis Company ID se login karein.
   - [ ] "Launch New Program" par click karein.
   - [ ] Ek Public Program banayein 'Tesla Core' naam se (Bounty: $100-$5000, Scope: \*.tesla.com).
   - [ ] "Safe Harbor", "Disclosure Policy" aur **SLA Targets (24hr response, 72hr triage)** forms sahi se bharein aur Submit karein.
3. **Budget Set Karna:**
   - [ ] Check karein ki program edit karte waqt Total Budget set ho raha hai aur Dashboard par "Active Programs" ka counter 1 se badh gaya hai.

---

## 💻 PHASE 3: Researcher Operations (Hacking & Bug Report Test)

_Is phase me check hoga ki kya Hacker ko features sahi se mil rahe hain._

1. **Dashboard & Discovery:**
   - [ ] `hacker1` id se login karein.
   - [ ] Directory/Programs me dekhein kya `Tesla Core` wahan publicly top par dikh raha hai.
   - [ ] Program ko Bookmark karein dekhein ki Dashboard me Monitoring widget me update ho raha hai.
2. **Submit Report (Bug bhejna):**
   - [ ] 'Tesla Core' program kholiye aur "Submit Report" click karein.
   - [ ] Severity "HIGH", Weakness "XSS" aur Steps to Reproduce dalkar report bhej de.
   - [ ] **Draft Test:** Bich me tab close karke wapas kholiye, check kariye ki 30s Auto-Save Draft se purani likhi hui report wapas aa rahi hai kya!
3. **Teams & Comments:**
   - [ ] Report Submit hone ke baad us report ke andar Comment karein ("Pls reply fast").

---

## 🛡️ PHASE 4: Triager & Vulnerability Management (SLA & Status Track)

_Yahan check hoga ki kya company ya Triager properly action le paa rahe hain._

1. **Report Status Update (Triage process):**
   - [ ] Company admin ya 'Triager' role waley ID se login karein.
   - [ ] Unread Reports me `hacker1` ki report kholiye.
   - [ ] Status ko `SUBMITTED` se badalkar `TRIAGING` karein.
   - [ ] Phir padhne ke baad usko finally `ACCEPTED` status me set karein.
2. **SLA Timers (Bahut Zaroori):**
   - [ ] Jaise hi aapne `SUBMITTED` se hataya, check karein ki **Time to First Response** ki SLA complete/pass hui ya nahi.
3. **Bounty (Paise) Dena:**
   - [ ] Report ko edit karke "Bounty Amount" me $500 daalein aur Status `READY_FOR_PAYOUT` se `PAID` karein.

---

## 📊 PHASE 5: Admin Metrics & Logs (Security Tracker)

_Akhiri stage jahan Super Admin sab check karta hai ki sab data safely record hua na._

1. **Audit Logs Track Karna:**
   - [ ] Super Admin se login karein aur Audit Logs module kholiye.
   - [ ] List me check karein kya ye saari entry hain:
     - _Hacker ne kab login kiya_
     - _Status kisne aur kab change kiya tha_
     - _Bounty kisne release ki_
2. **Company Budget Deduction:**
   - [ ] Admin aur Company dono ke dashboard par check karein ki "$500" total payout me update ho gaya hoga!

> 🏆 **Result:** Agar aapne ye 5 Phase bina kisi error ke nikal liye, iska matlab aapka core **XploitArena 100% Solid** hai aur Live (Production) me jaane ke layak hai!
