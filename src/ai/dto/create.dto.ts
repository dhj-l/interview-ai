import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAIDto {
  /**
   * 模型类型
   */
  @IsNotEmpty({ message: '模型类型不能为空' })
  @IsString({ message: '模型类型必须是字符串' })
  @IsOptional({ message: '模型类型是可选的' })
  modelType?: string;
  /**
   * 模型活泼度
   */
  @IsNotEmpty({ message: '模型活泼度不能为空' })
  @IsNumber({}, { message: '模型活泼度必须是数字' })
  @IsOptional({ message: '模型活泼度是可选的' })
  temperature?: number;
  /**
   * 模型最大token数
   */
  @IsNotEmpty({ message: '模型最大token数不能为空' })
  @IsNumber({}, { message: '模型最大token数必须是数字' })
  @IsOptional({ message: '模型最大token数是可选的' })
  maxTokens?: number;
  /**
   * 超时时间
   */
  @IsNotEmpty({ message: '超时时间不能为空' })
  @IsNumber({}, { message: '超时时间必须是数字' })
  @IsOptional({ message: '超时时间是可选的' })
  timeout?: number;
}
