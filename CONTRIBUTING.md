# Contributing to Home Kitchen Client

Thanks for your interest in the public Home Kitchen client.

This repository contains the **customer-facing PWA only**. Owner-side business logic, private administration code and the source of truth for publication state remain outside this public repository.

## Good contribution areas

- mobile UX and accessibility;
- PWA install experience;
- catalog performance;
- image loading and responsive behavior;
- cart / checkout client UX;
- documentation;
- smoke-test coverage.

Do not add private owner-side code, credentials, production administration logic or confidential business data.

## Validation

For client changes, run the same public smoke path used by CI where relevant:

```bash
node smoke.mjs
chmod +x scripts/build-public-pwa.sh
scripts/build-public-pwa.sh
```

For UI-only documentation changes, keep the pull request focused and explain the user-visible impact.

## Security

Never commit secrets, Supabase service-role keys, admin credentials, private endpoints or personal customer data. See [SECURITY.md](./SECURITY.md).
