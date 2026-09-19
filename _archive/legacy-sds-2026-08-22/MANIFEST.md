# Legacy SDS consolidation manifest

Consolidated on 2026-08-22 from the superseded
`Studio-Daw-Station-SDS-` repository. This directory is reference material and
is excluded from the active application repository and build.

## Preserved material

- `legacy-sds-history.bundle` — complete two-commit Git history for the former
  `main` branch. SHA-256:
  `01EFE21C9AD8EE6DE5936AF10652E7FC23DB060F76A599991EF21BB80867D4CC`
- `sds.txt` — historical SDS intent and corrections. SHA-256:
  `83B1CF2B4D103EF22F36D1A31442EFC095469B330C84821B4CAC3AB509163FFF`
- `zip-files/Poietek_Devin_Handoff_v3_1.zip` — SHA-256:
  `5AE954BCD724ED35BE7C5A01BDE671118DDBE02C79A25EC4D4CA6ADC1C91DA10`
- `zip-files/Poietek_Implementation_Build_171_180_v3_1.zip` — SHA-256:
  `771015F7076E4DA96D947436E1A05BA48CFE5DBD61AF85C7CE6AA549B3BD4331`
- `zip-files/Poietek_Master_Development_Library_v3_1.zip` — SHA-256:
  `3212DD65DDB09806E9BCCED4841E11B2F1C84A62ACBBE69FA30F00C0BE9046BD`

## Deduplication decision

The legacy repository contained 49 tracked files: 10 were byte-identical to the
canonical repository, 30 were divergent older versions, and 9 appeared only in
the legacy tree. The unique components were old prototype workspaces and
competitor-referencing presentation components. Current tests explicitly reject
the old `DAWMenuBar`/`Navigation` shell, and the canonical Poietek application
has replacement Arrange, Rack, navigation, workspace, sampler and mixer
surfaces. None of the old source was overlaid onto `src/`.

Generated `node_modules` trees, interrupted dependency staging and duplicate
source/configuration files were intentionally not preserved because they are
rebuildable or recoverable from the verified Git bundle.
