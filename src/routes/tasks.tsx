import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { DataTable } from "@/components/legal/page-bits";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { queryClient } from "@/lib/query-client";
import { createTask, listMatters, listTasks, listTeam, updateTaskStatus } from "@/lib/server/api";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/tasks")({ component: TasksPage });

function TasksPage() {
  const { data = [] } = useQuery({ queryKey: ["tasks"], queryFn: () => listTasks() });
  const [open, setOpen] = useState(false);
  const update = useMutation({
    mutationFn: (input: { id: string; status: string }) => updateTaskStatus({ data: input }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  return (
    <AppShell title="Tasks" actions={<Button onClick={() => setOpen(true)}>+ Task</Button>}>
      <DataTable
        columns={[
          { key: "title", label: "Task" },
          { key: "matter", label: "Matter" },
          { key: "who", label: "Assigned" },
          { key: "due", label: "Due" },
          { key: "priority", label: "Priority" },
          { key: "status", label: "Status" },
        ]}
        rows={data.map((t) => ({
          id: t.id,
          title: t.title,
          matter: t.matter_name,
          who: t.assigned_to,
          due: formatDate(t.due_date),
          priority: t.priority,
          status: (
            <Select
              className="h-8 w-36"
              value={t.status}
              onChange={(e) => update.mutate({ id: t.id, status: e.target.value })}
            >
              <option>Open</option>
              <option>In Progress</option>
              <option>Done</option>
            </Select>
          ),
        }))}
      />
      <NewTask open={open} onOpenChange={setOpen} />
    </AppShell>
  );
}

function NewTask({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: matters = [] } = useQuery({ queryKey: ["matters"], queryFn: () => listMatters() });
  const { data: team = [] } = useQuery({ queryKey: ["team"], queryFn: () => listTeam() });
  const [title, setTitle] = useState("");
  const [matter_id, setMatter] = useState("");
  const [assigned_to, setWho] = useState("");
  const [due_date, setDue] = useState("");
  const mutation = useMutation({
    mutationFn: () => createTask({ data: { title, matter_id: matter_id || undefined, assigned_to, due_date } }),
    onSuccess: () => {
      toast.success("Task assigned");
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onOpenChange(false);
      setTitle("");
    },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Matter</Label>
            <Select value={matter_id} onChange={(e) => setMatter(e.target.value)}>
              <option value="">—</option>
              {matters.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Assign to</Label>
            <Select value={assigned_to} onChange={(e) => setWho(e.target.value)}>
              <option value="">—</option>
              {team.map((m) => (
                <option key={m.id}>{m.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Due</Label>
            <Input type="date" value={due_date} onChange={(e) => setDue(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
