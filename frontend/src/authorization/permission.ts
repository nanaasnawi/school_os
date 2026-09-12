// ⚠️ AUTO-GENERATED FILE BY RUST BACKEND - DO NOT EDIT
export const Permission = {
  LearningAssignmentCreate: "Learning.Assignment.Create",
  LearningAssignmentRead: "Learning.Assignment.Read",
  LearningAssignmentUpdate: "Learning.Assignment.Update",
  LearningAssignmentDelete: "Learning.Assignment.Delete",
  AssessmentRead: "Assessment.Read",
  AssessmentUpdate: "Assessment.Update",
} as const;

export type AppPermission = typeof Permission[keyof typeof Permission];
