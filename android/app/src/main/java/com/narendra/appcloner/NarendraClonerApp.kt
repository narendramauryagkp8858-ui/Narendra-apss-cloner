package com.narendra.appcloner

import android.app.Application
import android.util.Log
import com.narendra.appcloner.core.VirtualSandboxEngine
import com.narendra.appcloner.security.SecurityVaultManager

/**
 * Narendra App Cloner
 * Developer: Narendra Maurya
 */
class NarendraClonerApp : Application() {

    companion object {
        const val TAG = "NarendraAppCloner"
        lateinit var instance: NarendraClonerApp
            private set
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        Log.i(TAG, "Narendra App Cloner initialized by Narendra Maurya")

        SecurityVaultManager.init(this)
        VirtualSandboxEngine.init(this)
    }
}
