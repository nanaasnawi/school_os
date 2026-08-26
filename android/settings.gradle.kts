pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "SchoolOS"

include(":app")
include(":core")
include(":domain")
include(":data")

// Feature modules
include(":feature:auth")
include(":feature:home")
include(":feature:learning")
include(":feature:assignments")
include(":feature:quizzes")
include(":feature:sessions")
include(":feature:grades")
include(":feature:progress")
include(":feature:achievements")
include(":feature:notifications")
include(":feature:profile")
