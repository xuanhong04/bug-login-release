# Instructions for AI Agents (Antigravity & Codex)

## 1. General Coding & Testing
- After your changes, instead of running specific tests or linting specific files, run `pnpm format && pnpm lint && pnpm test`. First format the code, then lint it, then test it, so that no part is broken after your changes.
- Before finishing the task and showing a summary, always run `pnpm format && pnpm lint && pnpm test` at the root of the project to ensure you don't finish with a broken application.
- Don't leave comments that don't add value.
- Do not duplicate code unless you have a very good reason to do so. It is important that the same logic is not duplicated multiple times.
- If there is a global singleton of a struct (in Rust), only use it inside a method while properly initializing it, unless explicitly specified otherwise in the request.

## 2. UI / UX & Theming Rules
- **NO HARDCODED COLORS**: If you are modifying the UI, do not add random colors (e.g., `text-red-500`, `#333`, `bg-gray-100`). The UI uses a strictly defined `oklch` CSS variables system.
- **Allowed Colors**: `bg-background`, `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `text-primary`, `border-border`, etc. All these variables auto-adapt to dark mode.
- **Dark Mode**: No `dark:bg-black` needed. Stick to the variables and it works automatically via the `.dark` class on root.
- **Layout Model**: The application is an `overflow-hidden` fixed window. For scrollable content, always use the `<ScrollArea>` component from Shadcn, do not let the whole page scroll.
- **Modals over Routing**: BugLogin heavily utilizes dialogs (Modals) for actions (e.g., settings, profile creation). Do not create new pages/routes for forms unless required.

## 3. UI Components Architecture
- **Reuse Shadcn Primitives**: Always look inside `src/components/ui/` first before building a tag from scratch. Use the existing `<Button>`, `<Input>`, `<Select>`, `<Dialog>`, etc.
- **Micro-Animations**: Use `tw-animate-css` or `motion` (Framer) for state animations to maintain a premium feel.
- **Icons**: Standardize on using `lucide-react` or `react-icons`. Make them small and neutral (e.g. `w-4 h-4 text-muted-foreground`).

## 4. State Management & Tauri Integration
- **Abstract Logic**: Complex state and Tauri event listeners must use custom hooks (e.g., `useProfileEvents`).
- **Tauri Invocations**: When invoking Rust backend with `await invoke("command_name")`, *always* wrap the call in a `try...catch` block. Never let an unhandled rejection crash the UI.
- **Feedback & Interactions (Toasts)**: Never use native `alert()` or `console.error` to communicate with the user.
  - Import and use `showSuccessToast(message)` or `showErrorToast(message)` from `src/lib/toast-utils.ts`.
- **Loading States**: All async interactions (submitting forms, invoking Tauri commands) must have clear loading states (disabling buttons, showing spinners/loaders).

## 5. Internationalization (i18n)
- BugLogin supports multiple languages.
- **CRITICAL RULE**: Anytime you make changes that affect copy or add new text, it has to be reflected in all translation files.
- Use `const { t } = useTranslation()` from `react-i18next`. Example: Use `{t("profile.delete_confirm")}` instead of hardcoded strings.
