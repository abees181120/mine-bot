import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true, collection: 'bots' })
export class Bot {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  password: string;
}

export type BotDocument = HydratedDocument<Bot>;
export const BotSchema = SchemaFactory.createForClass(Bot);
