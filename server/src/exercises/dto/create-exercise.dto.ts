export class CreateExerciseDto {
  title: string;
  question: string;
  type: 'qcm' | 'text' | 'drag_drop';
  subject: 'math' | 'french' | 'logic';
  level: number;
  options?: any[];
  answer: string;
}