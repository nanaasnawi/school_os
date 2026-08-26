# Walkthrough - Fix KSP/Hilt NoSuchFileException

I have fixed the `java.nio.file.NoSuchFileException` that was occurring during the `:core:kspDebugKotlin` task. This issue was caused by KSP's incremental processing failing to handle Hilt's generated metadata files correctly.

## Changes Made

### Build Configuration

#### [gradle.properties](file:///C:/Users/USER/Documents/School Os/android/gradle.properties)
- Added `ksp.incremental=false` to disable incremental processing for KSP. This is the recommended workaround for this specific Hilt/KSP interaction issue.

#### [libs.versions.toml](file:///C:/Users/USER/Documents/School Os/android/gradle/libs.versions.toml)
- Updated KSP version from `2.0.21-1.0.27` to `2.0.21-1.0.28` (latest for Kotlin 2.0.21).
- (Reverted Hilt to `2.53.1` after a trial upgrade to `2.60.1` failed due to Android Gradle Plugin version compatibility).

### Bug Fixes

#### [ProfileScreen.kt](file:///C:/Users/USER/Documents/School Os/android/feature/profile/src/main/java/com/schoolos/android/feature/profile/ProfileScreen.kt)
- Fixed a missing import for `CosmicNavy`.

## Verification Results

### Automated Tests
- Ran `./gradlew clean :core:kspDebugKotlin` and it completed successfully.
- Verified that incremental builds of the `:core` module no longer trigger the `NoSuchFileException`.

> [!NOTE]
> While the Hilt/KSP issue is resolved, I noticed some unrelated build errors in other modules (e.g., `:feature:sessions`) related to `@Composable` annotations and color retrieval. These appear to be existing issues in the codebase where `@Composable` properties are being accessed from non-composable contexts.
