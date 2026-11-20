package com.narendra.appscloner.core

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.RemoteInput
import com.narendra.appscloner.R
import com.narendra.appscloner.ui.MainActivity
import java.util.concurrent.Executors

/**
 * Handles direct notification reply for the 6-digit Wireless Debugging pairing code,
 * allowing users to pair without closing Android's pairing code popup!
 */
class AdbPairingReceiver : BroadcastReceiver() {

    companion object {
        const val ACTION_SUBMIT_PAIRING_CODE = "com.narendra.appscloner.ACTION_SUBMIT_PAIRING_CODE"
        const val KEY_PAIRING_CODE = "key_adb_pairing_code"
        const val CHANNEL_ID = "narendra_adb_pairing"
        const val NOTIFICATION_ID = 9101

        private val bgExecutor = Executors.newSingleThreadExecutor()

        fun showPairingNotification(context: Context, statusText: String? = null) {
            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            ensureChannel(nm)

            val remoteInput = RemoteInput.Builder(KEY_PAIRING_CODE)
                .setLabel("Enter 6-digit pairing code")
                .build()

            val replyIntent = Intent(context, AdbPairingReceiver::class.java).apply {
                action = ACTION_SUBMIT_PAIRING_CODE
            }
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            val replyPendingIntent = PendingIntent.getBroadcast(context, 1, replyIntent, flags)

            val replyAction = NotificationCompat.Action.Builder(
                android.R.drawable.ic_menu_send,
                "Enter Pairing Code",
                replyPendingIntent
            ).addRemoteInput(remoteInput).build()

            val body = statusText
                ?: "Open Wireless Debugging -> Pair device with pairing code, then type the 6-digit code here!"

            val notification = NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_cloner_logo)
                .setContentTitle("Narendra Apps Cloner · Pairing Ready")
                .setContentText(body)
                .setStyle(NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setOngoing(true)
                .addAction(replyAction)
                .build()

            nm.notify(NOTIFICATION_ID, notification)
        }

        fun showResultNotification(context: Context, title: String, message: String, ongoing: Boolean = false) {
            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            ensureChannel(nm)

            val openIntent = Intent(context, MainActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            }
            val openFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            val openPending = PendingIntent.getActivity(context, 2, openIntent, openFlags)

            val builder = NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_cloner_logo)
                .setContentTitle(title)
                .setContentText(message)
                .setStyle(NotificationCompat.BigTextStyle().bigText(message))
                .setContentIntent(openPending)
                .setAutoCancel(!ongoing)
                .setOngoing(ongoing)
                .setPriority(NotificationCompat.PRIORITY_HIGH)

            nm.notify(NOTIFICATION_ID, builder.build())
        }

        private fun ensureChannel(nm: NotificationManager) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    "In-Built Wireless ADB Pairing",
                    NotificationManager.IMPORTANCE_HIGH
                )
                nm.createNotificationChannel(channel)
            }
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != ACTION_SUBMIT_PAIRING_CODE) return

        val results = RemoteInput.getResultsFromIntent(intent) ?: return
        val code = results.getCharSequence(KEY_PAIRING_CODE)?.toString()?.trim().orEmpty()
        if (code.length != 6) {
            showPairingNotification(context, "Invalid code ($code). Please enter the 6-digit pairing code.")
            return
        }

        val pendingResult = goAsync()
        bgExecutor.execute {
            try {
                val host = LocalAdbDiscovery.latestPairingHost ?: "127.0.0.1"
                val port = LocalAdbDiscovery.latestPairingPort
                if (port <= 0) {
                    showPairingNotification(
                        context,
                        "Pairing service not detected yet. Keep 'Pair device with pairing code' open & retry."
                    )
                    return@execute
                }

                val pairRes = BuiltInAdbEngine.pairAndConnect(context, host, port, code)
                if (pairRes.isSuccess) {
                    LocalAdbDiscovery.stopDiscovery()
                    showResultNotification(
                        context,
                        "In-Built Shizuku Mode Connected!",
                        "Play Store Source (com.android.vending) is now active. Tap to return to Narendra Apps Cloner.",
                        ongoing = false
                    )
                } else {
                    val err = pairRes.exceptionOrNull()?.localizedMessage ?: "Pairing failed"
                    showPairingNotification(context, "Pairing failed ($err). Open a new code & try again.")
                }
            } finally {
                pendingResult.finish()
            }
        }
    }
}
