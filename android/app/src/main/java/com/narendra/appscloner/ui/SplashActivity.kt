package com.narendra.appscloner.ui

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import com.narendra.appscloner.R

/**
 * Splash Screen Activity displaying "Narendra Apps Cloner" & developer email on launch.
 * Developer: Narendra Maurya (narendramauryagkp@gmail.com)
 */
class SplashActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)

        val container = findViewById<View>(R.id.splashContainer)
        container.alpha = 0f
        container.scaleX = 0.92f
        container.scaleY = 0.92f
        container.animate()
            .alpha(1f)
            .scaleX(1f)
            .scaleY(1f)
            .setDuration(700L)
            .start()

        Handler(Looper.getMainLooper()).postDelayed({
            startActivity(Intent(this, MainActivity::class.java))
            finish()
        }, 1800L)
    }
}
