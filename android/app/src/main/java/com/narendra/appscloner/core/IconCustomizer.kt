package com.narendra.appscloner.core

import android.content.Context
import android.content.Intent
import android.content.pm.ShortcutInfo
import android.content.pm.ShortcutManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.graphics.drawable.Drawable
import android.graphics.drawable.Icon
import com.narendra.appscloner.model.ClonedAppInfo
import com.narendra.appscloner.ui.CloneShortcutActivity
import java.io.ByteArrayOutputStream

/**
 * Generates a brand-new badged & tinted launcher icon for cloned apps,
 * and pins a second Home Screen shortcut icon when requested.
 */
object IconCustomizer {

    fun createClonedIconBitmap(
        originalDrawable: Drawable,
        badgeLabel: String,
        accentColorHex: String = "#7C3AED",
        sizePx: Int = 192
    ): Bitmap {
        val bitmap = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)

        // Draw tinted original app icon with slight inset for cloned ring
        val inset = (sizePx * 0.08f).toInt()
        val copy = originalDrawable.constantState?.newDrawable()?.mutate() ?: originalDrawable.mutate()
        val colorMatrix = ColorMatrix().apply { setSaturation(1.2f) }
        copy.colorFilter = ColorMatrixColorFilter(colorMatrix)
        copy.setBounds(inset, inset, sizePx - inset, sizePx - inset)
        copy.draw(canvas)

        // Draw glowing ring around cloned icon
        val ringColor = try {
            Color.parseColor(accentColorHex)
        } catch (_: Exception) {
            Color.parseColor("#7C3AED")
        }
        val ringPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.STROKE
            strokeWidth = sizePx * 0.045f
            color = ringColor
        }
        val pad = sizePx * 0.04f
        canvas.drawRoundRect(
            RectF(pad, pad, sizePx - pad, sizePx - pad),
            sizePx * 0.24f,
            sizePx * 0.24f,
            ringPaint
        )

        // Draw distinct Clone Badge pill in bottom-right corner
        val cleanBadge = badgeLabel.ifBlank { "2" }.take(5)
        val pillWidth = (sizePx * (0.28f + cleanBadge.length * 0.06f)).coerceAtMost(sizePx * 0.56f)
        val pillHeight = sizePx * 0.26f
        val pillRect = RectF(
            sizePx - pillWidth - sizePx * 0.03f,
            sizePx - pillHeight - sizePx * 0.03f,
            sizePx - sizePx * 0.03f,
            sizePx - sizePx * 0.03f
        )

        val pillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.FILL
            color = ringColor
        }
        canvas.drawRoundRect(pillRect, pillHeight / 2f, pillHeight / 2f, pillPaint)

        val pillBorder = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.STROKE
            strokeWidth = sizePx * 0.02f
            color = Color.WHITE
        }
        canvas.drawRoundRect(pillRect, pillHeight / 2f, pillHeight / 2f, pillBorder)

        val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.WHITE
            textSize = sizePx * 0.14f
            typeface = Typeface.DEFAULT_BOLD
            textAlign = Paint.Align.CENTER
        }
        val fm = textPaint.fontMetrics
        val textY = pillRect.centerY() - (fm.ascent + fm.descent) / 2f
        canvas.drawText(cleanBadge, pillRect.centerX(), textY, textPaint)

        return bitmap
    }

    fun toPngBytes(bitmap: Bitmap): ByteArray {
        val out = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
        return out.toByteArray()
    }

    fun pinHomeScreenIcon(context: Context, clone: ClonedAppInfo, originalIcon: Drawable): Boolean {
        val shortcutManager = context.getSystemService(ShortcutManager::class.java) ?: return false
        if (!shortcutManager.isRequestPinShortcutSupported) return false

        val iconBitmap = createClonedIconBitmap(originalIcon, clone.badgeLabel)
        val launchIntent = Intent(context, CloneShortcutActivity::class.java).apply {
            action = Intent.ACTION_VIEW
            putExtra(CloneShortcutActivity.EXTRA_CLONE_PACKAGE, clone.clonePackageName)
            putExtra(CloneShortcutActivity.EXTRA_CLONE_NAME, clone.cloneName)
            putExtra(CloneShortcutActivity.EXTRA_ORIGINAL_PACKAGE, clone.originalPackageName)
        }

        val shortcutInfo = ShortcutInfo.Builder(context, clone.id)
            .setShortLabel(clone.cloneName)
            .setLongLabel(clone.cloneName)
            .setIcon(Icon.createWithBitmap(iconBitmap))
            .setIntent(launchIntent)
            .build()

        return shortcutManager.requestPinShortcut(shortcutInfo, null)
    }
}
