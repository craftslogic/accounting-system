# Finora Mobile — Status & Roadmap

## ✅ What Was Just Implemented

### 1. `transactionStore.ts` (new Zustand store)
- Fetches **real accounts** from Supabase with computed balances
- Fetches **real transactions** with joins (category, account)  
- Fetches **categories** (falls back to 13 built-in defaults if user has none yet)
- `addTransaction()` — submits to Supabase `transactions` table
- Works for income, expense, and transfer

### 2. `add.tsx` — Full Add Transaction Screen ✨
Was: `Alert.alert('Coming Soon')` on every button  
Now:
- **Type selector** — Expense / Income / Transfer tabs
- **Big numpad** — native calculator-style amount input in PKR
- **Account picker** — chips from real Supabase accounts
- **To-account picker** — only shown for Transfer type
- **Category picker** — chips filtered by income/expense type
- **Note input** — optional free text
- Saves to **Supabase** and refreshes all data

### 3. `transactions.tsx` — Real Transactions List
Was: static mock data, no grouping  
Now:
- Grouped by date (Today / Yesterday / date labels)
- **Pull-to-refresh**
- **Summary strip** — total income / expenses / net
- Empty state with link to Add
- Add button in header

### 4. `home.tsx` — Real Dashboard
Was: hardcoded mock data  
Now:
- Real total balance from account calculation
- Real monthly income / expenses / savings (current month only)
- Real accounts carousel
- Real recent 5 transactions
- Quick Actions link to Add screen
- Pull-to-refresh

---

## 🔍 What Was Already There (Working)
- Auth flow: Login, Signup, Welcome screens ✅
- Auth store with Supabase session ✅
- Tab navigation (Home / Txns / Add / Analytics / Accounts) ✅
- Accounts tab (still using mock data — needs update) ⚠️
- Analytics tab (charts with mock data) ⚠️
- TransactionRow, Card, Input, Button, EmptyState components ✅

---

## 🗺️ Suggested Next Steps (in priority order)

### Phase 1 — Core Missing Screens (do these first)
| # | Task | Why |
|---|------|-----|
| 1 | **Wire Accounts tab to real Supabase data** | Currently shows mock accounts |
| 2 | **Add Account creation on mobile** | Users need to create accounts from their phone |
| 3 | **Wire Analytics tab to real data** | Charts show fake numbers |

### Phase 2 — Better Transaction UX
| # | Task | Why |
|---|------|-----|
| 4 | **Date picker on Add screen** | Currently defaults to today only |
| 5 | **Edit / Delete transaction** | Swipe-to-delete or long press |
| 6 | **Transaction filters & search** | Filter by type, date range, account |
| 7 | **Transaction detail screen** | Tap a row to see full details |

### Phase 3 — Profile & Settings
| # | Task | Why |
|---|------|-----|
| 8 | **Profile / Settings tab** | Currently no profile page on mobile |
| 9 | **Sign out button on mobile** | Currently missing |
| 10 | **Dark/light mode toggle** | System default works, manual toggle missing |

### Phase 4 — Funds System on Mobile
| # | Task | Why |
|---|------|-----|
| 11 | **Funds list screen** | Show all funds with progress bars |
| 12 | **Fund detail screen** | Add money / use money from a fund |
| 13 | **Available balance shows fund deductions** | Balance card should subtract reserved funds |

### Phase 5 — Notifications & Polish
| # | Task | Why |
|---|------|-----|
| 14 | **Push notifications for recurring allocations** | Fund reminders |
| 15 | **Haptic feedback on Add** | Premium feel on success |
| 16 | **App icon & splash screen** | Currently Expo default |

---

> [!TIP]
> Start with **Phase 1** — wiring real accounts data is 1–2 hours of work and makes the app fully functional end-to-end.

---

## 🚀 To Run the Mobile App

```bash
cd finora-mobile
npx expo start
```
Scan the QR code with Expo Go on your phone.

> [!NOTE]
> The TypeScript errors that exist in the project are all in **Expo-generated boilerplate** files (`explore.tsx`, `app-tabs.tsx`, `collapsible.tsx`). All new files are error-free.
