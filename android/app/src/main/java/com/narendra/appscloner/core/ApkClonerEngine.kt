package com.narendra.appscloner.core

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInstaller
import android.os.Build
import com.android.apksig.ApkSigner
import java.io.FilterOutputStream
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.OutputStream
import java.util.zip.CRC32
import java.util.zip.ZipEntry
import java.util.zip.ZipFile
import java.util.zip.ZipOutputStream

/**
 * Real on-device APK Cloner Engine:
 * 1. Copies base.apk (+ split APKs if present)
 * 2. Rewrites AndroidManifest.xml with a new package name, custom app label & distinct authorities
 * 3. Replaces launcher PNG/WebP icons with a newly generated badged & tinted clone icon
 * 4. Signs cloned APK(s) with APK Signature Scheme v1/v2/v3
 * 5. Triggers Android PackageInstaller so the cloned app installs as a separate app with its own NEW icon!
 */
object ApkClonerEngine {

    const val ACTION_INSTALL_RESULT = "com.narendra.appscloner.ACTION_INSTALL_RESULT"

    private class CountingOutputStream(out: OutputStream) : FilterOutputStream(out) {
        var bytesWritten: Long = 0L
            private set

        override fun write(b: Int) {
            out.write(b)
            bytesWritten++
        }

        override fun write(b: ByteArray, off: Int, len: Int) {
            out.write(b, off, len)
            bytesWritten += len
        }
    }

    data class CloneBuildResult(
        val clonePackageName: String,
        val outputApkFiles: List<File>
    )

    fun buildClonedApks(
        context: Context,
        oldPackage: String,
        newPackage: String,
        customLabel: String,
        cloneNumber: Int,
        badgeLabel: String
    ): CloneBuildResult {
        val pm = context.packageManager
        val appInfo = pm.getApplicationInfo(oldPackage, 0)
        val originalIcon = pm.getApplicationIcon(oldPackage)
        val badgedPngBytes = IconCustomizer.toPngBytes(
            IconCustomizer.createClonedIconBitmap(originalIcon, badgeLabel)
        )

        val workDir = File(context.cacheDir, "cloned_apks/$newPackage")
        if (workDir.exists()) workDir.deleteRecursively()
        workDir.mkdirs()

        val sourcePaths = mutableListOf<String>()
        sourcePaths.add(appInfo.publicSourceDir)
        appInfo.splitPublicSourceDirs?.let { splits ->
            sourcePaths.addAll(splits)
        }

        val signerConfig = SigningKeyManager.getSignerConfig(context)
        val signedApks = mutableListOf<File>()

        val hasSplits = sourcePaths.size > 1

        sourcePaths.forEachIndexed { index, srcPath ->
            val srcFile = File(srcPath)
            val unsignedFile = File(workDir, "unsigned_$index.apk")
            val signedFile = File(
                workDir,
                if (index == 0) "base_cloned.apk" else "split_${index}_cloned.apk"
            )

            rewriteSingleApk(
                sourceApk = srcFile,
                destUnsignedApk = unsignedFile,
                oldPackage = oldPackage,
                newPackage = newPackage,
                customLabel = customLabel,
                cloneNumber = cloneNumber,
                hasSplits = hasSplits,
                replacementIconPng = if (index == 0) badgedPngBytes else null
            )

            ApkSigner.Builder(listOf(signerConfig))
                .setInputApk(unsignedFile)
                .setOutputApk(signedFile)
                .setMinSdkVersion(26)
                .setV1SigningEnabled(true)
                .setV2SigningEnabled(true)
                .setV3SigningEnabled(true)
                .build()
                .sign()

            unsignedFile.delete()
            signedApks.add(signedFile)
        }

        return CloneBuildResult(
            clonePackageName = newPackage,
            outputApkFiles = signedApks
        )
    }

