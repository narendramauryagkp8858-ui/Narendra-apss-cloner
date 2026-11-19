package com.narendra.appscloner.core

import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.charset.StandardCharsets

/**
 * Rewrites Android Binary XML (AndroidManifest.xml) safely:
 * - Updates manifest package name to newPackage
 * - Expands relative .ClassName values on application/activity/service/receiver/provider
 * - Updates application android:label to customName
 * - Updates provider authorities & custom permissions to prevent install conflicts
 *
 * Preserves existing StringPool indices (appends new strings only) so ResourceMap stays valid.
 */
object BinaryManifestEditor {

    private const val RES_XML_TYPE = 0x0003
    private const val RES_STRING_POOL_TYPE = 0x0001
    private const val RES_XML_START_ELEMENT_TYPE = 0x0102
    private const val UTF8_FLAG = 0x0100
    private const val TYPE_STRING = 0x03

    fun rewriteManifest(
        axmlBytes: ByteArray,
        oldPackage: String,
        newPackage: String,
        customLabel: String,
        cloneNumber: Int
    ): ByteArray {
        val buf = ByteBuffer.wrap(axmlBytes).order(ByteOrder.LITTLE_ENDIAN)

        val fileType = buf.getShort(0).toInt() and 0xFFFF
        val fileHeaderSize = buf.getShort(2).toInt() and 0xFFFF
        if (fileType != RES_XML_TYPE) {
            return axmlBytes
        }

        // Parse StringPool chunk right after file header
        val spOffset = fileHeaderSize
        val spType = buf.getShort(spOffset).toInt() and 0xFFFF
        if (spType != RES_STRING_POOL_TYPE) {
            return axmlBytes
        }

        val spHeaderSize = buf.getShort(spOffset + 2).toInt() and 0xFFFF
        val spChunkSize = buf.getInt(spOffset + 4)
        val stringCount = buf.getInt(spOffset + 8)
        val styleCount = buf.getInt(spOffset + 12)
        val flags = buf.getInt(spOffset + 16)
        val stringsStart = buf.getInt(spOffset + 20)
        val stylesStart = buf.getInt(spOffset + 24)
        val isUtf8 = (flags and UTF8_FLAG) != 0

        val strings = MutableList(stringCount) { idx ->
            val strOff = spOffset + stringsStart + buf.getInt(spOffset + spHeaderSize + idx * 4)
            readString(axmlBytes, strOff, isUtf8)
        }

        val appendedMap = HashMap<String, Int>()
        fun internNewString(value: String): Int {
            appendedMap[value]?.let { return it }
            val idx = strings.size
            strings.add(value)
            appendedMap[value] = idx
            return idx
        }

        // Copy XML body (all chunks after StringPool) so we can update attribute indices
        val xmlBodyStart = spOffset + spChunkSize
        val xmlBody = axmlBytes.copyOfRange(xmlBodyStart, axmlBytes.size)
        val bodyBuf = ByteBuffer.wrap(xmlBody).order(ByteOrder.LITTLE_ENDIAN)

        var pos = 0
        while (pos + 8 <= xmlBody.size) {
            val chunkType = bodyBuf.getShort(pos).toInt() and 0xFFFF
            val chunkHeaderSize = bodyBuf.getShort(pos + 2).toInt() and 0xFFFF
            val chunkSize = bodyBuf.getInt(pos + 4)
            if (chunkSize <= 0 || pos + chunkSize > xmlBody.size) break

            if (chunkType == RES_XML_START_ELEMENT_TYPE && chunkHeaderSize >= 16 && pos + chunkHeaderSize + 20 <= xmlBody.size) {
                val extOffset = pos + chunkHeaderSize
                val tagNameIdx = bodyBuf.getInt(extOffset + 4)
                val attrStart = bodyBuf.getShort(extOffset + 8).toInt() and 0xFFFF
                val attrSize = bodyBuf.getShort(extOffset + 10).toInt() and 0xFFFF
                val attrCount = bodyBuf.getShort(extOffset + 12).toInt() and 0xFFFF

                val tagName = if (tagNameIdx in strings.indices) strings[tagNameIdx] else ""
                val attrsBase = extOffset + attrStart

                for (i in 0 until attrCount) {
                    val attrOff = attrsBase + i * attrSize
                    if (attrOff + 20 > xmlBody.size) break

                    val attrNameIdx = bodyBuf.getInt(attrOff + 4)
                    val attrName = if (attrNameIdx in strings.indices) strings[attrNameIdx] else ""
                    val rawValIdx = bodyBuf.getInt(attrOff + 8)
                    val dataType = bodyBuf.get(attrOff + 15).toInt() and 0xFF
                    val dataVal = bodyBuf.getInt(attrOff + 16)

                    val strVal = when {
                        dataType == TYPE_STRING && dataVal in strings.indices -> strings[dataVal]
                        rawValIdx in strings.indices -> strings[rawValIdx]
                        else -> null
                    }

                    when (tagName) {
                        "manifest" -> {
                            if (attrName == "package") {
                                val newIdx = internNewString(newPackage)
                                bodyBuf.putInt(attrOff + 8, newIdx)
                                bodyBuf.put(attrOff + 15, TYPE_STRING.toByte())
                                bodyBuf.putInt(attrOff + 16, newIdx)
                            }
                        }

                        "application" -> {
                            if (attrName == "label") {
                                val newIdx = internNewString(customLabel)
                                bodyBuf.putInt(attrOff + 8, newIdx)
                                bodyBuf.put(attrOff + 15, TYPE_STRING.toByte())
                                bodyBuf.putInt(attrOff + 16, newIdx)
                            } else if (attrName == "name" && strVal != null) {
                                val fqcn = expandClassName(strVal, oldPackage)
                                if (fqcn != strVal) {
                                    val newIdx = internNewString(fqcn)
                                    bodyBuf.putInt(attrOff + 8, newIdx)
                                    bodyBuf.put(attrOff + 15, TYPE_STRING.toByte())
                                    bodyBuf.putInt(attrOff + 16, newIdx)
                                }
                            }
                        }

                        "activity", "activity-alias", "service", "receiver" -> {
                            if ((attrName == "name" || attrName == "targetActivity") && strVal != null) {
                                val fqcn = expandClassName(strVal, oldPackage)
                                if (fqcn != strVal) {
                                    val newIdx = internNewString(fqcn)
                                    bodyBuf.putInt(attrOff + 8, newIdx)
                                    bodyBuf.put(attrOff + 15, TYPE_STRING.toByte())
                                    bodyBuf.putInt(attrOff + 16, newIdx)
                                }
                            }
                        }

                        "provider" -> {
                            if (attrName == "name" && strVal != null) {
                                val fqcn = expandClassName(strVal, oldPackage)
                                if (fqcn != strVal) {
                                    val newIdx = internNewString(fqcn)
                                    bodyBuf.putInt(attrOff + 8, newIdx)
                                    bodyBuf.put(attrOff + 15, TYPE_STRING.toByte())
                                    bodyBuf.putInt(attrOff + 16, newIdx)
                                }
                            } else if (attrName == "authorities" && strVal != null) {
                                val newAuth = rewriteAuthorities(strVal, oldPackage, newPackage, cloneNumber)
                                val newIdx = internNewString(newAuth)
                                bodyBuf.putInt(attrOff + 8, newIdx)
                                bodyBuf.put(attrOff + 15, TYPE_STRING.toByte())
                                bodyBuf.putInt(attrOff + 16, newIdx)
                            }
                        }

                        "permission" -> {
                            if (attrName == "name" && strVal != null) {
                                val newPerm = if (strVal.contains(oldPackage)) {
                                    strVal.replace(oldPackage, newPackage)
                                } else {
                                    "$strVal.clone$cloneNumber"
                                }
                                val newIdx = internNewString(newPerm)
                                bodyBuf.putInt(attrOff + 8, newIdx)
                                bodyBuf.put(attrOff + 15, TYPE_STRING.toByte())
                                bodyBuf.putInt(attrOff + 16, newIdx)
                            }
                        }

                        "uses-permission" -> {
                            if (attrName == "name" && strVal != null && strVal.startsWith("$oldPackage.")) {
                                val newPerm = strVal.replaceFirst(oldPackage, newPackage)
                                val newIdx = internNewString(newPerm)
                                bodyBuf.putInt(attrOff + 8, newIdx)
                                bodyBuf.put(attrOff + 15, TYPE_STRING.toByte())
                                bodyBuf.putInt(attrOff + 16, newIdx)
                            }
                        }
                    }
                }
            }
            pos += chunkSize
        }

        // Rebuild StringPool chunk
        val newStringsData = ByteArrayOutputStream()
        val newOffsets = IntArray(strings.size)
        for (i in strings.indices) {
            newOffsets[i] = newStringsData.size()
            writeString(newStringsData, strings[i], isUtf8)
        }
        // Pad string data block to 4-byte boundary
        while (newStringsData.size() % 4 != 0) {
            newStringsData.write(0)
        }

        val newStringsBytes = newStringsData.toByteArray()
        val styleOffsetsBytes = if (styleCount > 0) {
            axmlBytes.copyOfRange(spOffset + spHeaderSize + stringCount * 4, spOffset + stringsStart)
        } else {
            ByteArray(0)
        }
        val stylesRawBytes = if (styleCount > 0 && stylesStart > 0) {
            axmlBytes.copyOfRange(spOffset + stylesStart, spOffset + spChunkSize)
        } else {
            ByteArray(0)
        }

        val newStringsStart = spHeaderSize + strings.size * 4 + styleOffsetsBytes.size
        val newStylesStart = if (styleCount > 0 && stylesStart > 0) newStringsStart + newStringsBytes.size else 0
        val newSpChunkSize = newStringsStart + newStringsBytes.size + stylesRawBytes.size
        val newFileSize = fileHeaderSize + newSpChunkSize + xmlBody.size

        val out = ByteBuffer.allocate(newFileSize).order(ByteOrder.LITTLE_ENDIAN)
        // File header (copy and update fileSize)
        out.put(axmlBytes, 0, fileHeaderSize)
        out.putInt(4, newFileSize)

        // StringPool header
        out.putShort(RES_STRING_POOL_TYPE.toShort())
        out.putShort(spHeaderSize.toShort())
        out.putInt(newSpChunkSize)
        out.putInt(strings.size)
        out.putInt(styleCount)
        out.putInt(flags)
        out.putInt(newStringsStart)
        out.putInt(newStylesStart)

        if (spHeaderSize > 28) {
            out.put(axmlBytes, spOffset + 28, spHeaderSize - 28)
        }
        for (off in newOffsets) {
            out.putInt(off)
        }
        if (styleOffsetsBytes.isNotEmpty()) {
            out.put(styleOffsetsBytes)
        }
        out.put(newStringsBytes)
        if (stylesRawBytes.isNotEmpty()) {
            out.put(stylesRawBytes)
        }
        out.put(xmlBody)

        return out.array()
    }

