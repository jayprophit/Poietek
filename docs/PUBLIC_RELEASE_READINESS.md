# Poietek Public Release Readiness

Document ID: `POI-PUBLIC-RELEASE-001`

Edition: `1.0.0`

Assessment date: `2026-08-14`

Decision: `NO-GO`

## Outcome

Poietek Studio is an active pre-release engineering build. It is not a finished public product and must not be marketed, sold, submitted to stores, or distributed as production-ready yet.

The machine-readable register in `src/poietek/release/PublicReleaseReadiness.ts` contains 28 public-release gates across 14 mandatory categories. At this assessment, 27 of 28 gates block release. The single verified gate is the static PWA install contract; even that remains subject to repeated browser acceptance for each release.

This register is intentionally stricter than the weighted build checklist. A plan, schema, contract, responsive mock, passing unit test, provider name, build script, package target, hardware profile, standards label, price, or store rule is not release evidence by itself.

## Release rule

The release decision fails closed:

- Every required category must remain represented.
- Every blocking gate must be `verified`.
- `working`, `foundation`, `missing`, and `external_gate` all block a public release.
- A gate moves to `verified` only when its required exit has repeatable evidence retained with the release candidate.
- External approval cannot be inferred. Store acceptance, rights acceptance, signatures, payments, hardware measurements, security review, legal review, and provider delivery require evidence from the responsible authority.

## Current blocking areas

1. Real-project and cross-device product acceptance.
2. Audio-engine/device qualification, BS.1770 loudness, true peak, and time-preserving pitch DSP.
3. Quota, migration, crash-recovery, backup, and restore qualification.
4. Offline/update/browser matrix acceptance.
5. Reviewed native adapters plus signed/notarized desktop installers.
6. Mobile-specific UX, audio-session behaviour, signed packages, and store acceptance.
7. ASVS-based security verification, supply-chain controls, SBOM, threat modelling, and independent testing.
8. Complete data/SDK inventory, approved privacy notice, legal terms, and matching user-data controls.
9. WCAG 2.2 AA automated and human acceptance, including accessible time-based editing.
10. Production cloud authentication/authorization, conflict-safe collaboration, backup, quota, and outage behaviour.
11. Owner-approved commercial rules and store-compliant billing/fulfilment.
12. Authoritative rights/split consent plus real publishing/registration providers.
13. A distributable local AI runtime and qualified third-party-provider safety controls.
14. Protected multi-target CI, provenance/signing, crash/incident/support operations, and store certification.

## Official requirement baseline

The register links each applicable gate to the controlling primary source. The current baseline includes:

- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [MDN installable PWA guidance](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [Tauri capability security](https://v2.tauri.app/security/capabilities/)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Data safety](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)
- [Google Play payments policy](https://support.google.com/googleplay/android-developer/answer/9858738?hl=en)
- [Microsoft Store policies](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies)

Store, privacy, payment, accessibility, security, and platform requirements change. They must be rechecked against the current official sources immediately before each submission; this document is an engineering control, not a legal approval or a substitute for review by the responsible owner and qualified advisers.

## Where to review it in the app

Open `Ecosystem` and choose `Release control`. The screen shows the current hard decision, evidence-state totals, category/state filters, current evidence, exact exits, and direct official-source links. There is deliberately no Publish, Buy, Submit, Accept rights, or Mark ready action.
