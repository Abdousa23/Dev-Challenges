import { PartialType } from '@nestjs/mapped-types';
import { CreateGreetingDto } from './create-greeting.dto';

export class UpdateGreetingDto extends PartialType(CreateGreetingDto) {}
