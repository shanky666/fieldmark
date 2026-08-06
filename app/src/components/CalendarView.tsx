import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format, startOfMonth, getDaysInMonth, addMonths, subMonths, isAfter, startOfDay } from 'date-fns';
import { COLORS } from '../constants/colors';

interface CalendarRecord {
  date: string; // YYYY-MM-DD
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'FLAGGED';
  is_leave?: boolean;
  leave_type?: string;
  is_correction_pending?: boolean;
}

interface CalendarViewProps {
  records: CalendarRecord[];
  onDayPress: (dateStr: string) => void;
}

export default function CalendarView({ records, onDayPress }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Generate days in grid
  const startOfCurrent = startOfMonth(currentMonth);
  // getDay returns 0 for Sunday, 1 for Monday... Convert to Mon=0, Tue=1... Sun=6
  const rawOffset = startOfCurrent.getDay();
  const startDayOffset = rawOffset === 0 ? 6 : rawOffset - 1; 
  const totalDays = getDaysInMonth(currentMonth);

  const daysArray = [];
  // Offset padding cells
  for (let i = 0; i < startDayOffset; i++) {
    daysArray.push({ isPadding: true, key: `pad-${i}` });
  }

  // Active month cells
  const today = startOfDay(new Date());
  for (let day = 1; day <= totalDays; day++) {
    const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = format(cellDate, 'yyyy-MM-dd');
    
    // Find matching record
    const match = records.find(r => r.date === dateStr);
    
    let cellType: 'FUTURE' | 'ABSENT' | 'LEAVE' | 'CORRECTION_PENDING' | 'PENDING' | 'APPROVED' = 'FUTURE';

    if (isAfter(cellDate, today)) {
      cellType = 'FUTURE';
    } else {
      // Default to absent for past days if not present or on leave
      cellType = 'ABSENT';
      
      if (match) {
        if (match.is_leave) {
          cellType = 'LEAVE';
        } else if (match.is_correction_pending) {
          cellType = 'CORRECTION_PENDING';
        } else if (match.status === 'APPROVED' || match.status === 'FLAGGED') {
          cellType = 'APPROVED';
        } else if (match.status === 'PENDING') {
          cellType = 'PENDING';
        } else if (match.status === 'REJECTED') {
          cellType = 'ABSENT'; // Rejections count as absent
        }
      }
      
      // Sundays default to weekend/future color
      if (cellDate.getDay() === 0 && cellType === 'ABSENT') {
        cellType = 'FUTURE';
      }
    }

    daysArray.push({
      isPadding: false,
      dayNumber: day,
      dateString: dateStr,
      type: cellType,
      key: `day-${day}`
    });
  }

  // Group into weeks
  const rows = [];
  let tempWeek = [];
  for (let i = 0; i < daysArray.length; i++) {
    tempWeek.push(daysArray[i]);
    if (tempWeek.length === 7 || i === daysArray.length - 1) {
      // Pad out last week
      while (tempWeek.length < 7) {
        tempWeek.push({ isPadding: true, key: `pad-end-${tempWeek.length}` });
      }
      rows.push(tempWeek);
      tempWeek = [];
    }
  }

  const getCellBg = (type: string) => {
    switch (type) {
      case 'APPROVED':
        return COLORS.accent;
      case 'PENDING':
        return COLORS.accent + '66'; // semi-transparent green
      case 'ABSENT':
        return COLORS.danger;
      case 'LEAVE':
        return COLORS.info;
      case 'CORRECTION_PENDING':
        return COLORS.warning;
      case 'FUTURE':
      default:
        return '#e0e0e0';
    }
  };

  const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <View style={styles.container}>
      {/* Month Selector header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.arrowBtn} onPress={handlePrevMonth}>
          <Text style={styles.arrowText}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{format(currentMonth, 'MMMM yyyy')}</Text>
        <TouchableOpacity style={styles.arrowBtn} onPress={handleNextMonth}>
          <Text style={styles.arrowText}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* Grid Header */}
      <View style={styles.weekdaysRow}>
        {weekdays.map((wd, index) => (
          <Text key={`wd-${index}`} style={styles.weekdayLabel}>{wd}</Text>
        ))}
      </View>

      {/* Grid Content */}
      <View style={styles.grid}>
        {rows.map((week, weekIdx) => (
          <View key={`week-${weekIdx}`} style={styles.weekRow}>
            {week.map((cell) => {
              if (cell.isPadding) {
                return <View key={cell.key} style={styles.dayCellDummy} />;
              }

              const bg = getCellBg(cell.type!);
              const isPastActive = cell.type !== 'FUTURE';
              
              return (
                <TouchableOpacity
                  key={cell.key}
                  style={[styles.dayCell, { backgroundColor: bg }]}
                  disabled={!isPastActive}
                  onPress={() => cell.dateString && onDayPress(cell.dateString)}
                >
                  <Text style={[
                    styles.dayText, 
                    cell.type === 'FUTURE' && { color: COLORS.darkText }
                  ]}>
                    {cell.dayNumber}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendIndicator, { backgroundColor: COLORS.accent }]} />
          <Text style={styles.legendLabel}>Approved</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendIndicator, { backgroundColor: COLORS.accent + '66' }]} />
          <Text style={styles.legendLabel}>Pending</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendIndicator, { backgroundColor: COLORS.danger }]} />
          <Text style={styles.legendLabel}>Absent</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendIndicator, { backgroundColor: COLORS.info }]} />
          <Text style={styles.legendLabel}>Leave</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendIndicator, { backgroundColor: COLORS.warning }]} />
          <Text style={styles.legendLabel}>Correction</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  arrowBtn: {
    padding: 8,
    minWidth: 44, // Touch target
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 16,
    color: COLORS.primary,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingBottom: 6,
    marginBottom: 6,
  },
  weekdayLabel: {
    width: 32,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.lightText,
  },
  grid: {
    gap: 6,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellDummy: {
    width: 34,
    height: 34,
  },
  dayText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 15,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingTop: 10,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
  },
  legendIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  legendLabel: {
    fontSize: 10,
    color: COLORS.lightText,
  },
});
