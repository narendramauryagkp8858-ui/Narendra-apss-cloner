package com.narendra.appscloner.ui

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.widget.Toast

/**
 * Trampoline activity launched when tapping a pinned 2nd Home Screen clone icon.
 * Strictly launches the NEW cloned package (never falls back to the original old app).
 */
class CloneShortcutActivity : Activity() {

    companion object {
        const val EXTRA_CLONE_PACKAGE = "extra_clone_package"
        const val EXTRA_CLONE_NAME = "extra_clone_name"
        const val EXTRA_ORIGINAL_PACKAGE = "extra_original_package"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val clonePkg = intent.getStringExtra(EXTRA_CLONE_PACKAGE)
        val cloneName = intent.getStringExtra(EXTRA_CLONE_NAME) ?: "Cloned App"

        if (!clonePkg.isNullOrBlank()) {
            val launchIntent = packageManager.getLaunchIntentForPackage(clonePkg)
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                startActivity(launchIntent)
                finish()
                return
            }
        }

        Toast.makeText(
            this,
            "$cloneName is not installed yet. Opening Narendra Apps Cloner...",
            Toast.LENGTH_LONG
        ).show()

        startActivity(Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        })
        finish()
    }
}
