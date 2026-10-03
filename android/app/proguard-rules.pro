# R8 is on for release builds (isMinifyEnabled/isShrinkResources = true, #27).
# This app is a WebView shell: the only code reached by reflection is the JS bridge
# that MainActivity registers with addJavascriptInterface(..., "Android").
#
# - WebView only exposes methods that carry @JavascriptInterface, looked up at run
#   time, so both the methods and the annotation itself must survive R8. AGP's
#   default rules (proguard-android-optimize.txt) already cover this; the rules
#   below make it explicit so the bridge doesn't depend on those defaults.
# - Renaming the bridge class is harmless: page JS reaches it by the injected name
#   "Android", not by its Java class name.

-keepattributes RuntimeVisibleAnnotations

-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

-keepclassmembers class com.sgshs.simplegame.snakegame.VibratorBridge {
    public *;
}
