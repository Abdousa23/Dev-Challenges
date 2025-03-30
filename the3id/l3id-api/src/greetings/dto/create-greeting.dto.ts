import { IsString, IsNotEmpty, IsPhoneNumber, IsDate, IsOptional } from 'class-validator';

export class CreateGreetingDto {
    @IsString()
    @IsNotEmpty()
    message: string;

    @IsString()
    @IsNotEmpty()
    senderName: string;

    @IsString()
    @IsNotEmpty()
    recipientName: string;

    @IsPhoneNumber(null)
    @IsNotEmpty()
    recipientPhone: string;

    @IsDate()
    @IsOptional()
    scheduledTime: Date;
}