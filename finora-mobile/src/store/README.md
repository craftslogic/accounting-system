# Finora Mobile — Supabase Auth Store

## Store: `useAuthStore`

Located at `src/store/authStore.ts`

### State
| Field | Type | Description |
|-------|------|-------------|
| `user` | `User \| null` | Current Supabase user |
| `session` | `Session \| null` | Active session |
| `isLoading` | `boolean` | Operation in progress |
| `isInitialized` | `boolean` | Auth state resolved |

### Actions
- `initialize()` — Restores session from AsyncStorage on app start
- `signInWithEmail(email, password)` — Email/password login
- `signUpWithEmail(email, password, fullName)` — Email signup
- `signInWithGoogle()` — OAuth via Supabase + Expo WebBrowser
- `signOut()` — Clears session

### Auth Flow
```
App start → initialize() → getSession()
  ├── Session found → set user + redirect to /(tabs)/home
  └── No session → redirect to /(auth)/welcome

AuthGuard (in _layout.tsx) monitors auth state changes
  ├── user && inAuthGroup → push /(tabs)/home
  └── !user && !inAuthGroup → push /(auth)/welcome
```
