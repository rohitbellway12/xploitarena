# 🚧 Pending Features: Kyun aur Kaise Kaam Karenge?

Yahan un 7 pending features ka detail hai jo abhi aapke XploitArena project mein implement nahi hue hain. Yeh features ek normal Bug Bounty platform ko "Enterprise-Level" (badi companies jaise Google/Microsoft ke standard ka) banane ke liye zaroori hote hain.

Chaliye samajhte hain inme se kaunse feature mein **Third-Party API** lagegi aur wo **kyun zaroori** hain:

---

## 🔹 Milestone 1 (M1) Pending Tasks

### 1. M1.1.9 - SSO Integration: SAML 2.0 for Enterprise

**Kya hai?**
Aapke platform par abhi Google aur GitHub ka login (OAuth) hai jo normal Hackers ke liye theek hai. Par badi companies (jaise Banks ya IT MNCs) apne employees ko alag se password banane nahi deti. Wo apna ek central portal (jaise Okta, Microsoft Azure AD, ya PingIdentity) use karte hain jahan se ek click me sab login hota hai. Is protocol ko SAML 2.0 kehte hain.

**Kyun zaroori hai?**
Badi companies apna Bug Bounty program tab tak host nahi karengi jab tak unhe SAML login na mile kyunki yeh unki security policy hoti hai.

**Third-Party lagegi?**
Haan. Aapko `passport-saml` package use karna padega aur companies ke Okta/Azure servers ke sath connection banana padega.

### 2. M1.2.9 - Database-level permission enforcement (RLS)

**Kya hai?**
Abhi aapki security backend code (Express.js/Node.js middleware) me chal rahi hai. Agar kal ko code me koi bug aa gaya, toh ek company ka admin dusri company ke data (reports/bounties) ko dekh sakta hai. RLS (Row Level Security) direct database (PostgreSQL) ke andar lock lagata hai. Data wahan se bahar tab tak niklega hee nahi jab tak sahi user ki ID match na ho, chahe code me kitni bhi galti ho.

**Kyun zaroori hai?**
Hackers ki reports bahut sensitive hoti hain. Data leak ka chance 0% karne ke liye ye "Defense in Depth" (doosri layer ki security) zaroori hai.

**Third-Party lagegi?**
Nahi. Yeh Prisma aur aapke PostgreSQL database ke andar ki SQL settings (Policies) se lofical way me hota hai.

### 3. M1.5.5 - Malware scanning on upload

**Kya hai?**
Hackers bug report karte waqt apne Proof of Concept (PoC) scripts, PDF, ya ZIP files server par upload karte hain. Aise me koi "Bura Hacker" (Malicious attacker) aisi file upload kar sakta hai jisme virus/trojan ho, jo aapke server ya jo Triager us file ko download karega, uske computer ko hack kar le!

**Kyun zaroori hai?**
Platform, Backend Servers, aur Security Analysts ko virus infection se bachane ke liye. Har file upload hone se pehle scan honi zaroori hai.

**Third-Party lagegi?**
Haan! Sabse sasta aur open-source tarika hai **ClamAV** (software) server par daalna. Ya fir VirusTotal/AWS Macie jaisi premium APIs use karni padengi.

---

## 🔹 Milestone 2 (M2) Pending Tasks

### 4. M2.3.3 - Scope Checker tool

**Kya hai?**
Bug Bounty programs mein har company ek "Scope" deti hai (jaise `*.xploitarena.com` allowed hai, par `admin.xploitarena.com` allowed nahi hai). Hackers galti se galat website hack kar lete hain aur form bharte hain. Ye tool ek input box hota hai jahan hacker report submit karne se pehle apna Target URL daalta hai, aur system (Regex parsing se) batata hai ki "Yeh URL is program mein allowed hai ya nahi."

**Kyun zaroori hai?**
Isse "Out of Scope" (bekar) reports aana band ho jati hain, jisse Triagers aur Company ka time bachta hai.

**Third-Party lagegi?**
Nahi. Yeh aapke khud ke Backend code (Regex matching) se ban jayega.

### 5. M2.3.16 - Report Quality Checker

**Kya hai?**
Bahut se naye hackers grammar ki galtiyan karte hain, ya bekar format me report likhte hain (bina steps, bina screenshot ke). Ye checker ek AI ya rule-based tool hoga jo report submit hone se pehle hacker ko alert dega ("Aapki report mein Steps to Reproduce ghum hai" ya "English theek karein").

**Kyun zaroori hai?**
Professionalism banaye rakhne ke liye aur Companies ka experience acha karne ke liye taaki unhe tatti reports na padhni padein.

**Third-Party lagegi?**
Haan, agar aap isko AI based banana chahte hain toh OpenAI (ChatGPT API) ya Claude API lagani padegi. (Rule-based me third-party nahi chahiye).

### 6. M2.4.8 & M2.4.9 - Jira Sync for In Progress/Resolved status

**Kya hai?**
Jab XploitArena par koi bug "Valid" (Accepted) hota hai, toh company us bug ko fix karne ke liye apne Developers ko bhejti hai. Duniya ki 90% software companies Developers ka kaam track karne ke liye **Jira** (Atlassian) software use karti hain.
Ye integration XploitArena ke bug ko automatically Jira mein ek "Ticket/Task" me convert kar dega. Jab Developer Jira me ticket close karega, toh XploitArena par report apne aap "Resolved" ho jayegi!

**Kyun zaroori hai?**
Company ke admins ko apna kaam 2 jagah (XploitArena par aur Jira par manually) update karne se bachane ke liye. Ye feature premium clients pane ke liye sabse bada hathiyar hai.

**Third-Party lagegi?**
Aapko 100% **Atlassian (Jira) API webhooks** ka istemaal karna hoga.

### 7. M2.5.4 - Escalation triggers (Aggressive Alerts)

**Kya hai?**
Status tracker me humne dekha tha SLA (Service Level Agreement) hote hain (Jaise 72 ghante me reply aana chahiye). Agar 72 ghante nikal gaye aur company ne hacker ko reply nahi kiya, toh yeh Trigger automatically us Company ke sabse bade Boss (CISO ya Manager) ki Email ID par ya Phone No. par alert bhej dega ki "Aapki team SLA fail kar rahi hai!"

**Kyun zaroori hai?**
Hackers ko jaldi reply mil sake aur platform ki reputation SLA breaches ki wajah se kharab na ho.

**Third-Party lagegi?**
Haan. Email ke liye AWS SES/SendGrid (Nodemailer) aur SMS Alerts ke liye **Twilio API** ya **MessageBird API** lagegi.
