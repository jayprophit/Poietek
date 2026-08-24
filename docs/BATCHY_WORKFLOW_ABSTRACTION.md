# Batchy & Friends workflow abstraction

Reviewed: 2026-08-22

Implementation: Poietek Studio `Batch Delivery Workshop`

Method: clean-room analysis of public product and documentation pages; no Batchy
source code, binaries, presets, DSP, branding, command-line implementation or
`.batchyfx` files were copied.

## Official material reviewed

- [Batchy & Friends product page](https://batchyandfriends.com/), including the
  feature, purchase and FAQ sections.
- [About Batchy & Friends](https://batchyandfriends.com/about).
- [Batchy documentation](https://batchyandfriends.com/docs), including first
  launch, graph editing, preview, presets, batch processing, naming, multi-output
  work, command-line automation, output safety and reports.

The public site presents one product, **Batchy**, rather than a multi-product
suite. It is described as a visual node-based batch audio processor for macOS
and Windows, with a GUI, command-line route and external VST3/Audio Unit hosting
where the platform supports it. Its strongest product idea is not an individual
effect: it is the controlled journey from a reusable graph and an auditioned
example to many predictable output files.

The official pages are not fully consistent about evaluation access. The About
page describes a 30-day trial, while the product FAQ says there is no free trial
and describes a download that becomes unrestricted after licence activation.
Poietek does not repeat either statement as a settled purchasing fact; buyers
should confirm the current policy on the official site.

## Product anatomy and useful lessons

| Public Batchy area | General lesson | Poietek abstraction |
| --- | --- | --- |
| Visual processing graph | A batch job should be a readable, reusable signal-flow document rather than a hidden list of mutations. | Versioned `BatchRecipe` nodes and acyclic edges are stored in the canonical project. Nodes are provider-neutral intent with explicit native/external capability requirements. |
| Native processing and external plug-ins | Built-in utility, analysis and audio operations can share one graph with licensed external processors, but execution availability differs. | Original node kinds cover gain, EQ, dynamics, repair intent, space, delay, pitch/time, routing, external slots and meters. The current starter uses only original names and parameters; all DSP/host work is adapter-gated. |
| Live processed preview, bypass and analysis views | A creator should hear and inspect one representative result before multiplying it. | Every recipe or output change invalidates approval. One canonical source becomes the pilot; `preview_observed` requires an adapter/evidence reference before a later explicit approval. The browser cannot self-approve. |
| Reusable presets with descriptive metadata | Repeatability needs a durable recipe, not a one-off screen state. | Recipe id, name, description, nodes, edges and parameters persist in `org.poietek.batch-delivery/1.0.0` and participate in project undo/redo. |
| Many input files and multiple output nodes | A source should be able to produce review, archive, preview, game or custom deliverables in one reviewed plan. | A canonical source set fans out to any number of `BatchOutputVariant` records. The starter demonstrates Review WAV, Archive FLAC and Mobile Preview without claiming those encoders ran. |
| Per-output format, rate, depth, channel, loudness and tail choices | Output settings belong to each deliverable; global defaults must not erase explicit per-output intent. | Every variant owns format, sample-rate, bit-depth, channel, normalization target, tail and conflict policy. Unsupported codec, loudness or true-peak work becomes a named missing capability. |
| Filename templates and metadata tokens | Naming must be deterministic, legible and safe across large jobs. | Poietek uses its own brace-token vocabulary: `{project}`, `{asset}`, `{variant}`, `{version}`, `{counter:3}`, `{sample_rate}`, `{channels}`, `{hash8}` and `{ext}`. Project/asset values are sanitized independently from the template. |
| Dry run, fail-fast and reporting | The system should validate before it creates folders or writes media, and should return machine-readable evidence. | `createBatchDryRunPlan` is pure: it resolves all paths, discovers collisions and creates no directory/file. A planning manifest is downloadable. Pilot and aggregate run evidence bind to an exact stable plan key plus adapter evidence; run counts must be coherent. |
| Output-root containment and conservative overwrite behavior | A filename expansion must never escape its selected root; existing work should be preserved by default. | Rooted paths, drive paths, backslashes, empty/dot/parent segments, unknown tokens, unsafe portable characters, reserved device names and excessive path length fail closed. Existing paths default to preserve-and-skip; versioning is deterministic; replacement remains an adapter-confirmed intent. |
| GUI and command-line automation | The same durable job definition should serve interactive and automated surfaces. | The canonical model and JSON manifest are UI-independent. No Poietek CLI is claimed yet; a future CLI/native worker must consume the same validated plan and return evidence instead of maintaining a second job truth. |

## Batch Delivery Workshop

The rack device has five deliberate views:

1. **Sources** selects only audio assets already registered in the canonical
   project. It never scans arbitrary folders behind the user's back.
2. **Recipe** shows an original provider-neutral acyclic graph. Bypass changes
   are project mutations and reset pilot approval.
3. **Outputs** owns per-deliverable settings, safe naming templates and existing-
   path policies.
4. **Dry run** resolves every source/output pair, reports ready/skipped/blocked
   rows and guarantees that it created no output directory or media file.
5. **Pilot** selects the representative source, exposes the preview/approval and
   adapter gates, shows only observed aggregate run evidence, and exports the
   planning manifest.

The same workflow is exposed through the Rack library, Production and Devices
menus, Studio Library and the **Safe Batch Delivery Rig** template. The template
connects batch orchestration to the existing single-file Revision Process Chain,
pilot monitoring and standards-gated mastering/delivery controls.

## Safety and truth boundary

Poietek currently implements the canonical model, immutable mutations, graph
validation, token/path resolver, collision planner, project persistence,
undo/redo, manifest export and responsive rack UI. It does **not** claim:

- that WAV, AIFF, FLAC, MP3 or OGG media was encoded;
- that gain, EQ, meters, plug-ins, loudness or true peak ran;
- that a target directory exists or was inspected unless a filesystem adapter
  supplied the observed path list;
- that a pilot was auditioned without a preview-render evidence reference;
- that aggregate success counts identify individual finished files; or
- that a GUI planning manifest is a rendered audio deliverable.

The adapter boundary preserves a C/C++-class native foundation path without
pretending it already exists. A production worker must provide preview render,
batch render, filesystem delivery, requested codec encoders, sample-peak or
standards analyzers, and external plug-in hosting as separately testable
capabilities. In-place or replacement work must canonicalize the real
destination, write a temporary sibling, validate it, swap recoverably and return
an auditable report.

## Competitive quality effect

This closes a gap left by the existing one-file offline chain and high-level
mastering plan. Poietek now has a coherent asset-to-deliverable control plane
comparable in workflow class to mature batch converters, mastering queues, game-
audio asset pipelines and post-production delivery tools, while remaining more
explicit about canonical assets, source preservation, revision ownership,
cross-platform path safety and evidence. It is a strong original foundation,
not a five-star claim for unavailable DSP, plug-in hosting, codecs or native job
execution.
