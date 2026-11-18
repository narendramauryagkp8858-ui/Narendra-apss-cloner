package com.narendra.appscloner.ui

import android.content.pm.PackageManager
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.narendra.appscloner.R
import com.narendra.appscloner.model.ClonedAppInfo
import com.narendra.appscloner.model.InstalledAppInfo

class ClonedAppsAdapter(
    private var items: List<ClonedAppInfo>,
    private val packageManager: PackageManager,
    private val onOpenClick: (ClonedAppInfo) -> Unit,
    private val onRenameClick: (ClonedAppInfo) -> Unit,
    private val onDeleteClick: (ClonedAppInfo) -> Unit
) : RecyclerView.Adapter<ClonedAppsAdapter.CloneViewHolder>() {

    class CloneViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val ivIcon: ImageView = view.findViewById(R.id.ivCloneIcon)
        val tvBadge: TextView = view.findViewById(R.id.tvCloneBadge)
        val tvName: TextView = view.findViewById(R.id.tvCloneName)
        val tvPackage: TextView = view.findViewById(R.id.tvClonePackage)
        val btnOpen: Button = view.findViewById(R.id.btnOpenClone)
        val btnRename: Button = view.findViewById(R.id.btnRenameClone)
        val btnDelete: Button = view.findViewById(R.id.btnDeleteClone)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CloneViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_cloned_app, parent, false)
        return CloneViewHolder(view)
    }

    override fun onBindViewHolder(holder: CloneViewHolder, position: Int) {
        val item = items[position]
        holder.tvName.text = item.cloneName
        holder.tvPackage.text = item.clonePackageName
        holder.tvBadge.text = item.badgeLabel

        try {
            val drawable = packageManager.getApplicationIcon(item.originalPackageName).mutate()
            val matrix = ColorMatrix().apply { setSaturation(1.25f) }
            drawable.colorFilter = ColorMatrixColorFilter(matrix)
            holder.ivIcon.setImageDrawable(drawable)
        } catch (_: Exception) {
            holder.ivIcon.setImageResource(R.drawable.ic_cloner_logo)
        }

        holder.btnOpen.setOnClickListener { onOpenClick(item) }
        holder.btnRename.setOnClickListener { onRenameClick(item) }
        holder.btnDelete.setOnClickListener { onDeleteClick(item) }
    }

    override fun getItemCount(): Int = items.size

    fun updateList(newList: List<ClonedAppInfo>) {
        items = newList
        notifyDataSetChanged()
    }
}

class InstalledAppsAdapter(
    private var items: List<InstalledAppInfo>,
    private val onCloneClick: (InstalledAppInfo) -> Unit
) : RecyclerView.Adapter<InstalledAppsAdapter.AppViewHolder>() {

    class AppViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val ivIcon: ImageView = view.findViewById(R.id.ivAppIcon)
        val tvName: TextView = view.findViewById(R.id.tvAppName)
        val tvPackage: TextView = view.findViewById(R.id.tvAppPackage)
        val btnClone: Button = view.findViewById(R.id.btnCloneApp)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): AppViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_installed_app, parent, false)
        return AppViewHolder(view)
    }

    override fun onBindViewHolder(holder: AppViewHolder, position: Int) {
        val item = items[position]
        holder.ivIcon.setImageDrawable(item.icon)
        holder.tvName.text = item.appName
        holder.tvPackage.text = item.packageName
        holder.btnClone.setOnClickListener { onCloneClick(item) }
    }

    override fun getItemCount(): Int = items.size

    fun updateList(newList: List<InstalledAppInfo>) {
        items = newList
        notifyDataSetChanged()
    }
}
