export class CreateExerciseDto {
  title: string;
  series: number;
  level: number;
  question: string;
  correct_answer: string;
  wrong_answers: string[];
}