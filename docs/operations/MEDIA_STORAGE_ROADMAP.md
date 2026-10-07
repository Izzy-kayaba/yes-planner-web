# Media storage roadmap

## Current behavior

Vendor and Venue portfolio images are stored as bytes in MongoDB GridFS. The upload endpoint accepts JPG, PNG, or WebP under 5 MB, checks a basic file signature, and limits the profile to six portfolio images. The media read route serves only records marked as public vendor-profile media. Document records in the wedding workspace do not currently provide private binary document storage.

## Deferred work

Production-grade object storage, a ClamAV scanning service, image processing/metadata stripping, signed private links, CDN configuration, retention rules, and upload/download monitoring are intentionally deferred. Do not deploy an unreviewed S3 integration or use the existing public image route for private files.

Before starting this work, define:

1. The storage provider and environment-specific bucket lifecycle.
2. Quarantine and fail-closed behavior when malware scanning is unavailable.
3. Image dimension/pixel limits and processing output formats.
4. Public versus private access rules and short-lived URL behavior.
5. Cache and content-disposition policies at both origin and CDN.
6. Retention, deletion, orphan cleanup, backups, and migration from GridFS.
7. Monitoring for rejected, failed, uploaded, downloaded, and deleted files.

The feature is not considered production-ready until the full lifecycle is tested and operational ownership is documented.