    private fun rewriteSingleApk(
        sourceApk: File,
        destUnsignedApk: File,
        oldPackage: String,
        newPackage: String,
        customLabel: String,
        cloneNumber: Int,
        hasSplits: Boolean,
        replacementIconPng: ByteArray?
    ) {
        ZipFile(sourceApk).use { zipIn ->
            val countingOut = CountingOutputStream(FileOutputStream(destUnsignedApk))
            ZipOutputStream(countingOut).use { zipOut ->
                val entries = zipIn.entries()

                while (entries.hasMoreElements()) {
                    val entry = entries.nextElement()
                    val name = entry.name

                    if (entry.isDirectory) {
                        continue
                    }

                    // Strip existing signatures before re-signing
                    if (name.startsWith("META-INF/") &&
                        (name.endsWith(".SF") || name.endsWith(".RSA") || name.endsWith(".DSA") ||
                            name.endsWith(".EC") || name == "META-INF/MANIFEST.MF")
                    ) {
                        continue
                    }

                    val rawBytes = zipIn.getInputStream(entry).use { it.readBytes() }
                    val outBytes: ByteArray = when {
                        name == "AndroidManifest.xml" -> {
                            BinaryManifestEditor.rewriteManifest(
                                axmlBytes = rawBytes,
                                oldPackage = oldPackage,
                                newPackage = newPackage,
                                customLabel = customLabel,
                                cloneNumber = cloneNumber,
                                hasSplits = hasSplits
                            )
                        }

                        replacementIconPng != null && isLauncherIconEntry(name) -> {
                            replacementIconPng
                        }

                        else -> rawBytes
                    }

                    val keepStored = name == "resources.arsc" || name.endsWith(".so") || entry.method == ZipEntry.STORED
                    val outEntry = ZipEntry(name)

                    if (keepStored) {
                        outEntry.method = ZipEntry.STORED
                        outEntry.size = outBytes.size.toLong()
                        outEntry.compressedSize = outBytes.size.toLong()
                        val crc = CRC32().apply { update(outBytes) }
                        outEntry.crc = crc.value

                        val align = if (name.endsWith(".so")) 4096 else 4
                        val nameLen = name.toByteArray(Charsets.UTF_8).size
                        val headerBase = countingOut.bytesWritten + 30L + nameLen
                        val rem = (headerBase % align).toInt()
                        val pad = if (rem == 0) 0 else align - rem
                        if (pad > 0) {
                            outEntry.extra = ByteArray(pad)
                        }
                        zipOut.putNextEntry(outEntry)
                        zipOut.write(outBytes)
                        zipOut.closeEntry()
                    } else {
                        outEntry.method = ZipEntry.DEFLATED
                        zipOut.putNextEntry(outEntry)
                        zipOut.write(outBytes)
                        zipOut.closeEntry()
                    }
                    zipOut.flush()
                }
            }
        }
    }

    private fun isLauncherIconEntry(entryName: String): Boolean {
        if (!entryName.startsWith("res/")) return false
        val lower = entryName.lowercase()
        val isImage = lower.endsWith(".png") || lower.endsWith(".webp")
        if (!isImage) return false
        return lower.contains("ic_launcher") || lower.contains("app_icon")
    }

    fun installClonedApks(context: Context, apks: List<File>, customLabel: String) {
        val installer = context.packageManager.packageInstaller
        val params = PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL).apply {
            setAppLabel(customLabel)
        }
        val sessionId = installer.createSession(params)
        val session = installer.openSession(sessionId)

        apks.forEachIndexed { idx, file ->
            FileInputStream(file).use { fis ->
                session.openWrite("apk_$idx", 0, file.length()).use { out ->
                    fis.copyTo(out)
                    session.fsync(out)
                }
            }
        }

        val callbackIntent = Intent(ACTION_INSTALL_RESULT).setPackage(context.packageName)
        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }
        val pendingIntent = PendingIntent.getBroadcast(context, sessionId, callbackIntent, flags)
        session.commit(pendingIntent.intentSender)
        session.close()
    }
}
