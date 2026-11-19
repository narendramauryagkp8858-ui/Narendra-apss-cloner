package com.narendra.appscloner.ui

import android.app.admin.DevicePolicyManager
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageInstaller
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.narendra.appscloner.R
import com.narendra.appscloner.core.ApkClonerEngine
import com.narendra.appscloner.core.CloneStorageManager
import com.narendra.appscloner.core.ClonerDeviceAdminReceiver
import com.narendra.appscloner.core.IconCustomizer
import com.narendra.appscloner.model.ClonedAppInfo
import com.narendra.appscloner.model.InstalledAppInfo
import java.util.concurrent.Executors

/**
 * Narendra Apps Cloner - Main App Cloner Dashboard
 * Developer: Narendra Maurya (narendramauryagkp@gmail.com)
 */
class MainActivity : AppCompatActivity() {

    private lateinit var tvCloneCount: TextView
    private lateinit var tvInstalledCount: TextView
    private lateinit var tvNoClones: TextView
    private lateinit var etSearch: EditText
    private lateinit var rvClonedApps: RecyclerView
    private lateinit var rvInstalledApps: RecyclerView

    private lateinit var clonedAdapter: ClonedAppsAdapter
    private lateinit var installedAdapter: InstalledAppsAdapter

    private var allClones: List<ClonedAppInfo> = emptyList()
    private var allInstalledApps: List<InstalledAppInfo> = emptyList()

    private val executor = Executors.newSingleThreadExecutor()
    private var pendingCloneForShortcut: ClonedAppInfo? = null

