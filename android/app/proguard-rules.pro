# Minification is disabled (isMinifyEnabled = false) for this WebView shell —
# there's no app logic to obfuscate/shrink, and keeping it off avoids stripping
# the @JavascriptInterface bridge by accident. Kept for parity with dday-sgshs
# and as a placeholder if minification is ever turned on later.

-keepclassmembers class com.sgshs.simplegame.snakegame.VibratorBridge {
    public *;
}
