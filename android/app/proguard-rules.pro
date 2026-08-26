# School OS ProGuard Rules
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable

# Kotlinx Serialization
-keepclassmembers class kotlinx.serialization.json.** { *; }
-keepclassmembers class com.schoolos.android.data.remote.dto.** { *; }

# Retrofit
-keepattributes Signature
-keepattributes Exceptions
-dontwarn retrofit2.**
-keep class retrofit2.** { *; }

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
