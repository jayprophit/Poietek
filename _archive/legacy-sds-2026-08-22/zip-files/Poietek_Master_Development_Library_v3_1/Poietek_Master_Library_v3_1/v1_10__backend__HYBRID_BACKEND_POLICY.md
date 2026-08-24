# Poietek Hybrid Backend Policy

## Canonical responsibility split

### Local client
Canonical for active creative work and project media while editing.

### Supabase
Recommended first hosted backend:
- Auth
- PostgreSQL project directory / teams / rights metadata later
- Realtime relay/presence
- small hosted files only where sensible

### Firebase
Optional non-overlapping platform services:
- Firebase Hosting for the public website/web app
- Cloud Messaging where supported
- Remote Config / feature rollout where useful
- App Check where applicable

Do **not** mirror every project mutation into both Supabase and Firestore.

If Supabase is unavailable:
- local app continues;
- sync queues;
- Firebase does not secretly become a second project database.

If the user prefers Firebase as the canonical test backend instead, implement the
same `HostedBackend` contract with a Firebase adapter and disable the Supabase
adapter for that environment.
