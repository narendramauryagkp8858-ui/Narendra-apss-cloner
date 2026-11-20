package com.narendra.appscloner.core

import android.content.Context
import android.os.Build
import io.github.muntashirakon.adb.AbsAdbConnectionManager
import io.github.muntashirakon.adb.AdbStream
import org.bouncycastle.asn1.x500.X500Name
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder
import org.bouncycastle.jce.provider.BouncyCastleProvider
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder
import org.conscrypt.Conscrypt
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.math.BigInteger
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.PrivateKey
import java.security.SecureRandom
import java.security.Security
import java.security.cert.Certificate
import java.security.cert.X509Certificate
import java.util.Date

/**
 * Built-In Zero-Root Wireless ADB Engine (In-Built Shizuku-Equivalent).
 * Connects directly to Android's local Wireless Debugging daemon (adbd) over TLS
 * without requiring root or any external Shizuku app.
 *
 * Installs cloned APKs using `pm install-create -i com.android.vending` so cloned apps
 * pass Google Play Store installer verification.
 */
object BuiltInAdbEngine {

    private const val PREFS_NAME = "narendra_builtin_adb_prefs"
    private const val KEY_PAIRED = "is_adb_paired"
    private const val IDENTITY_FILE = "narendra_adb_identity.p12"
    private const val IDENTITY_ALIAS = "narendra_adb_client"
    private const val IDENTITY_PASS = "narendra_adb_2026"

    private val bcProvider by lazy { BouncyCastleProvider() }

    @Volatile
    private var managerInstance: ClonerAdbConnectionManager? = null

    private class ClonerAdbConnectionManager(
        private val privKey: PrivateKey,
        private val cert: Certificate
    ) : AbsAdbConnectionManager() {

        init {
            setApi(Build.VERSION.SDK_INT)
        }

        override fun getPrivateKey(): PrivateKey = privKey

        override fun getCertificate(): Certificate = cert

        override fun getDeviceName(): String = "NarendraAppsCloner"
    }

    @Synchronized
    private fun getManager(context: Context): AbsAdbConnectionManager {
        managerInstance?.let { return it }

        if (Security.getProvider("Conscrypt") == null) {
            try {
                Security.addProvider(Conscrypt.newProvider())
            } catch (_: Throwable) {
            }
        }

        val (privKey, cert) = loadOrCreateIdentity(context.applicationContext)
        val manager = ClonerAdbConnectionManager(privKey, cert)
        managerInstance = manager
        return manager
    }

    private fun loadOrCreateIdentity(context: Context): Pair<PrivateKey, X509Certificate> {
        val ksFile = File(context.filesDir, IDENTITY_FILE)
        val ks = KeyStore.getInstance("PKCS12")

        if (ksFile.exists()) {
            try {
                FileInputStream(ksFile).use { fis ->
                    ks.load(fis, IDENTITY_PASS.toCharArray())
                }
                val priv = ks.getKey(IDENTITY_ALIAS, IDENTITY_PASS.toCharArray()) as PrivateKey
                val cert = ks.getCertificate(IDENTITY_ALIAS) as X509Certificate
                return priv to cert
            } catch (_: Exception) {
                ksFile.delete()
            }
        }

        val kpg = KeyPairGenerator.getInstance("RSA")
        kpg.initialize(2048, SecureRandom())
        val keyPair = kpg.generateKeyPair()

        val issuer = X500Name("CN=Narendra Apps Cloner, O=Narendra Maurya, EMAILADDRESS=narendramauryagkp@gmail.com")
        val now = System.currentTimeMillis()
        val certBuilder = JcaX509v3CertificateBuilder(
            issuer,
            BigInteger(64, SecureRandom()).abs(),
            Date(now - 86_400_000L),
            Date(now + 25L * 365L * 86_400_000L),
            issuer,
            keyPair.public
        )
        val signer = JcaContentSignerBuilder("SHA256WithRSA")
            .setProvider(bcProvider)
            .build(keyPair.private)
        val cert = JcaX509CertificateConverter()
            .setProvider(bcProvider)
            .getCertificate(certBuilder.build(signer))

        ks.load(null, null)
        ks.setKeyEntry(IDENTITY_ALIAS, keyPair.private, IDENTITY_PASS.toCharArray(), arrayOf(cert))
        FileOutputStream(ksFile).use { fos ->
            ks.store(fos, IDENTITY_PASS.toCharArray())
        }
        return keyPair.private to cert
    }

