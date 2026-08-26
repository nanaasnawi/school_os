# Fix Composable Annotation Errors in Agenda Content

The project is failing to build due to missing `@Composable` annotations in `StudentAgendaContent.kt` and `TeacherAgendaContent.kt`. These functions invoke `@Composable` functions (like `StudentSessionCard`, `TeacherSessionCard`, `Text`, `Row`, etc.) and therefore must be marked as `@Composable`.

## Proposed Changes

### [feature:sessions]

#### [MODIFY] [StudentAgendaContent.kt](file:///C:/Users/USER/Documents/School%20Os/android/feature/sessions/src/main/java/com/schoolos/android/feature/sessions/StudentAgendaContent.kt)
- Add `@Composable` annotation to `studentAgendaContent` function.
- Add `@Composable` annotation to `renderAgendaSection` function.

#### [MODIFY] [TeacherAgendaContent.kt](file:///C:/Users/USER/Documents/School%20Os/android/feature/sessions/src/main/java/com/schoolos/android/feature/sessions/TeacherAgendaContent.kt)
- Add `@Composable` annotation to `teacherAgendaContent` function.
- Add `@Composable` annotation to `renderTeacherSection` function.

#### [MODIFY] [TodayScreen.kt](file:///C:/Users/USER/Documents/School%20Os/android/feature/sessions/src/main/java/com/schoolos/android/feature/sessions/TodayScreen.kt)
- Since the agenda content functions will now be `@Composable`, their calls inside `LazyColumn` must be handled correctly. However, `LazyColumn` content is NOT a composable context.
- **Wait**: If I mark them `@Composable`, I might need to adjust how they are called. Actually, `LazyListScope` extensions should ideally NOT be `@Composable`.
- **Investigation**: I will first try adding the annotations and see if the compiler allows them to be called within `LazyColumn`. If not, I will explore alternative ways to structure these modular content builders, such as wrapping them or ensuring they only call `@Composable` functions within `item {}` blocks correctly.

## Verification Plan

### Automated Tests
- Run `./gradlew :feature:sessions:compileDebugKotlin` to verify the build passes.

### Manual Verification
- None required as this is a build fix.
