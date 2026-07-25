import { FeeBreakdown } from '../types';

export function calculateCourseFees(
  course: string = '',
  category: string = 'General',
  gender: string = 'Male',
  classWishToJoin: string = ''
): FeeBreakdown {
  const isFemale =
    (gender || '').toLowerCase() === 'female' ||
    (gender || '').toLowerCase() === 'girl' ||
    (gender || '').toLowerCase() === 'girls';

  const isSecondary =
    (classWishToJoin || '').includes('9th') ||
    (classWishToJoin || '').includes('10th') ||
    (course || '').includes('9th') ||
    (course || '').includes('10th') ||
    (course || '').toLowerCase().includes('secondary');

  let tuitionFee = 600;
  let admissionFee = 200;
  let developmentFund = 300;
  let libraryDeposit = 150;
  let examFee = 150;

  if (isSecondary) {
    tuitionFee = isFemale ? 350 : 450;
    admissionFee = 150;
    developmentFund = 200;
    libraryDeposit = 100;
    examFee = 100;
  } else {
    // 11th & 12th Class
    if (course.includes('Science') || course.includes('Medical')) {
      tuitionFee = isFemale ? 525 : 600;
    } else if (course.includes('Humanities') || course.includes('Arts')) {
      tuitionFee = isFemale ? 425 : 500;
    } else {
      tuitionFee = isFemale ? 525 : 600;
    }
    admissionFee = 200;
    developmentFund = 300;
    libraryDeposit = 150;
    examFee = 150;
  }

  // Category concessions if applicable
  if (category === 'SC' || category === 'ST') {
    tuitionFee = Math.round(tuitionFee * 0.5); // 50% concession on tuition
  } else if (category === 'OBC' || category === 'RBA') {
    tuitionFee = Math.round(tuitionFee * 0.85); // 15% concession
  }

  const totalFee = tuitionFee + admissionFee + developmentFund + libraryDeposit + examFee;

  return {
    tuitionFee,
    admissionFee,
    developmentFund,
    libraryDeposit,
    examFee,
    totalFee,
  };
}

export function numberToWords(num: number): string {
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty ', 'Thirty ', 'Forty ', 'Fifty ', 'Sixty ', 'Seventy ', 'Eighty ', 'Ninety '];

  if ((num = num.toString() as any).length > 9) return 'overflow';
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += Number(n[1]) !== 0 ? (a[Number(n[1])] || b[n[1][0]] + a[n[1][1]]) + 'Crore ' : '';
  str += Number(n[2]) !== 0 ? (a[Number(n[2])] || b[n[2][0]] + a[n[2][1]]) + 'Lakh ' : '';
  str += Number(n[3]) !== 0 ? (a[Number(n[3])] || b[n[3][0]] + a[n[3][1]]) + 'Thousand ' : '';
  str += Number(n[4]) !== 0 ? (a[Number(n[4])] || b[n[4][0]] + a[n[4][1]]) + 'Hundred ' : '';
  str += Number(n[5]) !== 0 ? ((str !== '' ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + a[n[5][1]])) : '';
  return str.trim() + ' Only';
}
