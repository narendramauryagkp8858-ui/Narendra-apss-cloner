package com.narendra.appcloner.security

import android.content.Context
import android.content.SharedPreferences
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * Security Vault Manager for Narendra App Cloner
 * Developer: Narendra Maurya
 */
object SecurityVaultManager {

    private const val PREFS_FILE = "narendra_vault_secure_prefs"
    private const val KEY_PIN_HASH = "vault_pin_hash"
    private const val KEY_LOCK_ENABLED = "vault_lock_enabled"

    private lateinit var encryptedPrefs: SharedPreferences

    fun init(context: Context) {
        try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()

            encryptedPrefs = EncryptedSharedPreferences.create(
                context,
                PREFS_FILE,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (e: Exception) {
            encryptedPrefs = context.getSharedPreferences(PREFS_FILE, Context.MODE_PRIVATE)
        }
    }

    fun isAppLockEnabled(): Boolean = encryptedPrefs.getBoolean(KEY_LOCK_ENABLED, false)

    fun setAppLockEnabled(enabled: Boolean) {
        encryptedPrefs.edit().putBoolean(KEY_LOCK_ENABLED, enabled).apply()
    }

    fun setPin(pin: String) {
        encryptedPrefs.edit().putString(KEY_PIN_HASH, hashString(pin)).apply()
    }

    fun verifyPin(pin: String): Boolean {
        val storedHash = encryptedPrefs.getString(KEY_PIN_HASH, null) ?: return true
        return storedHash == hashString(pin)
    }

    private fun hashString(input: String): String {
        val bytes = java.security.MessageDigest.getInstance("SHA-256").digest(input.toByteArray())
        return bytes.joinToString("") { "%02x".format(it) }
    }
}