    private val installResultReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            val status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE)
            val message = intent.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE) ?: ""

            when (status) {
                PackageInstaller.STATUS_PENDING_USER_ACTION -> {
                    val confirmIntent: Intent? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        intent.getParcelableExtra(Intent.EXTRA_INTENT, Intent::class.java)
                    } else {
                        @Suppress("DEPRECATION")
                        intent.getParcelableExtra(Intent.EXTRA_INTENT)
                    }
                    if (confirmIntent != null) {
                        confirmIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        startActivity(confirmIntent)
                    }
                }

                PackageInstaller.STATUS_SUCCESS -> {
                    refreshClones()
                    loadDeviceApps()
                    Toast.makeText(
                        this@MainActivity,
                        "Cloned App Installed! New icon added.",
                        Toast.LENGTH_LONG
                    ).show()
                    pendingCloneForShortcut?.let { clone ->
                        try {
                            val icon = packageManager.getApplicationIcon(clone.clonePackageName)
                            IconCustomizer.pinHomeScreenIcon(this@MainActivity, clone, icon)
                        } catch (_: Exception) {
                        }
                        pendingCloneForShortcut = null
                    }
                }

                else -> {
                    refreshClones()
                    if (status != PackageInstaller.STATUS_FAILURE_ABORTED) {
                        showInstallFailedDialog(message)
                    }
                }
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        tvCloneCount = findViewById(R.id.tvCloneCount)
        tvInstalledCount = findViewById(R.id.tvInstalledCount)
        tvNoClones = findViewById(R.id.tvNoClones)
        etSearch = findViewById(R.id.etSearch)
        rvClonedApps = findViewById(R.id.rvClonedApps)
        rvInstalledApps = findViewById(R.id.rvInstalledApps)

        val tvHeaderEmail = findViewById<TextView>(R.id.tvHeaderEmail)
        tvHeaderEmail.setOnClickListener {
            try {
                val mailIntent = Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:narendramauryagkp@gmail.com"))
                startActivity(mailIntent)
            } catch (_: Exception) {
                Toast.makeText(this, "Email: narendramauryagkp@gmail.com", Toast.LENGTH_SHORT).show()
            }
        }

        ContextCompat.registerReceiver(
            this,
            installResultReceiver,
            IntentFilter(ApkClonerEngine.ACTION_INSTALL_RESULT),
            ContextCompat.RECEIVER_EXPORTED
        )

        setupRecyclerViews()
        loadDeviceApps()
        refreshClones()

        etSearch.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                applySearchFilter(s?.toString() ?: "")
            }
            override fun afterTextChanged(s: Editable?) {}
        })
    }

    override fun onResume() {
        super.onResume()
        refreshClones()
    }

    override fun onDestroy() {
        try {
            unregisterReceiver(installResultReceiver)
        } catch (_: Exception) {
        }
        executor.shutdownNow()
        super.onDestroy()
    }

    private fun setupRecyclerViews() {
        rvClonedApps.layoutManager = LinearLayoutManager(this)
        clonedAdapter = ClonedAppsAdapter(
            items = emptyList(),
            packageManager = packageManager,
            onOpenClick = { clone -> openClone(clone) },
            onPinIconClick = { clone -> pinCloneIcon(clone) },
            onRenameClick = { clone -> showRenameDialog(clone) },
            onDeleteClick = { clone -> confirmDeleteClone(clone) }
        )
        rvClonedApps.adapter = clonedAdapter

        rvInstalledApps.layoutManager = LinearLayoutManager(this)
        installedAdapter = InstalledAppsAdapter(
            items = emptyList(),
            onCloneClick = { app -> showCreateCloneDialog(app) }
        )
        rvInstalledApps.adapter = installedAdapter
    }

    private fun loadDeviceApps() {
        val mainIntent = Intent(Intent.ACTION_MAIN, null).apply {
            addCategory(Intent.CATEGORY_LAUNCHER)
        }

        val resolveList = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            packageManager.queryIntentActivities(mainIntent, PackageManager.ResolveInfoFlags.of(0))
        } else {
            @Suppress("DEPRECATION")
            packageManager.queryIntentActivities(mainIntent, 0)
        }

        val uniquePackages = HashSet<String>()
        val apps = mutableListOf<InstalledAppInfo>()

        for (info in resolveList) {
            val pkg = info.activityInfo.packageName
            if (pkg == packageName || pkg.startsWith("com.narendra.cloner.") || !uniquePackages.add(pkg)) continue
            val label = info.loadLabel(packageManager).toString()
            val icon = info.loadIcon(packageManager)
            apps.add(InstalledAppInfo(appName = label, packageName = pkg, icon = icon))
        }

        apps.sortBy { it.appName.lowercase() }
        allInstalledApps = apps
        tvInstalledCount.text = apps.size.toString()
        applySearchFilter(etSearch.text?.toString() ?: "")
    }

    private fun refreshClones() {
        allClones = CloneStorageManager.loadClones(this)
        tvCloneCount.text = allClones.size.toString()
        tvNoClones.visibility = if (allClones.isEmpty()) View.VISIBLE else View.GONE
        applySearchFilter(etSearch.text?.toString() ?: "")
    }

    private fun applySearchFilter(query: String) {
        val q = query.trim().lowercase()
        val filteredClones = if (q.isEmpty()) {
            allClones
        } else {
            allClones.filter {
                it.cloneName.lowercase().contains(q) || it.originalPackageName.lowercase().contains(q)
            }
        }
        clonedAdapter.updateList(filteredClones)

        val filteredInstalled = if (q.isEmpty()) {
            allInstalledApps
        } else {
            allInstalledApps.filter {
                it.appName.lowercase().contains(q) || it.packageName.lowercase().contains(q)
            }
        }
        installedAdapter.updateList(filteredInstalled)
    }

    private fun showCreateCloneDialog(app: InstalledAppInfo) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !packageManager.canRequestPackageInstalls()) {
            AlertDialog.Builder(this)
                .setTitle("Allow App Installation")
                .setMessage("To install cloned apps with a new separate icon, enable 'Install unknown apps' for Narendra Apps Cloner.")
                .setPositiveButton("Open Settings") { _, _ ->
                    val settingsIntent = Intent(
                        Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:$packageName")
                    )
                    startActivity(settingsIntent)
                }
                .setNegativeButton("Cancel", null)
                .show()
            return
        }

        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_create_clone, null)
        val tvTargetPackage = dialogView.findViewById<TextView>(R.id.tvTargetPackage)
        val etCloneName = dialogView.findViewById<EditText>(R.id.etCloneName)
        val etCloneBadge = dialogView.findViewById<EditText>(R.id.etCloneBadge)

        val nextNum = allClones.count { it.originalPackageName == app.packageName } + 1
        tvTargetPackage.text = app.packageName
        etCloneName.setText("${app.appName} Clone ${nextNum + 1}")
        etCloneBadge.setText("${nextNum + 1}")

        AlertDialog.Builder(this)
            .setView(dialogView)
            .setPositiveButton("Clone & Install") { _, _ ->
                val cloneInfo = CloneStorageManager.nextCloneInfo(
                    context = this,
                    originalPackageName = app.packageName,
                    originalAppName = app.appName,
                    customName = etCloneName.text.toString(),
                    badgeLabel = etCloneBadge.text.toString()
                )
                buildAndInstallClone(cloneInfo)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun buildAndInstallClone(cloneInfo: ClonedAppInfo) {
        val progressBar = ProgressBar(this).apply { isIndeterminate = true }
        val progressDialog = AlertDialog.Builder(this)
            .setTitle("Cloning ${cloneInfo.originalAppName}...")
            .setMessage("Generating separate package (${cloneInfo.clonePackageName}) & creating new badged icon...")
            .setView(progressBar)
            .setCancelable(false)
            .create()
        progressDialog.show()

        executor.execute {
            try {
                val result = ApkClonerEngine.buildClonedApks(
                    context = this,
                    oldPackage = cloneInfo.originalPackageName,
                    newPackage = cloneInfo.clonePackageName,
                    customLabel = cloneInfo.cloneName,
                    cloneNumber = cloneInfo.cloneNumber,
                    badgeLabel = cloneInfo.badgeLabel
                )
                CloneStorageManager.saveNewClone(this, cloneInfo)
                pendingCloneForShortcut = cloneInfo

                runOnUiThread {
                    progressDialog.dismiss()
                    refreshClones()
                    ApkClonerEngine.installClonedApks(this, result.outputApkFiles, cloneInfo.cloneName)
                }
            } catch (e: Exception) {
                runOnUiThread {
                    progressDialog.dismiss()
                    AlertDialog.Builder(this)
                        .setTitle("Cloning Error")
                        .setMessage("Could not build cloned APK: ${e.localizedMessage ?: "Unsupported split/protected app"}")
                        .setPositiveButton("Use Work Profile") { _, _ -> launchWorkProfileSetup() }
                        .setNegativeButton("Close", null)
                        .show()
                }
            }
        }
    }

    private fun openClone(clone: ClonedAppInfo) {
        // Strictly launch ONLY the cloned package, NEVER the old originalPackageName!
        val cloneLaunchIntent = packageManager.getLaunchIntentForPackage(clone.clonePackageName)
        if (cloneLaunchIntent != null) {
            cloneLaunchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            startActivity(cloneLaunchIntent)
            return
        }

        // Cloned APK is not installed yet — prompt to install it or use Work Profile
        AlertDialog.Builder(this)
            .setTitle("${clone.cloneName} Not Installed")
            .setMessage(
                "To open this as a separate new app (without opening the old ${clone.originalAppName}), install the cloned APK first."
            )
            .setPositiveButton("Install Cloned APK") { _, _ ->
                buildAndInstallClone(clone)
            }
            .setNeutralButton("Work Profile") { _, _ ->
                launchWorkProfileSetup()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun pinCloneIcon(clone: ClonedAppInfo) {
        val isInstalled = packageManager.getLaunchIntentForPackage(clone.clonePackageName) != null
        if (!isInstalled) {
            Toast.makeText(this, "Please install the cloned APK first, then pin its icon.", Toast.LENGTH_SHORT).show()
            buildAndInstallClone(clone)
            return
        }

        try {
            val icon = packageManager.getApplicationIcon(clone.clonePackageName)
            val pinned = IconCustomizer.pinHomeScreenIcon(this, clone, icon)
            if (pinned) {
                Toast.makeText(this, "New icon added for ${clone.cloneName}!", Toast.LENGTH_SHORT).show()
            } else {
                Toast.makeText(this, "Your launcher already displays the new app icon in App Drawer.", Toast.LENGTH_SHORT).show()
            }
        } catch (_: Exception) {
            Toast.makeText(this, "Unable to pin shortcut on this launcher.", Toast.LENGTH_SHORT).show()
        }
    }

    private fun showRenameDialog(clone: ClonedAppInfo) {
        val input = EditText(this).apply {
            setText(clone.cloneName)
            setPadding(40, 30, 40, 30)
        }
        AlertDialog.Builder(this)
            .setTitle("Rename Clone")
            .setView(input)
            .setPositiveButton("Save") { _, _ ->
                val newName = input.text.toString().trim()
                if (newName.isNotEmpty()) {
                    CloneStorageManager.renameClone(this, clone.id, newName)
                    refreshClones()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun confirmDeleteClone(clone: ClonedAppInfo) {
        AlertDialog.Builder(this)
            .setTitle("Delete Clone?")
            .setMessage("Remove \"${clone.cloneName}\" and uninstall its cloned package if installed?")
            .setPositiveButton("Delete") { _, _ ->
                val isInstalled = packageManager.getLaunchIntentForPackage(clone.clonePackageName) != null
                CloneStorageManager.deleteClone(this, clone)
                refreshClones()
                if (isInstalled) {
                    val uninstallIntent = Intent(
                        Intent.ACTION_DELETE,
                        Uri.parse("package:${clone.clonePackageName}")
                    )
                    startActivity(uninstallIntent)
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showInstallFailedDialog(reason: String) {
        AlertDialog.Builder(this)
            .setTitle("Install Note")
            .setMessage(
                "Android could not install this re-signed APK (${reason.ifBlank { "Package protected or split incompatible" }}).\n\n" +
                    "Protected apps (like WhatsApp or Banking apps) verify their original signature. Use Official Work Profile to create a second icon with full signature support."
            )
            .setPositiveButton("Setup Work Profile") { _, _ -> launchWorkProfileSetup() }
            .setNegativeButton("OK", null)
            .show()
    }

    private fun launchWorkProfileSetup() {
        try {
            val intent = Intent(DevicePolicyManager.ACTION_PROVISION_MANAGED_PROFILE).apply {
                putExtra(
                    DevicePolicyManager.EXTRA_PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME,
                    ComponentName(this@MainActivity, ClonerDeviceAdminReceiver::class.java)
                )
            }
            startActivity(intent)
        } catch (_: Exception) {
            Toast.makeText(this, "Work Profile provisioning is not supported on this device.", Toast.LENGTH_LONG).show()
        }
    }
}
