# Fix NoSuchFileException in KSP/Hilt Build

The `:core:kspDebugKotlin` task is failing with a `java.nio.file.NoSuchFileException` specifically pointing to `hilt_aggregated_deps` inside the KSP generated directory. This is a known issue with KSP's incremental processing when used with Hilt, where the processor fails to find or copy files between incremental rounds.

## User Review Required

> [!IMPORTANT]
> This plan proposes updating Hilt to a newer version and disabling KSP incremental processing as a workaround. Disabling incremental KSP might slightly increase build times for the `:core` module but will ensure build stability.

## Proposed Changes

### Build Configuration

#### [MODIFY] [libs.versions.toml](file:///C:/Users/USER/Documents/School Os/android/gradle/libs.versions.toml)
- Update Hilt version from `2.53.1` to `2.60.1` (latest stable).
- Check if KSP version `2.0.21-1.0.27` should be updated to `2.0.21-1.0.28`.

#### [MODIFY] [gradle.properties](file:///C:/Users/USER/Documents/School Os/android/gradle.properties)
- Add `ksp.incremental=false` to disable incremental processing for KSP, which is the root cause of the `NoSuchFileException`.

## Verification Plan

### Automated Tests
- Run `./gradlew clean :core:kspDebugKotlin` to verify the build completes successfully.
- Run a full build `./gradlew assembleDebug` to ensure all modules are compatible with the updated Hilt version.

### Manual Verification
- Verify that Hilt components in the `:core` module are still correctly generated and accessible.
