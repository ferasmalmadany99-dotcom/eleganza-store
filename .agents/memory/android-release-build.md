---
name: Android release builds with limited memory
description: Avoiding Gradle and native compiler OOM during Android release builds in this workspace.
---

For Android release builds, default Gradle/CMake parallelism can exhaust the workspace's 8 GiB cgroup limit while React Native native libraries compile. A retry succeeded with `--max-workers=1`, `CMAKE_BUILD_PARALLEL_LEVEL=2`, and JVM args `-Xmx2g -XX:MaxMetaspaceSize=768m`; previously generated JS/native build outputs were reused.

**Why:** the initial parallel release build was killed by the cgroup OOM killer despite Gradle reporting the daemon disappeared; the memory-limited retry completed.

**How to apply:** on future `assembleRelease` builds in this workspace, limit Gradle and CMake parallelism before increasing heap size or restarting from a clean build.

After a forced full rerun hit OOM, a normal incremental `assembleRelease` completed with one Gradle worker, a 1.5 GiB JVM heap, and the Expo preview workflow stopped temporarily to free memory. Gradle rebuilt the JS bundle because the app source had changed.

**Why:** `--rerun-tasks` needlessly repeated native work and pushed the 8 GiB workspace over its memory limit; reusing successful outputs and pausing Metro gave the build enough headroom.

**How to apply:** prefer a normal incremental build after source changes. Stop and restart the Expo workflow only when memory pressure requires it; restart it after the build. Force the bundle task only when public environment values changed without a tracked source change.

The workspace may not have a writable Android SDK available through the package installer. Nix-provided SDKs are read-only and can place the NDK at `ndk-bundle`, while Gradle expects a versioned `ndk/<version>` path and additional Build Tools packages. Avoid copying the full NDK into the workspace; that can exceed its per-user disk quota.

**Why:** release builds need SDK paths and components Gradle can both discover and update, but the Nix SDK store is immutable and the complete NDK is too large for a workspace copy.

**How to apply:** if Android SDK discovery or SDK component installation fails, use a writable SDK root with links to Nix SDK components and provide the expected versioned NDK path. Keep component parents writable when packages are missing: for example, make `build-tools` a real directory and link existing versions into it before installing missing Build Tools or CMake with `sdkmanager`. Do not symlink the entire parent directory if the installer must add a version.

Workspace restarts can terminate an active Gradle build and erase a temporary SDK root under `/tmp`, causing `SDK location not found` even when the Nix SDK remains installed.

**Why:** the `/tmp/android-sdk` path disappeared after a workspace restart. Pointing `ANDROID_HOME` and `ANDROID_SDK_ROOT` directly at the existing Nix Android SDK restored the build; the NDK location warning was non-fatal.

**How to apply:** after a restart, verify the APK timestamp and locate the current Nix SDK root under `/nix/store/*-androidsdk/libexec/android-sdk`. Use it directly when the required platform, Build Tools, NDK, and CMake are present; create a writable shim only when Gradle must install missing components. Do not assume `/tmp/android-sdk` persists.

For Android API 36 release builds, use OpenJDK 21 rather than the workspace's default GraalVM 19. The Android JDK image transform failed under JDK 19 and completed under JDK 21.

**Why:** the Android Gradle plugin's `jlink` transform for API 36 was incompatible with the default GraalVM JDK in this environment.

**How to apply:** set `JAVA_HOME` and put that JDK's `bin` directory first in `PATH` when building Android release variants.

Gradle may mark the React Native release JS bundle as up to date even when only Expo public API host variables changed, leaving the APK with its previous API hostname.

**Why:** those environment values are not reliably tracked as bundle task inputs.

**How to apply:** force `:app:createBundleReleaseJsAndAssets` to rerun with the intended `EXPO_PUBLIC_DOMAIN` and `EXPO_PUBLIC_API_BASE_URL`, then inspect `assets/index.android.bundle` inside the APK for the expected host before distributing it.

An Android release can build successfully but close immediately on launch if Expo bundled the app without `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`.

**Why:** a release APK built directly through Gradle without exporting the Clerk public key contained the app's missing-key startup failure, despite passing the native build.

**How to apply:** export the Clerk public key and required public host values before forcing the release JS bundle; inspect the bundle inside the finished APK for the key's presence, expected host, and absence of the missing-key failure without printing the key itself.

An arm64 release with the corrected Expo Router startup route and Clerk configuration was installed on the user's Android phone, and the user confirmed that the app works well.

**Why:** a successful web preview or APK build alone does not prove the native app starts correctly on-device.

**How to apply:** when changing Android startup or authentication setup, include an install-and-launch check on a real device before treating the release as fully verified.

A cold Android release build can take many minutes initializing Gradle/Expo and compiling native C++ targets. NDK path warnings and cross-filesystem hard-link failures may fall back to slower copies without failing the build.

**Why:** after a workspace reset, this release spent several minutes in Gradle setup, Metro bundling, and native compilation while the processes remained active and eventually advanced.

**How to apply:** if Gradle, Metro, Ninja, or clang are still active and the log advances, allow the cold build to continue; restart only after a real error or a confirmed stalled process.

Chat asset attachments have a 100 MiB upload limit. A universal Android release APK can exceed it because it bundles native libraries for several CPU architectures.

**Why:** the four-architecture Eleganza APK exceeded the attachment limit, so it could not be delivered in chat.

**How to apply:** when a downloadable APK must fit the chat attachment limit and the target phone's ABI is confirmed, build only that ABI, verify the new APK and ZIP are below the limit, then attach the ZIP. Keep universal builds for broader distribution.
