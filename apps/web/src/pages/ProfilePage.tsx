import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuth } from "../features/auth/AuthContext";
import { authService } from "../services/auth.service";
import { usersService } from "../services/users.service";
import { CodeCard } from "../features/codes/CodeCard";
import { PromptCard } from "../features/prompts/PromptCard";
import { EmptyState, CardSkeleton, Input, Label, Textarea, Button, formatDate } from "@codevault/ui";
import type { Code, Prompt } from "@codevault/types";

type Tab = "saved" | "liked" | "settings";

export function ProfilePage() {
  const { user, refetch } = useAuth();
  const [tab, setTab] = useState<Tab>("saved");
  const queryClient = useQueryClient();

  const saved = useQuery({ queryKey: ["me", "saved"], queryFn: usersService.saved, enabled: tab === "saved" });
  const liked = useQuery({ queryKey: ["me", "liked"], queryFn: usersService.liked, enabled: tab === "liked" });

  const { register, handleSubmit } = useForm({
    defaultValues: { displayName: user?.profile?.displayName || "", bio: user?.profile?.bio || "" },
  });

  const updateMutation = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: () => {
      toast.success("تم تحديث الملف الشخصي");
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      refetch();
    },
  });

  if (!user) return null;

  const tabs: { value: Tab; label: string }[] = [
    { value: "saved", label: "المحفوظات" },
    { value: "liked", label: "الإعجابات" },
    { value: "settings", label: "الإعدادات" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/20 text-xl font-bold text-accent">
          {user.profile?.displayName?.charAt(0) ?? "U"}
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">{user.profile?.displayName}</h1>
          <p className="text-sm text-text-secondary">{user.email}</p>
          <p className="text-xs text-text-muted">عضو منذ {formatDate(user.createdAt)}</p>
        </div>
      </div>

      <div className="mt-8 flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium ${
              tab === t.value ? "border-accent text-accent" : "border-transparent text-text-secondary hover:text-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "saved" && (
          <ItemGrid
            isLoading={saved.isLoading}
            items={saved.data}
            emptyTitle="لا توجد عناصر محفوظة بعد"
          />
        )}
        {tab === "liked" && (
          <ItemGrid isLoading={liked.isLoading} items={liked.data} emptyTitle="لم تُعجب بأي عنصر بعد" />
        )}
        {tab === "settings" && (
          <form
            onSubmit={handleSubmit((values) => updateMutation.mutate(values))}
            className="max-w-md flex flex-col gap-4"
          >
            <div>
              <Label>الاسم المعروض</Label>
              <Input {...register("displayName")} />
            </div>
            <div>
              <Label>نبذة عنك</Label>
              <Textarea rows={3} {...register("bio")} />
            </div>
            <Button type="submit" disabled={updateMutation.isPending} className="w-fit">
              حفظ التغييرات
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function ItemGrid({
  isLoading,
  items,
  emptyTitle,
}: {
  isLoading: boolean;
  items?: { id: string; itemType: "CODE" | "PROMPT"; code: Code | null; prompt: Prompt | null }[];
  emptyTitle: string;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }
  if (!items?.length) return <EmptyState title={emptyTitle} />;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) =>
        it.itemType === "CODE" && it.code ? (
          <CodeCard key={it.id} code={it.code} />
        ) : it.prompt ? (
          <PromptCard key={it.id} prompt={it.prompt} />
        ) : null
      )}
    </div>
  );
}
