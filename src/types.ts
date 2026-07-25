export type UserRole = 'incharge' | 'student';

export interface Candidate {
  id: string; // e.g. ADM-2026-1001
  fullName: string;
  fatherName: string;
  motherName: string;
  dob: string;
  gender: string;
  category: string;
  email: string;
  mobile: string;
  aadharNumber: string;
  address: string;
  previousQualification: string;
  boardUniversity: string;
  prevRollNumber: string;
  passingYear: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  grade?: string;
  division?: string;
  courseApplied: string;
  majorSubjects: string;
  session: string;
  assignedRollNumber?: string;
  enrolmentNumber?: string;
  status: 'Pending' | 'Approved' | 'Fee Deposited' | 'Admitted' | 'Rejected';
  dcStatus: 'Not Requested' | 'Requested' | 'Approved' | 'Issued';
  dcReason?: string;
  applicationDate: string;
  feeAmount: number;
  feeStatus: 'Unpaid' | 'Paid';
  bankChallanNo?: string;
  photoUrl?: string;
  conductRating?: string;
  hostelRequested?: boolean;
  scholarshipApplied?: boolean;
  formTypeSubmitted?: string;
  uploadedFormUrl?: string;

  // Fields from official BHSS Ladhoo Pampore Admission Form
  admNo?: string;
  classWishToJoin?: string; // 9th, 10th, 11th, 12th
  boardRegNo?: string;
  bankAccountNo?: string;
  fatherOccupation?: string;
  bloodGroup?: string;
  height?: string;
  penNumber?: string;
  rationCardDetail?: 'APL' | 'BPL' | 'AAY' | string;
  socialCategory?: string;
  parentContactNo?: string;
  hasDisability?: 'YES' | 'NO';
  disabilityType?: string;
  
  // Class 9th & 10th Secondary Subjects
  secondarySubjects?: string[];
  
  // Class 11th & 12th Stream & Combination Selection
  streamOpted?: 'SCIENCE' | 'HUMANITIES' | 'VOCATIONAL' | string;
  compulsorySubject?: string; // e.g., "General English"
  scienceElectives?: string[]; // Physics, Chemistry, Biology, Mathematics
  humanitiesElectives?: string[]; // Education, Economics, Political Science, History, Urdu, Mathematics
  vocationalSubject?: string; // IT&ITES, TOURISM AND HOSPITALITY, MATHEMATICS

  // Enclosures Checklist
  enclosuresAttached?: {
    marksCertificate?: boolean;
    dischargeCertificate?: boolean;
    characterCertificate?: boolean;
    aadhaarPhotocopy?: boolean;
    rationCardPhotocopy?: boolean;
    bankPassbookPhotocopy?: boolean;
    photographsCount?: boolean;
  };

  declarationAccepted?: boolean;

  // Incharge Admission Verification Fields
  verificationRemarks?: string;
  verifiedBy?: string;
  verifiedDate?: string;
  verifiedDocuments?: {
    marksCertificate?: boolean;
    aadhaarProof?: boolean;
    categoryCertificate?: boolean;
    characterCertificate?: boolean;
    photoMatched?: boolean;
  };
}

export type ActiveTab = 
  | 'dashboard'
  | 'apply-admission'
  | 'candidates-list'
  | 'qr-scanner'
  | 'generate-documents'
  | 'excel-manage'
  | 'uploaded-forms';

export type DocumentType = 
  | 'discharge'
  | 'character'
  | 'provisional'
  | 'library'
  | 'bank-slip'
  | 'hostel'
  | 'scholarship'
  | 'examination'
  | 'bonafide';

export interface UploadedFormRecord {
  id: string;
  title: string;
  candidateId?: string;
  candidateName?: string;
  formCategory: 'Admission' | 'Hostel' | 'Scholarship' | 'Examination' | 'Bonafide' | 'Custom';
  uploadDate: string;
  fileDataUrl?: string;
  status: 'Draft' | 'Submitted' | 'Verified' | 'Approved';
  parsedFields?: Record<string, any>;
}

export interface FeeBreakdown {
  tuitionFee: number;
  admissionFee: number;
  developmentFund: number;
  libraryDeposit: number;
  examFee: number;
  totalFee: number;
}
