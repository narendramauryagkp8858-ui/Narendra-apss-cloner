package com.narendra.appscloner.core

import android.content.Context
import com.android.apksig.ApkSigner
import org.bouncycastle.asn1.x500.X500Name
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder
import org.bouncycastle.jce.provider.BouncyCastleProvider
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.math.BigInteger
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.PrivateKey
import java.security.SecureRandom
import java.security.cert.X509Certificate
import java.util.Date

/**
 * Generates and caches a local RSA-2048 signing certificate for cloned APKs.
 * Developer: Narendra Maurya (narendramauryagkp@gmail.com)
 */
object SigningKeyManager {

    private const val KEYSTORE_FILE = "narendra_cloner_signing.p12"
    private const val KEY_ALIAS = "narendra_cloner_key"
    private const val STORE_PASS = "narendra_cloner_2026"

    private val bcProvider by lazy { BouncyCastleProvider() }

    fun getSignerConfig(context: Context): ApkSigner.SignerConfig {
        val ksFile = File(context.filesDir, KEYSTORE_FILE)
        val ks = KeyStore.getInstance("PKCS12")

        if (ksFile.exists()) {
            try {
                FileInputStream(ksFile).use { fis ->
                    ks.load(fis, STORE_PASS.toCharArray())
                }
                val privateKey = ks.getKey(KEY_ALIAS, STORE_PASS.toCharArray()) as PrivateKey
                val cert = ks.getCertificate(KEY_ALIAS) as X509Certificate
                return ApkSigner.SignerConfig.Builder(KEY_ALIAS, privateKey, listOf(cert)).build()
            } catch (_: Exception) {
                ksFile.delete()
            }
        }

        val kpg = KeyPairGenerator.getInstance("RSA")
        kpg.initialize(2048, SecureRandom())
        val keyPair = kpg.generateKeyPair()

        val issuer = X500Name("CN=Narendra Apps Cloner, O=Narendra Maurya, EMAILADDRESS=narendramauryagkp@gmail.com")
        val now = System.currentTimeMillis()
        val notBefore = Date(now - 86_400_000L)
        val notAfter = Date(now + 25L * 365L * 86_400_000L)
        val serial = BigInteger(64, SecureRandom()).abs()

        val certBuilder = JcaX509v3CertificateBuilder(
            issuer,
            serial,
            notBefore,
            notAfter,
            issuer,
            keyPair.public
        )
        val signer = JcaContentSignerBuilder("SHA256WithRSA")
            .setProvider(bcProvider)
            .build(keyPair.private)
        val certHolder = certBuilder.build(signer)
        val cert = JcaX509CertificateConverter()
            .setProvider(bcProvider)
            .getCertificate(certHolder)

        ks.load(null, null)
        ks.setKeyEntry(KEY_ALIAS, keyPair.private, STORE_PASS.toCharArray(), arrayOf(cert))
        FileOutputStream(ksFile).use { fos ->
            ks.store(fos, STORE_PASS.toCharArray())
        }

        return ApkSigner.SignerConfig.Builder(KEY_ALIAS, keyPair.private, listOf(cert)).build()
    }
}
