export interface GradeResult {
  percentage: number;
  percentageFormatted: string;
  grade: string; // e.g. "A1", "A2", "B1", "B2", "C1", "C2", "D", "E"
  division: string; // e.g. "Distinction (1st Div)", "1st Division", "2nd Division", "3rd Division", "Pass Grade", "Needs Improvement"
  gradePoints: number;
  status: 'Passed' | 'Eligible for Reappear' | 'Failed' | 'Pending';
  badgeColor: string;
  gradeColor: string;
  remarks: string;
}

export function calculateGradeAndPercentage(marksObtained: number | string, totalMarks: number | string = 500): GradeResult {
  const marks = Number(marksObtained);
  const total = Number(totalMarks);

  if (isNaN(marks) || isNaN(total) || total <= 0 || marks < 0) {
    return {
      percentage: 0,
      percentageFormatted: '0.00',
      grade: 'N/A',
      division: 'Pending Entry',
      gradePoints: 0,
      status: 'Pending',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
      gradeColor: 'text-slate-500',
      remarks: 'Please enter valid marks obtained and total maximum marks.',
    };
  }

  const pct = Math.min(100, Math.max(0, (marks / total) * 100));
  const pctStr = pct.toFixed(2);

  if (pct >= 90) {
    return {
      percentage: pct,
      percentageFormatted: pctStr,
      grade: 'A1',
      division: 'Distinction (1st Division)',
      gradePoints: 10,
      status: 'Passed',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      gradeColor: 'text-emerald-700 font-black',
      remarks: 'Outstanding academic performance.',
    };
  } else if (pct >= 80) {
    return {
      percentage: pct,
      percentageFormatted: pctStr,
      grade: 'A2',
      division: '1st Division with Honors',
      gradePoints: 9,
      status: 'Passed',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      gradeColor: 'text-emerald-600 font-black',
      remarks: 'Excellent academic performance.',
    };
  } else if (pct >= 70) {
    return {
      percentage: pct,
      percentageFormatted: pctStr,
      grade: 'B1',
      division: '1st Division',
      gradePoints: 8,
      status: 'Passed',
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
      gradeColor: 'text-blue-700 font-extrabold',
      remarks: 'Very Good academic standing.',
    };
  } else if (pct >= 60) {
    return {
      percentage: pct,
      percentageFormatted: pctStr,
      grade: 'B2',
      division: '1st Division',
      gradePoints: 7,
      status: 'Passed',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
      gradeColor: 'text-blue-600 font-bold',
      remarks: 'Good academic performance.',
    };
  } else if (pct >= 50) {
    return {
      percentage: pct,
      percentageFormatted: pctStr,
      grade: 'C1',
      division: '2nd Division',
      gradePoints: 6,
      status: 'Passed',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      gradeColor: 'text-amber-700 font-bold',
      remarks: 'Above average academic standing.',
    };
  } else if (pct >= 40) {
    return {
      percentage: pct,
      percentageFormatted: pctStr,
      grade: 'C2',
      division: '3rd Division',
      gradePoints: 5,
      status: 'Passed',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      gradeColor: 'text-amber-600 font-semibold',
      remarks: 'Average academic standing.',
    };
  } else if (pct >= 33) {
    return {
      percentage: pct,
      percentageFormatted: pctStr,
      grade: 'D',
      division: 'Pass Grade',
      gradePoints: 4,
      status: 'Passed',
      badgeColor: 'bg-orange-100 text-orange-900 border-orange-300',
      gradeColor: 'text-orange-700 font-semibold',
      remarks: 'Marginal pass grade.',
    };
  } else {
    return {
      percentage: pct,
      percentageFormatted: pctStr,
      grade: 'E',
      division: 'Needs Improvement',
      gradePoints: 0,
      status: 'Eligible for Reappear',
      badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
      gradeColor: 'text-rose-700 font-bold',
      remarks: 'Below minimum passing threshold (33%).',
    };
  }
}
