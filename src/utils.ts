String.prototype.output = function (): void {
  console.log(this);
};


function generateTenMinuteSlots(start: Date, end: Date) {
  const slots = [];
  let current = new Date(start);

  while (current < end) {
    const next = new Date(current);
    next.setMinutes(next.getMinutes() + 10);

    if (next > end) break;

    slots.push({
      startTime: new Date(current),
      endTime: new Date(next),
    });

    current = next;
  }

  return slots;
}

function isOverlapping(start1: Date, end1: Date, start2: Date, end2: Date) {
  return start1 < end2 && end1 > start2;
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
