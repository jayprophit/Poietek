"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMPLIANCE_BASELINE_CATALOG = exports.HELP_FAQ_CATALOG = exports.GOVERNANCE_POLICY_CATALOG = exports.MARKETPLACE_CATEGORIES = exports.COMMUNITY_MODE_CATALOG = exports.POIETEK_TV_CATALOG = exports.UNIFIED_CREATOR_STAGES = void 0;
exports.UNIFIED_CREATOR_STAGES = [
    { id: 'score', title: 'Score & compose', summary: 'Tempo map, MIDI, instruments, notation cues and picture hit-points share the project clock.', state: 'foundation', exit: 'Notation editing, MIDI arrangement and score-to-picture acceptance tests.' },
    { id: 'produce', title: 'Record & produce', summary: 'Local audio import, recording, waveform editing, rack instruments, sampling, mixing and export.', state: 'working_model', exit: 'Native low-latency engine, comping, automation and validated metering.' },
    { id: 'picture', title: 'Picture & VFX', summary: 'Video clips, captions, VFX graphs and score cues are referenced by the same project.', state: 'foundation', exit: 'Reviewed decode, GPU composition and deterministic render adapters.' },
    { id: 'master', title: 'Programme master', summary: 'The release binds picture, score, mix, captions, credits, rights and delivery profiles.', state: 'foundation', exit: 'Codec licences, loudness/QC profiles and reference-render verification.' },
    { id: 'broadcast', title: 'Poietek TV', summary: 'Schedule or stream a programme with chat, reactions, sharing, support and live listings.', state: 'foundation', exit: 'Ingest/CDN, moderation, captions, payments and broadcast-rights operations.' },
    { id: 'publish', title: 'Release, community & store', summary: 'Publish to selected audiences, collaborate, license work and sell creator or Poietek products.', state: 'foundation', exit: 'Identity, payments, tax, consumer, moderation and platform-service acceptance.' },
];
exports.POIETEK_TV_CATALOG = [
    { id: 'channels', title: 'Channels & schedules', summary: 'Private local channel and serializable programme/session records.', state: 'working_model', exit: 'Provider-backed channel publication and scheduling.' },
    { id: 'live', title: 'Live ingest & delivery', summary: 'Capability-gated broadcast session; never labels a stream live without provider evidence.', state: 'external_gate', exit: 'Authenticated ingest, transcoding, CDN delivery and health telemetry.' },
    { id: 'audience', title: 'Audience interaction', summary: 'Comments, reactions and sharing are independently gated.', state: 'foundation', exit: 'Moderation operations, abuse reporting, appeals and rate limits.' },
    { id: 'support', title: 'Donations & live shop', summary: 'Creator support and buy-during-stream flags cannot activate without payment capability.', state: 'external_gate', exit: 'Payment, seller checks, consumer disclosures, refunds, tax and payout operations.' },
    { id: 'access', title: 'Captions & accessible playback', summary: 'Caption assets are part of the programme project.', state: 'foundation', exit: 'Live captions, transcripts, keyboard/player and WCAG 2.2 AA acceptance.' },
    { id: 'insight', title: 'Audience evidence', summary: 'Viewer counts accept provider observations only; no fabricated analytics.', state: 'external_gate', exit: 'Consent-aware analytics, retention controls and reconciled reports.' },
];
exports.COMMUNITY_MODE_CATALOG = [
    { id: 'private', title: 'Local & private', summary: 'Offline-first profiles, groups, chats, showcases and drafts on the creator device.', state: 'working_model', exit: 'Encrypted local identity and backup acceptance.' },
    { id: 'central', title: 'Hosted community', summary: 'Profiles, follows, feeds, groups, forums, messaging, releases and moderation.', state: 'external_gate', exit: 'Backend, identity, safety, privacy and operations.' },
    { id: 'federated', title: 'Federated spaces', summary: 'Provider-neutral contract for independently operated compatible communities.', state: 'planned', exit: 'Protocol profile, signing, trust, moderation and inter-server abuse controls.' },
    { id: 'p2p', title: 'Peer-to-peer sharing', summary: 'Optional decentralized topology, separate from rights and ownership claims.', state: 'planned', exit: 'Discovery, consent, encryption, revocation, safety and network acceptance.' },
    { id: 'messages', title: 'Private messaging', summary: 'Direct and group messaging model with honest encryption capability state.', state: 'external_gate', exit: 'Audited end-to-end protocol and key recovery policy.' },
];
exports.MARKETPLACE_CATEGORIES = [
    ['plugin', 'Plug-ins'], ['instrument', 'Instruments'], ['effect', 'Effects'],
    ['sample', 'Samples'], ['preset', 'Presets'], ['skin', 'Skins'],
    ['template', 'Templates'], ['project', 'Projects'], ['music', 'Music'],
    ['video', 'Video'], ['ticket', 'Tickets'], ['service', 'Services'], ['other', 'Other'],
].map(([id, label]) => ({ id: id, label }));
exports.GOVERNANCE_POLICY_CATALOG = [
    ['terms', 'Terms of Service', 'Account, service, licence and responsibility rules.'],
    ['privacy', 'Privacy Notice', 'Data purposes, retention, rights, providers and transfers.'],
    ['community_rules', 'Community Rules', 'Safety, conduct, authenticity and enforcement.'],
    ['acceptable_use', 'Acceptable Use', 'Prohibited misuse of studio and platform services.'],
    ['content_and_copyright', 'Content & Copyright', 'Rights declarations, notices, takedown and appeal.'],
    ['marketplace_buyer', 'Buyer Terms', 'Licence delivery, price, cancellation and remedies.'],
    ['marketplace_seller', 'Seller Terms', 'Eligibility, listings, rights, tax and fulfilment.'],
    ['fees_and_payouts', 'Fees & Payouts', 'Approved commission, disclosure, reserves and payout.'],
    ['refunds_and_disputes', 'Refunds & Disputes', 'Consumer remedies and dispute handling.'],
    ['moderation_and_appeals', 'Moderation & Appeals', 'Reports, decisions, reasons and review.'],
    ['live_streaming', 'Live Streaming', 'Broadcast rights, safety, captions and interruption.'],
    ['donations', 'Creator Support', 'Payment character, fees, refunds and safeguarding.'],
    ['ai_use', 'AI Use & Disclosure', 'Consent, provenance, labelling and training defaults.'],
    ['children_and_age_assurance', 'Children & Age Assurance', 'Age-appropriate design and high privacy defaults.'],
    ['accessibility', 'Accessibility', 'WCAG target and accessible media commitments.'],
    ['security', 'Security', 'Controls, incident response and responsible disclosure.'],
    ['law_enforcement_requests', 'Authority Requests', 'Lawful request assessment and transparency.'],
    ['governance', 'Governance Charter', 'Rule changes, participation and decentralized operation.'],
    ['transparency_reporting', 'Transparency Reports', 'Moderation, safety and authority reporting metrics.'],
].map(([kind, title, purpose]) => ({ kind: kind, title, purpose }));
exports.HELP_FAQ_CATALOG = [
    { question: 'Who owns a production made in Poietek?', answer: 'Poietek is designed so the creator or agreed rightsholders—not Poietek—own user productions. Actual ownership can still depend on employment, commissions, collaboration agreements, samples and other underlying rights.' },
    { question: 'What permission does the service need?', answer: 'Only a versioned, non-exclusive service licence for purposes the user selects, such as storage, collaboration, display, streaming, delivery or safety moderation. The draft is not accepted automatically.' },
    { question: 'Can I complete music and picture in one project?', answer: 'The unified project binds score cues, MIDI, audio, picture clips, VFX references, captions, credits, rights and delivery masters to one clock. Video decode/render and notation remain gated until real engines are connected.' },
    { question: 'Can I stream on Poietek TV now?', answer: 'The channel/session model exists, but public live ingest, delivery, moderation, captions, donations and shopping require configured and reviewed services.' },
    { question: 'Can I sell my work and add-ons?', answer: 'Draft local listings exist for creator and company products. Publication requires seller verification, durable licence terms, payment, consumer, tax, fulfilment and dispute services.' },
    { question: 'What percentage does Poietek take?', answer: 'No rate is approved in this build. A commission cannot become active until the owner approves an explicit rate and a durable fee disclosure.' },
    { question: 'Does AI own or change my work?', answer: 'No ownership is inferred from AI use. Remote AI is optional and project changes require a preview, user acceptance and an undoable command. Provider and training terms must still be reviewed.' },
    { question: 'Can I use third-party music, samples or video?', answer: 'Only when you have the necessary permissions or an applicable legal exception. Poietek records declarations and evidence but cannot grant rights it does not control.' },
    { question: 'Is the community centralized or decentralized?', answer: 'Both are architectural options. Local/private mode is the safe default; hosted, federated and peer-to-peer modes stay unavailable until their real adapters, trust and safety controls are proven.' },
    { question: 'Are private messages end-to-end encrypted?', answer: 'Not currently. The interface must show unavailable until an audited protocol, key lifecycle and recovery policy exist.' },
    { question: 'How are children protected?', answer: 'The target is age-appropriate design, high privacy defaults and data minimisation. Public launch requires jurisdiction-specific age assurance and safeguarding review.' },
    { question: 'Does offline mode require an account?', answer: 'The local studio is designed to run without a network. Accounts are needed only for selected online collaboration, community, TV, store and provider features.' },
];
exports.COMPLIANCE_BASELINE_CATALOG = [
    { area: 'UK online safety', control: 'Risk assessment, reporting, moderation, complaints, appeals and user controls.', status: 'external_gate', url: 'https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/illegal-content-duties-under-the-online-safety-act' },
    { area: 'Privacy by design', control: 'Purpose limitation, minimisation, high privacy defaults, retention and data-rights workflows.', status: 'foundation', url: 'https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/guide-to-accountability-and-governance/data-protection-by-design-and-by-default/' },
    { area: 'Children', control: 'Age-appropriate design and best-interests assessment for services likely accessed by children.', status: 'external_gate', url: 'https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/introduction-to-the-childrens-code/' },
    { area: 'EU platform & marketplace', control: 'Trader traceability, platform notices, transparency and applicable intermediary duties.', status: 'external_gate', url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2065' },
    { area: 'UK creator copyright', control: 'Record creator/rightsholder assertions without making automatic platform ownership claims.', status: 'foundation', url: 'https://www.gov.uk/guidance/ownership-of-copyright-works' },
    { area: 'UK online selling', control: 'Pre-contract information, digital-content consent, durable confirmation and consumer remedies.', status: 'external_gate', url: 'https://www.gov.uk/online-and-distance-selling-for-businesses/online-selling' },
    { area: 'Platform seller reporting', control: 'Collect, verify, retain and report seller details when applicable.', status: 'external_gate', url: 'https://www.gov.uk/guidance/selling-goods-or-services-on-a-digital-platform' },
    { area: 'Accessibility', control: 'WCAG 2.2 AA target including keyboard access and accessible time-based media.', status: 'planned', url: 'https://www.w3.org/TR/WCAG22/' },
    { area: 'AI transparency', control: 'Disclose AI interactions/generated content where required and retain provenance.', status: 'planned', url: 'https://digital-strategy.ec.europa.eu/en/library/guidelines-transparency-obligations-providers-and-deployers-ai-systems' },
];
