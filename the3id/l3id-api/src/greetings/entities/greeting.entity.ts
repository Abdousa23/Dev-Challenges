import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Greeting {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    message: string;

    @Column()
    senderName: string;

    @Column()
    recipientName: string;

    @Column()
    recipientEmail: string;

    @Column()
    scheduledTime: Date;

    @Column({ default: false })
    isSent: boolean;
}