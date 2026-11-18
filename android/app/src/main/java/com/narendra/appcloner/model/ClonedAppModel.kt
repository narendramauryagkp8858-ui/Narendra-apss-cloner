package com.narendra.appcloner.model

import java.io.Serializable

data class ClonedAppModel(
    val id: String,
    val originalPackageName: String,
    val clonePackageName: String,
    var customName: String,
    val cloneNumber: Int,
    var badgeText: String,
    var badgeColor: String,
    var hueRotateDeg: Float = 0f,
    val isolatedDataPath: String,
    val isWorkProfileMode: Boolean = false,
    var isLocked: Boolean = false,
    var isHidden: Boolean = false,
    var launchCount: Int = 0,
    val createdAt: Long = System.currentTimeMillis()
) : Serializable
