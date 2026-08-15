import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import type {
  Assignment,
  AppNotification,
  Exam,
  Goal,
  StudySession,
  Subject,
} from "@/lib/types";

// Untyped view of the client so generic table helpers below stay simple.
const db = supabase as unknown as SupabaseClient;

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Not signed in");
  return data.user.id;
}

function useList<T>(table: string, orderBy: string, ascending = true) {
  return useQuery({
    queryKey: [table],
    queryFn: async (): Promise<T[]> => {
      const { data, error } = await db
        .from(table)
        .select("*")
        .order(orderBy, { ascending });
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

export const useSubjects = () => useList<Subject>("subjects", "created_at", false);
export const useAssignments = () => useList<Assignment>("assignments", "due_date", true);
export const useGoals = () => useList<Goal>("goals", "created_at", false);
export const useExams = () => useList<Exam>("exams", "exam_date", true);
export const useStudySessions = () =>
  useList<StudySession>("study_sessions", "studied_at", false);
export const useNotifications = () =>
  useList<AppNotification>("notifications", "created_at", false);

export function useCreate<T>(table: string, label: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const user_id = await currentUserId();
      const { data, error } = await db
        .from(table)
        .insert({ ...values, user_id })
        .select()
        .single();
      if (error) throw error;
      return data as T;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [table] });
      toast.success(`${label} created`);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdate(table: string, label: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, unknown> }) => {
      const { error } = await db.from(table).update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [table] });
      toast.success(`${label} updated`);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useRemove(table: string, label: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [table] });
      toast.success(`${label} deleted`);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
