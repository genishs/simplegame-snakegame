package com.sgshs.simplegame.snakegame

import android.app.Activity
import android.content.Context
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.webkit.WebViewAssetLoader

/**
 * Pure WebView shell (v1 spec, docs/specs/android-v1.md) — the game itself is
 * the root index.html/game.js/style.css served locally via WebViewAssetLoader.
 * No native game logic lives here.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)

        // FLAG_KEEP_SCREEN_ON is no longer set for the whole session: the page turns it
        // on only during active play via Android.setKeepScreenOn() (#28).
        // Phones are portrait-locked in the manifest (#23). Screens 600dp+ may ignore
        // the lock (Android 16), so the page also has a landscape layout.

        webView = WebView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }
        val root = FrameLayout(this).apply {
            // Same color as the page, so the inset strips read as page background.
            setBackgroundColor(ContextCompat.getColor(this@MainActivity, R.color.bg_page))
            addView(webView)
        }
        setContentView(root)
        applyCutoutInsets(root)

        enableImmersiveMode()

        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true // required: localStorage best-score persistence
        // #28: assets come only through WebViewAssetLoader — no file:// or content://.
        webView.settings.allowFileAccess = false
        webView.settings.allowContentAccess = false

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? = assetLoader.shouldInterceptRequest(request.url)

            // #28: the game never navigates; keep the WebView on the bundled page.
            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean = request.url.host != WebViewAssetLoader.DEFAULT_DOMAIN
        }

        webView.addJavascriptInterface(HostBridge(this), "Android")

        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html")

        onBackPressedDispatcher.addCallback(this, backPressedCallback)
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) enableImmersiveMode()
    }

    /**
     * #22: pause the game whenever the activity leaves the foreground (home, screen
     * off, incoming call). The page stops getting frames while we're away; without an
     * explicit pause the missed ticks used to run all at once on return. Not relying on
     * the page's own visibilitychange alone — whether WebView fires it depends on the
     * WebView version.
     */
    override fun onPause() {
        super.onPause()
        webView.evaluateJavascript("window.SnakeHost && window.SnakeHost.onPause();", null)
        webView.onPause()
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onDestroy() {
        // #28: release the WebView with the activity instead of leaking it.
        (webView.parent as? ViewGroup)?.removeView(webView)
        webView.destroy()
        super.onDestroy()
    }

    /**
     * #23: keep the page clear of display cutouts (punch holes, notches). The window
     * is edge-to-edge (and always lays out into the cutout on API 35+), so without
     * this the board or buttons can sit under the camera in landscape. Done natively
     * as root padding instead of CSS env(safe-area-inset-*): whether WebView reports
     * those depends on its version. The insets are consumed here so a WebView that
     * does report them can't apply them a second time.
     */
    private fun applyCutoutInsets(root: View) {
        ViewCompat.setOnApplyWindowInsetsListener(root) { v, insets ->
            val cutout = insets.getInsets(WindowInsetsCompat.Type.displayCutout())
            v.setPadding(cutout.left, cutout.top, cutout.right, cutout.bottom)
            WindowInsetsCompat.CONSUMED
        }
    }

    /** Immersive fullscreen: hide system bars, allow a swipe to reveal them briefly. */
    private fun enableImmersiveMode() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        val controller = WindowInsetsControllerCompat(window, window.decorView)
        controller.hide(WindowInsetsCompat.Type.systemBars())
        controller.systemBarsBehavior =
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
    }

    /**
     * Back button (#28): the page owns the decision through an explicit contract,
     * `window.SnakeHost.onBack()` in game.js, instead of the shell guessing at game
     * globals (which would break silently if game.js were ever bundled or renamed).
     * It returns "handled" when the game used the press (paused play or the
     * countdown, closed the help screen) and "exit" otherwise. Anything else —
     * including a missing SnakeHost — backgrounds the task rather than destroying
     * the activity, so a broken page can never trap the back button.
     */
    private val backPressedCallback = object : OnBackPressedCallback(true) {
        override fun handleOnBackPressed() {
            webView.evaluateJavascript(
                "(function(){try{return window.SnakeHost.onBack();}catch(e){return 'exit';}})();"
            ) { result -> if (result != "\"handled\"") moveTaskToBack(true) }
        }
    }
}

/**
 * JS bridge exposed to the page as `window.Android` (game.js calls it only when it
 * exists, so the web build is unaffected):
 * - vibrate(ms): short haptic on fruit eat / game over.
 * - setKeepScreenOn(on): keep the display awake only while a run is in progress.
 * Bridge methods run on a WebView binder thread, never the UI thread.
 */
class HostBridge(private val activity: Activity) {

    private val vibrator: Vibrator by lazy {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val manager = activity.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            manager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            activity.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
    }

    @JavascriptInterface
    fun vibrate(ms: Long) {
        if (ms <= 0 || !vibrator.hasVibrator()) return
        // #28: the page is trusted, but cap anyway so no call can buzz for long.
        val duration = ms.coerceAtMost(MAX_VIBRATE_MS)
        vibrator.vibrate(VibrationEffect.createOneShot(duration, VibrationEffect.DEFAULT_AMPLITUDE))
    }

    /** #28: replaces the always-on FLAG_KEEP_SCREEN_ON; window flags need the UI thread. */
    @JavascriptInterface
    fun setKeepScreenOn(on: Boolean) {
        activity.runOnUiThread {
            if (activity.isFinishing || activity.isDestroyed) return@runOnUiThread
            val flag = WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            if (on) activity.window.addFlags(flag) else activity.window.clearFlags(flag)
        }
    }

    private companion object {
        const val MAX_VIBRATE_MS = 200L
    }
}