    private fun expandClassName(name: String, oldPackage: String): String {
        if (name.startsWith(".")) return "$oldPackage$name"
        if (!name.contains(".")) return "$oldPackage.$name"
        return name
    }

    private fun rewriteAuthorities(
        authorities: String,
        oldPackage: String,
        newPackage: String,
        cloneNumber: Int
    ): String {
        return authorities.split(";").joinToString(";") { part ->
            if (part.contains(oldPackage)) {
                part.replace(oldPackage, newPackage)
            } else {
                "$part.c$cloneNumber"
            }
        }
    }

    private fun readString(data: ByteArray, offset: Int, isUtf8: Boolean): String {
        var idx = offset
        return if (isUtf8) {
            val u16First = data[idx++].toInt() and 0xFF
            if ((u16First and 0x80) != 0) idx++
            var u8Len = data[idx++].toInt() and 0xFF
            if ((u8Len and 0x80) != 0) {
                u8Len = ((u8Len and 0x7F) shl 8) or (data[idx++].toInt() and 0xFF)
            }
            String(data, idx, u8Len, StandardCharsets.UTF_8)
        } else {
            var u16Len = (data[idx].toInt() and 0xFF) or ((data[idx + 1].toInt() and 0xFF) shl 8)
            idx += 2
            if ((u16Len and 0x8000) != 0) {
                val low = (data[idx].toInt() and 0xFF) or ((data[idx + 1].toInt() and 0xFF) shl 8)
                idx += 2
                u16Len = ((u16Len and 0x7FFF) shl 16) or low
            }
            String(data, idx, u16Len * 2, StandardCharsets.UTF_16LE)
        }
    }