    fun isPaired(context: Context): Boolean {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getBoolean(KEY_PAIRED, false)
    }

    private fun setPaired(context: Context, paired: Boolean) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putBoolean(KEY_PAIRED, paired)
            .apply()
    }

    fun isConnected(context: Context): Boolean {
        return try {
            managerInstance?.isConnected == true
        } catch (_: Exception) {
            false
        }
    }

    fun pairAndConnect(
        context: Context,
        host: String,
        port: Int,
        pairingCode: String
    ): Result<Boolean> {
        return try {
            val manager = getManager(context)
            val cleanCode = pairingCode.trim()
            if (cleanCode.length != 6) {
                return Result.failure(IllegalArgumentException("Pairing code must be 6 digits."))
            }
            val paired = manager.pair(host.trim(), port, cleanCode)
            if (!paired) {
                return Result.failure(IllegalStateException("Pairing rejected. Check port and 6-digit code."))
            }
            setPaired(context, true)
            val connected = try {
                manager.autoConnect(context.applicationContext, 5000L)
            } catch (_: Exception) {
                false
            }
            Result.success(connected)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun ensureConnected(context: Context): Boolean {
        return try {
            val manager = getManager(context)
            if (manager.isConnected) return true
            val connected = manager.autoConnect(context.applicationContext, 5000L)
            if (connected) {
                setPaired(context, true)
            }
            connected
        } catch (_: Exception) {
            false
        }
    }

    fun installClonedApksWithPlayStoreSource(
        context: Context,
        apks: List<File>
    ): Result<Unit> {
        return try {
            val manager = getManager(context)
            if (!ensureConnected(context)) {
                return Result.failure(
                    IllegalStateException("In-Built Wireless ADB is not connected. Turn on Wireless Debugging or pair once.")
                )
            }

            val createOut = execCommand(manager, "pm install-create -i com.android.vending -r -t")
            val match = Regex("\\[(\\d+)]").find(createOut)
                ?: return Result.failure(IllegalStateException("Could not create install session: $createOut"))
            val sessionId = match.groupValues[1]

            for ((idx, file) in apks.withIndex()) {
                val splitName = if (idx == 0) "base.apk" else "split_$idx.apk"
                val writeRes = writeApkStream(manager, sessionId, splitName, file)
                if (!writeRes.contains("Success", ignoreCase = true)) {
                    try {
                        execCommand(manager, "pm install-abandon $sessionId")
                    } catch (_: Exception) {
                    }
                    return Result.failure(IllegalStateException("Write failed: $writeRes"))
                }
            }

            val commitOut = execCommand(manager, "pm install-commit $sessionId")
            if (!commitOut.contains("Success", ignoreCase = true)) {
                return Result.failure(IllegalStateException("Install failed: $commitOut"))
            }

            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun execCommand(manager: AbsAdbConnectionManager, command: String): String {
        val stream: AdbStream = manager.openStream("exec:$command")
        return try {
            stream.openInputStream().bufferedReader().readText().trim()
        } finally {
            try {
                stream.close()
            } catch (_: Exception) {
            }
        }
    }

    private fun writeApkStream(
        manager: AbsAdbConnectionManager,
        sessionId: String,
        splitName: String,
        apkFile: File
    ): String {
        val size = apkFile.length()
        val stream: AdbStream = manager.openStream("exec:pm install-write -S $size $sessionId $splitName -")
        return try {
            val out = stream.openOutputStream()
            FileInputStream(apkFile).use { fis ->
                val buffer = ByteArray(32 * 1024)
                while (true) {
                    val count = fis.read(buffer)
                    if (count <= 0) break
                    out.write(buffer, 0, count)
                }
                out.flush()
            }
            stream.openInputStream().bufferedReader().readText().trim()
        } finally {
            try {
                stream.close()
            } catch (_: Exception) {
            }
        }
    }
}
