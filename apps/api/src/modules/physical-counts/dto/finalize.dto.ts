import { Equals } from 'class-validator';

export class FinalizeDto {
  @Equals(true)
  confirm!: boolean;
}
