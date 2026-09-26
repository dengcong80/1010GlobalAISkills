# BeeTrust Plugin

BeeTrust is an evidence-backed workflow package for cross-border New Zealand Mānuka honey release decisions.

The package contains seven independently documented Skills covering trade orchestration, scientific evidence, custody integrity, MPI market access, customs clearance, adversarial risk testing, and final evidence monitoring.

## Submission materials

- Listing metadata: `submission-metadata.json`
- ChatGPT Apps submission import: `chatgpt-app-submission.json`
- Directory and composer icon: `assets/beetrust-plugin-icon.png`
- Entry cover: `assets/beetrust-entry-cover.png`
- Project home: https://github.com/dengcong80/1010GlobalAISkills/tree/main/beetrust-plugin
- Support: `docs/support.md`
- Privacy policy: `docs/privacy-policy.md`
- Terms of use: `docs/terms-of-use.md`
- Public test cases: `tests/public-submission-test-cases.json`
- Availability: New Zealand and Australia for the supported demonstration route

## Local verification

Run these commands from this directory:

```powershell
npm install
npm run verify
```

`verify:package` checks the Plugin manifest, Skill metadata, resources, scripts, implementations, and mirrored test files. `test` runs the TypeScript self-tests. `acceptance` runs the end-to-end BeeTrust acceptance suite.

## Supported demonstration intent

```text
Release 1000 jars of UMF Mānuka honey from New Zealand to Australia for AU retail review.
```

The baseline case must produce `RELEASE`; controlled red-team faults must produce `BLOCKED` without changing the baseline case.

## Public plugin submission

Upload the final `plugin.json` and `skills/` tree as a skills-only plugin package. The `src/`, `tests/`, resources, and verification scripts are retained for independent technical verification and release evidence.
