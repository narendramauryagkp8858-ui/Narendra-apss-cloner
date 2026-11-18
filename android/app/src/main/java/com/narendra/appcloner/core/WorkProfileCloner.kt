package com.narendra.appcloner.core

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.UserManager

/**
 * Official Work Profile / Managed Profile integration.
 * Developer: Narendra Maurya
 */
class WorkProfileCloner(private val context: Context) {

    private val devicePolicyManager = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
    private val userManager = context.getSystemService(Context.USER_SERVICE) as UserManager

    fun isWorkProfileSupported(): Boolean {
        return try {
            val method = UserManager::class.java.getMethod("supportsMultipleUsers")
            val result = method.invoke(userManager) as? Boolean
            result ?: (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
        } catch (e: Exception) {
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
        }
    }

    fun initiateWorkProfileProvisioning(adminComponent: ComponentName): Intent? {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(DevicePolicyManager.ACTION_PROVISION_MANAGED_PROFILE)
            intent.putExtra(
                DevicePolicyManager.EXTRA_PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME,
                adminComponent
            )
            intent.putExtra(
                DevicePolicyManager.EXTRA_PROVISIONING_SKIP_ENCRYPTION,
                true
            )
            return intent
        }
        return null
    }

    fun isRunningInWorkProfile(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            devicePolicyManager.isProfileOwnerApp(context.packageName)
        } else {
            false
        }
    }
}
