package com.schoolos.android.core.auth

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.runBlocking
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "auth_prefs")

fun isParentRole(role: String?): Boolean {
    if (role.isNullOrBlank()) return false
    val l = role.lowercase()
    return l.contains("parent") || l.contains("guardian") || l.contains("ortu") || l.contains("wali")
}

fun isTeacherRole(role: String?): Boolean {
    if (role.isNullOrBlank()) return false
    val l = role.lowercase()
    return !isParentRole(role) && (l.contains("teacher") || l.contains("guru"))
}

data class AuthState(
    val accessToken: String? = null,
    val refreshToken: String? = null,
    val userId: String? = null,
    val tenantId: String? = null,
    val name: String? = null,
    val email: String? = null,
    val role: String? = null,
    val isLoggedIn: Boolean = false,
    val schoolName: String? = null,
    val schoolLogoUrl: String? = null,
    val identifier: String? = null,
    val className: String? = null,
    val classId: String? = null,
    val childName: String? = null,
    val childId: String? = null,
) {
    val isParent: Boolean get() = isParentRole(role)
    val isTeacher: Boolean get() = isTeacherRole(role)
    val isStudent: Boolean get() = !isParent && !isTeacher
}

@Singleton
class AuthManager @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    companion object {
        private val KEY_ACCESS_TOKEN = stringPreferencesKey("access_token")
        private val KEY_REFRESH_TOKEN = stringPreferencesKey("refresh_token")
        private val KEY_USER_ID = stringPreferencesKey("user_id")
        private val KEY_TENANT_ID = stringPreferencesKey("tenant_id")
        private val KEY_NAME = stringPreferencesKey("user_name")
        private val KEY_EMAIL = stringPreferencesKey("user_email")
        private val KEY_ROLE = stringPreferencesKey("user_role")
        private val KEY_IDENTIFIER = stringPreferencesKey("user_identifier")
        private val KEY_CLASS_NAME = stringPreferencesKey("user_class_name")
        private val KEY_CLASS_ID = stringPreferencesKey("user_class_id")
        private val KEY_CHILD_NAME = stringPreferencesKey("user_child_name")
        private val KEY_CHILD_ID = stringPreferencesKey("user_child_id")
        private val KEY_IS_LOGGED_IN = booleanPreferencesKey("is_logged_in")
        private val KEY_SCHOOL_NAME = stringPreferencesKey("school_name")
        private val KEY_SCHOOL_LOGO_URL = stringPreferencesKey("school_logo_url")
        private val KEY_CUSTOM_SERVER_URL = stringPreferencesKey("custom_server_url")
    }

    val authState: Flow<AuthState> = context.dataStore.data.map { prefs ->
        AuthState(
            accessToken = prefs[KEY_ACCESS_TOKEN],
            refreshToken = prefs[KEY_REFRESH_TOKEN],
            userId = prefs[KEY_USER_ID],
            tenantId = prefs[KEY_TENANT_ID],
            name = prefs[KEY_NAME],
            email = prefs[KEY_EMAIL],
            role = prefs[KEY_ROLE],
            identifier = prefs[KEY_IDENTIFIER],
            className = prefs[KEY_CLASS_NAME],
            classId = prefs[KEY_CLASS_ID],
            childName = prefs[KEY_CHILD_NAME],
            childId = prefs[KEY_CHILD_ID],
            isLoggedIn = prefs[KEY_IS_LOGGED_IN] ?: false,
            schoolName = prefs[KEY_SCHOOL_NAME],
            schoolLogoUrl = prefs[KEY_SCHOOL_LOGO_URL],
        )
    }

    val isLoggedIn: Boolean
        get() = runBlocking {
            context.dataStore.data.first()[KEY_IS_LOGGED_IN] ?: false
        }

    suspend fun saveSession(
        accessToken: String,
        refreshToken: String,
        userId: String,
        tenantId: String,
        name: String = "",
        email: String = "",
        role: String = "",
        identifier: String? = null,
        className: String? = null,
        classId: String? = null,
        childName: String? = null,
        childId: String? = null,
    ) {
        context.dataStore.edit { prefs ->
            prefs[KEY_ACCESS_TOKEN] = accessToken
            prefs[KEY_REFRESH_TOKEN] = refreshToken
            prefs[KEY_USER_ID] = userId
            prefs[KEY_TENANT_ID] = tenantId
            prefs[KEY_NAME] = name
            prefs[KEY_EMAIL] = email
            prefs[KEY_ROLE] = role
            if (!identifier.isNullOrBlank()) prefs[KEY_IDENTIFIER] = identifier
            if (!className.isNullOrBlank()) prefs[KEY_CLASS_NAME] = className
            if (!classId.isNullOrBlank()) prefs[KEY_CLASS_ID] = classId
            if (!childName.isNullOrBlank()) prefs[KEY_CHILD_NAME] = childName
            if (!childId.isNullOrBlank()) prefs[KEY_CHILD_ID] = childId
            prefs[KEY_IS_LOGGED_IN] = true
        }
    }

    suspend fun updateUserProfile(
        name: String,
        email: String,
        role: String,
        identifier: String? = null,
        className: String? = null,
        classId: String? = null,
        childName: String? = null,
        childId: String? = null,
    ) {
        context.dataStore.edit { prefs ->
            if (name.isNotBlank()) prefs[KEY_NAME] = name
            if (email.isNotBlank()) prefs[KEY_EMAIL] = email
            if (role.isNotBlank()) prefs[KEY_ROLE] = role
            if (!identifier.isNullOrBlank()) prefs[KEY_IDENTIFIER] = identifier
            if (!className.isNullOrBlank()) prefs[KEY_CLASS_NAME] = className
            if (!classId.isNullOrBlank()) prefs[KEY_CLASS_ID] = classId
            if (!childName.isNullOrBlank()) prefs[KEY_CHILD_NAME] = childName
            if (!childId.isNullOrBlank()) prefs[KEY_CHILD_ID] = childId
        }
    }

    suspend fun saveSchoolProfile(name: String, logoUrl: String?) {
        context.dataStore.edit { prefs ->
            prefs[KEY_SCHOOL_NAME] = name
            if (logoUrl != null) {
                prefs[KEY_SCHOOL_LOGO_URL] = logoUrl
            } else {
                prefs.remove(KEY_SCHOOL_LOGO_URL)
            }
        }
    }

    suspend fun updateTokens(accessToken: String, refreshToken: String) {
        context.dataStore.edit { prefs ->
            prefs[KEY_ACCESS_TOKEN] = accessToken
            if (refreshToken.isNotBlank()) {
                prefs[KEY_REFRESH_TOKEN] = refreshToken
            }
            prefs[KEY_IS_LOGGED_IN] = true
        }
    }

    suspend fun clearSession() {
        context.dataStore.edit {
            it.remove(KEY_ACCESS_TOKEN)
            it.remove(KEY_REFRESH_TOKEN)
            it.remove(KEY_USER_ID)
            it.remove(KEY_TENANT_ID)
            it.remove(KEY_NAME)
            it.remove(KEY_EMAIL)
            it.remove(KEY_ROLE)
            it.remove(KEY_IDENTIFIER)
            it.remove(KEY_CLASS_NAME)
            it.remove(KEY_CLASS_ID)
            it.remove(KEY_CHILD_NAME)
            it.remove(KEY_CHILD_ID)
            it.remove(KEY_IS_LOGGED_IN)
            // intentionally NOT clearing school profile so the login screen still shows it
        }
    }

    suspend fun getChildName(): String? {
        return context.dataStore.data.first()[KEY_CHILD_NAME]
    }

    suspend fun getChildId(): String? {
        return context.dataStore.data.first()[KEY_CHILD_ID]
    }

    suspend fun getAccessToken(): String? {
        return context.dataStore.data.first()[KEY_ACCESS_TOKEN]
    }

    suspend fun getRefreshToken(): String? {
        return context.dataStore.data.first()[KEY_REFRESH_TOKEN]
    }

    suspend fun getStudentId(): String? {
        return context.dataStore.data.first()[KEY_USER_ID]
    }

    suspend fun getClassId(): String? {
        return context.dataStore.data.first()[KEY_CLASS_ID]
    }

    val customServerUrlFlow: Flow<String> = context.dataStore.data.map { prefs ->
        val saved = prefs[KEY_CUSTOM_SERVER_URL]
        val buildConfigUrl = com.schoolos.android.core.common.BuildConfig.API_BASE_URL
        val isBuildConfigHttps = buildConfigUrl.startsWith("https://")

        val isEmulator = android.os.Build.FINGERPRINT.startsWith("generic")
            || android.os.Build.MODEL.contains("google_sdk")
            || android.os.Build.MODEL.contains("Emulator")
            || android.os.Build.HARDWARE.contains("goldfish")
            || android.os.Build.HARDWARE.contains("ranchu")

        if (isBuildConfigHttps && saved != null) {
            val isLocalIp = saved.contains("192.168.") || saved.contains("10.0.") || saved.contains("127.0.0.1") || saved.contains("10.0.2.2")
            if (isLocalIp) {
                return@map buildConfigUrl
            }
        }

        if (!saved.isNullOrBlank() && saved.startsWith("http") && (isEmulator || (!saved.contains("10.0.2.2") && !saved.contains("127.0.0.1")))) {
            saved
        } else {
            buildConfigUrl
        }
    }

    suspend fun getCustomServerUrl(): String? {
        val saved = context.dataStore.data.first()[KEY_CUSTOM_SERVER_URL]
        val buildConfigUrl = com.schoolos.android.core.common.BuildConfig.API_BASE_URL
        val isBuildConfigHttps = buildConfigUrl.startsWith("https://")

        // If BuildConfig is configured with public HTTPS (e.g. Railway),
        // auto-clear and ignore stale private LAN IP addresses saved from local dev
        if (isBuildConfigHttps && saved != null) {
            val isLocalIp = saved.contains("192.168.") || saved.contains("10.0.") || saved.contains("127.0.0.1") || saved.contains("10.0.2.2")
            if (isLocalIp) {
                context.dataStore.edit { it.remove(KEY_CUSTOM_SERVER_URL) }
                return buildConfigUrl
            }
        }

        val isEmulator = android.os.Build.FINGERPRINT.startsWith("generic")
            || android.os.Build.MODEL.contains("google_sdk")
            || android.os.Build.MODEL.contains("Emulator")
            || android.os.Build.HARDWARE.contains("goldfish")
            || android.os.Build.HARDWARE.contains("ranchu")

        if (saved.isNullOrBlank() || !saved.startsWith("http") || (!isEmulator && (saved.contains("10.0.2.2") || saved.contains("127.0.0.1")))) {
            return buildConfigUrl
        }
        return saved
    }

    suspend fun saveCustomServerUrl(url: String) {
        context.dataStore.edit { prefs ->
            if (url.isBlank()) {
                prefs.remove(KEY_CUSTOM_SERVER_URL)
            } else {
                var clean = url.trim().replace(" ", "")
                if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
                    clean = "https://$clean"
                }
                clean = clean.trimEnd('/')
                if (!clean.endsWith("/api/v1")) {
                    clean = "$clean/api/v1"
                }
                clean = "$clean/"
                prefs[KEY_CUSTOM_SERVER_URL] = clean
            }
        }
    }
}
