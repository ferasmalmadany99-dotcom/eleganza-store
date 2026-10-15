---
name: Android release builds with limited memory
description: Avoiding Gradle and native compiler OOM during Android release builds in this workspace.
---

For Android release builds, default Gradle/CMake parallelism can exhaust the workspace's 8 GiB cgroup limit while React Native native libraries compile. A retry succeeded with `--max-workers=1`, `CMAKE_BUILD_PARALLEL_LEVEL=2`, and JVM args `-Xmx2g -XX:MaxMetaspaceSize=768m`; previously generated JS/native build outputs were reused.

**Why:** the initial parallel release build was killed by the cgroup OOM killer despite Gradle reporting the daemon disappeared; the memory-limited retry completed.

**How to apply:** on future `assembleRelease` builds in this workspace, limit Gradle and CMake parallelism before increasing heap size or restarting from a clean build.

The workspace may not have a writable Android SDK available through the package installer. Nix-provided SDKs are read-only and can place the NDK at `ndk-bundle`, while Gradle expects a versioned `ndk/<version>` path and additional Build Tools packages. Avoid copying the full NDK into the workspace; that can exceed its per-user disk quota.

**Why:** release builds need SDK paths and components Gradle can both discover and update, but the Nix SDK store is immutable and the complete NDK is too large for a workspace copy.

**How to apply:** if Android SDK discovery or SDK component installation fails, use a writable SDK root with links to the Nix SDK components, provide the expected versioned NDK path, and install missing Build Tools into that writable root.

For Android API 36 release builds, use OpenJDK 21 rather than the workspace's default GraalVM 19. The Android JDK image transform failed under JDK 19 and completed under JDK 21.

**Why:** the Android Gradle plugin's `jlink` transform for API 36 was incompatible with the default GraalVM JDK in this environment.

**How to apply:** set `JAVA_HOME` and put that JDK's `bin` directory first in `PATH` when building Android release variants.

Gradle may mark the React Native release JS bundle as up to date even when only Expo public API host variables changed, leaving the APK with its previous API hostname.

**Why:** those environment values are not reliably tracked as bundle task inputs.

**How to apply:** force `:app:createBundleReleaseJsAndAssets` to rerun with the intended `EXPO_PUBLIC_DOMAIN` and `EXPO_PUBLIC_API_BASE_URL`, then inspect `assets/index.android.bundle` inside the APK for the expected host before distributing it.
