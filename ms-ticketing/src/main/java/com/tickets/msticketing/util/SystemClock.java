package com.tickets.msticketing.util;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

public class SystemClock {
    private static long offsetMinutes = 0;

    public static LocalDateTime now() {
        return LocalDateTime.now(ZoneOffset.UTC).plusMinutes(offsetMinutes);
    }

    public static void advanceMinutes(long minutes) {
        offsetMinutes += minutes;
    }

    public static void reset() {
        offsetMinutes = 0;
    }
}
