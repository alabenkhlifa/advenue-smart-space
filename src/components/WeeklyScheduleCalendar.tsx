import { useState } from "react";
import { Plus, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import type { WeeklySchedule, TimeSlot } from "@/lib/campaigns";

interface WeeklyScheduleCalendarProps {
  value: WeeklySchedule;
  onChange: (schedule: WeeklySchedule) => void;
}

const WeeklyScheduleCalendar = ({
  value,
  onChange,
}: WeeklyScheduleCalendarProps) => {
  const [selectedDay, setSelectedDay] = useState<keyof WeeklySchedule | null>(
    null
  );
  const [newSlotStart, setNewSlotStart] = useState<string>("09:00");
  const [newSlotEnd, setNewSlotEnd] = useState<string>("17:00");

  const dayNames: { key: keyof WeeklySchedule; label: string }[] = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ];

  const addTimeSlot = (day: keyof WeeklySchedule) => {
    if (!newSlotStart || !newSlotEnd) return;

    // Validate that end time is after start time
    const startMinutes = timeToMinutes(newSlotStart);
    const endMinutes = timeToMinutes(newSlotEnd);

    if (endMinutes <= startMinutes) {
      alert("End time must be after start time");
      return;
    }

    // Check for overlapping slots
    const existingSlots = value[day];
    const hasOverlap = existingSlots.some((slot) => {
      const existingStart = timeToMinutes(slot.start);
      const existingEnd = timeToMinutes(slot.end);

      // Check if new slot overlaps with existing slot
      // Overlap occurs if:
      // 1. New start is between existing start and end
      // 2. New end is between existing start and end
      // 3. New slot completely contains existing slot
      // 4. Existing slot completely contains new slot
      return (
        (startMinutes >= existingStart && startMinutes < existingEnd) || // New start overlaps
        (endMinutes > existingStart && endMinutes <= existingEnd) || // New end overlaps
        (startMinutes <= existingStart && endMinutes >= existingEnd) || // New contains existing
        (existingStart <= startMinutes && existingEnd >= endMinutes) // Existing contains new
      );
    });

    if (hasOverlap) {
      alert("This time slot overlaps with an existing slot. Please choose a different time.");
      return;
    }

    const newSlot: TimeSlot = {
      id: `slot-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      start: newSlotStart,
      end: newSlotEnd,
    };

    const updatedSchedule = {
      ...value,
      [day]: [...value[day], newSlot],
    };

    onChange(updatedSchedule);
    setSelectedDay(null);
  };

  const removeTimeSlot = (day: keyof WeeklySchedule, slotId: string) => {
    const updatedSchedule = {
      ...value,
      [day]: value[day].filter((slot) => slot.id !== slotId),
    };

    onChange(updatedSchedule);
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const clearAllSlots = () => {
    const emptySchedule: WeeklySchedule = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    };
    onChange(emptySchedule);
  };

  const addBusinessHours = () => {
    const businessHoursSlot: TimeSlot = {
      id: `slot-${Date.now()}-bh`,
      start: "09:00",
      end: "17:00",
    };

    const updatedSchedule = { ...value };
    ["monday", "tuesday", "wednesday", "thursday", "friday"].forEach((day) => {
      updatedSchedule[day as keyof WeeklySchedule] = [
        { ...businessHoursSlot, id: `slot-${Date.now()}-${day}` },
      ];
    });

    onChange(updatedSchedule);
  };

  const totalScheduledSlots = Object.values(value).reduce(
    (sum, slots) => sum + slots.length,
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">Weekly Schedule</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {totalScheduledSlots === 0
              ? "No schedule set - campaign will run 24/7"
              : `${totalScheduledSlots} time slot${totalScheduledSlots !== 1 ? "s" : ""} scheduled`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addBusinessHours}
            className="text-xs"
          >
            <Clock className="h-3 w-3 mr-1" />
            Business Hours
          </Button>
          {totalScheduledSlots > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAllSlots}
              className="text-xs"
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {/* Row 1: Monday, Tuesday, Wednesday, Thursday */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {[dayNames[0], dayNames[1], dayNames[2], dayNames[3]].map(({ key, label }) => {
            const daySlots = value[key];
            const isSelected = selectedDay === key;

            return (
              <Card key={key} className="p-2 sm:p-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-medium truncate">{label}</h4>
                    <Badge variant="secondary" className="text-[10px] sm:text-xs h-5 sm:h-6">
                      {daySlots.length}
                    </Badge>
                  </div>

                  {/* Time slots list */}
                  <div className="space-y-1">
                    {daySlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between bg-primary/10 text-primary rounded px-1.5 sm:px-2 py-1 sm:py-1.5 text-[10px] sm:text-xs"
                      >
                        <span className="font-mono truncate">
                          {slot.start} - {slot.end}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeTimeSlot(key, slot.id)}
                          className="hover:bg-primary/20 rounded p-0.5 flex-shrink-0 ml-1"
                        >
                          <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        </button>
                      </div>
                    ))}

                    {daySlots.length === 0 && !isSelected && (
                      <p className="text-[10px] sm:text-xs text-muted-foreground text-center py-1 sm:py-2">
                        No slots
                      </p>
                    )}
                  </div>

                  {/* Add time slot form */}
                  {isSelected ? (
                    <div className="space-y-1.5 sm:space-y-2 pt-1.5 sm:pt-2 border-t">
                      <div className="space-y-1">
                        <Label htmlFor={`${key}-start`} className="text-[10px] sm:text-xs">
                          Start
                        </Label>
                        <Input
                          id={`${key}-start`}
                          type="time"
                          value={newSlotStart}
                          onChange={(e) => setNewSlotStart(e.target.value)}
                          className="h-7 sm:h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`${key}-end`} className="text-[10px] sm:text-xs">
                          End
                        </Label>
                        <Input
                          id={`${key}-end`}
                          type="time"
                          value={newSlotEnd}
                          onChange={(e) => setNewSlotEnd(e.target.value)}
                          className="h-7 sm:h-8 text-xs"
                        />
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          className="flex-1 h-6 sm:h-7 text-[10px] sm:text-xs"
                          onClick={() => addTimeSlot(key)}
                        >
                          Add
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-6 sm:h-7 text-[10px] sm:text-xs px-2"
                          onClick={() => setSelectedDay(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full h-6 sm:h-7 text-[10px] sm:text-xs"
                      onClick={() => {
                        setSelectedDay(key);
                        setNewSlotStart("09:00");
                        setNewSlotEnd("17:00");
                      }}
                    >
                      <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                      Add
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Row 2: Friday, Saturday, Sunday */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          {[dayNames[4], dayNames[5], dayNames[6]].map(({ key, label }) => {
            const daySlots = value[key];
            const isSelected = selectedDay === key;

            return (
              <Card key={key} className="p-2 sm:p-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-medium truncate">{label}</h4>
                    <Badge variant="secondary" className="text-[10px] sm:text-xs h-5 sm:h-6">
                      {daySlots.length}
                    </Badge>
                  </div>

                  {/* Time slots list */}
                  <div className="space-y-1">
                    {daySlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between bg-primary/10 text-primary rounded px-1.5 sm:px-2 py-1 sm:py-1.5 text-[10px] sm:text-xs"
                      >
                        <span className="font-mono truncate">
                          {slot.start} - {slot.end}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeTimeSlot(key, slot.id)}
                          className="hover:bg-primary/20 rounded p-0.5 flex-shrink-0 ml-1"
                        >
                          <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        </button>
                      </div>
                    ))}

                    {daySlots.length === 0 && !isSelected && (
                      <p className="text-[10px] sm:text-xs text-muted-foreground text-center py-1 sm:py-2">
                        No slots
                      </p>
                    )}
                  </div>

                  {/* Add time slot form */}
                  {isSelected ? (
                    <div className="space-y-1.5 sm:space-y-2 pt-1.5 sm:pt-2 border-t">
                      <div className="space-y-1">
                        <Label htmlFor={`${key}-start`} className="text-[10px] sm:text-xs">
                          Start
                        </Label>
                        <Input
                          id={`${key}-start`}
                          type="time"
                          value={newSlotStart}
                          onChange={(e) => setNewSlotStart(e.target.value)}
                          className="h-7 sm:h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`${key}-end`} className="text-[10px] sm:text-xs">
                          End
                        </Label>
                        <Input
                          id={`${key}-end`}
                          type="time"
                          value={newSlotEnd}
                          onChange={(e) => setNewSlotEnd(e.target.value)}
                          className="h-7 sm:h-8 text-xs"
                        />
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          className="flex-1 h-6 sm:h-7 text-[10px] sm:text-xs"
                          onClick={() => addTimeSlot(key)}
                        >
                          Add
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-6 sm:h-7 text-[10px] sm:text-xs px-2"
                          onClick={() => setSelectedDay(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full h-6 sm:h-7 text-[10px] sm:text-xs"
                      onClick={() => {
                        setSelectedDay(key);
                        setNewSlotStart("09:00");
                        setNewSlotEnd("17:00");
                      }}
                    >
                      <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                      Add
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeeklyScheduleCalendar;
