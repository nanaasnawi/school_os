# Walkthrough - Fixing @Composable Invocation Errors

I have fixed the compilation errors in `StudentAgendaContent.kt` and `TeacherAgendaContent.kt` related to `@Composable` invocations in non-composable contexts.

## Changes Made

### Sessions Feature Module

#### [StudentAgendaContent.kt](file:///C:/Users/USER/Documents/School%20Os/android/feature/sessions/src/main/java/com/schoolos/android/feature/sessions/StudentAgendaContent.kt)
- Removed the incorrect `@Composable` annotation from `studentAgendaContent`. `LazyListScope` extensions should be regular functions when used as DSL builders.
- Refactored `renderAgendaSection` to accept a `@Composable () -> Color` lambda instead of a direct `Color` value. This ensures that reactive colors like `TextTertiary` are evaluated within the `@Composable` context of the list items (`item { ... }` and `items { ... }`).
- Updated the call sites to wrap colors in lambdas.

#### [TeacherAgendaContent.kt](file:///C:/Users/USER/Documents/School%20Os/android/feature/sessions/src/main/java/com/schoolos/android/feature/sessions/TeacherAgendaContent.kt)
- Applied the same architectural fix to `teacherAgendaContent` and `renderTeacherSection` to prevent similar issues.

## Verification Results

### Automated Tests
- Ran `./gradlew :feature:sessions:compileDebugKotlin` and confirmed the build succeeds.

> [!TIP]
> Always keep `LazyListScope` extension functions (DSL builders) as regular functions. If you need to access `@Composable` values (like theme colors or composition locals), evaluate them inside the `item` or `items` content blocks which provide the necessary `@Composable` context.
