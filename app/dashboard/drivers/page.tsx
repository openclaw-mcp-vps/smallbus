"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { io, type Socket } from "socket.io-client";
import { Trash2 } from "lucide-react";
import { DriverAssignment } from "@/components/DriverAssignment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type { DriverRecord } from "@/lib/db/schema";

type DriverFormInput = {
  name: string;
  phone: string;
  licenseNumber: string;
  maxHoursPerDay: number;
};

function statusVariant(status: DriverRecord["status"]) {
  if (status === "available") {
    return "success" as const;
  }

  if (status === "on_route") {
    return "warning" as const;
  }

  return "neutral" as const;
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { register, handleSubmit, reset } = useForm<DriverFormInput>({
    defaultValues: {
      maxHoursPerDay: 8
    }
  });

  const summary = useMemo(() => {
    const available = drivers.filter((driver) => driver.status === "available").length;
    const onRoute = drivers.filter((driver) => driver.status === "on_route").length;
    return { available, onRoute, total: drivers.length };
  }, [drivers]);

  async function refreshDrivers() {
    const response = await fetch("/api/drivers", { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { drivers: DriverRecord[] };
    setDrivers(payload.drivers);
  }

  useEffect(() => {
    refreshDrivers();

    let socket: Socket | undefined;

    const connectSocket = async () => {
      await fetch("/api/socket");
      socket = io({ path: "/api/socket_io" });

      socket.on("smallbus:event", (event: { type: string }) => {
        if (event.type === "drivers.updated") {
          refreshDrivers();
        }
      });
    };

    connectSocket();

    return () => {
      socket?.disconnect();
    };
  }, []);

  const onSubmit = handleSubmit(async (data) => {
    setLoading(true);
    setErrorMessage("");

    const response = await fetch("/api/drivers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: data.name,
        phone: data.phone,
        licenseNumber: data.licenseNumber,
        status: "available",
        maxHoursPerDay: Number(data.maxHoursPerDay)
      })
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setErrorMessage(payload.error ?? "Unable to save driver");
      setLoading(false);
      return;
    }

    reset({ maxHoursPerDay: 8 });
    await refreshDrivers();
    setLoading(false);
  });

  const updateStatus = async (driverId: number, status: DriverRecord["status"]) => {
    await fetch(`/api/drivers/${driverId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status })
    });

    await refreshDrivers();
  };

  const removeDriver = async (driverId: number) => {
    await fetch(`/api/drivers/${driverId}`, {
      method: "DELETE"
    });

    await refreshDrivers();
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-[#f0f6fc]">Driver Scheduling</h1>
        <p className="text-sm text-[#8b949e]">Manage active operators, license records, and daily availability.</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="success">Available: {summary.available}</Badge>
          <Badge variant="warning">On Route: {summary.onRoute}</Badge>
          <Badge variant="neutral">Total Drivers: {summary.total}</Badge>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Add Driver</CardTitle>
            <CardDescription>Capture contact details and max daily hours before assignments begin.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" placeholder="Jordan Maxwell" {...register("name", { required: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" placeholder="+1-512-555-0133" {...register("phone", { required: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">License number</Label>
                <Input id="licenseNumber" placeholder="TX-CDL-44882" {...register("licenseNumber", { required: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxHoursPerDay">Max hours/day</Label>
                <Input
                  id="maxHoursPerDay"
                  type="number"
                  min={4}
                  max={16}
                  {...register("maxHoursPerDay", { valueAsNumber: true })}
                />
              </div>
              {errorMessage ? <p className="text-sm text-[#f85149]">{errorMessage}</p> : null}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Saving driver..." : "Save driver"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <DriverAssignment drivers={drivers} onStatusChange={updateStatus} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Driver Directory</CardTitle>
          <CardDescription>Current roster with availability and compliance details.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>License</TableHead>
                <TableHead>Max Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="font-medium text-[#f0f6fc]">{driver.name}</TableCell>
                  <TableCell>{driver.phone}</TableCell>
                  <TableCell>{driver.licenseNumber}</TableCell>
                  <TableCell>{driver.maxHoursPerDay}h</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(driver.status)}>{driver.status.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#f85149] hover:bg-[#161b22]"
                      onClick={() => removeDriver(driver.id)}
                      aria-label={`Delete ${driver.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
