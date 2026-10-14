---
name: Android release builds with limited memory
description: Avoiding Gradle and native compiler OOM during Android release builds in this workspace.
---

For Android release builds, default Gradle/CMake parallelism can exhaust the workspace's 8 GiB cgroup limit while React Native native libraries compile. A retry succeeded with `--max-workers=1`, `CMAKE_BUILD_PARALLEL_LEVEL=2`, and JVM args `-Xmx2g -XX:MaxMetaspaceSize=768m`; previously generated JS/native build outputs were reused.

**Why:** the initial parallel release build was killed by the cgroup OOM killer despite Gradle reporting the daemon disappeared; the memory-limited retry completed.

**How to apply:** on future `assembleRelease` builds in this workspace, limit Gradle and CMake parallelism before increasing heap size or restarting from a clean build.
