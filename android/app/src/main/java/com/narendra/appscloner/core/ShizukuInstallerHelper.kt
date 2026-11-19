package com.narendra.appscloner.core

import android.content.ComponentName
import android.content.Context
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.os.Build
import android.os.IBinder
import android.os.ParcelFileDescriptor
import com.narendra.appscloner.IClonerUserService
import rikka.shizuku.Shizuku
import java.io.File
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/**
 * Coordinates Play-Store-verified APK installation (-i com.android.vending) via Shizuku
 * and inspects the active installer package name for cloned apps.
 */
object ShizukuInstallerHelper {

    const val PLAY_STORE_PACKAGE = "com.android.vending"
    const val SHIZUKU_PACKAGE = "moe.shizuku.privileged.api"

    fun isShizukuInstalled(context: Context): Boolean {
        return try {
            context.packageManager.getPackageInfo(SHIZUKU_PACKAGE, 0)
            true
        } catch (_: Exception) {
            false
        }
    }

    fun isShizukuRunning(): Boolean {
        return try {
            Shizuku.pingBinder()
        } catch (_: Exception) {
            false
        }
    }

    fun hasShizukuPermission(): Boolean {
        return try {
            if (!isShizukuRunning()) return false
            if (Shizuku.isPreV11()) return false
            Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED
        } catch (_: Exception) {
            false
        }
    }

    fun isReadyForPlayStoreInstall(): Boolean {
        return isShizukuRunning() && hasShizukuPermission()
    }

    fun getInstallerPackage(context: Context, packageName: String): String? {
        return try {
            val pm = context.packageManager
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                val info = pm.getInstallSourceInfo(packageName)
                info.installingPackageName ?: info.initiatingPackageName
            } else {
                @Suppress("DEPRECATION")
                pm.getInstallerPackageName(packageName)
            }
        } catch (_: Exception) {
            null
        }
    }

    fun isInstalledFromPlayStoreSource(context: Context, packageName: String): Boolean {
        return getInstallerPackage(context, packageName) == PLAY_STORE_PACKAGE
    }

    fun installWithPlayStoreSource(context: Context, apks: List<File>): Result<Unit> {
        if (!isReadyForPlayStoreInstall()) {
            return Result.failure(IllegalStateException("Shizuku Play Store Mode is not active."))
        }

        val args = Shizuku.UserServiceArgs(ComponentName(context, ClonerUserService::class.java))
            .daemon(false)
            .processNameSuffix("cloner_installer")
            .version(3)

        val latch = CountDownLatch(1)
        var remoteService: IClonerUserService? = null

        val connection = object : ServiceConnection {
            override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
                remoteService = IClonerUserService.Stub.asInterface(service)
                latch.countDown()
            }

            override fun onServiceDisconnected(name: ComponentName?) {
                remoteService = null
            }
        }

        return try {
            Shizuku.bindUserService(args, connection)
            val bound = latch.await(10, TimeUnit.SECONDS)
            val service = remoteService
            if (!bound || service == null) {
                return Result.failure(IllegalStateException("Timed out connecting to Shizuku installer service."))
            }

            val sessionResult = service.createPlayStoreSession()
            if (!sessionResult.startsWith("SESSION:")) {
                return Result.failure(IllegalStateException(sessionResult.removePrefix("ERROR:")))
            }
            val sessionId = sessionResult.removePrefix("SESSION:")

            for ((idx, apkFile) in apks.withIndex()) {
                val splitName = if (idx == 0) "base.apk" else "split_$idx.apk"
                val pfd = ParcelFileDescriptor.open(apkFile, ParcelFileDescriptor.MODE_READ_ONLY)
                val writeResult = pfd.use { fd ->
                    service.writeApkToSession(sessionId, splitName, apkFile.length(), fd)
                }
                if (writeResult != "OK") {
                    try {
                        service.abandonSession(sessionId)
                    } catch (_: Exception) {
                    }
                    return Result.failure(IllegalStateException(writeResult.removePrefix("ERROR:")))
                }
            }

            val commitResult = service.commitSession(sessionId)
            if (commitResult != "OK") {
                return Result.failure(IllegalStateException(commitResult.removePrefix("ERROR:")))
            }

            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        } finally {
            try {
                Shizuku.unbindUserService(args, connection, true)
            } catch (_: Exception) {
            }
        }
    }
}
