package com.narendra.appscloner.ui

import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.narendra.appscloner.R
import com.narendra.appscloner.core.CloneStorageManager
import com.narendra.appscloner.model.ClonedAppInfo
import com.narendra.appscloner.model.InstalledAppInfo

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

    private fun setupRecyclerViews() {
        rvClonedApps.layoutManager = LinearLayoutManager(this)
        clonedAdapter = ClonedAppsAdapter(
            items = emptyList(),
            packageManager = packageManager,
            onOpenClick = { clone -> openClone(clone) },
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
            if (pkg == packageName || !uniquePackages.add(pkg)) continue
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
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_create_clone, null)
        val tvTargetPackage = dialogView.findViewById<TextView>(R.id.tvTargetPackage)
        val etCloneName = dialogView.findViewById<EditText>(R.id.etCloneName)
        val etCloneBadge = dialogView.findViewById<EditText>(R.id.etCloneBadge)

        val nextNum = allClones.count { it.originalPackageName == app.packageName } + 1
        tvTargetPackage.text = app.packageName
        etCloneName.setText("${app.appName} (Clone $nextNum)")
        etCloneBadge.setText(if (nextNum == 1) "2" else "$nextNum")

        AlertDialog.Builder(this)
            .setView(dialogView)
            .setPositiveButton("Create Clone") { _, _ ->
                val created = CloneStorageManager.createClone(
                    context = this,
                    originalPackageName = app.packageName,
                    originalAppName = app.appName,
                    customName = etCloneName.text.toString(),
                    badgeLabel = etCloneBadge.text.toString()
                )
                refreshClones()
                Toast.makeText(this, "Cloned: ${created.cloneName}", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Cancel", null)
            .show()
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
            .setMessage("Remove \"${clone.cloneName}\" and clear its isolated space?")
            .setPositiveButton("Delete") { _, _ ->
                CloneStorageManager.deleteClone(this, clone)
                refreshClones()
                Toast.makeText(this, "Deleted ${clone.cloneName}", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun openClone(clone: ClonedAppInfo) {
        AlertDialog.Builder(this)
            .setTitle("${clone.cloneName} · Ready")
            .setMessage(
                "Isolated Container: ${clone.clonePackageName}\n" +
                "Storage Path: ${clone.storagePath}\n\n" +
                "Launch ${clone.originalAppName} now?"
            )
            .setPositiveButton("Launch App") { _, _ ->
                val launchIntent = packageManager.getLaunchIntentForPackage(clone.originalPackageName)
                if (launchIntent != null) {
                    startActivity(launchIntent)
                } else {
                    Toast.makeText(this, "Target app cannot be launched directly.", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("Close", null)
            .show()
    }
}
