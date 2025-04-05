import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true, collection: 'daily_reward_status' })
export class DailyRewardStatus {
  @Prop({ required: true })
  botId: string;
  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  status: 'rewarded' | 'skipped' | 'failed';

  @Prop()
  type?: number;

  @Prop()
  reason?: string;
}

export type DailyRewardStatusDocument = HydratedDocument<DailyRewardStatus>;
export const DailyRewardStatusSchema =
  SchemaFactory.createForClass(DailyRewardStatus);
