export type Priority = "low" | "medium" | "high";
export type AssignmentStatus = "pending" | "in_progress" | "completed";

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  color: string;
  teacher: string | null;
  credits: number;
  created_at: string;
}

export interface Assignment {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  description: string | null;
  priority: Priority;
  status: AssignmentStatus;
  due_date: string | null;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_value: number;
  current_value: number;
  unit: string;
  deadline: string | null;
  status: "active" | "completed";
  created_at: string;
}

export interface Exam {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  exam_date: string;
  location: string | null;
  notes: string | null;
  created_at: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  subject_id: string | null;
  duration_minutes: number;
  notes: string | null;
  studied_at: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  type: string;
  read: boolean;
  created_at: string;
}
