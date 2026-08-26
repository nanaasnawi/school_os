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
)

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
    ) {
        context.dataStore.edit { prefs ->
            prefs[KEY_ACCESS_TOKEN] = accessToken
            prefs[KEY_REFRESH_TOKEN] = refreshToken
            prefs[KEY_USER_ID] = userId
            prefs[KEY_TENANT_ID] = tenantId
            prefs[KEY_NAME] = name
            prefs[KEY_EMAIL] = email
            prefs[KEY_ROLE] = role
            prefs[KEY_IS_LOGGED_IN] = true
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

    suspend fun clearSession() {
        context.dataStore.edit { 
            it.remove(KEY_ACCESS_TOKEN)
            it.remove(KEY_REFRESH_TOKEN)
            it.remove(KEY_USER_ID)
            it.remove(KEY_TENANT_ID)
            it.remove(KEY_NAME)
            it.remove(KEY_EMAIL)
            it.remove(KEY_ROLE)
            it.remove(KEY_IS_LOGGED_IN)
            // intentionally NOT clearing school profile so the login screen still shows it
        }
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

    suspend fun getCustomServerUrl(): String? {
        return context.dataStore.data.first()[KEY_CUSTOM_SERVER_URL]
    }

    suspend fun saveCustomServerUrl(url: String) {
        context.dataStore.edit { prefs ->
            if (url.isBlank()) {
                prefs.remove(KEY_CUSTOM_SERVER_URL)
            } else {
                var clean = url.trim()
                if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
                    clean = "http://$clean"
                }
                if (!clean.endsWith("/")) {
                    clean = "$clean/"
                }
                if (!clean.endsWith("api/v1/")) {
                    clean = "${clean}api/v1/"
                }
                prefs[KEY_CUSTOM_SERVER_URL] = clean
            }
        }
    }
}
