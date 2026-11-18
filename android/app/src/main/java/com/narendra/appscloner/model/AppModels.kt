package com.narendra.appscloner.model

import android.graphics.drawable.Drawable

data class InstalledAppInfo(
    val appName: String,
    val packageName: String,
    val icon: Drawable
)

data class ClonedAppInfo(
    val id: String,
    val originalPackageName: String,
    val originalAppName: String,
    val cloneName: String,
    val clonePackageName: String,
    val cloneNumber: Int,
    val badgeLabel: String,
    val storagePath: String,
    val createdAt: Long
)
