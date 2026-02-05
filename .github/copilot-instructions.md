# EduAdmin Copilot Instructions

## Project Overview
**EduAdmin** is a comprehensive school management system for elementary schools (SD). It's a React 19 + TypeScript + Vite application with role-based dashboards for 7 user types (SuperAdmin, OperatorData, StaffTU, KepalaSekolah, GuruMapel, GuruBimbel, WaliKelas, OrangTua) built on **Supabase** backend with **Gemini AI** integration.

**Current State**: ~85% production-ready. Has code quality ✅, but needs security fixes (hardcoded credentials, CSP), environment configs, and testing before deployment.

## Architecture

### 1. **State Management Pattern** (Context + Reducer)
- **DataContext** (`components/DashboardSuperAdmin/contexts/DataContext.tsx`): Centralized data layer for students, teachers, classes, subjects, exams, tutoring
  - Single source of truth - eliminates data duplication between App.tsx and dashboard components
  - Wraps authenticated app with `<DataProvider>`
- **adminReducer** (`components/DashboardSuperAdmin/reducers/adminReducer.ts`): UI state via `useAdminUI()` hook
  - Grouped state: activeView, modals, selections, forms, sidebar toggle
  - Reduces useState declarations from 105+ to manageable amount
- **Custom Hooks** in `components/DashboardSuperAdmin/hooks/`: useStudents, useTeachers, useClasses, useSubjects, useExams, useFinance, useSavings, useTutoring, useAttendance, useSchedules, useMultimedia
  - Each encapsulates data fetching/mutations for specific domain
  - Returns data + setters + helper functions for views to consume

### 2. **Component Structure**
```
components/
├── DashboardSuperAdmin/          # Main admin dashboard (still large at ~4,730 lines, decompose further)
│   ├── contexts/DataContext.tsx  # Shared data via React Context
│   ├── reducers/adminReducer.ts  # UI state management
│   ├── hooks/                    # Domain-specific data hooks
│   ├── components/views/         # Extracted view components (DataSiswaView, KeuanganView, etc.)
│   └── types.ts                  # Shared types (Student, Teacher, Class, Subject, etc.)
├── Dashboard[Role].tsx           # Role-specific dashboards (7 roles, each imports views from DashboardSuperAdmin)
└── Login.tsx                     # Auth entry point (Supabase + legacy fallback)
```

### 3. **Authentication Flow**
- **Primary**: Supabase Auth (`supabase.auth.signInWithPassword()`)
- **Fallback**: Legacy database lookup in `studentsDataGlobal`/`teachersDataGlobal` from `data/sharedData.ts`
- **Issue**: Remove hardcoded credentials (e.g., `admin123`, `guru123` in Login.tsx) before production - use Supabase Auth only
- **Session**: Stored in localStorage as `supabase.auth.token` + `mock_session_v1`

### 4. **Data Flow**
1. User logs in via Login.tsx → Supabase Auth validates
2. App.tsx wraps authenticated view with `<DataProvider>`
3. DataContext fetches all domain data via custom hooks
4. Dashboard components consume via `useDataContext()` and `useAdminUI()`
5. Role-based dashboards render from `data/sharedData.ts` fallback or live Supabase

## Key Files & Patterns

### Critical Files to Know
- `App.tsx`: Main router, auth state, wraps with DataProvider
- `components/Login.tsx`: Auth entry (⚠️ has hardcoded credentials - needs removal)
- `components/DashboardSuperAdmin/contexts/DataContext.tsx`: All shared data hooks aggregated
- `data/sharedData.ts`: Global fallback data for 7 roles + school settings
- `vite.config.ts`: Code splitting config (vendor, ui, ai chunks), CSP headers via `_headers`
- `pre-deploy-check.js`, `setup-supabase.js`: Deployment helpers

### View Component Pattern
Each view in `components/DashboardSuperAdmin/components/views/` follows:
```tsx
// Example: DataSiswaView.tsx
export const DataSiswaView: React.FC<DataSiswaViewProps> = ({ ... }) => {
  const { students, classes, ... } = useDataContext();
  const [uiState, dispatch] = useAdminUI(); // for local view state if needed
  
  return (
    <div>
      {/* UI for managing students */}
    </div>
  );
};
```

### Custom Hook Pattern
```tsx
// Example: components/DashboardSuperAdmin/hooks/useStudents.ts
export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  
  const addNewStudent = (student) => { /* logic */ };
  const updateStudent = (id, changes) => { /* logic */ };
  
  return {
    students, setStudents, addNewStudent, updateStudent,
    // ... other helpers
  };
};
```

## Developer Workflows

### Local Development
```bash
npm install                          # Install deps
npm run dev                          # Start Vite dev server (http://localhost:3000)
npm run build                        # Production build
npm run preview                      # Preview built bundle locally
node test-gemini.js                  # Test Gemini API integration
```

### Build & Deployment
1. **Pre-deployment checks**: `node pre-deploy-check.js` (verifies env vars, builds)
2. **Git-based**: Push to main → Cloudflare Pages auto-deploys
3. **Manual**: `npx wrangler pages deploy dist` to Cloudflare
4. **Environment**: Set VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, GEMINI_API_KEY in Cloudflare Pages settings

### Debugging
- **State issues**: Check `components/DashboardSuperAdmin/contexts/DataContext.tsx` - it's the single source
- **Auth issues**: Look in Login.tsx and App.tsx (session/localStorage)
- **Data not syncing**: Verify hooks are fetching from Supabase (check `src/lib/supabase.ts`)
- **Console logs**: 127+ console.log statements in code - replace with proper error logging before production

## Project-Specific Conventions

