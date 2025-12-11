# Release Process

## Manual Steps

1. Update version in package.json
2. Update CHANGELOG.md with release notes
3. Commit changes:
   ```bash
   git add package.json CHANGELOG.md
   git commit -m "chore: bump version to X.Y.Z"
   ```
4. Create and push tag:
   ```bash
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   git push origin main --follow-tags
   ```
5. Release workflow will automatically:
   - Run all tests
   - Build the CLI
   - Create GitHub Release with artifacts
   - Deploy documentation

## Automated Steps

The release workflow handles:
- Building distribution files
- Creating release tarball
- Generating release notes
- Publishing GitHub Release
- Triggering docs deployment
