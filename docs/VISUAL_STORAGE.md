# CRESUM visual-source storage

Approved by the user on 2026-10-27; revised checkpoint workflow below.
The user deferred Oracle uploads and resumed app development. After a major
visual block or at the end of work, prepare an up-to-date source ZIP with a
manifest and SHA-256 checksums and provide it for download to the user's PC.
Include available original images, references, candidates, 3D assets and exact
prompts; disclose missing historical sources. Providing a link is not evidence
that the user has downloaded or backed up the archive. Do not block app work.

User Cloud Shell screenshots confirmed creation of `cresum-visuals` in home
region `eu-frankfurt-1`, compartment `fitflow-ai`, with `NoPublicAccess`,
`Standard` and versioning `Enabled`. Reported availability before creation was
21,474,836,480 bytes, usage 0. No object upload or round-trip was confirmed.
Keep Oracle as a deferred optional archive; no deletion/lifecycle is authorized.

## Ownership and availability

| Location              | Content                                                                | Purpose                                          |
| --------------------- | ---------------------------------------------------------------------- | ------------------------------------------------ |
| Oracle Object Storage | Original PNGs, references, candidates, 3D assets and available prompts | Private source archive with versioning           |
| GitHub                | Selected WebP exports, asset manifests, hashes and archive receipts    | Reproducible application releases and provenance |
| Application bundle    | Selected local artwork                                                 | Offline display without an Oracle dependency     |

Keep current Supabase account/workout responsibilities unchanged. This decision
does not require a Supabase Storage bucket, new app credentials or remote image
loading. It does not activate Oracle marketing or analytics infrastructure.

## Archive contract

- Bucket: `cresum-visuals`, Standard tier, `NoPublicAccess`, versioning `Enabled`.
- Use a confirmed home region and designated compartment. Check the account's
  actual quota/usage before provisioning or transferring data; retained versions
  also consume storage. No automatic deletion policy is approved.
- Preserve source bytes. A WebP conversion does not replace the original PNG.
- New records identify exercise/variant, model, phase, revision, original name,
  SHA-256, byte count, MIME type, generation/reference provenance where available,
  and Oracle region/namespace/bucket/object key/version ID when verified.
- Use immutable object keys containing revision and/or content hash. Do not
  silently overwrite an existing source. An upload skipped because its key
  exists still needs remote-content verification.
- Archive available prompts and reference provenance. Mark unavailable historical
  prompts/references missing; do not reconstruct text and label it the original.
- `pending-upload` means only a local source or inventory exists.
  `archive-verified` requires a confirmed remote object and a download whose
  SHA-256 matches the source. Record verification time and remote location.
- Archive status, user visual acceptance and biomechanics QA are independent.
  Existing integrated images remain usable while historical backfill is pending.

Current workflow: generate → retain original and exact prompt → select and
review → export and integrate → prepare source ZIP at major-block/end checkpoints
for PC download. Oracle's upload/verification workflow below remains deferred;
its `pending-upload` status must not be changed to `archive-verified` based on
local retention, ZIP preparation or user selection.

## Current inventory and migration

`visual-archive-backfill.json` lists 87 available generated PNGs and four final
3D exports in the current project workspace (150,900,419 bytes, approximately
144 MiB). Entries are proposals for upload, not remote receipts. The paths are
relative to the visual-production workspace, not the Git repository. Local
workspace availability alone is not durable backup.

The inventory is intentionally not an assertion that every historical chat
attachment or original prompt was recovered. User-uploaded references and
available prompt files need separate inventory. Backfill first the sources
referenced by current runtime manifests, then the remaining candidates/models.

## Provisioning and first round-trip

The authoring session has no direct OCI access. The user subsequently created
the bucket through authenticated Cloud Shell as recorded above, then deferred
uploads. The commands below remain a future reference, not completed actions.
Use authenticated Oracle Cloud Shell or a configured trusted production host. Never put private keys, tokens or signed-access URLs in Git,
the mobile bundle or chat.

Confirm CLI options on that host before running commands:

```bash
oci os bucket create --help
oci os object put --help
oci os object get --help
```

Set these to the chosen non-secret region and compartment identifiers:

```bash
CRESUM_OCI_REGION='REPLACE_WITH_HOME_REGION'
CRESUM_OCI_COMPARTMENT='REPLACE_WITH_COMPARTMENT_OCID'
oci os bucket create \
  --region "$CRESUM_OCI_REGION" \
  --compartment-id "$CRESUM_OCI_COMPARTMENT" \
  --name cresum-visuals \
  --storage-tier Standard \
  --public-access-type NoPublicAccess \
  --versioning Enabled
```

If the name already exists, inspect its compartment, tier, access and versioning
in the Console instead of replacing it. Verify the three expected configuration
values before proceeding. Upload one original PNG to Cloud Shell first; the
workspace paths in the inventory are not automatically accessible there.

```bash
CRESUM_SOURCE_FILE='/path/to/source.png'
CRESUM_SOURCE_SHA=$(sha256sum "$CRESUM_SOURCE_FILE" | cut -d ' ' -f 1)
CRESUM_OBJECT_KEY="backfill/2026-10-27/${CRESUM_SOURCE_SHA}.png"
oci os object put \
  --region "$CRESUM_OCI_REGION" \
  --bucket-name cresum-visuals \
  --name "$CRESUM_OBJECT_KEY" \
  --file "$CRESUM_SOURCE_FILE" \
  --no-overwrite \
  --verify-checksum
CRESUM_VERIFY_DIR=$(mktemp -d)
oci os object get \
  --region "$CRESUM_OCI_REGION" \
  --bucket-name cresum-visuals \
  --name "$CRESUM_OBJECT_KEY" \
  --file "$CRESUM_VERIFY_DIR/restored.png"
sha256sum "$CRESUM_SOURCE_FILE" "$CRESUM_VERIFY_DIR/restored.png"
cmp -- "$CRESUM_SOURCE_FILE" "$CRESUM_VERIFY_DIR/restored.png"
```

Only a matching hash/byte comparison establishes a verified transfer. Retain the
object/version identifiers returned by OCI and record the archive receipt before
marking that inventory entry verified. Then backfill the remaining files with
their recorded extensions; verify each object. Do not batch-mark the inventory
verified after checking only one sample.

## Provider references

- [Oracle bucket creation and options](https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/cmdref/os/bucket/create.html)
- [Oracle upload and verification options](https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/cmdref/os/object/put.html)
- [Oracle object versioning](https://docs.oracle.com/en-us/iaas/Content/Object/Tasks/usingversioning.htm)
- [Oracle free-resource limits by account state](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)
