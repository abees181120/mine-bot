import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true, collection: 'rewards' })
export class Rewards {
  @Prop()
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  type: number; // 0 = weapon, 1 = armor, 2 = jewelry, -1 = no reward

  @Prop({ required: true })
  inStock: number; // 0 = no, 1 = yes

  @Prop({ required: true })
  star: number; // 1 to 6 , 0 = no star or no reward

  @Prop()
  botId: string;

  @Prop()
  dateRewarded: Date;
}

export type RewardsDocument = HydratedDocument<Rewards>;
export const RewardSchema = SchemaFactory.createForClass(Rewards);
