# Fix @Composable invocation error in StudentAgendaContent.kt

The project fails to build because `TextTertiary` (a `@Composable` color property) is being evaluated in a non-composable context. `LazyListScope` extension functions like `studentAgendaContent` are DSL builders, not `@Composable` functions, and they are called from `LazyColumn` content blocks which are also not `@Composable`.

## User Review Required

> [!IMPORTANT]
> The fix involves changing how colors are passed to the agenda section renderers. Instead of passing a `Color` value directly, we will pass a `@Composable () -> Color` lambda. This allows the color to be evaluated inside the `@Composable` context of individual list items.

## Proposed Changes

### Sessions Feature Module

#### [MODIFY] [StudentAgendaContent.kt](file:///C:/Users/USER/Documents/School%20Os/android/feature/sessions/src/main/java/com/schoolos/android/feature/sessions/StudentAgendaContent.kt)
- Remove `@Composable` from `studentAgendaContent`.
- Update `renderAgendaSection` to take `color: @Composable () -> Color`.
- Update calls to `renderAgendaSection` to use lambdas: `{ NeonSuccess }`, `{ StudentNeon }`, `{ TextTertiary }`.
- Invoke `color()` inside `item { ... }` and `items { ... }`.

#### [MODIFY] [TeacherAgendaContent.kt](file:///C:/Users/USER/Documents/School%20Os/android/feature/sessions/src/main/java/com/schoolos/android/feature/sessions/TeacherAgendaContent.kt)
- Apply the same pattern to `teacherAgendaContent` and `renderTeacherSection`.

## Verification Plan

### Automated Tests
- Run `./gradlew :feature:sessions:compileDebugKotlin` to verify the fix.

### Manual Verification
- None required as this is a compilation fix.
