package com.narendra.appscloner;

import android.os.ParcelFileDescriptor;

interface IClonerUserService {
    void destroy();
    String createPlayStoreSession();
    String writeApkToSession(String sessionId, String splitName, long sizeBytes, in ParcelFileDescriptor fd);
    String commitSession(String sessionId);
    String abandonSession(String sessionId);
}
