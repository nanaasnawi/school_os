plugins { alias(libs.plugins.android.library); alias(libs.plugins.kotlin.android); alias(libs.plugins.kotlin.compose); alias(libs.plugins.hilt); alias(libs.plugins.ksp) }
android { namespace = "com.schoolos.android.feature.profile"; compileSdk = 35; defaultConfig { minSdk = 26 }; compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }; kotlinOptions { jvmTarget = "17" } }
dependencies {
    implementation(project(":core")); implementation(project(":domain"))
    implementation(platform(libs.compose.bom)); implementation(libs.compose.material3); implementation(libs.compose.material.icons.extended); implementation(libs.compose.ui.tooling.preview)
    implementation(libs.activity.compose); implementation(libs.lifecycle.runtime.compose); implementation(libs.lifecycle.viewmodel.compose); implementation(libs.navigation.compose)
    implementation(libs.hilt.android); ksp(libs.hilt.compiler); implementation(libs.hilt.navigation.compose); implementation(libs.coil.compose); implementation(libs.timber)
}
