# BeeTrust Plugin Tests

The executable TypeScript tests remain next to their implementations under `src/skills/*/tests.ts` because the runtime self-test imports them directly. This directory mirrors those test files so reviewers can inspect the package-level test surface independently from the production implementation.

Run the complete verification from the plugin root:

```powershell
npm run verify
```
