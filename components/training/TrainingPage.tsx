"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { SimpleFileUpload } from "@/components/shared/SimpleFileUpload";
import { InlineInvite } from "@/components/team/InlineInvite";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  GraduationCap, Pencil, Trash2, X, Check, UserPlus, Loader2,
} from "lucide-react";
import { getInitials, cn } from "@/lib/utils";

// Management roles per §38 BSIG
const MANAGEMENT_ROLES = new Set(["ceo", "ciso", "cto", "coo", "cpo"]);

interface CompanyUser {
  id: string;
  name: string;
  email: string;
  role: string;
  jobTitle: string | null;
}

interface SelectedParticipant {
  userId: string | null;
  name: string;
  role: string | null;
  isManagement: boolean;
}

type Item = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Form defaults
// ---------------------------------------------------------------------------
const EMPTY_FORM = {
  title: "",
  trainingType: "",
  description: "",
  providerName: "",
  trainerName: "",
  startedAt: "",
  completedAt: "",
  durationMinutes: "",
  nextTrainingDue: "",
};

export function TrainingPage({ items }: { items: Item[] }) {
  const t = useTranslations("training");
  const router = useRouter();
  const refresh = () => router.refresh();

  const batchCreate = trpc.training.batchCreate.useMutation({ onSuccess: refresh });
  const createMut = trpc.training.create.useMutation({ onSuccess: refresh });
  const updateMut = trpc.training.update.useMutation({ onSuccess: refresh });
  const deleteMut = trpc.training.delete.useMutation({ onSuccess: refresh });
  const certUpload = trpc.training.getCertificateUploadUrl.useMutation();

  const { data: users } = trpc.assignment.listAssignableUsers.useQuery();

  const [form, setForm] = useState(EMPTY_FORM);
  const [participants, setParticipants] = useState<SelectedParticipant[]>([]);
  const [certFileKey, setCertFileKey] = useState<string | null>(null);
  const [certFileName, setCertFileName] = useState<string | null>(null);
  const [managementOverride, setManagementOverride] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [showInvite, setShowInvite] = useState(false);

  const isSubmitting =
    batchCreate.isPending || createMut.isPending || updateMut.isPending;

  function setField(key: keyof typeof EMPTY_FORM, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleParticipant(user: CompanyUser) {
    setParticipants((prev) => {
      const exists = prev.find((p) => p.userId === user.id);
      if (exists) return prev.filter((p) => p.userId !== user.id);
      return [
        ...prev,
        {
          userId: user.id,
          name: user.name,
          role: user.jobTitle,
          isManagement: MANAGEMENT_ROLES.has(user.jobTitle ?? ""),
        },
      ];
    });
  }

  function removeParticipant(userId: string | null) {
    setParticipants((prev) => prev.filter((p) => p.userId !== userId));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setParticipants([]);
    setCertFileKey(null);
    setCertFileName(null);
    setManagementOverride(false);
    setEditItem(null);
    setShowInvite(false);
  }

  function startEdit(item: Item) {
    setEditItem(item);
    setForm({
      title: (item.title as string) ?? "",
      trainingType: (item.trainingType as string) ?? "",
      description: (item.description as string) ?? "",
      providerName: (item.providerName as string) ?? "",
      trainerName: (item.trainerName as string) ?? "",
      startedAt: item.startedAt ? new Date(item.startedAt as string).toISOString().slice(0, 10) : "",
      completedAt: item.completedAt ? new Date(item.completedAt as string).toISOString().slice(0, 10) : "",
      durationMinutes: item.durationMinutes ? String(item.durationMinutes) : "",
      nextTrainingDue: item.nextTrainingDue ? new Date(item.nextTrainingDue as string).toISOString().slice(0, 10) : "",
    });
    setParticipants([
      {
        userId: (item.userId as string) ?? null,
        name: (item.participantName as string) ?? "",
        role: (item.participantRole as string) ?? null,
        isManagement: (item.isManagement as boolean) ?? false,
      },
    ]);
    setCertFileKey((item.certificateFileKey as string) ?? null);
    setCertFileName(item.certificateFileKey ? "Certificate" : null);
    setManagementOverride((item.isManagement as boolean) ?? false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (participants.length === 0) {
      toast.error(t("noParticipants"));
      return;
    }

    const training = {
      title: form.title,
      trainingType: form.trainingType,
      description: form.description || null,
      providerName: form.providerName || null,
      trainerName: form.trainerName || null,
      startedAt: form.startedAt ? new Date(form.startedAt) : null,
      completedAt: form.completedAt ? new Date(form.completedAt) : null,
      durationMinutes: form.durationMinutes ? parseInt(form.durationMinutes, 10) : null,
      nextTrainingDue: form.nextTrainingDue || null,
      certificateFileKey: certFileKey,
    };

    if (editItem) {
      const p = participants[0];
      updateMut.mutate(
        {
          id: editItem.id as string,
          ...training,
          userId: p.userId,
          participantName: p.name,
          participantRole: p.role,
          isManagement: managementOverride || p.isManagement,
          nextTrainingDue: form.nextTrainingDue || undefined,
        },
        {
          onSuccess: () => {
            toast.success(t("edit"));
            resetForm();
          },
        },
      );
    } else {
      batchCreate.mutate(
        {
          training,
          participants: participants.map((p) => ({
            userId: p.userId,
            participantName: p.name,
            participantRole: p.role,
            isManagement: managementOverride || p.isManagement,
          })),
        },
        {
          onSuccess: (rows) => {
            toast.success(t("batchCreated", { count: rows.length }));
            resetForm();
          },
        },
      );
    }
  }

  const selectedIds = new Set(participants.map((p) => p.userId));

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        icon={<GraduationCap className="h-8 w-8 text-primary" />}
        title={t("title")}
        description={t("description")}
        helpText={t("helpText")}
      />

      {/* Form */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{editItem ? t("edit") : t("add")}</CardTitle>
          {editItem && (
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Training details grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">{t("fields.title")}</Label>
                <Input id="title" value={form.title} onChange={(e) => setField("title", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="trainingType">{t("fields.trainingType")}</Label>
                <Input id="trainingType" value={form.trainingType} onChange={(e) => setField("trainingType", e.target.value)} required placeholder="e.g. awareness, technical, management" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="providerName">{t("fields.providerName")}</Label>
                <Input id="providerName" value={form.providerName} onChange={(e) => setField("providerName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="trainerName">{t("fields.trainerName")}</Label>
                <Input id="trainerName" value={form.trainerName} onChange={(e) => setField("trainerName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="startedAt">{t("fields.startedAt")}</Label>
                <Input id="startedAt" type="date" value={form.startedAt} onChange={(e) => setField("startedAt", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="completedAt">{t("fields.completedAt")}</Label>
                <Input id="completedAt" type="date" value={form.completedAt} onChange={(e) => setField("completedAt", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="durationMinutes">{t("fields.durationMinutes")}</Label>
                <Input id="durationMinutes" type="number" min={1} value={form.durationMinutes} onChange={(e) => setField("durationMinutes", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nextTrainingDue">{t("fields.nextTrainingDue")}</Label>
                <Input id="nextTrainingDue" type="date" value={form.nextTrainingDue} onChange={(e) => setField("nextTrainingDue", e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">{t("fields.description")}</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setField("description", e.target.value)} rows={2} />
            </div>

            {/* Participants */}
            <div className="space-y-3">
              <Label>{t("participants")}</Label>

              {/* Selected chips */}
              {participants.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {participants.map((p) => (
                    <span
                      key={p.userId ?? p.name}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-sm"
                    >
                      <Avatar size="sm">
                        <AvatarFallback className="text-[9px]">
                          {getInitials(p.name)}
                        </AvatarFallback>
                      </Avatar>
                      {p.name}
                      {p.isManagement && (
                        <Badge variant="secondary" className="text-[9px] px-1 py-0">§38</Badge>
                      )}
                      {!editItem && (
                        <button
                          type="button"
                          onClick={() => removeParticipant(p.userId)}
                          className="hover:text-destructive transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}

              {/* User list (hidden in edit mode — single participant) */}
              {!editItem && (
                <div className="rounded-md border p-2 space-y-0.5 max-h-48 overflow-y-auto">
                  {(users ?? []).map((u) => {
                    const user = u as unknown as CompanyUser;
                    const isSelected = selectedIds.has(user.id);
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => toggleParticipant(user)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                          isSelected
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted text-foreground",
                        )}
                      >
                        <Avatar size="sm">
                          <AvatarFallback className="text-[9px]">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="flex-1 text-left truncate">{user.name}</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {user.jobTitle ?? user.email}
                        </span>
                        {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                      </button>
                    );
                  })}

                  {/* Invite new */}
                  {showInvite ? (
                    <div className="pt-2 border-t mt-2">
                      <InlineInvite
                        compact
                        onInvited={() => setShowInvite(false)}
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowInvite(true)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>{t("inviteNew")}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Management override */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isManagement"
                  checked={managementOverride}
                  onCheckedChange={(v) => setManagementOverride(!!v)}
                />
                <Label htmlFor="isManagement" className="text-sm font-normal cursor-pointer">
                  {t("managementTraining")}
                </Label>
              </div>
            </div>

            {/* Certificate upload */}
            <SimpleFileUpload
              label={t("certificate")}
              hint={t("certificateHint")}
              uploadingText={t("uploadingCert")}
              errorText={t("certUploadFailed")}
              removeText={t("removeCert")}
              currentFileKey={certFileKey}
              currentFileName={certFileName}
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              getUploadUrl={async (file) => {
                const result = await certUpload.mutateAsync(file);
                return result;
              }}
              onUploaded={(key, name) => {
                setCertFileKey(key);
                setCertFileName(name);
                toast.success(t("certUploaded"));
              }}
              onRemoved={() => {
                setCertFileKey(null);
                setCertFileName(null);
              }}
            />

            {/* Submit */}
            <Button type="submit" disabled={isSubmitting || participants.length === 0}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("saveTraining")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {t("empty")}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fields.title")}</TableHead>
                <TableHead>{t("fields.trainingType")}</TableHead>
                <TableHead>{t("fields.participantName")}</TableHead>
                <TableHead>{t("fields.isManagement")}</TableHead>
                <TableHead>{t("fields.completedAt")}</TableHead>
                <TableHead>{t("fields.nextTrainingDue")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id as string}>
                  <TableCell className="font-medium">{item.title as string}</TableCell>
                  <TableCell>{item.trainingType as string}</TableCell>
                  <TableCell>{item.participantName as string}</TableCell>
                  <TableCell>
                    {item.isManagement ? (
                      <Badge variant="default">{t("yes")}</Badge>
                    ) : (
                      <Badge variant="secondary">{t("no")}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.completedAt
                      ? new Date(item.completedAt as string).toLocaleDateString()
                      : "\u2014"}
                  </TableCell>
                  <TableCell>
                    {item.nextTrainingDue
                      ? new Date(item.nextTrainingDue as string).toLocaleDateString()
                      : "\u2014"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (window.confirm(t("deleteConfirm"))) {
                          deleteMut.mutate({ id: item.id as string });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