1. **Naming**: `Dashboard[Role].tsx` for role-specific dashboards, `[Feature]View.tsx` for views inside DashboardSuperAdmin
2. **Styling**: Tailwind CSS only - no CSS modules or styled-components
3. **Icons**: lucide-react exclusively
4. **Error handling**: Use `react-hot-toast` for notifications (avoid console.error in production)
5. **Data structure**: Students/Teachers indexed by ID in arrays, Classes/Subjects in arrays, Grades/Attendance in localStorage
6. **Responsive**: Mobile-first, Tailwind breakpoints (sm, md, lg, xl)

## Critical Issues Before Production

### Production Readiness: 78% → Target 90%+ after fixes

🔴 **MUST FIX (4-6 hours)**:
1. **Remove hardcoded credentials from Login.tsx** (Line 238 specifically)
   - Current issue: `if (username === 'admin' && (password === 'admin123' || password === 'admin'))`
   - Security risk: CRITICAL - backdoor login accessible to anyone
   - Solution: Delete all hardcoded password checks, use Supabase Auth only in production
   - Set environment variable `VITE_ALLOW_FALLBACK_AUTH=false` for production deployment

2. **Create `.env.example`**
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   GEMINI_API_KEY=your-gemini-api-key (optional)
   VITE_ALLOW_FALLBACK_AUTH=false (production only)
   ```

3. **Setup admin user in Supabase** before deployment
   - Create auth user in Supabase
   - Create profile record in database
   - Test login via Supabase Auth only

4. **Test deployment to staging** - verify all roles work without fallback

🟡 **SHOULD FIX (8-12 hours)**:
- Replace remaining `console.log` (127+) with logger utility - partially done, needs completion
- Implement Error Boundary for global error handling
- Add unit/integration tests (Jest + React Testing Library)
- Setup CI/CD with automated tests
- Add environment variable validation at startup
- Improve CSP headers - currently uses `unsafe-inline`, transition to nonce-based

🟢 **NICE TO HAVE** (Future):
- Split DashboardSuperAdmin.tsx further (currently 4,730 lines, very large)
- Optimize bundle size (~1.4MB main chunk) via aggressive code splitting
- Add error tracking service (Sentry, LogRocket)
- Implement performance monitoring

## Integration Points

- **Supabase**: `src/lib/supabase.ts` initializes client with VITE_SUPABASE_URL/KEY
- **Gemini AI**: Imported in DashboardSuperAdmin via `@google/genai`
- **Al-Quran API**: Called directly from components (domains whitelisted in CSP `_headers`)
- **Excel Upload**: XLSX library for student/teacher imports in views

## Performance Notes

- **Code splitting**: vendor, ui, ai chunks configured in vite.config.ts
- **Bundle size**: ~1-1.5 MB total (currently 1.95MB gzipped)
  - Main bundle: 1,465 kB (362 KB gzipped) ⚠️ Consider further splitting
  - AI chunk: 253 kB (50 KB gzipped) ✅
  - UI chunk: 49 kB (10 KB gzipped) ✅
  - Vendor chunk: 11 kB (4 KB gzipped) ✅
  - CSS: 169 kB (23 KB gzipped) ✅
- **Lazy loading**: React.lazy() for dashboard components in App.tsx
- **LocalStorage**: Attendance, grades, school settings persisted to localStorage (consider IndexedDB for scale)

## Deployment Verification Checklist

### Pre-Deployment (Must complete before production)
```bash
# 1. Run pre-deploy check
node pre-deploy-check.js

# 2. Build aplikasi
npm run build

# 3. Test build locally
npm run preview

# 4. Verify dist folder exists and is not empty
ls -la dist/
```

### Environment Setup
**Cloudflare Pages Settings:**
- Add env var: `VITE_SUPABASE_URL`
- Add env var: `VITE_SUPABASE_ANON_KEY`
- Add env var: `VITE_GEMINI_API_KEY` (optional)
- Add env var: `VITE_ALLOW_FALLBACK_AUTH=false` (production only)

**Supabase Preparation:**
- Create admin user via Supabase Auth console
- Create corresponding profile in database
- Test Supabase login locally with `.env.local`

### Deployment Steps
```bash
# Option 1: Git-based (Recommended)
git add .
git commit -m "chore: prepare for production deployment"
git push origin main
# Cloudflare Pages auto-deploys

# Option 2: Manual
npx wrangler pages deploy dist
```

### Post-Deployment Verification (Required)
- [ ] ✅ Login works with all 7 roles (Admin, Operator, StaffTU, Kepala, GuruMapel, GuruBimbel, WaliKelas, OrangTua)
- [ ] ✅ Fallback login is NOT accessible (only Supabase Auth works)
- [ ] ✅ Dashboard loads without console errors
- [ ] ✅ Data CRUD operations work (students, teachers, classes)
- [ ] ✅ Al-Quran API integration works
- [ ] ✅ AI features work (if Gemini API configured)
- [ ] ✅ Responsive on mobile (test on actual devices)
- [ ] ✅ Performance acceptable (< 3s first load, Lighthouse score > 80)
- [ ] ✅ No hardcoded credentials in browser DevTools

## Code Quality Metrics

**Current State (78% ready):**
- Linter Errors: 0 ✅
- TypeScript Errors: 0 ✅
- Console logs in production: 127+ ⚠️ (partially migrated to logger)
- Hardcoded credentials: 1 location 🔴 (Login.tsx line 238)
- Unit tests: 0 ❌

**Target State (90%+ after critical fixes):**
- Remove all hardcoded credentials
- Set `VITE_ALLOW_FALLBACK_AUTH=false` in production
- Verify build passes `node pre-deploy-check.js`
- All roles login successfully via Supabase Auth only
