package com.narendra.appscloner.core

import android.content.Context
import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Discovers local Android Wireless Debugging pairing service (_adb-tls-pairing._tcp)
 * via mDNS / NsdManager so the user doesn't have to hunt for random pairing ports.
 */
object LocalAdbDiscovery {

    private const val SERVICE_PAIRING = "_adb-tls-pairing._tcp."

    @Volatile
    var latestPairingHost: String? = null
        private set

    @Volatile
    var latestPairingPort: Int = -1
        private set

    private var nsdManager: NsdManager? = null
    private var discoveryListener: NsdManager.DiscoveryListener? = null
    private val isResolving = AtomicBoolean(false)
    private var onFoundCallback: ((String, Int) -> Unit)? = null

    fun startPairingDiscovery(context: Context, onDiscovered: ((String, Int) -> Unit)? = null) {
        onFoundCallback = onDiscovered
        if (discoveryListener != null) return

        val mgr = context.applicationContext.getSystemService(Context.NSD_SERVICE) as? NsdManager ?: return
        nsdManager = mgr

        val listener = object : NsdManager.DiscoveryListener {
            override fun onDiscoveryStarted(regType: String) {}

            override fun onServiceFound(serviceInfo: NsdServiceInfo) {
                if (serviceInfo.serviceType.contains("adb-tls-pairing")) {
                    resolvePairingService(mgr, serviceInfo)
                }
            }

            override fun onServiceLost(serviceInfo: NsdServiceInfo) {}

            override fun onDiscoveryStopped(serviceType: String) {}

            override fun onStartDiscoveryFailed(serviceType: String, errorCode: Int) {
                stopDiscovery()
            }

            override fun onStopDiscoveryFailed(serviceType: String, errorCode: Int) {}
        }

        discoveryListener = listener
        try {
            mgr.discoverServices(SERVICE_PAIRING, NsdManager.PROTOCOL_DNS_SD, listener)
        } catch (_: Exception) {
            discoveryListener = null
        }
    }

    @Suppress("DEPRECATION")
    private fun resolvePairingService(mgr: NsdManager, info: NsdServiceInfo) {
        if (!isResolving.compareAndSet(false, true)) return
        try {
            mgr.resolveService(info, object : NsdManager.ResolveListener {
                override fun onResolveFailed(serviceInfo: NsdServiceInfo, errorCode: Int) {
                    isResolving.set(false)
                }

                override fun onServiceResolved(resolved: NsdServiceInfo) {
                    isResolving.set(false)
                    val host = resolved.host?.hostAddress ?: "127.0.0.1"
                    val port = resolved.port
                    if (port > 0) {
                        latestPairingHost = host
                        latestPairingPort = port
                        onFoundCallback?.invoke(host, port)
                    }
                }
            })
        } catch (_: Exception) {
            isResolving.set(false)
        }
    }

    fun stopDiscovery() {
        val listener = discoveryListener ?: return
        discoveryListener = null
        onFoundCallback = null
        try {
            nsdManager?.stopServiceDiscovery(listener)
        } catch (_: Exception) {
        }
    }
}
