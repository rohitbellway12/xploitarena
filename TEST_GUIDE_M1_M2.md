# � XploitArena: Complete Point-to-Point Workflow Guide (M1 & M2)

Ye document aapko help karega platform ke har ek feature (Milestone 1 aur Milestone 2) ko step-by-step verify karne mein. Har section mein "Kya karna hai" (Action) aur "Kya check karna hai" (Expected) clear likha gaya hai.

---

## 🔐 Phase 1: Authentication & Security (M1.1 - M1.3)

### 🔴 Step 1: User Registration & Email Verification

- **Action:** `/register` par jaakar naya account banayein.
- **How it works:** Register karne par DB mein user state `isVerified: false` hogi. Ek verification link email par jayegi.
- **Check (M1.1.2):** Kya aap bina verify kiye Dashboard access kar paa rahe hain? (Should be blocked if enforced). Email bypass ke liye direct link access karke dekhein.

### 🔴 Step 2: Multi-Factor Authentication (M1.1.3)

- **Action:** Settings mein jaakar 2FA enable karein. Phir login karke dekhein.
- **How it works:** Login ke baad dashboard se pehle ek `/verify-2fa` screen aani chahiye jahan OTP manga jayega.
- **Check:** OTP sahi hone par hi aage badhne milna chahiye.

### 🔴 Step 3: Session Management (M1.1.5)

- **Action:** 2-3 alag browsers/devices se login karein.
- **How it works:** Profile settings mein "Active Sessions" dikhne chahiye.
- **Check:** `Revoke All Sessions` button dabane par kya baaki computers se aap logout ho gaye?

---

## 🛠️ Phase 2: RBAC & Multi-Tenancy (M1.2 - M1.3)

### 🔴 Step 4: Role-Based Access Control (RBAC)

- **Action:** 4 alag accounts banayein (Admin, Company, Triager, Researcher).
- **Check (M1.2.1-1.2.7):**
  - Kya Researcher ko Admin panel dikh raha hai? (Expected: No, 403 error).
  - Kya Triager doosre Triager ki private reports dekh sakta hai? (Expected: Only if global access is on).

### 🔴 Step 5: Data Isolation (M1.3)

- **Action:** Researcher-A se ek report submit karein. Refresh karke Researcher-B se login karein.
- **Check:** Researcher-B ko Researcher-A ki report `/my-reports` mein **Nahi** dikhni chahiye.

---

## 🏛️ Phase 3: Admin Power Tools (M1.6 & M1.4)

### 🔴 Step 6: Global Administrative Search (M1.6.1)

- **Action:** Header mein Search bar mein kisi user ka email ya ID dalkar enter marein.
- **Check:** Kya search results mein Users, Programs, aur Reports ka sahi data aa raha hai?

### 🔴 Step 7: Bulk Actions (M1.6.2 - 1.6.3)

- **Action:** `Admin > Company Hub` par jayein. 3 companies select karein.
- **Check:** Bottom/Top bar se `Suspend` click karein. Kya teeno ka status ek saath change hua? Triager assign karke verify karein.

### 🔴 Step 8: Audit Trail (M1.4)

- **Action:** Ek report delete karein ya kisi ka password reset karein.
- **Check:** `Admin > Audit Logs` par jayein. Kya timestamp ke saath action "User Deleted" ya "Password Changed" log hua?

---

## 🏢 Phase 4: Company & Program Lifecycle (M2.1 - M2.2)

### 🔴 Step 9: KYB Verification Workflow (M2.1.1)

- **Action:** Company account se `/settings/kyb` par document upload karein.
- **Check:** Admin panel mein "Pending Approvals" mein wo document dikhna chahiye. Admin ke approve karne par hi company program launch kar sakti hai.

### 🔴 Step 10: Program Creation & Scope (M2.1.6 - 2.1.11)

- **Action:** `Programs > Create` par jayein. Scope definition (URL, Asset Type) aur Reward grid bharein.
- **Check:** Kya program status `DRAFT` se `ACTIVE` tabhi hota hai jab settings complete hon?

### 🔴 Step 11: Budget & Alerts (M2.2)

- **Action:** Program budget $1000 rakhein. Ek report ko $800 ka payout karein.
- **Check (M2.2.2):** Kya dashboard par **75% Budget Alert** ya orange indicator aaya? $1100 payout karne par "Insufficient Balance" aana chahiye.

---

## 🕵️ Phase 5: Researcher & Submission Flow (M2.3 - M2.5)

### 🔴 Step 12: Draft Management (M2.3.5 - 2.3.7)

- **Action:** Report likhna suru karein aur beech mein browser band kar dein.
- **Check:** Dobara jaakar dekhein ki kya "Saved Draft" load hua? (Auto-save logic check).

### 🔴 Step 13: Canonical Status Workflow (M2.4)

- **Action:** Ek report ka status change karein: `Submitted` -> `Triaging` -> `Accepted` -> `Ready for Payout` -> `Paid`.
- **Check:** Har status transition audit log mein record hona chahiye aur researcher ko mail milna chahiye.

### 🔴 Step 14: SLA Tracking (M2.5)

- **Action:** Nayi report submit karein. 1 ghante baad check karein.
- **Check:** Report timeline par "Time to first response" ka countdown dikhna chahiye. Agar response der se hua toh "SLA Breached" flag aana chahiye.

---

## 🏆 Phase 6: Events & Leaderboards (M2.6)

### 🔴 Step 15: Live Hacking Events

- **Action:** Admin se ek Competition banayein (Start date/End date ke saath).
- **Check:** Kya events page par countdown timer chal raha hai? Event end hone par leaderboard par winner dikhna chahiye.

---

## ✅ Final Verification Checklist

1.  **M1.1:** Verification link expire ho rahi hai 24h baad?
2.  **M1.4:** Kya CSV export mein logs clear hain?
3.  **M2.1:** Private program sirf invited researchers ko dikh raha hai?
4.  **M2.4:** Duplicate marks karte waqt parent report ID maangi ja rahi hai?

---

**Tip:** Browser Console (F12) hamesha open rakhein taaki API errors (`401`, `500`) turant dikh jayein.
