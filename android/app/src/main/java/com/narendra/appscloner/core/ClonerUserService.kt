package com.narendra.appscloner.core

import android.os.ParcelFileDescriptor
import com.narendra.appscloner.IClonerUserService
import java.io.BufferedReader
import java.io.InputStreamReader
import kotlin.system.exitProcess

/**
 * Privileged Shizuku UserService (runs under shell UID 2000, no root required).
 * Installs cloned APKs with `-i com.android.vending` (Google Play Store) as installer
 * so cloned apps do not show "App Not Installed from Play Store".
 */
class ClonerUserService : IClonerUserService.Stub() {

    override fun destroy() {
        exitProcess(0)
    }

    override fun createPlayStoreSession(): String {
        return try {
            val process = ProcessBuilder(
                "pm",
                "install-create",
                "-i",
                "com.android.vending",
                "-r",
                "-t"
            ).redirectErrorStream(true).start()

            val output = readAll(process)
            val exitCode = process.waitFor()
            if (exitCode != 0) {
                return "ERROR:$output"
            }

            val match = Regex("\\[(\\d+)]").find(output)
            if (match != null) {
                "SESSION:${match.groupValues[1]}"
            } else {
                "ERROR:Could not parse session id from: $output"
            }
        } catch (e: Exception) {
            "ERROR:${e.localizedMessage ?: "createPlayStoreSession failed"}"
        }
    }

    override fun writeApkToSession(
        sessionId: String,
        splitName: String,
        sizeBytes: Long,
        fd: ParcelFileDescriptor
    ): String {
        return try {
            val process = ProcessBuilder(
                "pm",
                "install-write",
                "-S",
                sizeBytes.toString(),
                sessionId,
                splitName,
                "-"
            ).redirectErrorStream(true).start()

            ParcelFileDescriptor.AutoCloseInputStream(fd).use { input ->
                process.outputStream.use { out ->
                    input.copyTo(out, bufferSize = 64 * 1024)
                    out.flush()
                }
            }

            val output = readAll(process)
            val exitCode = process.waitFor()
            if (exitCode == 0) {
                "OK"
            } else {
                "ERROR:$output"
            }
        } catch (e: Exception) {
            "ERROR:${e.localizedMessage ?: "writeApkToSession failed"}"
        }
    }

    override fun commitSession(sessionId: String): String {
        return try {
            val process = ProcessBuilder(
                "pm",
                "install-commit",
                sessionId
            ).redirectErrorStream(true).start()

            val output = readAll(process)
            val exitCode = process.waitFor()
            if (exitCode == 0 && output.contains("Success", ignoreCase = true)) {
                "OK"
            } else {
                "ERROR:$output"
            }
        } catch (e: Exception) {
            "ERROR:${e.localizedMessage ?: "commitSession failed"}"
        }
    }

    override fun abandonSession(sessionId: String): String {
        return try {
            val process = ProcessBuilder("pm", "install-abandon", sessionId)
                .redirectErrorStream(true)
                .start()
            val output = readAll(process)
            process.waitFor()
            output
        } catch (e: Exception) {
            e.localizedMessage ?: "abandon error"
        }
    }

    private fun readAll(process: Process): String {
        return BufferedReader(InputStreamReader(process.inputStream)).use { reader ->
            reader.readText().trim()
        }
    }
}
