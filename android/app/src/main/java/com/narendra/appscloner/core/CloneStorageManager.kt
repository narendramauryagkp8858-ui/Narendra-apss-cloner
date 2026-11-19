package com.narendra.appscloner.core

import android.content.Context
import com.narendra.appscloner.model.ClonedAppInfo
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/**
 * Manages isolated clone directories and persistent clone registry.
 * Developer: Narendra Maurya (narendramauryagkp@gmail.com)
 */
object CloneStorageManager {

    private const val PREFS_NAME = "narendra_apps_cloner_prefs"
    private const val KEY_CLONES = "cloned_apps_json"

    fun loadClones(context: Context): MutableList<ClonedAppInfo> {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val raw = prefs.getString(KEY_CLONES, "[]") ?: "[]"
        val list = mutableListOf<ClonedAppInfo>()

        try {
            val array = JSONArray(raw)
            for (i in 0 until array.length()) {
                val obj = array.getJSONObject(i)
                list.add(
                    ClonedAppInfo(
                        id = obj.getString("id"),
                        originalPackageName = obj.getString("originalPackageName"),
                        originalAppName = obj.getString("originalAppName"),
                        cloneName = obj.getString("cloneName"),
                        clonePackageName = obj.getString("clonePackageName"),
                        cloneNumber = obj.getInt("cloneNumber"),
                        badgeLabel = obj.getString("badgeLabel"),
                        storagePath = obj.getString("storagePath"),
                        createdAt = obj.getLong("createdAt")
                    )
                )
            }
        } catch (_: Exception) {
        }
        return list
    }

    private fun saveClones(context: Context, clones: List<ClonedAppInfo>) {
        val array = JSONArray()
        for (clone in clones) {
            val obj = JSONObject().apply {
                put("id", clone.id)
                put("originalPackageName", clone.originalPackageName)
                put("originalAppName", clone.originalAppName)
                put("cloneName", clone.cloneName)
                put("clonePackageName", clone.clonePackageName)
                put("cloneNumber", clone.cloneNumber)
                put("badgeLabel", clone.badgeLabel)
                put("storagePath", clone.storagePath)
                put("createdAt", clone.createdAt)
            }
            array.put(obj)
        }
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_CLONES, array.toString())
            .apply()
    }

    fun nextCloneInfo(
        context: Context,
        originalPackageName: String,
        originalAppName: String,
        customName: String,
        badgeLabel: String
    ): ClonedAppInfo {
        val existing = loadClones(context)
        val maxNum = existing
            .filter { it.originalPackageName == originalPackageName }
            .maxOfOrNull { it.cloneNumber } ?: 0
        val cloneNumber = maxNum + 1

        val safeOriginalPkg = originalPackageName
            .split(".")
            .joinToString(".") { seg ->
                val cleaned = seg.replace(Regex("[^a-zA-Z0-9_]"), "")
                if (cleaned.isEmpty() || cleaned[0].isDigit()) "p$cleaned" else cleaned
            }
        val clonePkg = "com.narendra.cloner.c$cloneNumber.$safeOriginalPkg"
        val sandboxDir = File(context.filesDir, "cloner_spaces/c${cloneNumber}_$safeOriginalPkg")
        if (!sandboxDir.exists()) {
            sandboxDir.mkdirs()
        }

        return ClonedAppInfo(
            id = "clone_${System.currentTimeMillis()}",
            originalPackageName = originalPackageName,
            originalAppName = originalAppName,
            cloneName = customName.ifBlank { "$originalAppName (Clone $cloneNumber)" },
            clonePackageName = clonePkg,
            cloneNumber = cloneNumber,
            badgeLabel = badgeLabel.ifBlank { "${cloneNumber + 1}" },
            storagePath = sandboxDir.absolutePath,
            createdAt = System.currentTimeMillis()
        )
    }

    fun saveNewClone(context: Context, clone: ClonedAppInfo) {
        val existing = loadClones(context).filter { it.clonePackageName != clone.clonePackageName }.toMutableList()
        existing.add(0, clone)
        saveClones(context, existing)
    }

    fun renameClone(context: Context, cloneId: String, newName: String) {
        val existing = loadClones(context)
        val updated = existing.map {
            if (it.id == cloneId) it.copy(cloneName = newName) else it
        }
        saveClones(context, updated)
    }

    fun deleteClone(context: Context, clone: ClonedAppInfo) {
        val existing = loadClones(context).filter { it.id != clone.id }
        saveClones(context, existing)
        try {
            File(clone.storagePath).deleteRecursively()
        } catch (_: Exception) {
        }
    }
}
