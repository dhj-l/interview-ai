import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsUUID,
  IsOptional,
} from 'class-validator';

export class ResumeQuizDto {
  /**
   * 公司名称
   */
  @IsString({ message: '公司名称必须是字符串' })
  @IsNotEmpty({ message: '公司名称不能为空' })
  @MaxLength(100)
  company: string;

  /**
   *岗位名称
   */
  @IsString({ message: '岗位名称必须是字符串' })
  @IsNotEmpty({ message: '岗位名称不能为空' })
  @MaxLength(100)
  position: string;

  /**
   *最低薪资 单位 k
   */
  @IsString({ message: '最低薪资必须是字符串' })
  @IsNotEmpty({ message: '最低薪资不能为空' })
  @MaxLength(100)
  minSalary: string;

  /**
   * 最高薪资 单位 k
   */
  @IsString({ message: '最高薪资必须是字符串' })
  @IsNotEmpty({ message: '最高薪资不能为空' })
  @MaxLength(100)
  maxSalary: string;

  /**
   * 岗位描述
   */
  @IsString({ message: '岗位描述必须是字符串' })
  @IsNotEmpty({ message: '岗位描述不能为空' })
  @MaxLength(1000)
  jd: string;

  /**
   * 简历内容
   */
  @IsString({ message: '简历内容必须是字符串' })
  @IsNotEmpty({ message: '简历内容不能为空' })
  @MaxLength(10000)
  resumeContent: string;

  /**
   * 幂等性id
   */
  @IsUUID(4)
  @IsOptional()
  requestId?: string;
  /**
   * 简历url
   */
  @IsString({ message: '简历url必须是字符串' })
  @IsNotEmpty({ message: '简历url不能为空' })
  @MaxLength(1000)
  resumeUrl: string;
}