    private fun writeString(out: ByteArrayOutputStream, value: String, isUtf8: Boolean) {
        if (isUtf8) {
            val u16Len = value.length
            val utf8Bytes = value.toByteArray(StandardCharsets.UTF_8)
            val u8Len = utf8Bytes.size

            if (u16Len >= 0x80) {
                out.write(((u16Len shr 8) and 0x7F) or 0x80)
                out.write(u16Len and 0xFF)
            } else {
                out.write(u16Len)
            }

            if (u8Len >= 0x80) {
                out.write(((u8Len shr 8) and 0x7F) or 0x80)
                out.write(u8Len and 0xFF)
            } else {
                out.write(u8Len)
            }

            out.write(utf8Bytes)
            out.write(0)
        } else {
            val u16Len = value.length
            val utf16Bytes = value.toByteArray(StandardCharsets.UTF_16LE)
            if (u16Len >= 0x8000) {
                val high = ((u16Len shr 16) and 0x7FFF) or 0x8000
                val low = u16Len and 0xFFFF
                out.write(high and 0xFF)
                out.write((high shr 8) and 0xFF)
                out.write(low and 0xFF)
                out.write((low shr 8) and 0xFF)
            } else {
                out.write(u16Len and 0xFF)
                out.write((u16Len shr 8) and 0xFF)
            }
            out.write(utf16Bytes)
            out.write(0)
            out.write(0)
        }
    }
}
