# School OS ProGuard Rules
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keepattributes Signature
-keepattributes Exceptions

# Kotlinx Serialization
-keepclassmembers class kotlinx.serialization.json.** { *; }
-keepclassmembers class com.schoolos.android.data.remote.dto.** { *; }
-keepclassmembers class * {
    @kotlinx.serialization.Serializable <fields>;
}
-keepclassmembers class * {
    @kotlinx.serialization.SerialName <fields>;
}
-keepclasseswithmembers class * {
    @kotlinx.serialization.Serializable class *;
}
-dontwarn kotlinx.serialization.**

# Retrofit & OkHttp
-dontwarn retrofit2.**
-keep class retrofit2.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# Room Database
-keep class * extends androidx.room.RoomDatabase
-dontwarn androidx.room.paging.**

# Coil Image Loading
-dontwarn coil.**
-keep class coil.** { *; }
