from datetime import datetime, timedelta
from interface_adapters.controllers.mcp_tools import UpdatePatch

def apply_relative_patch(cur_start: datetime, cur_end: datetime, patch: UpdatePatch) -> tuple[datetime, datetime]:
    new_start = patch.start or cur_start
    new_end   = patch.end   or cur_end

    if getattr(patch, "new_date", None):
        nd = patch.new_date
        new_start = new_start.replace(year=nd.year, month=nd.month, day=nd.day)
        new_end   = new_end.replace(  year=nd.year, month=nd.month, day=nd.day)

    if getattr(patch, "new_start_time", None):
        t = patch.new_start_time
        new_start = new_start.replace(hour=t.hour, minute=t.minute, second=getattr(t, "second", 0), microsecond=0)
        if getattr(patch, "keep_duration", True) and not patch.new_end_time and not patch.end:
            new_end = new_start + (cur_end - cur_start)

    if getattr(patch, "new_end_time", None):
        t = patch.new_end_time
        new_end = new_end.replace(hour=t.hour, minute=t.minute, second=getattr(t, "second", 0), microsecond=0)

    if getattr(patch, "shift_days", None):
        delta = timedelta(days=patch.shift_days)
        new_start += delta; new_end += delta
    if getattr(patch, "shift_minutes", None):
        delta = timedelta(minutes=patch.shift_minutes)
        new_start += delta; new_end += delta

    if patch.start and getattr(patch, "keep_duration", True) and not patch.end:
        new_end = patch.start + (cur_end - cur_start)

    return new_start, new_end