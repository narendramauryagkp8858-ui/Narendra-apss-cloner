package com.narendra.appcloner.core

import android.content.Context
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import com.narendra.appcloner.model.ClonedAppModel
import java.io.File

/**
 * Virtual Sandbox Engine
 * Handles storage sandboxing, SQLite separation, and dual session containment.
 * Developer: Narendra Maurya
 */
object VirtualSandboxEngine {

    private const val TAG = "VirtualSandboxEngine"
    private const val VIRTUAL_STORAGE_BASE = "virtual_users"

    fun init(context: Context) {
        val baseDir = getVirtualBaseDir(context)
        if (!baseDir.exists()) {
            baseDir.mkdirs()
        }
        Log.d(TAG, "Sandbox base directory verified: ${baseDir.absolutePath}")
    }

    fun getCloneDataDir(context: Context, packageName: String, cloneNumber: Int): File {
        val userDir = File(getVirtualBaseDir(context), "user_$cloneNumber")
        val appDataDir = File(userDir, packageName)
        if (!appDataDir.exists()) {
            appDataDir.mkdirs()
            File(appDataDir, "databases").mkdirs()
            File(appDataDir, "shared_prefs").mkdirs()
            File(appDataDir, "files").mkdirs()
            File(appDataDir, "cache").mkdirs()
        }
        return appDataDir
    }

    fun createClone(
        context: Context,
        originalPackageName: String,
        customName: String,
        cloneNumber: Int,
        badgeText: String,
        badgeColor: String,
        hueRotateDeg: Float,
        isWorkProfileMode: Boolean
    ): ClonedAppModel {
        val pm = context.packageManager
        val pkgInfo: PackageInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            pm.getPackageInfo(originalPackageName, PackageManager.PackageInfoFlags.of(0))
        } else {
            @Suppress("DEPRECATION")
            pm.getPackageInfo(originalPackageName, 0)
        }

        val clonePackageName = "com.narendra.cloner.virtual_user_${cloneNumber}.${originalPackageName}"
        val dataDir = getCloneDataDir(context, originalPackageName, cloneNumber)

        Log.i(TAG, "Cloned ${pkgInfo.packageName} -> $clonePackageName at ${dataDir.absolutePath}")

        return ClonedAppModel(
            id = "clone_${originalPackageName}_$cloneNumber",
            originalPackageName = originalPackageName,
            clonePackageName = clonePackageName,
            customName = customName,
            cloneNumber = cloneNumber,
            badgeText = badgeText,
            badgeColor = badgeColor,
            hueRotateDeg = hueRotateDeg,
            isolatedDataPath = dataDir.absolutePath,
            isWorkProfileMode = isWorkProfileMode,
            isLocked = false,
            createdAt = System.currentTimeMillis()
        )
    }

    fun clearCloneCache(context: Context, packageName: String, cloneNumber: Int): Boolean {
        val appDataDir = getCloneDataDir(context, packageName, cloneNumber)
        val cacheDir = File(appDataDir, "cache")
        return cacheDir.deleteRecursively()
    }

    fun deleteClone(context: Context, packageName: String, cloneNumber: Int): Boolean {
        val appDataDir = getCloneDataDir(context, packageName, cloneNumber)
        return appDataDir.deleteRecursively()
    }

    private fun getVirtualBaseDir(context: Context): File {
        return File(context.filesDir, VIRTUAL_STORAGE_BASE)
    }
}
