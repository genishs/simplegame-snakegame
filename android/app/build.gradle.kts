plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// ---------------------------------------------------------------------------
// v1 spec (docs/specs/android-v1.md): the web root's game.js is the single
// source of truth for the shipped version. We parse `const GAME_VERSION =
// '<major>.<minor>.<patch>';` out of it and derive versionName/versionCode
// from that — never hand-typed here. Build fails loudly if it can't be found
// or doesn't parse, rather than silently shipping a stale version.
// ---------------------------------------------------------------------------
val repoRoot: File = rootProject.projectDir.parentFile
    ?: throw GradleException("android/ must live one level under the repo root")
val gameJsFile = File(repoRoot, "game.js")

val gameVersionRegex = Regex("""const\s+GAME_VERSION\s*=\s*['"](\d+)\.(\d+)\.(\d+)['"]""")

data class GameVersion(val name: String, val code: Int)

fun readGameVersion(): GameVersion {
    if (!gameJsFile.exists()) {
        throw GradleException("game.js not found at $gameJsFile — cannot derive app version")
    }
    val match = gameVersionRegex.find(gameJsFile.readText())
        ?: throw GradleException(
            "Could not find `const GAME_VERSION = 'X.Y.Z';` in $gameJsFile — " +
                "add it at the top of game.js (SoT for the Android version)."
        )
    val (major, minor, patch) = match.destructured
    val name = "$major.$minor.$patch"
    // major*10000 + minor*100 + patch — e.g. 0.6.1 -> 601
    val code = major.toInt() * 10000 + minor.toInt() * 100 + patch.toInt()
    return GameVersion(name, code)
}

val gameVersion = readGameVersion()

// ---------------------------------------------------------------------------
// Web assets: never committed under android/. Copied at build time from the
// repo-root 3 files (index.html / game.js / style.css) into a generated
// assets dir, so the root files stay the single source of truth.
// ---------------------------------------------------------------------------
val webAssetsDir = layout.buildDirectory.dir("generated/webAssets")

val copyWebAssets = tasks.register<Copy>("copyWebAssets") {
    from(repoRoot) {
        include("index.html", "game.js", "style.css")
    }
    into(webAssetsDir)
}

android {
    namespace = "com.sgshs.simplegame.snakegame"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.sgshs.simplegame.snakegame"
        minSdk = 26
        targetSdk = 36
        versionCode = gameVersion.code
        versionName = gameVersion.name

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    val keystoreDir = File(System.getProperty("user.home")!!, "keystores")
    val keystoreFile = File(keystoreDir, "sgshs-upload.jks")
    val keystorePassFile = File(keystoreDir, "sgshs-upload.pass")
    val hasSigningMaterial = keystoreFile.exists() && keystorePassFile.exists()

    signingConfigs {
        create("release") {
            if (hasSigningMaterial) {
                val pass = keystorePassFile.readText().trim()
                storeFile = keystoreFile
                storePassword = pass
                keyAlias = "upload"
                keyPassword = pass
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            isShrinkResources = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            if (hasSigningMaterial) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = false
    }

    sourceSets {
        getByName("main") {
            assets.srcDir(webAssetsDir.get().asFile)
        }
    }
}

tasks.named("preBuild") {
    dependsOn(copyWebAssets)
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.webkit:webkit:1.12.1")
    implementation("androidx.core:core-splashscreen:1.0.1")
}
