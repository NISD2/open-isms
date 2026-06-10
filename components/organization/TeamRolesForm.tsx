"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALL_ROLE_KEYS } from "@/lib/compliance/role-keys";
import { ArrowLeft, Plus, X } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email();

export interface TeamRoleEntry {
  roleKey: string;
  name?: string;
  email: string;
}

interface TeamRolesFormProps {
  roleSlugMap: Record<string, string[]>;
  onSubmit: (roles: TeamRoleEntry[]) => void;
  onSkip: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

interface MemberRow {
  id: number;
  name: string;
  email: string;
  roleKey: string;
}

export function TeamRolesForm({
  onSubmit,
  onSkip,
  onBack,
  isSubmitting,
}: TeamRolesFormProps) {
  const t = useTranslations("organization.teamRoles");
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [nextId, setNextId] = useState(0);

  function addMember() {
    setMembers((prev) => [...prev, { id: nextId, name: "", email: "", roleKey: "" }]);
    setNextId((n) => n + 1);
  }

  function removeMember(id: number) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function updateMember(id: number, field: keyof Omit<MemberRow, "id">, value: string) {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    );
    if (field === "email") {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const filled = members.filter((m) => m.email.length > 0);

    // Validate emails
    const newErrors: Record<number, string> = {};
    for (const m of filled) {
      if (!emailSchema.safeParse(m.email).success) {
        newErrors[m.id] = "Invalid email";
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(
      filled.map((m) => ({
        roleKey: m.roleKey || "ciso",
        name: m.name || undefined,
        email: m.email,
      })),
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-muted-foreground">{t("description")}</p>

      {members.length > 0 && (
        <div className="space-y-3">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-start gap-3 rounded-lg border p-3"
            >
              <div className="grid flex-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">{t("name")}</Label>
                  <Input
                    value={m.name}
                    onChange={(e) => updateMember(m.id, "name", e.target.value)}
                    placeholder="Jane Doe"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("email")}</Label>
                  <Input
                    value={m.email}
                    onChange={(e) => updateMember(m.id, "email", e.target.value)}
                    placeholder="name@company.com"
                  />
                  {errors[m.id] && (
                    <p className="text-xs text-destructive">{errors[m.id]}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("role")}</Label>
                  <Select
                    value={m.roleKey}
                    onValueChange={(v) => updateMember(m.id, "roleKey", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("rolePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_ROLE_KEYS.map((key) => (
                        <SelectItem key={key} value={key}>
                          {t(`roles.${key}.label`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-5 shrink-0"
                onClick={() => removeMember(m.id)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">{t("removeMember")}</span>
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button type="button" variant="outline" onClick={addMember}>
        <Plus className="mr-1.5 h-4 w-4" />
        {t("addMember")}
      </Button>

      <div className="flex items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={isSubmitting}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {t("back")}
        </Button>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onSkip}
            disabled={isSubmitting}
          >
            {t("skip")}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {t("submit")}
          </Button>
        </div>
      </div>
    </form>
  );
}
